import {
  FASTElement,
  observable,
  when,
  html,
  css,
  Observable
} from '@microsoft/fast-element';
import { WidgetDefinition, widgetService } from '../services/widget-service';
import { userProductService, UserProductService } from '../services/user-product-service';
import {
  getWidgetMinWidth,
  getAutoWidgetsForProduct,
  isWidgetAvailableForUser,
  shouldWidgetBeFullWidth,
  getWidgetById,
  getWidgetColumnSpan,
  getWidgetRowSpan
} from '../widgets/widget-registry';
import { createWidgetWrapper } from '../utils/widget-helper';
import { getSearchService } from '../services/search-service';

// Import grid layout and modal components
import '../components/grid-layout';
import '../components/modal-component';
import '../components/widget-wrapper/widget-wrapper';
import { workflowManager } from '../services/workflow-manager-service';
import { repositoryService } from '../services/repository-service';
import { UserSettings } from '../repositories/settings-repository';
import { GridLayout } from '../components/grid-layout';
import { UserProductChangeEvent } from '../repositories/models/user-product-models';

// Add responsive styles for the base page
export const basePageStyles = css`
  :host {
    display: block;
    height: 100%;
    width: 100%;
    overflow: hidden; /* Prevent scrollbars on the host element */
    background-color: var(--background-color, #f9f9f9);
  }

  .content-container {
    width: 100%;
    height: 100%;
    overflow: hidden; /* Let individual components manage their own overflow */
    box-sizing: border-box;
  }

  .content-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #eaeaea);
  }

  .content-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .widgets-container {
    padding: 1rem;
    overflow: auto; /* Allow vertical scrolling inside the container */
    height: calc(100% - 70px); /* Adjust based on your header height */
    width: 100%;
    box-sizing: border-box;
  }

  .empty-message {
    padding: 2rem;
    text-align: center;
    color: var(--text-light-2, #888);
  }

  /* Responsive adjustments for different screen sizes */
  @media (max-width: 960px) {
    .widgets-container {
      padding: 0.75rem;
    }
  }

  @media (max-width: 750px) {
    .widgets-container {
      padding: 0.5rem;
    }
  }

  @media (max-width: 500px) {
    .widgets-container {
      padding: 0.25rem;
    }

    .content-header h2 {
      font-size: 1.25rem;
    }
  }
`;

// Shared template parts that can be composed by child classes
export const baseContentTemplate = html<BasePage>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h2>${(x) => x.pageTitle}</h2>
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
    <grid-layout class="widgets-container" data-page="${x => x.pageTitle}"></grid-layout>
    
    <!-- Modal for workflows -->
    <dream-modal 
      id="workflowModal"
      title="${x => x.workflowTitle}" 
      @close="${x => x.handleModalClose()}">
    </dream-modal>
  </div>
