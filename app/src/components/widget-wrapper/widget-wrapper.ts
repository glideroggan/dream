import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { getWidgetById, getWidgetColumnSpan, getWidgetRowSpan } from "../../widgets/widget-registry";
import { template } from "./widget-wrapper-template";
import { styles } from "./widget-wrapper-styles";
import { createWidgetEvents, createBoundEventHandlers } from "./widget-wrapper-events";
import { WidgetTimeoutHandler } from "./widget-wrapper-timeout";
import { WidgetStateManager } from "./widget-wrapper-error-handling";
import { WidgetSizingManager } from "./widget-wrapper-sizing";
import { WidgetSettingsManager } from "./widget-wrapper-settings";
import { DEFAULT_COLUMN_SPAN, DEFAULT_ROW_SPAN } from "../../constants/grid-constants";
import { WidgetResizeTracker } from "../../utils/resize-tracker";

/**
 * Widget loading states
 */
export type WidgetWrapperState = 'loading' | 'loaded' | 'error' | 'import-error' | 'timeout-warning';

@customElement({
  name: "widget-wrapper",
  template,
  styles
})
export class WidgetWrapper extends FASTElement {
  // Widget attributes
  @attr widgetTitle: string = "";
  @attr widgetId: string = "";
  @attr state: WidgetWrapperState = 'loading';
  @attr errorMessage: string = '';
  @attr({attribute: 'page-type'}) pageType: string = '';
  @attr moduleImportPath: string = '';
  @attr({ mode: "boolean" }) hideCloseButton: boolean = false;
  @attr widgetName: string = '';
  
  // Computed properties
  get displayName(): string {
    return this.widgetName || this.widgetTitle || this.widgetId || 'Unknown Widget';
  }
  @attr({ attribute: 'seamless-integration', mode: 'boolean' }) seamlessIntegration: boolean = false;
  @attr({ attribute: 'save-dimensions', mode: 'boolean' }) saveDimensions: boolean = true;
  @attr({ attribute: 'load-from-settings', mode: 'boolean' }) loadFromSettings: boolean = true;
  
  // Grid span attributes - using constants for default/max values
  @attr({ mode: "fromView" }) colSpan: number = DEFAULT_COLUMN_SPAN;
  @attr({ mode: "fromView" }) rowSpan: number = DEFAULT_ROW_SPAN;
  @attr({ mode: "boolean" }) showSizeControls: boolean = true;
  @attr maxColSpan: number = 30; // MAX_GRID_COLUMNS
  @attr maxRowSpan: number = 24; // Changed from 12 to 24 to allow taller widgets
  @attr minColSpan: number = 1;
  @attr minRowSpan: number = 1;

  // Timeout configuration
  @attr({ mode: "fromView" }) warningTimeout: number = 5000; // 5 seconds for warning
  @attr({ mode: "fromView" }) failureTimeout: number = 10000; // 10 seconds for auto-failure

  // Widget definition object
  @observable _widgetDefinition: any = null;

  // Events
  events: ReturnType<typeof createWidgetEvents>;
  
  // Managers for different aspects of widget wrapper
  timeoutHandler: WidgetTimeoutHandler;
  stateManager: WidgetStateManager;
  sizingManager: WidgetSizingManager;
  settingsManager: WidgetSettingsManager;
  
  // Event handlers
  private eventHandlers: ReturnType<typeof createBoundEventHandlers>;
  
  // Track initialization state
  initialized: boolean = false;
  private connectedEventDispatched: boolean = false;

  // Add new properties for content-aware resizing
  resizeTracker: WidgetResizeTracker;
  contentResizeObserver: ResizeObserver | null = null;
  isManuallyResized: boolean = false;
  autoSizeEnabled: boolean = true;
  
  @attr({ mode: "boolean" }) enableAutoSize: boolean = true;

  constructor() {
    super();
    
    // Create custom events
    this.events = createWidgetEvents(this.widgetId, this.pageType);
    
    // Initialize managers first
    this.stateManager = new WidgetStateManager(this);
    this.sizingManager = new WidgetSizingManager(this);
    this.settingsManager = new WidgetSettingsManager(this);
    
    // Initialize timeout handler
    this.timeoutHandler = new WidgetTimeoutHandler(
      this.widgetId || 'unknown',
      // Warning timeout callback
      () => {
        if (this.state === 'loading') {
          this.state = 'timeout-warning';
        }
      },
      // Failure timeout callback
      () => {
        this.state = 'error';
        this.errorMessage = `Widget failed to initialize within ${this.failureTimeout / 1000} seconds`;
      },
      this.warningTimeout,
      this.failureTimeout
    );

    // Initialize resize tracker with default row span
    this.resizeTracker = new WidgetResizeTracker(this.rowSpan);
    
    // Create bound event handlers - provide explicit handlers from state manager
    this.eventHandlers = createBoundEventHandlers(this, {
      handleChildError: this.handleChildError,
      handleInitialized: this.handleInitialized,
      handleModuleError: this.handleModuleError
    });
  }

