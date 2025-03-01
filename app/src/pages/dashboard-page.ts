import {
  FASTElement,
  customElement,
  html,
  css,
  observable,
  attr,
  Observable,
  when
} from '@microsoft/fast-element'
import { WidgetDefinition, widgetService } from '../services/widget-service'
import { getSingletonManager } from '../services/singleton-manager'
import { getRepositoryService } from '../services/repository-service'
import { getWidgetPreferredSize, getWidgetsForProduct, getWidgetMinWidth } from '../widgets/widget-registry'
import { workflowService } from '../services/workflow-service'
import { getProductService, ProductService, ProductChangeEvent } from '../services/product-service'

// Import for the modal component
import '../components/modal-component'
import { ModalComponent } from '../components/modal-component'

const template = html<DashboardPage>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h1>${(x) => x.pageTitle}</h1>
    </div>

    <div class="widgets-container">
      ${when<DashboardPage>(x => !x.ready, html<DashboardPage>/*html*/ `
        <div class="empty-message">Loading...</div>`
      )}
    </div>
    
    <!-- Modal for workflows -->
    <dream-modal 
      id="workflowModal"
      title="${x => x.workflowTitle}" 
      @close="${x => x.handleModalClose()}"
      @workflowComplete="${(x,e) => x.handleWorkflowComplete(e.event)}">
    </dream-modal>
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
    /* Base grid layout that respects widget minimum widths */
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  /* Widget size classes - now based on span factor */
  .widget-sm {
    grid-column: span 1;
  }

  .widget-md {
    grid-column: span 1;
  }

  .widget-lg {
    grid-column: span 2;
  }

  .widget-xl {
    grid-column: span 3;
  }

  /* Responsive adjustments with better breakpoints */
  @media (min-width: 1200px) {
    .widgets-container {
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
  }

  @media (min-width: 1600px) {
    .widgets-container {
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }
  }

  @media (max-width: 800px) {
    .widgets-container {
      grid-template-columns: 1fr;
    }
    
    .widget-sm, .widget-md, .widget-lg, .widget-xl {
      grid-column: span 1;
    }
  }

  /* Special rule for very large screens - allow more columns */
  @media (min-width: 2200px) {
    .widgets-container {
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    }
  }

  .empty-message {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  /* Highlight effect for widgets */
  .widget-highlight {
    animation: highlight-pulse 2s ease-in-out;
    box-shadow: 0 0 0 2px var(--accent-color, #0078d4);
    z-index: 1;
  }
  
  @keyframes highlight-pulse {
    0% { box-shadow: 0 0 0 2px var(--accent-color, #0078d4); }
    50% { box-shadow: 0 0 0 6px var(--accent-color, #0078d4); }
    100% { box-shadow: 0 0 0 2px var(--accent-color, #0078d4); }
  }

  /* Add styles for widgets that need more space */
  .widget-needs-space {
    min-width: 100%;
  }
`

@customElement({
  name: 'dashboard-page',
  template,
  styles,
})
export class DashboardPage extends FASTElement {
  @observable pageTitle = 'Dashboard'
  @observable activeWidgets: WidgetDefinition[] = []
  @observable ready: boolean = false
  @observable workflowTitle: string = "Workflow"

  private _initialWidgetsLoaded = false
  private productService: ProductService | null = null;
  private productChangeUnsubscribe: (() => void) | null = null;

  // Define preferred widget sizes - can be expanded with widget metadata
  private widgetSizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = {
    'account': 'lg',    // Account widget is naturally larger
    'welcome': 'md',    // Welcome widget is medium sized
    'swish-widget': 'md' // Our new Swish widget
  };
  
  // Get a reference to the modal component in the shadow DOM
  private get modal(): ModalComponent | null {
    return this.shadowRoot?.getElementById('workflowModal') as ModalComponent | null;
  }

  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = 'welcome,account'

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
    
    console.debug(`DashboardPage connected, initialWidgets: "${this.initialWidgets}"`)

    // Listen for resize events to adjust widget layout
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Listen for start-workflow events
    document.addEventListener('start-workflow', this.handleWorkflowStart.bind(this));
    
    // Listen for focus-widget events
    document.addEventListener('focus-widget', this.handleWidgetFocus.bind(this));
    
    // Subscribe to product changes
    this.subscribeToProductChanges();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('start-workflow', this.handleWorkflowStart.bind(this));
    document.removeEventListener('focus-widget', this.handleWidgetFocus.bind(this));
    
    // Unsubscribe from product changes
    if (this.productChangeUnsubscribe) {
      this.productChangeUnsubscribe();
      this.productChangeUnsubscribe = null;
    }
  }
  
  /**
   * Subscribe to product changes from ProductService
   */
  private subscribeToProductChanges(): void {
    this.productService = getProductService();
    this.productChangeUnsubscribe = this.productService.subscribe(this.handleProductChange.bind(this));
    
    // Check for product-dependent widgets after initial widgets are loaded
    setTimeout(() => this.checkForProductWidgets(), 500);
  }
  
  /**
   * Handle product changes from ProductService
   */
  private handleProductChange(event: ProductChangeEvent): void {
    console.debug(`Product ${event.type} event received:`, event.product?.id);
    const productId = event.productId;
    
    if (event.type === 'add') {
      // When a product is added, add its associated widgets
      this.addWidgetsForProduct(productId);
    } else if (event.type === 'remove') {
      // When a product is removed, remove its associated widgets
      this.removeWidgetsForProduct(productId);
    }
  }
  
  /**
   * Check for existing products that should have widgets
   */
  private async checkForProductWidgets(): Promise<void> {
    if (!this.productService) return;
    
    try {
      const products = await this.productService.getProducts();
      if (products.length > 0) {
        console.debug('Checking for product-dependent widgets for existing products:', 
          products.map(p => p.id).join(', '));
        
        products.forEach(product => {
          this.addWidgetsForProduct(product.id);
        });
      }
    } catch (error) {
      console.error('Error checking for product widgets:', error);
    }
  }
  
  /**
   * Add widgets associated with a product
   */
  private addWidgetsForProduct(productId: string): void {
    // Use the widget registry to find widgets that require this product
    const productWidgets = getWidgetsForProduct(productId);
    
    if (productWidgets.length > 0) {
      console.debug(`Adding widgets for product ${productId}:`, productWidgets.map(w => w.id));
      
      productWidgets.forEach(widget => {
        // Check if widget is already active
        const isActive = this.activeWidgets.some(w => w.id === widget.id);
        
        if (!isActive) {
          this.loadWidgetById(widget.id);
        }
      });
    }
  }
  
  /**
   * Remove widgets associated with a product
   */
  private removeWidgetsForProduct(productId: string): void {
    // Use the widget registry to find widgets that require this product
    const productWidgets = getWidgetsForProduct(productId);
    
    if (productWidgets.length > 0) {
      console.debug(`Removing widgets for product ${productId}:`, productWidgets.map(w => w.id));
      
      productWidgets.forEach(widget => {
        const widgetId = widget.id;
        
        // Remove from active widgets array
        this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);
        
        // Remove from DOM
        if (this.shadowRoot) {
          const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
          if (widgetElement) {
            widgetElement.remove();
          }
        }
      });
    }
  }
  
  /**
   * Handles workflow start events
   */
  handleWorkflowStart(event: Event): void {
    const customEvent = event as CustomEvent;
    // Get workflowId from event detail - check both 'workflow' and 'workflowId' for compatibility
    const workflowId = customEvent.detail.workflowId || customEvent.detail.workflow;
    if (!workflowId) {
      console.error('No workflow ID provided in start-workflow event');
      return;
    }
    
    console.debug(`Dashboard page starting workflow: ${workflowId}`);
    
    // Update workflow title based on workflow ID
    this.workflowTitle = this.getWorkflowTitle(workflowId);
    
    // Open the workflow in the modal
    this.openWorkflow(workflowId, customEvent.detail.params || {});
  }
  
  /**
   * Gets a user-friendly title for a workflow based on its ID
   */
  private getWorkflowTitle(workflowId: string): string {
    // Map workflow IDs to friendly titles
    const titles: Record<string, string> = {
      'transfer': 'Transfer Money',
      'kyc': 'Identity Verification',
      'create-account': 'Create New Account'
    };
    
    return titles[workflowId] || `Start ${workflowId}`;
  }

  /**
   * Opens a workflow in the modal
   */
  async openWorkflow(workflowId: string, params?: Record<string, any>): Promise<void> {
    if (!this.modal) {
      console.error('Modal component not found');
      return;
    }
    
    // First open the modal
    this.modal.open();
    
    // Then load the workflow
    const success = await this.modal.loadWorkflow(workflowId, params);
    if (!success) {
      console.error(`Failed to load workflow: ${workflowId}`);
      this.modal.close(); // Close modal on failure
    }
  }
  
  /**
   * Handle modal close event
   */
  handleModalClose(): void {
    console.debug('Workflow modal closed');
  }
  
  /**
   * Handle workflow completion
   */
  handleWorkflowComplete(event: Event): void {
    const result = (event as CustomEvent).detail;
    console.debug('Workflow completed:', result);
    
    // Handle specific workflow result actions if needed
    if (result?.success) {
      console.debug(`Workflow completed successfully: ${JSON.stringify(result.data || {})}`);
    }
  }
  
  /**
   * Handles widget focus events
   */
  handleWidgetFocus(event: Event): void {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) {
      console.error('No widget ID provided in focus-widget event');
      return;
    }
    
    console.debug(`Dashboard page focusing widget: ${widgetId}`);
    
    // Find the widget element
    if (this.shadowRoot) {
      const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetElement) {
        // Scroll to the widget
        widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add temporary highlight effect to the widget
        widgetElement.classList.add('widget-highlight');
        setTimeout(() => {
          widgetElement.classList.remove('widget-highlight');
        }, 2000);
      } else {
        // Widget not found - might need to load it
        console.debug(`Widget ${widgetId} not found on page, attempting to load it`);
        this.loadWidgetById(widgetId);
      }
    }
  }

  /**
   * Loads a specific widget by its ID
   */
  async loadWidgetById(widgetId: string): Promise<void> {
    try {
      // Check if this widget is already active
      if (this.activeWidgets.some(widget => widget.id === widgetId)) {
        console.debug(`Widget ${widgetId} is already active, not loading again`);
        return;
      }
      
      const widgets = await widgetService.loadWidgets([widgetId]);
      
      if (widgets.length > 0) {
        const widget = widgets[0];
        this.activeWidgets.push(widget);
        
        // Add new widget to DOM
        const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement;
        const widgetElement = document.createElement(widget.elementName) as HTMLElement;
        
        if (widget.defaultConfig) {
          (widgetElement as any).config = widget.defaultConfig;
        }
        
        const preferredSize = getWidgetPreferredSize(widget.id);
        const size = preferredSize || this.widgetSizeMap[widget.id] || 'md';
        widgetElement.classList.add(`widget-${size}`);
        widgetElement.setAttribute('data-widget-id', widget.id);
        
        // Add highlight effect
        widgetElement.classList.add('widget-highlight');
        
        widgetContainer.appendChild(widgetElement);
        
        // Scroll to the newly added widget
        widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after a delay
        setTimeout(() => {
          widgetElement.classList.remove('widget-highlight');
        }, 2000);
        
        // Re-optimize layout
        this.optimizeLayout();
      } else {
        console.error(`Widget with ID ${widgetId} could not be loaded`);
      }
    } catch (error) {
      console.error(`Error loading widget ${widgetId}:`, error);
    }
  }

  async loadWidgets(): Promise<void> {
    console.debug('Loading widgets...')
    await this.loadWidgetsFromAttribute()
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (name === 'initialwidgets' && newValue !== oldValue) {
      console.debug(`initialWidgets attribute changed to: "${newValue}"`)
      this.initialWidgets = newValue
      if (this.isConnected) {
        this.loadWidgets();
      }
    }
  }

  async loadWidgetsFromAttribute(): Promise<void> {
    console.debug('Loading widgets:', this.initialWidgets)
    if (this.initialWidgets && !this._initialWidgetsLoaded) {
      const widgetIds = this.initialWidgets
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)
      if (widgetIds.length > 0) {
        console.debug(`Loading widgets: ${widgetIds.join(', ')}`)
        this._initialWidgetsLoaded = true
        await this.loadInitialWidgets(widgetIds)
      }
    }
  }

  async loadInitialWidgets(widgetIds: string[]): Promise<void> {
    console.debug('Loading initial widgets:', widgetIds)
    try {
      const widgets = await widgetService.loadWidgets(widgetIds)
      console.debug(`Loaded ${widgets.length} widgets:`, widgets)

      this.activeWidgets.push(...widgets)
      console.debug('Active widgets updated:', this.activeWidgets.length);
      this.addWidgetsToDOM()
      this.ready = true
      console.debug('Dashboard ready:', this.ready)

      // After widgets are added, evaluate layout optimization
      this.optimizeLayout();
      
      // Save the user's preferred base widgets configuration
      this.saveBaseWidgetPreferences(widgetIds);
    } catch (error) {
      console.error('Error loading widgets:', error)
    }
  }

  /**
   * Adds widgets to the DOM with appropriate size classes
   */
  addWidgetsToDOM() {
    console.debug('Adding widgets to DOM...')
    const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement
    
    this.activeWidgets.forEach((widget) => {
      const widgetElement = document.createElement(widget.elementName) as HTMLElement;
      
      if (widget.defaultConfig) {
        (widgetElement as any).config = widget.defaultConfig;
      }
      
      // Use registry to get preferred size or fall back to local sizing
      const preferredSize = getWidgetPreferredSize(widget.id);
      const size = preferredSize || this.widgetSizeMap[widget.id] || 'md';
      widgetElement.classList.add(`widget-${size}`);
      
      // Add a data attribute to help with layout optimization
      widgetElement.setAttribute('data-widget-id', widget.id);
      
      // Add min-width information as a data attribute for easier access
      const minWidth = getWidgetMinWidth(widget.id);
      widgetElement.setAttribute('data-min-width', minWidth.toString());
      
      widgetContainer.appendChild(widgetElement);
    });
    
    // Apply initial layout optimization with a slight delay to ensure DOM is ready
    setTimeout(() => this.optimizeLayout(), 50);
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

    const containerWidth = container.offsetWidth;
    
    // Update grid template columns based on widget minimum widths
    this.updateGridLayout(container, widgets as HTMLElement[]);
    
    // Adjust widget size classes based on available space
    this.distributeWidgetSizes(widgets as HTMLElement[], containerWidth);
  }
  
  /**
   * Updates grid layout based on container width and widget minimum requirements
   */
  updateGridLayout(container: HTMLElement, widgets: HTMLElement[]) {
    const containerWidth = container.offsetWidth;
    
    // Find the maximum minimum width among all widgets
    let maxMinWidth = 300; // default
    widgets.forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id') || '';
      const minWidth = getWidgetMinWidth(widgetId);
      maxMinWidth = Math.max(maxMinWidth, minWidth);
    });
    
    // Calculate how many columns we can fit
    const possibleColumns = Math.floor(containerWidth / maxMinWidth);
    const columnsToUse = Math.max(1, possibleColumns);
    
    // Determine ideal column width (at least maxMinWidth, but can be larger)
    const columnWidth = Math.max(maxMinWidth, Math.floor(containerWidth / columnsToUse) - 24);
    
    // Apply the new grid template
    if (columnsToUse === 1) {
      container.style.gridTemplateColumns = '1fr';
    } else {
      container.style.gridTemplateColumns = `repeat(${columnsToUse}, minmax(${columnWidth}px, 1fr))`;
    }
    
    // Reset all widgets span to default for recalculation
    widgets.forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id') || '';
      const minWidth = getWidgetMinWidth(widgetId);
      
      // If a widget's minimum width is more than half the container, 
      // it should get special treatment
      if (minWidth > containerWidth / 2 && columnsToUse > 1) {
        widget.classList.add('widget-needs-space');
      } else {
        widget.classList.remove('widget-needs-space');
      }
    });
    
    // Log for debugging
    console.debug(`Grid layout: ${columnsToUse} columns of ${columnWidth}px (container: ${containerWidth}px)`);
  }
  
  /**
   * Distributes widget sizes based on available width and column count
   */
  distributeWidgetSizes(widgets: HTMLElement[], containerWidth: number) {
    // Calculate how many reasonable columns we have
    const reasonableColumnCount = Math.floor(containerWidth / 350);
    
    // If we can only fit one column, make all widgets full width
    if (reasonableColumnCount <= 1) {
      widgets.forEach(widget => {
        this.setWidgetSize(widget, 'xl');
      });
      return;
    }
    
    // For wider layouts, use widget preferred sizes but ensure they fit properly
    widgets.forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id') || '';
      const preferredSize = getWidgetPreferredSize(widgetId);
      const minWidth = getWidgetMinWidth(widgetId);
      
      let size = preferredSize || this.widgetSizeMap[widgetId] || 'md';
      
      // Adjust size for very wide widgets or narrow containers
      if (minWidth > containerWidth / 2) {
        size = reasonableColumnCount >= 3 ? 'lg' : 'xl';
      } else if (reasonableColumnCount <= 2 && size === 'lg') {
        size = 'md'; // In 2-column layout, limit large widgets to medium
      }
      
      this.setWidgetSize(widget, size as 'sm' | 'md' | 'lg' | 'xl');
    });
    
    // Special case handling for layouts
    if (reasonableColumnCount >= 3 && widgets.length >= 3) {
      // In 3+ column layouts with many widgets, make first widget larger
      this.setWidgetSize(widgets[0] as HTMLElement, 'lg');
    }
    
    // In any layout, if we have an odd number of widgets and using 2 columns,
    // make the last widget span the full width for a cleaner look
    if (reasonableColumnCount === 2 && widgets.length % 2 === 1) {
      this.setWidgetSize(widgets[widgets.length - 1] as HTMLElement, 'lg');
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

  /**
   * Save base widget preferences
   * This only saves the user's explicitly chosen widgets, not product-dependent ones
   */
  private async saveBaseWidgetPreferences(widgetIds: string[]): Promise<void> {
    try {
      const repoService = getRepositoryService();
      const settingsRepo = repoService.getSettingsRepository();
      
      await settingsRepo.updateSettings({
        preferredWidgets: widgetIds
      });
      
      console.debug('Saved base widget preferences:', widgetIds);
    } catch (error) {
      console.error('Error saving widget preferences:', error);
    }
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
      if (!this.initialWidgets && userSettings.preferredWidgets && userSettings.preferredWidgets.length > 0) {
        console.debug('Using preferred widgets from user settings:', userSettings.preferredWidgets);
        this.initialWidgets = userSettings.preferredWidgets.join(',');
      }
    } catch (error) {
      console.error('Error loading user widget preferences:', error);
    }
  }
}