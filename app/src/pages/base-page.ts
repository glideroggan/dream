import {
  FASTElement,
  observable,
  when,
  html,
  css,
  Observable
} from '@microsoft/fast-element';
import { WidgetDefinition, widgetService } from '../services/widget-service';
import { getProductService, ProductService, ProductChangeEvent } from '../services/product-service';
import { 
  getWidgetPreferredSize, 
  getWidgetMinWidth, 
  getAutoWidgetsForProduct,
  isWidgetAvailableForUser
} from '../widgets/widget-registry';
import { ModalComponent } from '../components/modal-component';
import { createWidgetWrapper } from '../utils/widget-helper';
import { getSearchService } from '../services/search-service';

// Import grid layout and modal components
import '../components/grid-layout';
import '../components/modal-component';
import '../components/widget-wrapper';
import { workflowManager } from '../services/workflow-manager-service';
import { repositoryService } from '../services/repository-service';
import { UserSettings } from '../repositories/settings-repository';

// Shared template parts that can be composed by child classes
export const baseContentTemplate = html<BasePage>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h1>${(x) => x.pageTitle}</h1>
    </div>
    ${when<BasePage>(x => !x.ready, html<BasePage>/*html*/ `
      <div class="empty-message">Loading...</div>`
    )}
    ${when<BasePage>(x => x.ready && x.activeWidgets.length === 0, html<BasePage>/*html*/ `
      <div class="empty-message">
        <p>No widgets available for this page yet.</p>
        <p>Check back soon for updates!</p>
      </div>`
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
`;

// Shared styles
export const baseStyles = css`
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
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  /* Widget size classes - based on span factor */
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

  /* Special rule for very large screens */
  @media (min-width: 2200px) {
    .widgets-container {
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    }
  }

  .empty-message {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--neutral-foreground-hint);
    background-color: var(--neutral-layer-2);
    border-radius: 8px;
    margin: 2rem 0;
  }

  .empty-message p {
    margin: 0.5rem 0;
  }

  .empty-message p:first-child {
    font-size: 1.2rem;
    font-weight: 500;
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

  /* Widget removal animation */
  .widget-removing {
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
    transform: scale(0.95);
  }
`;

export class BasePage extends FASTElement {
  @observable pageTitle: string = 'Page';
  @observable activeWidgets: WidgetDefinition[] = [];
  @observable ready: boolean = false;
  @observable workflowTitle: string = "Workflow";

  protected initialWidgets: string = '';
  protected _initialWidgetsLoaded = false;
  protected productService: ProductService | null = null;
  protected productChangeUnsubscribe: (() => void) | null = null;
  
  // Track widget load attempts to prevent infinite retry loops
  protected widgetLoadAttempts: Map<string, number> = new Map();
  protected maxLoadAttempts = 2;

  // Define preferred widget sizes - can be expanded with widget metadata
  protected widgetSizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = {
    'account': 'lg',    // Account widget is naturally larger
    'welcome': 'md',    // Welcome widget is medium sized
    'swish-widget': 'md' // Swish widget
  };

  // Add a page type property to identify each page
  protected pageType: string = 'base';

  // Get a reference to the modal component in the shadow DOM
  protected get modal(): ModalComponent | null {
    return this.shadowRoot?.getElementById('workflowModal') as ModalComponent | null;
  }

  connectedCallback(): void {
    super.connectedCallback();

    // Load user preferences for widget sizes if available
    this.loadUserWidgetPreferences();

    widgetService.onWidgetsRegistered(() => {
      this.loadWidgets();
    });

    if (widgetService.areAllWidgetsRegistered()) {
      this.loadWidgets();
    }

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
    document.addEventListener('close-widget', this.handleCloseWidget.bind(this));
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
    document.removeEventListener('close-widget', this.handleCloseWidget.bind(this));
  }

  /**
   * Load widgets for the page - should be implemented by subclasses
   */
  async loadWidgets(): Promise<void> {
    console.debug('Base loadWidgets called - subclasses should override this');
    // Load from settings first, then fallback to initialWidgets if needed
    await this.loadUserWidgetPreferences();
    if (this.initialWidgets) {
      await this.loadWidgetsFromList(this.initialWidgets);
    } else {
      // No widgets to load, just set ready state
      this.ready = true;
    }
  }

  /**
   * Load widgets from a comma-separated list
   */
  protected async loadWidgetsFromList(widgetList: string): Promise<void> {
    if (!widgetList || this._initialWidgetsLoaded) return;
    
    const widgetIds = widgetList
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id);
      
    if (widgetIds.length > 0) {
      console.debug(`Loading widgets: ${widgetIds.join(', ')}`);
      this._initialWidgetsLoaded = true;
      await this.loadInitialWidgets(widgetIds);
    } else {
      // Even if no widgets, set ready state
      this.ready = true;
    }
  }

  /**
   * Load initial widgets for the page
   */
  protected async loadInitialWidgets(widgetIds: string[]): Promise<void> {
    console.debug(`Loading initial widgets for ${this.pageTitle}:`, widgetIds);
    try {
      const widgets = await widgetService.loadWidgets(widgetIds);
      console.debug(`Loaded ${widgets.length} widgets:`, widgets);

      this.activeWidgets.push(...widgets);
      this.addWidgetsToDOM();
      this.ready = true;

      // After widgets are added, evaluate layout optimization
      this.optimizeLayout();

      // Save the user's preferred widget configuration for this page
      this.saveWidgetPreferences(widgetIds);
    } catch (error) {
      console.error('Error loading widgets:', error);
    }
  }

  /**
   * Subscribe to product changes from ProductService
   */
  protected subscribeToProductChanges(): void {
    this.productService = getProductService();
    this.productChangeUnsubscribe = this.productService.subscribe(this.handleProductChange.bind(this));

    // Check for product-dependent widgets after initial widgets are loaded
    setTimeout(() => this.checkForProductWidgets(), 500);
  }

  /**
   * Handle product changes from ProductService
   */
  protected handleProductChange(event: ProductChangeEvent): void {
    console.debug(`Product ${event.type} event received:`, event.product?.id);
    const productId = event.productId;

    if (event.type === 'add') {
      // When a product is added, add its associated widgets
      this.addWidgetsForProduct(productId);
    } else if (event.type === 'remove') {
      // When a product is removed, remove its associated widgets
      this.removeWidgetsForProduct(productId);
    }

    // Refresh search service when products change
    const searchService = getSearchService();
    searchService.refreshAllSearchableItems();
    console.debug('Search service refreshed after product change');
  }

  /**
   * Check for existing products that should have widgets
   */
  protected async checkForProductWidgets(): Promise<void> {
    // This method now only checks for product changes since the user last visited
    // It will not add widgets to the page unless the product was just added during this session
    
    // All widget placement is determined from user settings, not from hardcoded rules
  }

  /**
   * Add widgets associated with a product to the current page
   * This is ONLY called when a product is newly added
   */
  protected async addWidgetsForProduct(productId: string): Promise<void> {
    try {
      // Get widgets that should be automatically added for this product
      const autoWidgets = getAutoWidgetsForProduct(productId);
      
      if (autoWidgets.length === 0) return;
      
      console.debug(`Adding widgets for product ${productId} to ${this.pageType} page:`, 
        autoWidgets.map(w => w.id));

      // If user is currently on this page when the product is added,
      // add the associated widgets to THIS page only
      for (const widget of autoWidgets) {
        // Check if widget is already on this page
        if (this.activeWidgets.some(w => w.id === widget.id)) {
          console.debug(`Widget ${widget.id} is already on ${this.pageType} page`);
          continue;
        }
        
        // Add the widget to this page
        console.debug(`Auto-adding widget ${widget.id} to ${this.pageType} page after product add`);
        await this.loadWidgetById(widget.id);
      }
      
      // Update user settings with the current widgets on this page
      await this.saveCurrentWidgetsToSettings();
      
    } catch (error) {
      console.error(`Error adding widgets for product ${productId}:`, error);
    }
  }

  /**
   * Remove widgets associated with a product FROM ALL PAGES
   * This should be called when a product is removed
   */
  protected async removeWidgetsForProduct(productId: string): Promise<void> {
    // Use the widget registry to find widgets that require this product
    const productWidgets = getAutoWidgetsForProduct(productId);

    if (productWidgets.length === 0) return;
    
    console.debug(`Removing widgets for product ${productId}:`, productWidgets.map(w => w.id));

    // 1. Remove from current page if present
    let widgetsRemoved = false;
    
    productWidgets.forEach(widget => {
      const widgetId = widget.id;

      // Check if we have this widget on this page
      if (this.activeWidgets.some(w => w.id === widgetId)) {
        // Remove from active widgets array
        this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);

        // Remove from DOM
        if (this.shadowRoot) {
          const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
          if (widgetElement) {
            widgetElement.remove();
            widgetsRemoved = true;
          }
        }
      }
    });
    
    // Save current page settings if we removed widgets
    if (widgetsRemoved) {
      await this.saveCurrentWidgetsToSettings();
    }
    
    // 2. Remove from ALL pages in user settings
    try {
      const settingsRepo = repositoryService.getSettingsRepository()
      const userSettings = await settingsRepo.getCurrentSettings();
      
      // Get all widget IDs to remove
      const widgetIdsToRemove = productWidgets.map(w => w.id);
      
      // Check all settings properties that end with "Widgets" (page widget lists)
      let updateNeeded = false;
      const updatedSettings: Partial<UserSettings> = {};
      
      Object.keys(userSettings).forEach(key => {
        if (key.endsWith('Widgets')) {
          const pageWidgets = userSettings[key] as string[];
          if (pageWidgets && Array.isArray(pageWidgets)) {
            // Filter out the widgets for the removed product
            const filteredWidgets = pageWidgets.filter(
              widgetId => !widgetIdsToRemove.includes(widgetId)
            );
            
            // If there was a change, update this page's widgets
            if (filteredWidgets.length !== pageWidgets.length) {
              updatedSettings[key] = filteredWidgets;
              updateNeeded = true;
              
              console.debug(
                `Removing product widgets from ${key}:`, 
                pageWidgets.filter(id => widgetIdsToRemove.includes(id))
              );
            }
          }
        }
      });
      
      // Save changes if needed
      if (updateNeeded) {
        await settingsRepo.updateSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error removing product widgets from user settings:', error);
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
        Observable.notify(this, 'activeWidgets');

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
  protected async createWidgetElement(widget: WidgetDefinition, wrapperElement: HTMLElement) {
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

  /**
   * Adds widgets to the DOM with appropriate size classes and wrapped in widget-wrapper
   */
  protected addWidgetsToDOM() {
    console.debug('Adding widgets to DOM...');
    const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement;

    this.activeWidgets.forEach((widget) => {
      // Create the wrapper element using our helper
      const wrapperElement = createWidgetWrapper({
        widgetId: widget.id,
        initialState: 'loading',
        warningTimeout: 5000,
        failureTimeout: 10000,
        additionalAttributes: {
          'widget-name': widget.name || widget.id,
          'page-type': this.pageType
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
   * Handle resize event
   */
  protected handleResize() {
    this.optimizeLayout();
  }

  /**
   * Optimizes widget layout based on container width and widget count
   */
  protected optimizeLayout() {
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
  protected updateGridLayout(container: HTMLElement, widgets: HTMLElement[]) {
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
  protected distributeWidgetSizes(widgets: HTMLElement[], containerWidth: number) {
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
  protected setWidgetSize(widget: HTMLElement, size: 'sm' | 'md' | 'lg' | 'xl') {
    // Remove existing size classes
    widget.classList.remove('widget-sm', 'widget-md', 'widget-lg', 'widget-xl');

    // Add the new size class
    widget.classList.add(`widget-${size}`);
  }

  /**
   * Save widget preferences for this page
   * This stores the current active widgets for the specific pageas string[] | undefined;
   */
  protected async saveWidgetPreferences(widgetIds: string[]): Promise<void> {
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      // const settingsRepo = repositoryService.getSettingsRepository();
      
      // Get the page-specific settings key
      const pageKey = `${this.pageType}Widgets`;
      
      await settingsRepo.updateSettings({
        [pageKey]: widgetIds
      });

      console.debug(`Saved widget preferences for ${this.pageType}:`, widgetIds);
    } catch (error) {
      console.error('Error saving widget preferences:', error);
    }
  }

  /**
   * Load user widget preferences from settings repository
   * This retrieves any previously saved widget configuration for this page
   */
  protected async loadUserWidgetPreferences(): Promise<void> {
    try {
      const settingsRepo = repositoryService.getSettingsRepository()
      const userSettings = await settingsRepo.getCurrentSettings();

      // Check for page-specific widget settings using pageType
      const pageKey = `${this.pageType}Widgets`;
      const pageWidgets = userSettings[pageKey] as string[] | undefined;
      
      if (pageWidgets && pageWidgets.length > 0) {
        // User settings always take precedence over initialWidgets 
        console.debug(`Using widgets from user settings for ${this.pageType}:`, pageWidgets);
        this.initialWidgets = pageWidgets.join(',');
      }
      // If no settings found, will fall back to default initialWidgets
    } catch (error) {
      console.error('Error loading user widget preferences:', error);
    }
  }

  /**
   * Handles workflow start events
   */
  protected handleWorkflowStart(event: Event): void {
    const customEvent = event as CustomEvent;
    // Get workflowId from event detail - check both 'workflow' and 'workflowId' for compatibility
    const workflowId = customEvent.detail.workflowId || customEvent.detail.workflow;
    if (!workflowId) {
      console.error('No workflow ID provided in start-workflow event');
      return;
    }

    console.debug(`Starting workflow: ${workflowId}`);

    // Update workflow title based on workflow ID
    this.workflowTitle = this.getWorkflowTitle(workflowId);

    // Open the workflow in the modal
    this.openWorkflow(workflowId, customEvent.detail.params || {});
  }

  /**
   * Gets a user-friendly title for a workflow based on its ID
   */
  protected getWorkflowTitle(workflowId: string): string {
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
  protected async openWorkflow(workflowId: string, params?: Record<string, any>): Promise<void> {
    // Directly use the workflow manager instead of manipulating the modal
    // This ensures proper workflow lifecycle management
    try {
      console.debug(`Starting workflow via manager: ${workflowId}`);
      
      // Let the workflow manager handle everything - it will open the modal as needed
      await workflowManager.startWorkflow(workflowId, params);
    } catch (error) {
      console.error(`Error starting workflow ${workflowId}:`, error);
    }
  }

  /**
   * Handle modal close event - must be public to be accessible from template
   */
  public handleModalClose(): void {
    console.debug('Workflow modal closed');
  }

  /**
   * Handle workflow completion - must be public to be accessible from template
   */
  public handleWorkflowComplete(event: Event): void {
    const result = (event as CustomEvent).detail;
    console.log('[base-page] Workflow completed:', result);

    // Handle specific workflow result actions if needed
    if (result?.success) {
      console.debug(`Workflow completed successfully: ${JSON.stringify(result.data || {})}`);
      
      // Check if this was a product-related workflow
      if (result.data?.productId) {
        console.debug(`Workflow added product: ${result.data.productId}, refreshing search`);
        
        // Force product service to refresh its data
        const productService = getProductService();
        productService.refreshProducts().then(() => {
          // Only refresh search service after products are refreshed
          const searchService = getSearchService();
          searchService.refreshAllSearchableItems();
          console.debug('Search service refreshed after product change');
        });
        
        // Add a delayed refresh for extra safety
        setTimeout(() => {
          const searchService = getSearchService();
          searchService.refreshAllSearchableItems();
          console.debug('Extra search service refresh after delay');
        }, 500);
      }
    }
  }

  /**
   * Handles widget focus events
   * If the widget isn't on this page, it will be added only if targetPage matches
   */
  protected async handleWidgetFocus(event: Event): Promise<void> {
    const detail = (event as CustomEvent).detail;
    const { widgetId } = detail;
    const targetPage = detail.targetPage || this.pageType;
    
    if (!widgetId) {
      console.error('No widget ID provided in focus-widget event');
      return;
    }

    console.debug(`Focusing widget: ${widgetId}, target page: ${detail.targetPage}, current page: ${this.pageType}`);
    

    // Only proceed if this is the target page or no target page was specified
    if (targetPage && targetPage !== this.pageType) {
      console.debug(`Ignoring widget focus event for ${widgetId} because target page ${targetPage} doesn't match current page ${this.pageType}`);
      return;
    }

    // Check if this widget is available for the user
    const isAvailable = await isWidgetAvailableForUser(widgetId);
    if (!isAvailable) {
      console.debug(`Widget ${widgetId} is not available for this user`);
      return;
    }

    // Find the widget element
    if (this.shadowRoot) {
      const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetElement) {
        // Widget is already on this page, scroll to it
        widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add temporary highlight effect to the widget
        widgetElement.classList.add('widget-highlight');
        setTimeout(() => {
          widgetElement.classList.remove('widget-highlight');
        }, 2000);
      } else {
        // Widget not found - add it to this page
        console.debug(`Adding widget ${widgetId} to ${this.pageType} page from search/focus`);
        await this.loadWidgetById(widgetId);
        
        // Save the updated widget list to settings
        await this.saveCurrentWidgetsToSettings();
      }
    }
  }

  /**
   * Save the current active widgets to settings
   * This is called whenever widgets are added or removed
   */
  protected async saveCurrentWidgetsToSettings(): Promise<void> {
    // Get current widget IDs
    const widgetIds = this.activeWidgets.map(w => w.id);
    
    // Save to settings
    await this.saveWidgetPreferences(widgetIds);
  }

  /**
   * Handle retry widget event
   */
  protected handleRetryWidget(event: Event) {
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

    // Get the wrapper element
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
   * This is called when a widget in error state is dismissed via the "Dismiss" button
   */
  protected handleDismissWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;

    console.debug(`Dismissing widget ${widgetId} (from error state)`);

    // The functionality is identical to handleCloseWidget, so we'll reuse that
    this.removeWidgetFromPage(widgetId);
  }

  /**
   * Handle close widget event
   * This is called when a user manually closes a widget via the "X" close button
   */
  protected handleCloseWidget(event: Event): void {
    const { widgetId, pageType } = (event as CustomEvent).detail;
    console.debug(`starting Closing widget ${widgetId} ${pageType} (user requested)`);
    if (!widgetId || this.pageType !== pageType) return;

    console.debug(`Closing widget ${widgetId} ${this.pageType} (user requested)`);
    
    this.removeWidgetFromPage(widgetId);
  }

  /**
   * Common functionality to remove a widget from the page and update settings
   * This is used by both dismiss and close operations
   */
  private removeWidgetFromPage(widgetId: string): void {
    // Find the widget in active widgets
    const widgetToRemove = this.activeWidgets.find(w => w.id === widgetId);
    if (!widgetToRemove) {
      console.warn(`Could not find widget ${widgetId} to remove`);
      return;
    }

    // Remove from active widgets array
    this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);

    // Remove from DOM with a nice fade-out effect
    if (this.shadowRoot) {
      const wrapperElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
      if (wrapperElement) {
        // Add transition for smoother removal
        wrapperElement.classList.add('widget-removing');
        
        // Wait for animation to complete before removing from DOM
        setTimeout(() => {
          if (wrapperElement.parentElement) {
            wrapperElement.parentElement.removeChild(wrapperElement);
          }
          
          // Re-optimize layout after widget is removed
          this.optimizeLayout();
        }, 300); // Match the CSS transition duration
      }
    }

    // Clean up tracking state
    this.widgetLoadAttempts.delete(widgetId);
    
    // Save the updated widget list to settings
    this.saveCurrentWidgetsToSettings();
  }

  /**
   * Handle cancel widget load event
   */
  protected handleCancelWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;

    console.debug(`Cancelling widget load for ${widgetId}`);

    // Get the wrapper element and set it to error state
    const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
    if (wrapper) {
      wrapper.setAttribute('state', 'error');
      wrapper.setAttribute('errorMessage', 'Widget load cancelled due to timeout');
    }
  }
}
