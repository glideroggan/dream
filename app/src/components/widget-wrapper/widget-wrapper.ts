import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { getWidgetById, getWidgetColumnSpan, getWidgetRowSpan } from "../../widgets/widget-registry";
import { widgetService } from "../../services/widget-service";
import { template } from "./widget-wrapper-template";
import { styles } from "./widget-wrapper-styles";
import { createWidgetEvents, createBoundEventHandlers, isModuleError } from "./widget-wrapper-events";
import { WidgetTimeoutHandler } from "./widget-wrapper-timeout";
import { repositoryService } from "../../services/repository-service";
import { MAX_GRID_COLUMNS, MAX_GRID_ROWS, DEFAULT_COLUMN_SPAN, DEFAULT_ROW_SPAN, MIN_ROW_HEIGHT, DEFAULT_GRID_GAP } from "../../constants/grid-constants";
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
  @attr maxColSpan: number = MAX_GRID_COLUMNS;
  @attr maxRowSpan: number = MAX_GRID_ROWS;
  @attr minColSpan: number = 1;
  @attr minRowSpan: number = 1;

  // Timeout configuration
  @attr({ mode: "fromView" }) warningTimeout: number = 5000; // 5 seconds for warning
  @attr({ mode: "fromView" }) failureTimeout: number = 10000; // 10 seconds for auto-failure

  // Widget definition object
  @observable private _widgetDefinition: any = null;

  // Events
  private events: ReturnType<typeof createWidgetEvents>;
  
  // Timeout handler
  private timeoutHandler: WidgetTimeoutHandler;
  
  // Event handlers
  private eventHandlers: ReturnType<typeof createBoundEventHandlers>;
  
  // Track initialization state
  private initialized: boolean = false;
  private connectedEventDispatched: boolean = false;

  // Add new properties for content-aware resizing
  private resizeTracker: WidgetResizeTracker;
  private contentResizeObserver: ResizeObserver | null = null;
  private isManuallyResized: boolean = false;
  autoSizeEnabled: boolean = true;
  
  @attr({ mode: "boolean" }) enableAutoSize: boolean = true;

  // Add a property to track last resize time
  private lastResizeTime: number = 0;
  private resizeBlockActive: boolean = false;
  private resizeBlockTimeoutId: number | null = null;

  // Add properties for size lock
  private sizeLockActive: boolean = false;
  private sizeLockTargetRows: number = 0;
  private sizeLockTimeoutId: number | null = null;

  constructor() {
    super();
    
    // Create custom events
    this.events = createWidgetEvents(this.widgetId, this.pageType);
    
    // Create bound event handlers
    this.eventHandlers = createBoundEventHandlers(this);
    
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
      this.loadDimensionsFromSettings();
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
          const colSpan = getWidgetColumnSpan(this.widgetId);
          if (colSpan) {
            this.colSpan = colSpan;
            console.debug(`Widget wrapper ${this.widgetId} setting colSpan from registry function: ${this.colSpan}`);
          }
        }
        
        if (!this.hasAttribute('rowSpan')) {
          const rowSpan = getWidgetRowSpan(this.widgetId);
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
    this.checkForExistingErrors();

    // Check if we need to load the module for this widget
    this.initializeWidgetModule();

    // Set up content resize observer
    if (this.enableAutoSize) {
      this.setupContentResizeObserver();
    }
    
    // Listen for content overflow events from the widget
    this.addEventListener('widget-request-resize', this.handleResizeRequest.bind(this));
    
    // Listen for content shrink events
    this.addEventListener('widget-content-shrink', this.handleContentShrink.bind(this));

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
    this.removeEventListener('widget-request-resize', this.handleResizeRequest.bind(this));

    // Clean up content resize observer
    if (this.contentResizeObserver) {
      this.contentResizeObserver.disconnect();
      this.contentResizeObserver = null;
    }
    
    // Remove content-related event listeners
    this.removeEventListener('widget-request-resize', this.handleResizeRequest.bind(this));
    this.removeEventListener('widget-content-shrink', this.handleContentShrink.bind(this));
  }

  /**
   * Check if the widget service already has errors for this widget
   */
  private checkForExistingErrors(): void {
    if (!this.widgetId) return;

    if (widgetService.hasLoadError(this.widgetId)) {
      const errorMessage = widgetService.getLoadErrorMessage(this.widgetId);

      // Check if it's an import error or other error
      if (isModuleError(errorMessage)) {
        // It's an import error
        this.handleImportError(errorMessage);
      } else {
        // Standard error
        this.state = 'error';
        this.errorMessage = errorMessage || 'Unknown widget error';
      }
    }
  }

  /**
   * Handle widget module error events
   */
  handleModuleError(event: Event): void {
    const customEvent = event as CustomEvent;
    const { widgetId, error, modulePath } = customEvent.detail;

    // Only process if it's for our widget
    if (widgetId !== this.widgetId) return;

    console.debug(`Widget ${this.widgetId} received module error:`, error);

    // Handle as an import error
    this.handleImportError(error?.message || 'Failed to load widget module', modulePath);
  }

  /**
   * Handle import errors specifically
   */
  private handleImportError(errorMessage: string | undefined, modulePath?: string): void {
    this.state = 'import-error';
    this.errorMessage = errorMessage!;

    // If we have the module definition, show the path
    if (modulePath) {
      this.moduleImportPath = modulePath;
    } else if (this._widgetDefinition?.module) {
      this.moduleImportPath = this._widgetDefinition.module;
    }

    this.timeoutHandler.clearTracking();
  }

  /**
   * Handle initialization event from child widget
   */
  handleInitialized(event: Event) {
    if (this.initialized) return;

    console.debug(`Widget ${this.displayName} initialized (from ${event.type}) after ${this.timeoutHandler.getElapsedTime()}`);
    this.initialized = true;
    this.state = 'loaded';

    // Clear timeout tracking since we're initialized
    this.timeoutHandler.clearTracking();
  }

  /**
   * Handle errors from child widgets
   */
  handleChildError(event: Event) {
    console.debug(`Widget ${this.displayName} error after ${this.timeoutHandler.getElapsedTime()}:`, event);

    // Update state to error
    this.state = 'error';

    // Update error message if available
    if (event instanceof ErrorEvent && event.message) {
      this.errorMessage = event.message;
    } else {
      this.errorMessage = 'Widget encountered an error during initialization';
    }

    // Clear timeout tracking
    this.timeoutHandler.clearTracking();

    // Prevent further propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    // Handle state changes
    if (name === 'state' && oldValue !== newValue) {
      console.debug(`Widget ${this.displayName} state changed: ${oldValue} -> ${newValue}`);

      // State transition logic
      switch (newValue) {
        case 'loading':
          // Start timeout tracking when entering loading state
          this.timeoutHandler.startTracking();
          break;

        case 'loaded':
        case 'error':
        case 'import-error':
          // Stop timeout tracking when the widget is fully loaded or has errored
          this.timeoutHandler.clearTracking();
          break;
      }
    }

    // Handle widget ID changes
    if ((name === 'widgetId' || name === 'widget-id') && oldValue !== newValue) {
      // For consistency, always use widgetId internally
      if (name === 'widget-id') {
        this.widgetId = newValue;
      }

      // Update widget definition
      this.updateWidgetDefinition();

      // Update event details
      this.events.updateEventDetails(this.widgetId, this.pageType);
      
      // Update timeout handler
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

    // Handle page type changes
    if ((name === 'pageType' || name === 'page-type') && oldValue !== newValue) {
      this.events.updateEventDetails(this.widgetId, newValue);
    }

    // Handle timeout configuration changes
    if ((name === 'warningTimeout' || name === 'warning-timeout') && oldValue !== newValue) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 5000;
      this.warningTimeout = numericValue;
      this.timeoutHandler.updateTimeouts(numericValue);
    }

    if ((name === 'failureTimeout' || name === 'failure-timeout') && oldValue !== newValue) {
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
      this._widgetDefinition = getWidgetById(this.widgetId);
      console.debug(`Widget definition for ${this.widgetId}:`, this._widgetDefinition);
    }
  }

  /**
   * Initialize the widget module loading process
   */
  private async initializeWidgetModule(): Promise<void> {
    if (!this.widgetId) {
      console.error("Cannot initialize widget module - widget ID is missing");
      this.setErrorState("Missing widget ID");
      return;
    }

    try {
      // Check if widget definition exists
      this._widgetDefinition = getWidgetById(this.widgetId);
      if (!this._widgetDefinition) {
        throw new Error(`Widget with ID "${this.widgetId}" not found in registry`);
      }

      // Check if the widget module is already loaded
      if (widgetService.isWidgetLoaded(this.widgetId)) {
        console.debug(`Widget ${this.widgetId} module already loaded, no need to load again`);
        return;
      }

      // Check if there are existing errors for this widget
      if (widgetService.hasLoadError(this.widgetId)) {
        const errorMessage = widgetService.getLoadErrorMessage(this.widgetId) ||
          "Unknown widget loading error";

        this.handleWidgetLoadError(errorMessage);
        return;
      }

      // Register a load handler with the widget service
      console.debug(`Requesting widget service to load module for ${this.widgetId}`);

      try {
        // Use widget service to load the module
        await widgetService.loadWidgetModule(this._widgetDefinition);
        console.debug(`Widget ${this.widgetId} module loaded successfully`);
      } catch (error) {
        // Handle the error from widget service
        this.handleWidgetLoadError(
          error instanceof Error ? error.message : `Unknown error loading widget ${this.widgetId}`
        );
      }
    } catch (error) {
      console.error(`Error initializing widget ${this.widgetId}:`, error);
      this.setErrorState(
        error instanceof Error ? error.message : `Unknown error initializing widget ${this.widgetId}`
      );
    }
  }

  /**
   * Handle widget load errors, distinguishing between import errors and other errors
   */
  private handleWidgetLoadError(message: string): void {
    console.error(`Widget ${this.widgetId} load error:`, message);

    // Determine if this is an import error or a general error
    if (isModuleError(message)) {
      this.state = 'import-error';
      this.errorMessage = message;

      // Add module path info if available
      if (this._widgetDefinition?.module) {
        this.moduleImportPath = this._widgetDefinition.module;
      }
    } else {
      this.setErrorState(message);
    }
  }

  /**
   * Set the widget to error state
   */
  private setErrorState(message: string): void {
    this.state = 'error';
    this.errorMessage = message;
    this.timeoutHandler.clearTracking();
  }

  /**
   * Request retry of widget load
   */
  retry() {
    console.debug(`Retrying widget: ${this.widgetId || this.displayName || 'Unknown'}`);

    // Clear any errors in the widget service for this widget
    widgetService.clearLoadError(this.widgetId);

    this.initialized = false;
    this.state = 'loading';
    this.errorMessage = '';
    this.moduleImportPath = '';

    // Start timeout tracking again
    this.timeoutHandler.startTracking();

    // Re-initialize the widget module
    this.initializeWidgetModule();

    // Also dispatch the retry event for parent containers
    this.dispatchEvent(this.events.retryEvent);
  }

  /**
   * Dismiss the failed widget
   */
  dismiss() {
    console.debug(`Dismissing widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.dispatchEvent(this.events.dismissEvent);
  }

  /**
   * Cancel a slow-loading widget
   */
  cancel() {
    console.debug(`Cancelling widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.state = 'error';
    this.errorMessage = 'Widget loading cancelled by user';
    this.dispatchEvent(this.events.cancelEvent);
  }

  /**
   * Close the widget 
   */
  closeWidget() {
    console.debug(`Closing widget: ${this.widgetId || this.displayName || 'Unknown'} - page type: ${this.pageType}`);
    this.dispatchEvent(this.events.closeEvent);
  }

  /**
   * Change widget spans (columns and rows) and emit change event
   * Modified to respect preserveRowSpan flag
   */
  changeSpans(newColSpan: number, newRowSpan: number, isUserResized: boolean = true, isContentShrink: boolean = false, detail: any = {}): void {
    // If preserveRowSpan flag is set, use the current row span
    if (detail?.preserveRowSpan) {
      console.log(`Widget ${this.widgetId} preserving current row span: ${this.rowSpan}`);
      newRowSpan = this.rowSpan;
    }

    // If we have an active size lock from a content shrink operation,
    // prevent any attempts to override the target size UNLESS this is a follow-up call from the same operation
    if (this.sizeLockActive && !isContentShrink) {
      // Only enforce row span lock, allow column span changes
      if (this.sizeLockTargetRows !== newRowSpan) {
        console.log(`Widget ${this.widgetId} rejecting row span change during size lock: 
          attempted ${newRowSpan}, locked at ${this.sizeLockTargetRows}`);
        newRowSpan = this.sizeLockTargetRows; // Force the locked row span
      }
    }

    // Clamp values to valid ranges
    newColSpan = Math.max(this.minColSpan, Math.min(newColSpan, this.maxColSpan));
    newRowSpan = Math.max(this.minRowSpan, Math.min(newRowSpan, this.maxRowSpan));
    
    // Don't do anything if spans haven't changed
    if (this.colSpan === newColSpan && this.rowSpan === newRowSpan) return;
    
    const oldColSpan = this.colSpan;
    const oldRowSpan = this.rowSpan;
    
    console.log(`Widget ${this.widgetId} spans changing from ${oldColSpan}x${oldRowSpan} to ${newColSpan}x${newRowSpan}, 
      user resized: ${isUserResized}, content shrink: ${isContentShrink}`);
    
    // Update properties AND attributes for immediate feedback
    this.colSpan = newColSpan;
    this.rowSpan = newRowSpan;
    
    // Explicit attribute updates to ensure they're synchronized with properties
    this.setAttribute('colSpan', newColSpan.toString());
    this.setAttribute('rowSpan', newRowSpan.toString());
    
    // Update DOM classes
    this.updateRowSpanClasses(newRowSpan);
    
    // Create span change event with additional flag
    const spanChangeEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.widgetId,
        pageType: this.pageType,
        oldColSpan,
        oldRowSpan,
        colSpan: newColSpan,
        rowSpan: newRowSpan,
        isUserResized,
        isContentShrink, // Add this flag so grid layout can respect content-based changes
        source: isUserResized ? 'user-resize' : isContentShrink ? 'content-shrink' : 'content-resize'
      }
    });
    
    // Dispatch the event for the grid to handle
    console.log(`Dispatching span change event for ${this.widgetId}: ${newColSpan}x${newRowSpan}`);
    this.dispatchEvent(spanChangeEvent);
    
    // Track if this was a user-initiated resize
    if (isUserResized) {
      this.isManuallyResized = true;
      this.resizeTracker.recordUserResize(newRowSpan);
      
      // Also notify any contained widget
      const widgetElement = this.querySelector('[class*="widget"]');
      if (widgetElement && typeof (widgetElement as any).setUserResizePreference === 'function') {
        (widgetElement as any).setUserResizePreference(newRowSpan * (MIN_ROW_HEIGHT + DEFAULT_GRID_GAP));
      }
    }
    
    // Also update parent grid-layout directly for immediate visual feedback
    this.updateParentGridClasses(newColSpan, newRowSpan);
    
    // Trigger grid layout update
    this.triggerGridLayoutUpdate();
  }

  /**
   * Increase column span by 1
   */
  increaseColSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentColSpan = Number(this.colSpan);
    const maxColSpan = Number(this.maxColSpan);
    
    if (currentColSpan < maxColSpan) {
      const oldColSpan = currentColSpan;
      const newColSpan = Math.min(oldColSpan + 1, maxColSpan);
      
      console.debug(`WidgetWrapper: Increasing column span for ${this.widgetId} from ${oldColSpan} to ${newColSpan}`);
      
      // Only update column span, preserve current row span exactly as is
      this.changeColSpanOnly(newColSpan);
    }
  }
  
  /**
   * Decrease column span by 1
   */
  decreaseColSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentColSpan = Number(this.colSpan);
    const minColSpan = Number(this.minColSpan);
    
    if (currentColSpan > minColSpan) {
      const oldColSpan = currentColSpan;
      const newColSpan = Math.max(oldColSpan - 1, minColSpan);
      
      console.debug(`WidgetWrapper: Decreasing column span for ${this.widgetId} from ${oldColSpan} to ${newColSpan}`);
      
      // Only update column span, preserve current row span exactly as is
      this.changeColSpanOnly(newColSpan);
    }
  }
  
  /**
   * Change only column span without affecting row span
   * This prevents the automatic row recalculation that happens in changeSpans
   */
  private changeColSpanOnly(newColSpan: number): void {
    const currentRowSpan = this.rowSpan;
    
    // Direct property update first for immediate UI feedback
    this.colSpan = newColSpan;
    
    // CRITICAL: First update DOM attributes directly 
    this.style.setProperty('--col-span', newColSpan.toString());
    this.setAttribute('colSpan', newColSpan.toString());
    
    // Create event that explicitly preserves the current row span
    const spanChangeEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.widgetId,
        pageType: this.pageType,
        oldColSpan: this.colSpan,
        oldRowSpan: currentRowSpan,
        colSpan: newColSpan,
        rowSpan: currentRowSpan, // Important: keep current row span
        isUserResized: true,
        source: 'colSpanChangeOnly',
        preserveRowSpan: true // Add a flag to indicate row span should be preserved
      }
    });
    
    // Also update our own classes if we're directly in a grid layout
    const parentElement = this.parentElement;
    if (parentElement && parentElement.classList.contains('widgets-container')) {
      // Remove all existing col-span-* classes
      for (let i = 1; i <= this.maxColSpan; i++) {
        this.classList.remove(`col-span-${i}`);
      }
      // Add the new col-span class
      this.classList.add(`col-span-${newColSpan}`);
    }
    
    // Update parent grid styles directly but ONLY for columns
    if (parentElement) {
      // Remove existing column span classes
      for (let i = 1; i <= this.maxColSpan; i++) {
        parentElement.classList.remove(`col-span-${i}`);
      }
      parentElement.classList.add(`col-span-${newColSpan}`);
      parentElement.style.gridColumn = `span ${newColSpan}`;
    }
    
    // Then dispatch the event for the grid to handle
    this.dispatchEvent(spanChangeEvent);
  }
  
  /**
   * Increase row span by 1
   */
  increaseRowSpan(): void {
    // Explicitly convert to numbers to avoid string concatenation
    const currentRowSpan = Number(this.rowSpan);
    const maxRowSpan = Number(this.maxRowSpan);
    
    if (currentRowSpan < maxRowSpan) {
      const oldRowSpan = currentRowSpan;
      const newRowSpan = Math.min(oldRowSpan + 1, maxRowSpan); 
      
      console.debug(`WidgetWrapper: Increasing row span for ${this.widgetId} from ${oldRowSpan} to ${newRowSpan}`);
      
      // Direct property update first for immediate UI feedback
      this.rowSpan = newRowSpan;
      
      try {
        // Create event with complete details matching the column span events
        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.widgetId,
            pageType: this.pageType, // Ensure pageType is always included
            oldColSpan: this.colSpan,
            oldRowSpan: oldRowSpan,
            colSpan: this.colSpan,
            rowSpan: newRowSpan,
            isUserResized: true,
            source: 'increaseRowSpan'
          }
        });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.widgetId} with pageType ${this.pageType}`);
        
        // Update DOM attributes directly 
        this.style.setProperty('--row-span', newRowSpan.toString());
        this.setAttribute('rowSpan', newRowSpan.toString());
        
        // The issue: Also ensure our own classes are updated if we're directly in a grid layout
        // Detect if we're directly in the grid-layout (parent is widgets-container)
        const parentElement = this.parentElement;
        if (parentElement && parentElement.classList.contains('widgets-container')) {
          // We're directly in the grid layout, so we need to update our own classes
          // Remove all existing row-span-* classes
          for (let i = 1; i <= this.maxRowSpan; i++) {
            this.classList.remove(`row-span-${i}`);
          }
          // Add the new row-span class
          this.classList.add(`row-span-${newRowSpan}`);
          console.debug(`WidgetWrapper: Updated own row-span class to row-span-${newRowSpan}`);
        }
        
        // Then dispatch the event for the grid to handle
        this.dispatchEvent(spanChangeEvent);
        
        // Check if the event was handled
        setTimeout(() => {
          console.debug(`WidgetWrapper: After event dispatch - ${this.widgetId} rowSpan attribute: ${this.getAttribute('rowSpan')}`);
          
          // Check parent element
          if (parentElement) {
            // Check if we need to set the class on ourselves when directly in grid
            if (parentElement.classList.contains('widgets-container')) {
              const selfHasRowSpanClass = Array.from(this.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Direct grid child has row-span class: ${selfHasRowSpanClass}, classes: ${this.className}`);
            } else {
              // Normal case - check parent
              const hasRowSpanClass = Array.from(parentElement.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Parent element has row-span class: ${hasRowSpanClass}, classes: ${parentElement.className}`);
            }
          }
        }, 50);
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }
  
  /**
   * Decrease row span by 1
   */
  decreaseRowSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentRowSpan = Number(this.rowSpan);
    const minRowSpan = Number(this.minRowSpan);
    
    if (currentRowSpan > minRowSpan) {
      const oldRowSpan = currentRowSpan;
      const newRowSpan = Math.max(oldRowSpan - 1, minRowSpan);
      
      console.debug(`WidgetWrapper: Decreasing row span for ${this.widgetId} from ${oldRowSpan} to ${newRowSpan}`);
      
      // Direct property update first for immediate UI feedback
      this.rowSpan = newRowSpan;
      
      try {
        // Create event with complete details
        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.widgetId,
            pageType: this.pageType, // Ensure pageType is always included
            oldColSpan: this.colSpan,
            oldRowSpan: oldRowSpan,
            colSpan: this.colSpan,
            rowSpan: newRowSpan,
            isUserResized: true,
            source: 'decreaseRowSpan'
          }
        });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.widgetId} with pageType ${this.pageType}`);
        
        // Update DOM attributes directly
        this.style.setProperty('--row-span', newRowSpan.toString());
        this.setAttribute('rowSpan', newRowSpan.toString());
        
        // The issue: Also ensure our own classes are updated if we're directly in a grid layout
        // Detect if we're directly in the grid-layout (parent is widgets-container)
        const parentElement = this.parentElement;
        if (parentElement && parentElement.classList.contains('widgets-container')) {
          // We're directly in the grid layout, so we need to update our own classes
          // Remove all existing row-span-* classes
          for (let i = 1; i <= this.maxRowSpan; i++) {
            this.classList.remove(`row-span-${i}`);
          }
          // Add the new row-span class
          this.classList.add(`row-span-${newRowSpan}`);
          console.debug(`WidgetWrapper: Updated own row-span class to row-span-${newRowSpan}`);
        }
        
        // Then dispatch the event for the grid to handle
        this.dispatchEvent(spanChangeEvent);
        
        // Check if the event was handled
        setTimeout(() => {
          console.debug(`WidgetWrapper: After event dispatch - ${this.widgetId} rowSpan attribute: ${this.getAttribute('rowSpan')}`);
          
          // Check parent element
          if (parentElement) {
            // Check if we need to set the class on ourselves when directly in grid
            if (parentElement.classList.contains('widgets-container')) {
              const selfHasRowSpanClass = Array.from(this.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Direct grid child has row-span class: ${selfHasRowSpanClass}, classes: ${this.className}`);
            } else {
              // Normal case - check parent
              const hasRowSpanClass = Array.from(parentElement.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Parent element has row-span class: ${hasRowSpanClass}, classes: ${parentElement.className}`);
            }
          }
        }, 50);
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }

  /**
   * Handle resize requests from widgets
   */
  private handleResizeRequest(event: Event): void {
    const customEvent = event as CustomEvent;
    const { rowSpan, reason } = customEvent.detail;
    
    // If resize events are blocked, ignore this request
    if (this.resizeBlockActive) {
      console.log(`Widget ${this.widgetId} ignoring resize request during blocking period`);
      event.stopPropagation();
      return;
    }
    
    console.debug(`Widget ${this.widgetId} received resize request: ${rowSpan} rows (${reason})`);
    
    // If user has manually resized and auto-size is disabled, ignore the request
    if (this.isManuallyResized && !this.autoSizeEnabled) {
      console.debug(`Widget ${this.widgetId} ignoring resize request - manually sized by user`);
      event.stopPropagation();
      return;
    }
    
    // Get appropriate row span from resize tracker
    const newRowSpan = this.resizeTracker.getExpandedRowSpan(rowSpan);
    
    // Only increase, never decrease rows from content fit requests
    if (newRowSpan > this.rowSpan && reason === 'content-overflow') {
      this.changeSpans(this.colSpan, newRowSpan, false);
    }
    
    // Stop propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Set up observer to monitor content size changes
   */
  private setupContentResizeObserver(): void {
    if (this.contentResizeObserver) {
      this.contentResizeObserver.disconnect();
    }
    
    this.contentResizeObserver = new ResizeObserver(entries => {
      // Only proceed if auto-size is enabled
      if (!this.enableAutoSize || this.sizeLockActive) return;
      
      const contentElement = entries[0];
      if (!contentElement) return;
      
      const contentRect = contentElement.contentRect;
      const contentScrollHeight = contentElement.target.scrollHeight;
      
      // More aggressive overflow detection (5px threshold instead of 20px)
      if (contentScrollHeight > contentRect.height + 5) {
        // Process immediately without timeout
        this.handleContentOverflow(contentScrollHeight);
      }
    });
    
    // Immediate observation
    const contentSlot = this.shadowRoot?.querySelector('.widget-content');
    if (contentSlot) {
      this.contentResizeObserver?.observe(contentSlot);
      console.debug(`Widget wrapper content observer set up for ${this.widgetId}`);
    }
  }

  /**
   * Handle content overflow by requesting more rows if needed
   */
  private handleContentOverflow(contentHeight: number): void {
    // Skip if auto-size is disabled or if manually resized
    if (!this.enableAutoSize || (this.isManuallyResized && !this.autoSizeEnabled)) {
      return;
    }
    
    // Calculate how many rows are needed for this content with buffer
    const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
    const neededRows = Math.ceil(contentHeight / rowHeight + 0.5); // Add 0.5 row buffer
    
    // Get appropriate row span from resize tracker
    const newRowSpan = this.resizeTracker.getExpandedRowSpan(neededRows);
    
    // Only resize if different from current - be more aggressive with expansion
    if (newRowSpan > this.rowSpan) {
      console.debug(`Widget ${this.widgetId} content overflow detected. ` +
        `Content height: ${contentHeight}px. Expanding from ${this.rowSpan} to ${newRowSpan + 1} rows.`);
      
      // Add one extra row to prevent edge case scrollbars
      this.changeSpans(this.colSpan, newRowSpan + 1, false);
    }
  }

  /**
   * Handle content shrink events from widgets
   */
  private handleContentShrink(event: Event): void {
    const customEvent = event as CustomEvent;
    const { newContentHeight, rowsNeeded } = customEvent.detail;
    
    console.log(`Widget ${this.widgetId} received content shrink notification: ${newContentHeight}px (${rowsNeeded} rows needed)`);
    
    // Skip if auto-size is disabled
    if (!this.autoSizeEnabled) {
      console.log(`Widget ${this.widgetId} ignoring content shrink - auto-size disabled`);
      return;
    }
    
    // If we got rows needed directly from the event, use that
    // Otherwise calculate based on height
    let neededRows = rowsNeeded;
    if (!neededRows) {
      const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
      neededRows = Math.max(Math.ceil(newContentHeight / rowHeight), this.minRowSpan);
    }
    
    // Add larger buffer to avoid aggressive shrinking (20% instead of 10%)
    const targetRows = Math.ceil(neededRows * 1.2);
    
    // Ensure we don't shrink below the minimum
    const newRowSpan = Math.max(targetRows, this.minRowSpan);
    
    console.log(`Widget ${this.widgetId} content shrink calculation:
      Content height: ${newContentHeight}px
      Content needs ${rowsNeeded} rows
      Current row span: ${this.rowSpan}
      Target row span: ${newRowSpan}`);
    
    // Only shrink if new size is significantly smaller (at least 20%)
    if (newRowSpan < this.rowSpan * 0.8) {
      console.log(`Widget ${this.widgetId} shrinking from ${this.rowSpan} to ${newRowSpan} rows`);
      
      // Set the size lock
      this.sizeLockActive = true;
      this.sizeLockTargetRows = newRowSpan;
      
      // Clear any existing size lock timeout
      if (this.sizeLockTimeoutId !== null) {
        window.clearTimeout(this.sizeLockTimeoutId);
      }
      
      // Force immediate DOM update using direct manipulation
      this.updateRowSpanClasses(newRowSpan);
      this.changeSpans(this.colSpan, newRowSpan, false, true);
      this.updateParentGridClasses(this.colSpan, newRowSpan);
      
      // Use requestAnimationFrame for reliable DOM updates
      requestAnimationFrame(() => {
        // Force reflow to ensure DOM is updated
        void document.body.offsetHeight;
        
        // Find and notify parent grid-layout that it needs to update
        this.triggerGridLayoutUpdate();
        
        // Release size lock after a short delay
        requestAnimationFrame(() => {
          console.log(`Widget ${this.widgetId}: Size lock released after shrink operation`);
          this.sizeLockActive = false;
        });
      });
    } else {
      console.log(`Widget ${this.widgetId} NOT shrinking - difference not significant enough`);
    }
    
    // Stop propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Block resize events temporarily to prevent oscillation
   */
  private blockResizeEvents(): void {
    // Set flag to block resize events
    this.resizeBlockActive = true;
    console.log(`Widget ${this.widgetId}: Blocking resize events for 500ms to prevent oscillation`);
    
    // Clear any existing timeout
    if (this.resizeBlockTimeoutId !== null) {
      window.clearTimeout(this.resizeBlockTimeoutId);
    }
    
    // Set timeout to unblock after 500ms
    this.resizeBlockTimeoutId = window.setTimeout(() => {
      this.resizeBlockActive = false;
      this.resizeBlockTimeoutId = null;
      console.log(`Widget ${this.widgetId}: Resize events unblocked`);
    }, 500);
  }

  /**
   * Trigger parent grid-layout to update its layout
   */
  private triggerGridLayoutUpdate(): void {
    // Find parent grid-layout
    const gridLayout = this.closest('grid-layout');
    if (gridLayout) {
      console.log(`Triggering layout update on parent grid-layout`);
      
      // Try to call updateLayout if it exists
      if (typeof (gridLayout as any).updateLayout === 'function') {
        (gridLayout as any).updateLayout();
      }
      
      // Also dispatch a resize event that the grid might be listening for
      const resizeEvent = new CustomEvent('grid-item-resize', {
        bubbles: true,
        composed: true,
        detail: {
          widgetId: this.widgetId,
          rowSpan: this.rowSpan,
          colSpan: this.colSpan
        }
      });
      
      this.dispatchEvent(resizeEvent);
    }
  }

  /**
   * Update row-span classes directly to ensure DOM is updated
   */
  private updateRowSpanClasses(rowSpan: number): void {
    // Remove all existing row-span classes
    for (let i = 1; i <= this.maxRowSpan; i++) {
      this.classList.remove(`row-span-${i}`);
    }
    
    // Add the new row span class
    this.classList.add(`row-span-${rowSpan}`);
    
    // Also update any parent grid item if we're in a grid
    const parentElement = this.parentElement;
    if (parentElement) {
      for (let i = 1; i <= this.maxRowSpan; i++) {
        parentElement.classList.remove(`row-span-${i}`);
      }
      parentElement.classList.add(`row-span-${rowSpan}`);
      
      console.debug(`Direct DOM update: Set row-span-${rowSpan} class on parent element`);
    }
  }

  /**
   * Update parent grid item classes directly (bypassing the event system)
   * Make this faster and more robust
   */
  private updateParentGridClasses(colSpan: number, rowSpan: number): void {
    // Find all possible parent elements that might need updating
    // This helps ensure grid layout updates even with different DOM structures
    const gridItemParent = this.parentElement;
    const gridContainer = this.closest('.grid-container') || this.closest('grid-layout');
    
    // Update immediate parent (usually grid-item)
    if (gridItemParent) {
      // Apply classes
      for (let i = 1; i <= this.maxColSpan; i++) {
        gridItemParent.classList.remove(`col-span-${i}`);
      }
      gridItemParent.classList.add(`col-span-${colSpan}`);
      
      for (let i = 1; i <= this.maxRowSpan; i++) {
        gridItemParent.classList.remove(`row-span-${i}`);
      }
      gridItemParent.classList.add(`row-span-${rowSpan}`);
      
      // Apply inline styles for immediate visual feedback
      gridItemParent.style.gridColumn = `span ${colSpan}`;
      gridItemParent.style.gridRow = `span ${rowSpan}`;
    }
    
    // If we're in a grid container, force a layout recalculation
    // if (gridContainer) {
    //   // This forces a reflow, which can help with immediate visual updates
    //   gridContainer.style.display = 'grid';
    //   // Read a layout property to force the browser to apply the previous style
    //   void gridContainer.offsetHeight; 
    // }
    
    console.log(`Direct grid update: ${colSpan}x${rowSpan} applied to DOM`);
  }

  /**
   * Toggle auto-sizing behavior
   */
  toggleAutoSize(): void {
    // Toggle the state
    this.autoSizeEnabled = !this.autoSizeEnabled;
    console.debug(`Widget ${this.widgetId} auto-size ${this.autoSizeEnabled ? 'enabled' : 'disabled'}`);
    
    if (this.autoSizeEnabled) {
      // Reset user resize preference
      this.isManuallyResized = false;
      this.resizeTracker.resetUserPreference();
      
      // Notify contained widget
      const widgetElement = this.querySelector('[class*="widget"]');
      if (widgetElement && typeof (widgetElement as any).resetUserResizePreference === 'function') {
        (widgetElement as any).resetUserResizePreference();
      }
      
      // Check if we need to resize based on current content
      this.setupContentResizeObserver();
    } else {
      // When auto-size is disabled, mark as manually sized to prevent auto-expansion
      this.isManuallyResized = true;
      
      // Disconnect resize observer when auto-sizing is disabled
      if (this.contentResizeObserver) {
        this.contentResizeObserver.disconnect();
        this.contentResizeObserver = null;
      }
    }
  }

  /**
   * Load widget dimensions from user settings
   */
  private async loadDimensionsFromSettings(): Promise<void> {
    if (!this.widgetId || !this.pageType) return;
    
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      const dimensions = await settingsRepo.getWidgetGridDimensions(this.pageType, this.widgetId);
      console.debug(`Loaded dimensions for ${this.widgetId} from settings: ${dimensions.colSpan}x${dimensions.rowSpan}`);
      
      // Apply dimensions from settings
      if (dimensions.colSpan && dimensions.colSpan > 0) {
        this.colSpan = dimensions.colSpan;
      }
      
      if (dimensions.rowSpan && dimensions.rowSpan > 0) {
        this.rowSpan = dimensions.rowSpan;
      }
    } catch (error) {
      console.warn(`Failed to load dimensions from settings for widget ${this.widgetId}:`, error);
      
      // Fall back to widget registry values
      if (!this.hasAttribute('colSpan')) {
        this.colSpan = getWidgetColumnSpan(this.widgetId);
      }
      
      if (!this.hasAttribute('rowSpan')) {
        this.rowSpan = getWidgetRowSpan(this.widgetId);
      }
    }
  }

  /**
   * Save widget dimensions to user settings
   */
  private async saveDimensionsToSettings(colSpan: number, rowSpan: number): Promise<void> {
    if (!this.saveDimensions || !this.widgetId || !this.pageType) return;
    
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      await settingsRepo.updateWidgetGridDimensions(
        this.pageType, 
        this.widgetId, 
        colSpan, 
        rowSpan
      );
      
      console.debug(`Saved dimensions for ${this.widgetId} to settings: ${colSpan}x${rowSpan}`);
    } catch (error) {
      console.warn(`Failed to save dimensions to settings for widget ${this.widgetId}:`, error);
    }
  }
}