`;

export const imports = async (url: string) => await import(url)

export class BasePage extends FASTElement {
  // At the start of the class, add a static styles property
  static styles = basePageStyles;

  @observable pageTitle: string = 'Page';
  @observable activeWidgets: WidgetDefinition[] = [];
  @observable ready: boolean = false;
  @observable workflowTitle: string = "Workflow";
  protected dataPage: boolean = true; // Added missing property
  protected productChangeUnsubscribe: (() => void) | null = null;
  protected initialWidgets: string = '';
  protected _initialWidgetsLoaded = false;
  protected userProductService: UserProductService  = userProductService;
  protected settingsRepository = repositoryService.getSettingsRepository();
  protected widgetLoadAttempts: Map<string, number> = new Map();
  protected maxLoadAttempts = 2;
  protected pageType: string = 'base';

  private boundHandleResize: EventListener;
  private boundHandleWorkflowStart: EventListener;
  private boundHandleWidgetFocus: EventListener;
  private boundHandleCloseWidget: EventListener;
  private boundHandleRetryWidget: EventListener;
  private boundHandleDismissWidget: EventListener;
  private boundHandleCancelWidget: EventListener;

  

  constructor() {
    super();
    // Create bound handlers once to ensure we can remove the same function references
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundHandleWorkflowStart = this.handleWorkflowStart.bind(this);
    this.boundHandleWidgetFocus = this.handleWidgetFocus.bind(this);
    this.boundHandleCloseWidget = this.handleCloseWidget.bind(this);
    this.boundHandleRetryWidget = this.handleRetryWidget.bind(this);
    this.boundHandleDismissWidget = this.handleDismissWidget.bind(this);
    this.boundHandleCancelWidget = this.handleCancelWidget.bind(this);
  }

  protected get modal(): any | null {
    const ModalType = imports("@components/modal")
    return this.shadowRoot?.getElementById('workflowModal') as typeof ModalType | null;
  }

  connectedCallback(): void {
    this.loadUserWidgetPreferences();
    super.connectedCallback();

    widgetService.onWidgetsRegistered(() => {
      this.loadWidgets();
    });

    if (widgetService.areAllWidgetsRegistered()) {
      this.loadWidgets();
    }

    // Use bound event handlers
    window.addEventListener('resize', this.boundHandleResize);
    document.addEventListener('start-workflow', this.boundHandleWorkflowStart);
    document.addEventListener('focus-widget', this.boundHandleWidgetFocus);
    document.addEventListener('close-widget', this.boundHandleCloseWidget);
    document.addEventListener('retry-widget', this.boundHandleRetryWidget);
    document.addEventListener('dismiss-widget', this.boundHandleDismissWidget);
    document.addEventListener('cancel-widget-load', this.boundHandleCancelWidget);

    this.subscribeToProductChanges();
    // Diagnostic log to track page lifecycle
    console.debug(`${this.pageType} page connected`);

    // Trigger an initial layout optimization
    setTimeout(() => this.handleResize(), 0);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    // Use bound event handlers for removal
    window.removeEventListener('resize', this.boundHandleResize);
    document.removeEventListener('start-workflow', this.boundHandleWorkflowStart);
    document.removeEventListener('focus-widget', this.boundHandleWidgetFocus);
    document.removeEventListener('close-widget', this.boundHandleCloseWidget);
    document.removeEventListener('retry-widget', this.boundHandleRetryWidget);
    document.removeEventListener('dismiss-widget', this.boundHandleDismissWidget);
    document.removeEventListener('cancel-widget-load', this.boundHandleCancelWidget);
    document.removeEventListener('retry-widget', this.boundHandleRetryWidget);
    if (this.productChangeUnsubscribe) {
      this.productChangeUnsubscribe();
      this.productChangeUnsubscribe = null;
    }
    // Diagnostic log
    console.debug(`${this.pageType} page disconnected`);
  }

  async loadWidgets(): Promise<void> {
    console.debug('Base loadWidgets called - subclasses should override this');
    await this.loadUserWidgetPreferences();
    if (this.initialWidgets) {
      await this.loadWidgetsFromList(this.initialWidgets);
    } else {
      this.ready = true;
    }
  }

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
      this.ready = true;
    }
  }

  protected async loadInitialWidgets(widgetIds: string[]): Promise<void> {
    console.debug(`Loading initial widgets for ${this.pageTitle}:`, widgetIds);
    try {
      const widgets = await widgetService.loadWidgets(widgetIds);
      console.debug(`Loaded ${widgets.length} widgets:`, widgets);
      this.activeWidgets.push(...widgets);
      this.addWidgetsToDOM();
      this.ready = true;
      this.saveWidgetPreferences(widgetIds);
    } catch (error) {
      console.error('Error loading widgets:', error);
    }
  }

  protected subscribeToProductChanges(): void {
    this.productChangeUnsubscribe = this.userProductService.subscribe(this.handleProductChange.bind(this));
    setTimeout(() => this.checkForProductWidgets(), 500);
  }

  protected handleProductChange(event: UserProductChangeEvent): void {
    console.debug(`Product ${event.type} event received:`, event.product?.id);
    const productId = event.productId;
    if (event.type === 'add') {
      this.addWidgetsForProduct(productId);
    } else if (event.type === 'remove') {
      this.removeWidgetsForProduct(productId);
    }

    const searchService = getSearchService();
    searchService.refreshAllSearchableItems();
    console.debug('Search service refreshed after product change');
  }

  protected async checkForProductWidgets(): Promise<void> {
    // This method now only checks for product changes since the user last visited 
    // It will not add widgets to the page unless the product was just added during this session
    console.debug('Search service refreshed after product change');
    // All widget placement is determined from user settings, not from hardcoded rules
  }

  protected async addWidgetsForProduct(productId: string): Promise<void> {
    try {
      const autoWidgets = getAutoWidgetsForProduct(productId);
      if (autoWidgets.length === 0) return;
      console.debug(`Adding widgets for product ${productId} to ${this.pageType} page:`,
        autoWidgets.map(w => w.id));
      for (const widget of autoWidgets) {
        if (this.activeWidgets.some(w => w.id === widget.id)) {
          console.debug(`Widget ${widget.id} is already on ${this.pageType} page`);
          continue;
        }
        console.debug(`Auto-adding widget ${widget.id} to ${this.pageType} page after product add`);
        await this.loadWidgetById(widget.id);
      }
      await this.saveCurrentWidgetsToSettings();
    } catch (error) {
      console.error(`Error adding widgets for product ${productId}:`, error);
    }
  }

  protected async removeWidgetsForProduct(productId: string): Promise<void> {
    const productWidgets = getAutoWidgetsForProduct(productId);
    if (productWidgets.length === 0) return;
    console.debug(`Removing widgets for product ${productId}:`, productWidgets.map(w => w.id));
    let widgetsRemoved = false;
    productWidgets.forEach(widget => {
      const widgetId = widget.id;
      if (this.activeWidgets.some(w => w.id === widgetId)) {
        this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);
        if (this.shadowRoot) {
          const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
          if (widgetElement) {
            widgetElement.remove();
            widgetsRemoved = true;
          }
        }
      }
    });
    if (widgetsRemoved) {
      await this.saveCurrentWidgetsToSettings();
    }
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      const userSettings = await settingsRepo.getCurrentSettings();
      const widgetIdsToRemove = productWidgets.map(w => w.id);
      const updatedSettings: Partial<UserSettings> = {};

      Object.keys(userSettings).forEach(key => {
        if (key.endsWith('Widgets')) {
          const pageWidgets = userSettings[key] as string[];
          if (pageWidgets && Array.isArray(pageWidgets)) {
            const filteredWidgets = pageWidgets.filter(
              widgetId => !widgetIdsToRemove.includes(widgetId)
            );
            if (filteredWidgets.length !== pageWidgets.length) {
              updatedSettings[key] = filteredWidgets;
            }
          }
        }
      });
      if (Object.keys(updatedSettings).length > 0) {
        // Fix: use update method instead of non-existent saveSettings method
        await settingsRepo.update(userSettings.id, updatedSettings);
      }
    } catch (error) {
      console.error('Error removing product widgets from user settings:', error);
    }
  }

  async loadWidgetById(widgetId: string): Promise<void> {
    try {
      if (this.activeWidgets.some(widget => widget.id === widgetId)) {
        console.debug(`Widget ${widgetId} is already active, not loading again`);
        return;
      }
      const widgets = await widgetService.loadWidgets([widgetId]);
      if (widgets.length > 0) {
        const widget = widgets[0];
        this.activeWidgets.push(widget);
        Observable.notify(this, 'activeWidgets');

        // Get the widget definition from registry for spans
        const widgetDef = getWidgetById(widgetId);
        console.debug(`Loading widget ${widgetId}, definition:`, widgetDef);
        // Get grid dimensions from registry
        let colSpan = widgetDef?.colSpan || getWidgetColumnSpan(widgetId);
        let rowSpan = widgetDef?.rowSpan || getWidgetRowSpan(widgetId);
        // Try to load grid dimensions from settings if available
        if (this.dataPage) {
          try {
            const dimensions = await this.settingsRepository.getWidgetGridDimensions(
              this.pageType,
              widgetId,
              colSpan,   // Default to registry value if not in settings
              rowSpan    // Default to registry value if not in settings
            );
            colSpan = dimensions.colSpan;
            rowSpan = dimensions.rowSpan;
            console.debug(`Loaded dimensions from settings for widget ${widgetId}: ${colSpan}x${rowSpan}`);
          } catch (error) {
            console.warn(`Failed to load grid dimensions for widget ${widgetId}:`, error);
          }
        }
        // Create the wrapper with spans
        const wrapperElement = createWidgetWrapper({
          widgetId: widget.id,
          initialState: 'loading',
          additionalAttributes: {
            'widget-name': widget.name || widget.id,
            'page-type': this.pageType,
            'colSpan': colSpan.toString(),
            'rowSpan': rowSpan.toString()
          }
        });
        // Critical: Ensure data-grid-item-id is set on the wrapper's parent element
        wrapperElement.setAttribute('data-widget-id', widgetId);
        wrapperElement.setAttribute('data-grid-item-id', widgetId);
        const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement;
        widgetContainer.appendChild(wrapperElement);
        // Use grid-layout's addItem method with proper spans
        const gridLayout = widgetContainer as any;
        if (gridLayout.addItem && typeof gridLayout.addItem === 'function') {
          // Log grid layout presence and function
          console.debug(`Found grid-layout with addItem function for widget ${widgetId}`);

          gridLayout.addItem(wrapperElement, {
            id: widget.id,
            colSpan,
            rowSpan,
            minWidth: widgetDef?.minWidth || getWidgetMinWidth(widget.id),
            fullWidth: widgetDef?.fullWidth || shouldWidgetBeFullWidth(widget.id)
          });

          // Verify data attribute after adding to grid
          console.debug(`Widget wrapper data-grid-item-id after grid.addItem: ${wrapperElement.getAttribute('data-grid-item-id')}`);
        } else {
          console.warn(`Grid layout for ${widgetId} does not have addItem method!`);
        }

        this.createWidgetElement(widget, wrapperElement);
        wrapperElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        wrapperElement.classList.add('widget-highlight');
        setTimeout(() => {
          wrapperElement.classList.remove('widget-highlight');
        }, 2000);
        // Update layout
        if (gridLayout.updateLayout && typeof gridLayout.updateLayout === 'function') {
          gridLayout.updateLayout();
        }
      } else {
        console.error(`Widget with ID ${widgetId} could not be loaded`);
      }
    } catch (error) {
      console.error(`Error loading widget ${widgetId}:`, error);
    }
  }

  protected async createWidgetElement(widget: WidgetDefinition, wrapperElement: HTMLElement): Promise<void> {
    try {
      this.widgetLoadAttempts.set(widget.id, (this.widgetLoadAttempts.get(widget.id) || 0) + 1);
      console.debug(`Creating widget element: ${widget.id} (${widget.elementName})`);
      const widgetElement = await widgetService.createWidgetElement(widget.id);
      console.debug(`Widget element created for ${widget.id}`, widgetElement);
      if (!widgetElement) {
        throw new Error(`Failed to create widget element for ${widget.id}`);
      }
      console.debug(`Widget element created for ${widget.id}`);
      widgetElement.addEventListener('*', (event) => {
        console.debug(`Widget ${widget.id} event: ${event.type}`);
      }, true);
      const onLoaded = () => {
        console.debug(`Widget ${widget.id} initialized`);
        widgetElement.removeEventListener('initialized', onLoaded);
      };
      widgetElement.addEventListener('initialized', onLoaded);

      console.debug(`Adding widget ${widget.id} to wrapper`);
      wrapperElement.appendChild(widgetElement);
    } catch (error) {
      console.error(`Error creating widget ${widget.id}:`, error);
      wrapperElement.setAttribute('state', 'error');
      wrapperElement.setAttribute('errorMessage',
        error instanceof Error ? error.message : 'Failed to initialize widget'
      );
    }
  }

  protected async addWidgetsToDOM(): Promise<void> {
    console.debug('Adding widgets to DOM...');
    const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement;
    if (!widgetContainer) return;

    // Get the GridLayout component
    const gridLayout = widgetContainer as GridLayout;

    // Set the data-page attribute on the grid layout to ensure it's available to all widgets
    gridLayout.setAttribute('data-page', this.pageType);

    // Process each active widget
    this.activeWidgets.forEach(async (widget) => {
      const widgetDef = getWidgetById(widget.id);
      console.debug(`Adding widget to DOM: ${widget.id}, definition:`, widgetDef);

      // Create widget wrapper with explicit page-type attribute
      const wrapperElement = createWidgetWrapper({
        widgetId: widget.id,
        initialState: 'loading',
        warningTimeout: 5000,
        failureTimeout: 10000,
        additionalAttributes: {
          'widget-name': widget.name || widget.id,
          'page-type': this.pageType,  // Ensure page-type is explicitly set
          'colSpan': widgetDef?.colSpan?.toString() || getWidgetColumnSpan(widget.id).toString(),
          'rowSpan': widgetDef?.rowSpan?.toString() || getWidgetRowSpan(widget.id).toString()
        }
      });

      // Debug the page type setting
      console.debug(`Widget wrapper ${widget.id} created with page-type: ${wrapperElement.getAttribute('page-type')}`);

      // Add wrapper to DOM
      widgetContainer.appendChild(wrapperElement);
      // Get grid dimensions from user settings
      let colSpan = widgetDef?.colSpan || getWidgetColumnSpan(widget.id);
      let rowSpan = widgetDef?.rowSpan || getWidgetRowSpan(widget.id);
      // If we're a data page, try to load saved dimensions
      if (this.dataPage) {
        try {
          const dimensions = await this.settingsRepository.getWidgetGridDimensions(
            this.pageType,
            widget.id,
            colSpan,   // Default to registry value if not in settings
            rowSpan    // Default to registry value if not in settings
          );
          colSpan = dimensions.colSpan;
          rowSpan = dimensions.rowSpan;
        } catch (error) {
          console.warn(`Failed to load grid dimensions for widget ${widget.id}:`, error);
        }
      }
      // Add to grid layout with proper metadata
      gridLayout.addItem(wrapperElement, {
        id: widget.id,
        colSpan,
        rowSpan,
        minWidth: widgetDef?.minWidth || getWidgetMinWidth(widget.id),
        fullWidth: widgetDef?.fullWidth || shouldWidgetBeFullWidth(widget.id)
      });
      // Create the actual widget element inside the wrapper
      this.createWidgetElement(widget, wrapperElement);
    });
  }

  protected handleResize() {
    // Update to call grid layout's updateLayout instead of the removed optimizeLayout
    const gridLayout = this.shadowRoot?.querySelector('.widgets-container') as any;
    if (gridLayout && typeof gridLayout.updateLayout === 'function') {
      gridLayout.updateLayout();
    }
  }

  protected handleWorkflowStart(event: Event): void {
    const customEvent = event as CustomEvent;
    const workflowId = customEvent.detail.workflowId || customEvent.detail.workflow;
    if (!workflowId) {
      console.error('No workflow ID provided in start-workflow event');
      return;
    }
    console.debug(`Starting workflow: ${workflowId}`);
    this.workflowTitle = this.getWorkflowTitle(workflowId);
    this.openWorkflow(workflowId, customEvent.detail.params || {});
  }

  protected getWorkflowTitle(workflowId: string): string {
    const titles: Record<string, string> = {
      'transfer': 'Transfer Money',
      'kyc': 'Identity Verification',
      'create-account': 'Create New Account'
    };
    return titles[workflowId] || `Start ${workflowId}`;
  }

  protected async openWorkflow(workflowId: string, params?: Record<string, any>): Promise<void> {
    try {
      console.debug(`Starting workflow via manager: ${workflowId}`);
      await workflowManager.startWorkflow(workflowId, params);
    } catch (error) {
      console.error(`Error starting workflow ${workflowId}:`, error);
    }
  }

  public handleModalClose(): void {
    console.debug('Workflow modal closed');
  }

  protected async handleWidgetFocus(event: Event): Promise<void> {
    const detail = (event as CustomEvent).detail;
    const { widgetId } = detail;
    const targetPage = detail.targetPage || this.pageType;
    if (!widgetId) {
      console.error('No widget ID provided in focus-widget event');
      return;
    }
    console.debug(`Focusing widget: ${widgetId}, target page: ${detail.targetPage}, current page: ${this.pageType}`);
    if (targetPage && targetPage !== this.pageType) {
      console.debug(`Ignoring widget focus event for ${widgetId} because target page ${targetPage} doesn't match current page ${this.pageType}`);
      return;
    }
    const isAvailable = await isWidgetAvailableForUser(widgetId);
    if (!isAvailable) {
      console.warn(`Widget ${widgetId} is not available for this user`);
      return;
    }

    if (this.shadowRoot) {
      const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetElement) {
        console.debug(`Scrolling to widget ${widgetId} on ${this.pageType} page`);
        widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        widgetElement.classList.add('widget-highlight');
        setTimeout(() => {
          widgetElement.classList.remove('widget-highlight');
        }, 2000);
      } else {
        console.debug(`Adding widget ${widgetId} to ${this.pageType} page from search/focus`);
        await this.loadWidgetById(widgetId);
        await this.saveCurrentWidgetsToSettings();
      }
    }
  }

  protected async saveCurrentWidgetsToSettings(): Promise<void> {
    const widgetIds = this.activeWidgets.map(w => w.id);
    await this.saveWidgetPreferences(widgetIds);
  }

  protected handleRetryWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;
    console.debug(`Retrying widget load for ${widgetId}`);
    const widget = this.activeWidgets.find(w => w.id === widgetId);
    if (!widget) return;
    const attempts = this.widgetLoadAttempts.get(widgetId) || 0;
    if (attempts >= this.maxLoadAttempts) {
      console.error(`Exceeded max retry attempts (${this.maxLoadAttempts}) for widget ${widgetId}`);
      const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
      if (wrapper) {
        wrapper.setAttribute('state', 'error');
        wrapper.setAttribute('errorMessage', `Failed to load after ${this.maxLoadAttempts} attempts`);
      }
      return;
    }
    const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
    if (!wrapper) return;
    while (wrapper.firstChild) {
      wrapper.removeChild(wrapper.firstChild);
    }
    wrapper.setAttribute('state', 'loading');
    this.createWidgetElement(widget, wrapper as HTMLElement);
  }

  protected handleDismissWidget(event: Event) {
    console.debug('Dismissing widget:', event);
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;
    console.debug(`Dismissing widget ${widgetId} (from error state)`);
    this.removeWidgetFromPage(widgetId);
  }

  protected handleCloseWidget(event: Event): void {
    console.debug('Closing widget:', event);
    const { widgetId, pageType } = (event as CustomEvent).detail;
    if (!widgetId || this.pageType !== pageType) return;
    console.debug(`Closing widget ${widgetId} ${this.pageType} (user requested)`);
    this.removeWidgetFromPage(widgetId);
  }

  private removeWidgetFromPage(widgetId: string): void {
    // Find widget in active widgets array
    const widgetToRemove = this.activeWidgets.find(w => w.id === widgetId);
    if (!widgetToRemove) {
      console.warn(`Could not find widget ${widgetId} to remove`);
      return;
    }

    // Update our active widgets tracking array
    this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);

    // Get direct reference to the grid-layout
    const gridLayout = this.shadowRoot?.querySelector('.widgets-container') as GridLayout;
    if (!gridLayout) {
      console.error("Could not find grid-layout component");
      return;
    }

    // Find the widget element directly within the grid
    const widgetElement = gridLayout.querySelector(`[data-grid-item-id="${widgetId}"]`);
    if (widgetElement) {
      // Add a brief animation class if desired
      widgetElement.classList.add('widget-removing');

      // Use short timeout to allow animation to complete
      setTimeout(() => {
        // Remove from grid directly
        if (widgetElement.parentElement) {
          widgetElement.parentElement.removeChild(widgetElement);
        }

        // If grid-layout has a removeItem method, use it
        if (typeof gridLayout.removeItem === 'function') {
          gridLayout.removeItem(widgetId);
        }

        // Always update the layout
        if (typeof gridLayout.updateLayout === 'function') {
          gridLayout.updateLayout();
        }
      }, 300);

      // remove any settings for this widget
      this.settingsRepository.removeWidgetFromLayout(this.pageType, widgetId);
    }

    // Clean up and save settings
    this.widgetLoadAttempts.delete(widgetId);
    this.saveCurrentWidgetsToSettings();
  }

  protected handleCancelWidget(event: Event) {
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;
    console.debug(`Cancelling widget load for ${widgetId}`);
    const wrapper = this.shadowRoot?.querySelector(`widget-wrapper[widgetId="${widgetId}"]`);
    if (wrapper) {
      wrapper.setAttribute('state', 'error');
      wrapper.setAttribute('errorMessage', 'Widget load cancelled due to timeout');
    }
  }

  // Add a simple optimizeLayout method that delegates to grid-layout
  // for backward compatibility with any code that might still call it
  protected optimizeLayout(): void {
    const gridLayout = this.shadowRoot?.querySelector('.widgets-container') as any;
    if (gridLayout && typeof gridLayout.updateLayout === 'function') {
      gridLayout.updateLayout();
    }
  }

  protected async loadUserWidgetPreferences(): Promise<void> {
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      const userSettings = await settingsRepo.getCurrentSettings();
      const pageKey = `${this.pageType}Widgets`;
      const pageWidgets = userSettings[pageKey] as string[] | undefined;
      if (pageWidgets && pageWidgets.length > 0) {
        console.debug(`Using widgets from user settings for ${this.pageType}:`, pageWidgets);
        this.initialWidgets = pageWidgets.join(',');
      } else {
        console.debug(`No saved widget preferences found for ${this.pageType} page`);
      }
    } catch (error) {
      console.error('Error loading user widget preferences:', error);
    }
  }

  protected async saveWidgetPreferences(widgetIds: string[]): Promise<void> {
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      const pageKey = `${this.pageType}Widgets`;

      console.debug(`Saving widget preferences for ${this.pageType}:`, widgetIds);

      // Fix: Get current settings to access the ID, then use update method
      const userSettings = await settingsRepo.getCurrentSettings();
      await settingsRepo.update(userSettings.id, {
        [pageKey]: widgetIds
      });

      // Ensure each widget exists in the layout
      for (const widgetId of widgetIds) {
        await settingsRepo.ensureWidgetInLayout(this.pageType, widgetId);
      }

      console.debug(`Saved widget preferences for ${this.pageType}:`, widgetIds);
    } catch (error) {
      console.error('Error saving widget preferences:', error);
    }
  }
}
