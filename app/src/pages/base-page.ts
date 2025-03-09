import {
  FASTElement,
  observable,
  when,
  html,
  css,
  Observable
} from '@microsoft/fast-element';
import { WidgetDefinition, widgetService } from '../services/widget-service';
import { getProductService, ProductService } from '../services/product-service';
import { 
  getWidgetPreferredSize, 
  getWidgetMinWidth, 
  getAutoWidgetsForProduct,
  isWidgetAvailableForUser,
  shouldWidgetBeFullWidth
} from '../widgets/widget-registry';
import { ModalComponent } from '../components/modal-component';
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
import { ProductChangeEvent } from '../repositories/models/product-models';

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

export class BasePage extends FASTElement {
  @observable pageTitle: string = 'Page';
  @observable activeWidgets: WidgetDefinition[] = [];
  @observable ready: boolean = false;
  @observable workflowTitle: string = "Workflow";
  protected productChangeUnsubscribe: (() => void) | null = null;
  protected initialWidgets: string = '';
  protected _initialWidgetsLoaded = false;
  protected productService: ProductService | null = null;
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

  protected get modal(): ModalComponent | null {
    return this.shadowRoot?.getElementById('workflowModal') as ModalComponent | null;
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
    this.productService = getProductService();
    this.productChangeUnsubscribe = this.productService.subscribe(this.handleProductChange.bind(this));
    setTimeout(() => this.checkForProductWidgets(), 500);
  }

  protected handleProductChange(event: ProductChangeEvent): void {
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
        await settingsRepo.updateSettings(updatedSettings);
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

        const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement;
        const wrapperElement = createWidgetWrapper({
          widgetId: widget.id,
          initialState: 'loading',
          additionalAttributes: {
            'widget-name': widget.name || widget.id,
            'page-type': this.pageType
          }
        });
        
        widgetContainer.appendChild(wrapperElement);
        
        // Use grid-layout's addItem method if available
        const gridLayout = widgetContainer as any;
        if (gridLayout.addItem && typeof gridLayout.addItem === 'function') {
          gridLayout.addItem(wrapperElement, {
            id: widget.id,
            preferredSize: getWidgetPreferredSize(widget.id),
            minWidth: getWidgetMinWidth(widget.id),
            fullWidth: shouldWidgetBeFullWidth(widget.id)
          });
        }
        
        this.createWidgetElement(widget, wrapperElement);
        wrapperElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        wrapperElement.classList.add('widget-highlight');
        setTimeout(() => {
          wrapperElement.classList.remove('widget-highlight');
        }, 2000);
        
        // Let grid handle layout optimization
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

      // Let grid-layout handle full-width behavior
      // We don't need to add widget-full-width class here anymore

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
    const gridLayout = widgetContainer as GridLayout; // Cast to any to access the addItem method

    // TODO: continue here
    const getSize = async (page: string, widgetId: string) => {
      const size = await this.settingsRepository.getWidgetSize(page, widgetId);
      console.debug(`Widget ${widgetId} size: ${size}`);
      return size;
    }

    this.activeWidgets.forEach(async (widget) => {
      
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


      // Add wrapper to DOM
      widgetContainer.appendChild(wrapperElement);
      
      const userSize = await getSize(this.pageTitle, widget.id);
      // If grid-layout component has the addItem method, use it to properly set up the item
      gridLayout.addItem(wrapperElement, {
        id: widget.id,
        preferredSize: userSize || getWidgetPreferredSize(widget.id),
        minWidth: getWidgetMinWidth(widget.id),
        fullWidth: shouldWidgetBeFullWidth(widget.id)
      });
      
      this.createWidgetElement(widget, wrapperElement);
    });

    // Let the grid layout optimize itself
    setTimeout(() => {
      gridLayout.updateLayout();
    }, 50);
  }

  protected handleResize() {
    // Update to call grid layout's updateLayout instead of the removed optimizeLayout
    const gridLayout = this.shadowRoot?.querySelector('.widgets-container') as any;
    if (gridLayout && typeof gridLayout.updateLayout === 'function') {
      gridLayout.updateLayout();
    }
  }

  /*
  Handles workflow start events, mainly from search results
  */
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
      console.debug(`Widget ${widgetId} is not available for this user`);
      return;
    }

    if (this.shadowRoot) {
      const widgetElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetElement) {
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
    const { widgetId } = (event as CustomEvent).detail;
    if (!widgetId) return;
    console.debug(`Dismissing widget ${widgetId} (from error state)`);
    this.removeWidgetFromPage(widgetId);
  }

  protected handleCloseWidget(event: Event): void {
    const { widgetId, pageType } = (event as CustomEvent).detail;
    if (!widgetId || this.pageType !== pageType) return;
    console.debug(`Closing widget ${widgetId} ${this.pageType} (user requested)`);
    this.removeWidgetFromPage(widgetId);
  }

  private removeWidgetFromPage(widgetId: string): void {
    const widgetToRemove = this.activeWidgets.find(w => w.id === widgetId);
    if (!widgetToRemove) {
      console.warn(`Could not find widget ${widgetId} to remove`);
      return;
    }
    this.activeWidgets = this.activeWidgets.filter(w => w.id !== widgetId);
    if (this.shadowRoot) {
      const wrapperElement = this.shadowRoot.querySelector(`[data-widget-id="${widgetId}"]`);
      if (wrapperElement) {
        wrapperElement.classList.add('widget-removing');
        setTimeout(() => {
          if (wrapperElement.parentElement) {
            wrapperElement.parentElement.removeChild(wrapperElement);
          }
          
          // Update to use grid layout's updateLayout method
          const gridLayout = this.shadowRoot?.querySelector('.widgets-container') as any;
          if (gridLayout && typeof gridLayout.updateLayout === 'function') {
            gridLayout.updateLayout();
          }
        }, 300);
      }
    }
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
      await settingsRepo.updateSettings({
        [pageKey]: widgetIds
      });
      console.debug(`Saved widget preferences for ${this.pageType}:`, widgetIds);
    } catch (error) {
      console.error('Error saving widget preferences:', error);
    }
  }
}
