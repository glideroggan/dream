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

// Import the widget helper
import { createWidgetWrapper, createWidgetElement } from '../utils/widget-helper'

// Import for the modal component
import '../components/modal-component'
import { ModalComponent } from '../components/modal-component'

// Import the widget wrapper component
import '../components/widget-wrapper';

// Import the grid layout component
import '../components/grid-layout';

const template = html<DashboardPage>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h1>${(x) => x.pageTitle}</h1>
    </div>
    ${when<DashboardPage>(x => !x.ready, html<DashboardPage>/*html*/ `
      <div class="empty-message">Loading...</div>`
)}
    <grid-layout class="widgets-container"></grid-layout>
    
    <!-- Modal for workflows -->
    <dream-modal 
      id="workflowModal"
      title="${x => x.workflowTitle}" 
      @close="${x => x.handleModalClose()}"
      @workflowComplete="${(x, e) => x.handleWorkflowComplete(e.event)}">
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
  initialWidgets: string = 'welcome,account,fast-widget,slow-widget,error-widget';

  // Track widget load attempts to prevent infinite retry loops
  private widgetLoadAttempts: Map<string, number> = new Map();
  private maxLoadAttempts = 2;

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

    // Listen for widget-related events
    document.addEventListener('retry-widget', this.handleRetryWidget.bind(this));
    document.addEventListener('dismiss-widget', this.handleDismissWidget.bind(this));
    document.addEventListener('cancel-widget-load', this.handleCancelWidget.bind(this));
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

    document.removeEventListener('retry-widget', this.handleRetryWidget.bind(this));
    document.removeEventListener('dismiss-widget', this.handleDismissWidget.bind(this));
    document.removeEventListener('cancel-widget-load', this.handleCancelWidget.bind(this));
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

        // Add new widget with wrapper to DOM
        const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement;

        // Create wrapper using our helper
        const wrapperElement = createWidgetWrapper({
          widgetId: widget.id,
          initialState: 'loading',
          additionalClasses: [`widget-${getWidgetPreferredSize(widget.id) || 'md'}`],
          additionalAttributes: {
            'widget-name': widget.name || widget.id 
          }
        });

        // Add the wrapper to the container
        widgetContainer.appendChild(wrapperElement);

        // Create the actual widget element within the wrapper
        this.createWidgetElement(widget, wrapperElement);

        // Scroll to the newly added widget
        wrapperElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight effect
        wrapperElement.classList.add('widget-highlight');

        // Remove highlight after a delay
        setTimeout(() => {
          wrapperElement.classList.remove('widget-highlight');
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

  /**
   * Creates a widget element and adds it to the wrapper
   */
  private async createWidgetElement(widget: WidgetDefinition, wrapperElement: HTMLElement) {
    try {
      // Track attempt count
      this.widgetLoadAttempts.set(widget.id, (this.widgetLoadAttempts.get(widget.id) || 0) + 1);

      console.debug(`Creating widget element: ${widget.id} (${widget.elementName})`);

      // Create the actual widget element using widget service
      const widgetElement = await widgetService.createWidgetElement(widget.id);
      
      if (!widgetElement) {
        throw new Error(`Failed to create widget element for ${widget.id}`);
      }
      
      console.debug(`Widget element created for ${widget.id}`);

      // Add debug logging for initialization events
      widgetElement.addEventListener('*', (event) => {
        console.debug(`Widget ${widget.id} event: ${event.type}`);
      }, true);

      // Listen for initialization complete
      const onLoaded = () => {
        console.debug(`Widget ${widget.id} initialized`);
        // Remove the event listener
        widgetElement.removeEventListener('initialized', onLoaded);
      };

      widgetElement.addEventListener('initialized', onLoaded);

      console.debug(`Adding widget ${widget.id} to wrapper`);
      // Add the widget to the wrapper
      wrapperElement.appendChild(widgetElement);

    } catch (error) {
      console.error(`Error creating widget ${widget.id}:`, error);

      // Set the wrapper state to error (the wrapper will handle the display)
      wrapperElement.setAttribute('state', 'error');
      wrapperElement.setAttribute('errorMessage', 
        error instanceof Error ? error.message : 'Failed to initialize widget'
      );
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
   * Adds widgets to the DOM with appropriate size classes and wrapped in widget-wrapper
   */
  addWidgetsToDOM() {
    console.debug('Adding widgets to DOM...')
    const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement

    this.activeWidgets.forEach((widget) => {
      // Create the wrapper element using our helper
      const wrapperElement = createWidgetWrapper({
        widgetId: widget.id,
        initialState: 'loading',
        warningTimeout: 5000,
        failureTimeout: 10000,
        additionalAttributes: {
          'widget-name': widget.name || widget.id
        }
      });

      // Add the wrapper to the container first
      widgetContainer.appendChild(wrapperElement);

      // Now create the actual widget element
      this.createWidgetElement(widget, wrapperElement);
    });

    // Apply initial layout optimization with a slight delay to ensure DOM is ready
    setTimeout(() => this.optimizeLayout(), 50);
  }

  /**
   * Handle retry widget event
   */
  private handleRetryWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;

    console.debug(`Retrying widget load for ${widgetId}`);

    // Get the widget definition
    const widget = this.activeWidgets.find(w => w.id === widgetId);
    if (!widget) return;

    // Check if we've exceeded max retry attempts
    const attempts = this.widgetLoadAttempts.get(widgetId) || 0;
    if (attempts >= this.maxLoadAttempts) {
      console.error(`Exceeded max retry attempts (${this.maxLoadAttempts}) for widget ${widgetId}`);

      // Tell the wrapper to show an error
      const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
      if (wrapper) {
        wrapper.setAttribute('state', 'error');
        wrapper.setAttribute('errorMessage', `Failed to load after ${this.maxLoadAttempts} attempts`);
      }
      return;
    }

    // Get the wrapper element - use camelCase attribute selector to match component
    const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
    if (!wrapper) return;

    // Clear any existing widget content
    while (wrapper.firstChild) {
      wrapper.removeChild(wrapper.firstChild);
    }

    // Reset the wrapper state - the wrapper will show loading again
    wrapper.setAttribute('state', 'loading');

    // Reload the widget
    this.createWidgetElement(widget, wrapper as HTMLElement);
  }

  /**
   * Handle dismiss widget event
   */
  private handleDismissWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;

    console.debug(`Dismissing widget ${widgetId}`);

    // Remove from active widgets array
    this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);

    // Remove from DOM
    if (this.shadowRoot) {
      const wrapper = this.shadowRoot.querySelector(`widget-wrapper[data-widget-id="${widgetId}"]`);
      if (wrapper) {
        wrapper.remove();
      }
    }

    // Clean up tracking state
    this.widgetLoadAttempts.delete(widgetId);

    // Re-optimize layout
    this.optimizeLayout();
  }

  /**
   * Handle cancel widget load event
   */
  private handleCancelWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;

    console.debug(`Cancelling widget load for ${widgetId}`);

    // Get the wrapper element and set it to error state - use camelCase attribute selector
    const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
    if (wrapper) {
      wrapper.setAttribute('state', 'error');
      wrapper.setAttribute('errorMessage', 'Widget load cancelled due to timeout');
    }
  }

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

    // Determine ideal column width (at least maxMinWidth, but can be larger)
    const possibleColumns = Math.floor(containerWidth / maxMinWidth);
    const columnsToUse = Math.max(1, possibleColumns);

    let columnWidth = maxMinWidth;
    // Apply the new grid template
    if (columnsToUse === 1) {
      container.style.gridTemplateColumns = '1fr';
    } else {
      columnWidth = Math.max(maxMinWidth, Math.floor(containerWidth / columnsToUse) - 24);
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