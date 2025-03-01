import {
  FASTElement,
  customElement,
  html,
  css,
  observable,
  attr,
  repeat,
  when,
  Observable,
  DOM,
  ViewTemplate,
} from '@microsoft/fast-element'
import { WidgetDefinition, widgetService, WidgetService } from '../services/widget-service'
import { getSingletonManager } from '../services/singleton-manager'
import { getRepositoryService } from '../services/repository-service'
import { getWidgetPreferredSize } from '../widgets/widget-registry'

const template = html<ContentComponent>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h1>${(x) => x.pageTitle}</h1>
    </div>

    <div class="widgets-container">
      ${when<ContentComponent>(x => !x.ready, html<ContentComponent>/*html*/ `
        <div class="empty-message">Loading...</div>`
      )}
    </div>
  </div>
`

const styles = css`
  :host {
    display: block;
    height: 100%;
    overflow-y: auto;
  }

  .content-container {
    padding: 1.5rem;
    height: 100%;
    position: relative;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .widgets-container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
  }

  /* Widget size classes */
  .widget-sm {
    grid-column: span 4;
  }

  .widget-md {
    grid-column: span 6;
  }

  .widget-lg {
    grid-column: span 8;
  }

  .widget-xl {
    grid-column: span 12;
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .widget-sm {
      grid-column: span 6;
    }
    
    .widget-md, .widget-lg {
      grid-column: span 12;
    }
  }

  @media (max-width: 768px) {
    .widgets-container {
      grid-template-columns: repeat(1, 1fr);
    }
    
    .widget-sm, .widget-md, .widget-lg, .widget-xl {
      grid-column: span 1;
    }
  }

  .empty-message {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
`

@customElement({
  name: 'dream-content',
  template,
  styles,
})
export class ContentComponent extends FASTElement {
  @observable pageTitle = 'Dashboard'
  @observable activeWidgets: WidgetDefinition[] = []
  @observable ready: boolean = false

  private _initialWidgetsLoaded = false

  // Define preferred widget sizes - can be expanded with widget metadata
  private widgetSizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = {
    'account': 'lg',    // Account widget is naturally larger
    'welcome': 'md',    // Welcome widget is medium sized
  };

  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = ''

  static get observedAttributes(): string[] {
    return ['initialwidgets']
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback()
    
    // Load user preferences for widget sizes if available
    await this.loadUserWidgetPreferences();
    
    widgetService.onWidgetsRegistered(() => {
      this.loadWidgets()
    })

    if (widgetService.areAllWidgetsRegistered()) {
      this.loadWidgets()
    }
    
    console.log(`ContentComponent connected, initialWidgets: "${this.initialWidgets}"`)

    // Listen for resize events to adjust widget layout
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * Load user widget preferences from settings repository
   */
  async loadUserWidgetPreferences(): Promise<void> {
    try {
      const repoService = getRepositoryService();
      const settingsRepo = repoService.getSettingsRepository();
      const userSettings = await settingsRepo.getCurrentSettings();
      
      // If user has preferred widgets, use them if no initialWidgets specified
      if (!this.initialWidgets && userSettings.preferredWidgets.length > 0) {
        console.log('Using preferred widgets from user settings:', userSettings.preferredWidgets);
        this.initialWidgets = userSettings.preferredWidgets.join(',');
      }
    } catch (error) {
      console.error('Error loading user widget preferences:', error);
    }
  }
  
  /**
   * Save the current widget configuration to user settings
   */
  async saveWidgetConfiguration(): Promise<void> {
    try {
      const widgetIds = this.activeWidgets.map(widget => widget.id);
      
      if (widgetIds.length > 0) {
        const repoService = getRepositoryService();
        const settingsRepo = repoService.getSettingsRepository();
        
        await settingsRepo.updateSettings({
          preferredWidgets: widgetIds
        });
        
        console.log('Saved widget configuration:', widgetIds);
      }
    } catch (error) {
      console.error('Error saving widget configuration:', error);
    }
  }

  async loadWidgets(): Promise<void> {
    console.log('Loading widgets...')
    await this.loadWidgetsFromAttribute()
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (name === 'initialwidgets' && newValue !== oldValue) {
      console.log(`initialWidgets attribute changed to: "${newValue}"`)
      this.initialWidgets = newValue
    }
  }

  async activateWidgets(): Promise<void> {
    console.log('Activating widgets...')
    await this.loadWidgetsFromAttribute()
  }

  async loadWidgetsFromAttribute(): Promise<void> {
    console.log('Loading widgets:', this.initialWidgets)
    if (this.initialWidgets && !this._initialWidgetsLoaded) {
      const widgetIds = this.initialWidgets
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)
      if (widgetIds.length > 0) {
        console.log(`Loading widgets: ${widgetIds.join(', ')}`)
        this._initialWidgetsLoaded = true
        await this.loadInitialWidgets(widgetIds)
      }
    }
  }

  async loadInitialWidgets(widgetIds: string[]): Promise<void> {
    console.log('Loading initial widgets:', widgetIds)
    try {
      const widgetService = getSingletonManager().get(
        'WidgetService'
      ) as WidgetService
      const widgets = await widgetService.loadWidgets(widgetIds)
      console.log(`Loaded ${widgets.length} widgets:`, widgets)

      this.activeWidgets.push(...widgets)

      console.log('Active widgets updated:', this.activeWidgets.length);
      this.addWidgetsToDOM()
      this.ready = true
      console.log('Content ready:', this.ready)

      // After widgets are added, evaluate layout optimization
      this.optimizeLayout();
      
      // Save the widget configuration to user settings
      this.saveWidgetConfiguration();
    } catch (error) {
      console.error('Error loading widgets:', error)
    }
  }

  /**
   * Adds widgets to the DOM with appropriate size classes
   */
  addWidgetsToDOM() {
    console.log('Adding widgets to DOM...')
    const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement
    
    // If we only have one widget, make it full width
    const useFullWidth = this.activeWidgets.length === 1;
    
    this.activeWidgets.forEach((widget) => {
      const widgetElement = document.createElement(widget.elementName) as HTMLElement;
      
      if (widget.defaultConfig) {
        (widgetElement as any).config = widget.defaultConfig;
      }
      
      // Use registry to get preferred size or fall back to local sizing
      const preferredSize = getWidgetPreferredSize(widget.id);
      const size = useFullWidth ? 'xl' : (preferredSize || this.widgetSizeMap[widget.id] || 'md');
      widgetElement.classList.add(`widget-${size}`);
      
      // Add a data attribute to help with layout optimization
      widgetElement.setAttribute('data-widget-id', widget.id);
      
      widgetContainer.appendChild(widgetElement);
    });
  }
  
  /**
   * Handles browser resize events
   */
  handleResize() {
    this.optimizeLayout();
  }

  /**
   * Optimizes widget layout based on container width and widget count
   */
  optimizeLayout() {
    if (!this.shadowRoot) return;
    
    const container = this.shadowRoot.querySelector('.widgets-container') as HTMLElement;
    if (!container) return;
    
    const widgets = Array.from(container.children);
    if (widgets.length === 0) return;

    // If there's only one widget on screen, make it full width
    if (widgets.length === 1) {
      const widget = widgets[0] as HTMLElement;
      this.setWidgetSize(widget, 'xl');
      return;
    }
    
    // For multiple widgets, use a more complex layout optimization
    const containerWidth = container.offsetWidth;
    
    // For very narrow screens, stack everything
    if (containerWidth < 768) {
      widgets.forEach(widget => {
        this.setWidgetSize(widget as HTMLElement, 'xl');
      });
      return;
    }
    
    // For wider screens, use a mix of sizes but ensure no orphaned widgets in rows
    this.optimizeWidgetRowLayout(widgets as HTMLElement[]);
  }
  
  /**
   * Optimizes layout to avoid orphaned widgets
   */
  optimizeWidgetRowLayout(widgets: HTMLElement[]) {
    // Restore default sizes first
    widgets.forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id') || '';
      const size = this.widgetSizeMap[widgetId] || 'md';
      this.setWidgetSize(widget, size);
    });
    
    // Check if we need to adjust the last widget in a row
    // This is a simplification - a more advanced implementation could calculate
    // exact positions based on grid layout
    
    // For example, if we have 3 widgets with sizes md, md, sm
    // The last sm widget would be alone on a new row - we could expand it to md or lg
    
    // This is a simplified approach that handles common cases
    const lastWidget = widgets[widgets.length - 1];
    if (lastWidget) {
      // If it's likely to be alone on a row, make it larger
      this.setWidgetSize(lastWidget, 'lg');
    }
  }
  
  /**
   * Sets a widget's size class
   */
  setWidgetSize(widget: HTMLElement, size: 'sm' | 'md' | 'lg' | 'xl') {
    // Remove existing size classes
    widget.classList.remove('widget-sm', 'widget-md', 'widget-lg', 'widget-xl');
    
    // Add the new size class
    widget.classList.add(`widget-${size}`);
  }
}