  // These handler methods delegate to the state manager
  handleChildError(event: Event): void {
    this.stateManager.handleChildError(event);
  }
  
  handleInitialized(event: Event): void {
    this.stateManager.handleInitialized(event);
  }
  
  handleModuleError(event: Event): void {
    this.stateManager.handleModuleError(event);
  }

  connectedCallback() {
    super.connectedCallback();

    // Prevent unwanted tooltips by removing any title attribute from the host element
    if (this.hasAttribute('title')) {
      this.removeAttribute('title');
    }
    
    // Ensure data attributes are consistent - this is critical for grid layout to find the wrapper
    this.setAttribute('data-widget-id', this.widgetId);
    
    // If we're inside a grid item, ensure it has consistent data attributes
    const parentElement = this.parentElement;
    if (parentElement) {
      parentElement.setAttribute('data-grid-item-id', this.widgetId);
      parentElement.setAttribute('data-widget-id', this.widgetId);
    }
    
    // Get widget info from registry
    this.updateWidgetDefinition();
    
    // Load dimensions from settings if enabled
    if (this.loadFromSettings && this.pageType && this.widgetId) {
      this.settingsManager.loadDimensionsFromSettings();
    } else {
      // If spans are not set explicitly, get them from widget definition
      if (this._widgetDefinition) {
        if (!this.hasAttribute('colSpan') && this._widgetDefinition.colSpan) {
          this.colSpan = this._widgetDefinition.colSpan;
          console.debug(`Widget wrapper ${this.widgetId} setting colSpan from registry: ${this.colSpan}`);
        }
        
        if (!this.hasAttribute('rowSpan') && this._widgetDefinition.rowSpan) {
          this.rowSpan = this._widgetDefinition.rowSpan;
          console.debug(`Widget wrapper ${this.widgetId} setting rowSpan from registry: ${this.rowSpan}`);
        }
      } else {
        // If no definition, get spans directly from registry functions
        if (!this.hasAttribute('colSpan')) {
          const colSpan = this.getWidgetColumnSpanFromRegistry();
          if (colSpan) {
            this.colSpan = colSpan;
            console.debug(`Widget wrapper ${this.widgetId} setting colSpan from registry function: ${this.colSpan}`);
          }
        }
        
        if (!this.hasAttribute('rowSpan')) {
          const rowSpan = this.getWidgetRowSpanFromRegistry();
          if (rowSpan) {
            this.rowSpan = rowSpan;
            console.debug(`Widget wrapper ${this.widgetId} setting rowSpan from registry function: ${this.rowSpan}`);
          }
        }
      }
    }
    
    console.debug(`Widget wrapper connected: ${this.displayName}, spans: ${this.colSpan}x${this.rowSpan}`);

    // Start timeout tracking if in loading state
    if (this.state === 'loading') {
      this.timeoutHandler.startTracking();
    }

    // Update event details with current widget ID and page type
    this.events.updateEventDetails(this.widgetId, this.pageType);

    // Use bound event handlers to ensure proper 'this' context
    this.addEventListener('error', this.eventHandlers.handleChildError);
    this.addEventListener('initialized', this.eventHandlers.handleInitialized);
    this.addEventListener('load-complete', this.eventHandlers.handleInitialized);

    // Also listen for module errors that bubble up from widget-service
    document.addEventListener('widget-module-error', this.eventHandlers.handleModuleError);

    // Listen for resize requests from the widget
    this.addEventListener('widget-request-resize', this.handleResizeRequest.bind(this));

    // Check for existing error in widget service
    this.stateManager.checkForExistingErrors();

    // Check if we need to load the module for this widget
    this.stateManager.initializeWidgetModule();

    // Set up content resize observer
    if (this.enableAutoSize) {
      this.sizingManager.setupContentResizeObserver();
    }
    
    // Listen for content overflow events from the widget
    this.addEventListener('widget-request-resize', this.sizingManager.handleResizeRequest.bind(this.sizingManager));
    
    // Listen for content shrink events
    this.addEventListener('widget-content-shrink', this.sizingManager.handleContentShrink.bind(this.sizingManager));

    console.debug(`Widget wrapper connected: ${this.displayName}, spans: ${this.colSpan}x${this.rowSpan}`);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.timeoutHandler.clearTracking();

    // Remove bound event listeners
    this.removeEventListener('error', this.eventHandlers.handleChildError);
    this.removeEventListener('initialized', this.eventHandlers.handleInitialized);
    this.removeEventListener('load-complete', this.eventHandlers.handleInitialized);
    document.removeEventListener('widget-module-error', this.eventHandlers.handleModuleError);
    
    // Remove resize-related event listeners
    this.removeEventListener('widget-request-resize', this.handleResizeRequest.bind(this));
    this.removeEventListener('widget-request-resize', this.sizingManager.handleResizeRequest.bind(this.sizingManager));
    this.removeEventListener('widget-content-shrink', this.sizingManager.handleContentShrink.bind(this.sizingManager));

    // Clean up content resize observer
    if (this.contentResizeObserver) {
      this.contentResizeObserver.disconnect();
      this.contentResizeObserver = null;
    }
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    // Make sure stateManager is initialized before using it
    // Handle state changes
    if (name === 'state' && oldValue !== newValue && this.stateManager) {
      this.stateManager.handleStateChange(oldValue as WidgetWrapperState, newValue as WidgetWrapperState);
    }

    // Handle widget ID changes
    if ((name === 'widgetId' || name === 'widget-id') && oldValue !== newValue) {
      // For consistency, always use widgetId internally
      if (name === 'widget-id') {
        this.widgetId = newValue;
      }

      // Update widget definition
      this.updateWidgetDefinition();

      // Update event details if events object is initialized
      if (this.events) {
        this.events.updateEventDetails(this.widgetId, this.pageType);
      }
      
      // Update timeout handler if initialized
      if (this.timeoutHandler) {
        this.timeoutHandler = new WidgetTimeoutHandler(
          this.widgetId || 'unknown',
          () => { if (this.state === 'loading') this.state = 'timeout-warning'; },
          () => {
            this.state = 'error';
            this.errorMessage = `Widget failed to initialize within ${this.failureTimeout / 1000} seconds`;
          },
          this.warningTimeout,
          this.failureTimeout
        );
      }
    }

    // Handle page type changes
    if ((name === 'pageType' || name === 'page-type') && oldValue !== newValue && this.events) {
      this.events.updateEventDetails(this.widgetId, newValue);
    }

    // Handle timeout configuration changes
    if ((name === 'warningTimeout' || name === 'warning-timeout') && oldValue !== newValue && this.timeoutHandler) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 5000;
      this.warningTimeout = numericValue;
      this.timeoutHandler.updateTimeouts(numericValue);
    }

    if ((name === 'failureTimeout' || name === 'failure-timeout') && oldValue !== newValue && this.timeoutHandler) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 10000;
      this.failureTimeout = numericValue;
      this.timeoutHandler.updateTimeouts(undefined, numericValue);
    }
  }

  /**
   * Update widget definition from registry
   */
  private updateWidgetDefinition(): void {
    if (this.widgetId) {
      this._widgetDefinition = this.getWidgetFromRegistry();
      console.debug(`Widget definition for ${this.widgetId}:`, this._widgetDefinition);
    }
  }

  /**
   * Get widget definition from registry
   */
  getWidgetFromRegistry(): any {
    return getWidgetById(this.widgetId);
  }

  /**
   * Get column span from registry
   */
  getWidgetColumnSpanFromRegistry(): number {
    return getWidgetColumnSpan(this.widgetId);
  }

  /**
   * Get row span from registry
   */
  getWidgetRowSpanFromRegistry(): number {
    return getWidgetRowSpan(this.widgetId);
  }

  /**
   * Handle resize requests from widgets - delegate to sizing manager
   */
  handleResizeRequest(event: Event): void {
    this.sizingManager.handleResizeRequest(event);
  }

  /**
   * Request retry of widget load - delegate to state manager
   */
  retry() {
    this.stateManager.retry();
  }

  /**
   * Dismiss the failed widget - delegate to state manager
   */
  dismiss() {
    this.stateManager.dismiss();
  }

  /**
   * Cancel a slow-loading widget - delegate to state manager
   */
  cancel() {
    this.stateManager.cancel();
  }

  /**
   * Close the widget - delegate to state manager
   */
  closeWidget() {
    this.stateManager.closeWidget();
  }

  /**
   * Change widget spans - delegate to sizing manager
   */
  changeSpans(newColSpan: number, newRowSpan: number, isUserResized: boolean = true, isContentShrink: boolean = false, detail: any = {}): void {
    this.sizingManager.changeSpans(newColSpan, newRowSpan, isUserResized, isContentShrink, detail);
  }

  /**
   * Increase column span - delegate to sizing manager
   */
  increaseColSpan(): void {
    this.sizingManager.increaseColSpan();
  }
  
  /**
   * Decrease column span - delegate to sizing manager
   */
  decreaseColSpan(): void {
    this.sizingManager.decreaseColSpan();
  }
  
  /**
   * Increase row span - delegate to sizing manager
   */
  increaseRowSpan(): void {
    this.sizingManager.increaseRowSpan();
  }
  
  /**
   * Decrease row span - delegate to sizing manager
   */
  decreaseRowSpan(): void {
    this.sizingManager.decreaseRowSpan();
  }

  /**
   * Toggle auto-sizing behavior - delegate to sizing manager
   */
  toggleAutoSize(): void {
    this.sizingManager.toggleAutoSize();
  }
}
