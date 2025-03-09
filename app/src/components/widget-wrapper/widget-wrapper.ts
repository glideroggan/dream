import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { getWidgetById, getWidgetColumnSpan, getWidgetRowSpan } from "../../widgets/widget-registry";
import { widgetService } from "../../services/widget-service";
import { template } from "./widget-wrapper-template";
import { styles } from "./widget-wrapper-styles";
import { createWidgetEvents, createBoundEventHandlers, isModuleError } from "./widget-wrapper-events";
import { WidgetTimeoutHandler } from "./widget-wrapper-timeout";
import { GridItemSize } from "../grid-layout";

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
  @attr({ attribute: 'seamless-integration', mode: 'boolean' }) seamlessIntegration: boolean = false;
  
  // Size attributes (for backward compatibility)
  @attr currentSize: GridItemSize = 'md'; 
  
  // New grid span attributes
  @attr({ mode: "fromView" }) colSpan: number = 8; // Default to half width (8/16 columns)
  @attr({ mode: "fromView" }) rowSpan: number = 1; // Default to single row
  @attr({ mode: "boolean" }) showSizeControls: boolean = true;
  @attr({ mode: "boolean" }) useLegacySizing: boolean = false; // Default to new sizing UI
  @attr maxColSpan: number = 16;
  @attr maxRowSpan: number = 8;
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
  }

  // Legacy: Available sizes for widget (backward compatibility)
  readonly availableSizes: GridItemSize[] = ['sm', 'md', 'lg', 'xl'];

  // Map of sizes to column spans for backward compatibility
  readonly sizeToSpanMap = {
    'sm': 4,   // Small: 4/16 columns
    'md': 8,   // Medium: 8/16 columns
    'lg': 12,  // Large: 12/16 columns
    'xl': 16   // Extra Large: 16/16 columns (full width)
  };

  /**
   * Computed property for display name
   */
  get displayName(): string {
    // First use explicit widget name if provided
    if (this.widgetName) {
      return this.widgetName;
    }
    // Then try to get name from widget definition
    if (this._widgetDefinition && this._widgetDefinition.name) {
      return this._widgetDefinition.name;
    }
    // Fall back to widget ID
    return this.widgetId || 'Unknown widget';
  }

  connectedCallback() {
    super.connectedCallback();

    // Prevent unwanted tooltips by removing any title attribute from the host element
    if (this.hasAttribute('title')) {
      this.removeAttribute('title');
    }
    
    // Get widget info from registry
    this.updateWidgetDefinition();
    
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
      
      // For backward compatibility - map size to column span if needed
      if (this.colSpan === 8 && this._widgetDefinition.preferredSize) {
        const size = this._widgetDefinition.preferredSize as GridItemSize;
        this.colSpan = this.sizeToSpanMap[size] || 8;
        console.debug(`Widget wrapper ${this.widgetId} setting colSpan from preferredSize: ${this.colSpan}`);
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

    // Check for existing error in widget service
    this.checkForExistingErrors();

    // Check if we need to load the module for this widget
    this.initializeWidgetModule();

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
   * Legacy: Change widget size and emit change event (for backward compatibility)
   * Maps size to column span and dispatches the appropriate event
   */
  changeSize(newSize: GridItemSize): void {
    if (this.currentSize === newSize) return;
    
    const oldSize = this.currentSize;
    this.currentSize = newSize;
    
    // Map size to column span
    const newColSpan = this.sizeToSpanMap[newSize] || 8;
    
    console.debug(`Widget ${this.widgetId} size changing from ${oldSize} to ${newSize} (col span: ${newColSpan})`);
    
    // Use the changeSpans method with the new column span
    this.changeSpans(newColSpan, this.rowSpan);
  }
  
  /**
   * Change widget spans (columns and rows) and emit change event
   */
  changeSpans(newColSpan: number, newRowSpan: number, isUserResized: boolean = true): void {
    // Clamp values to valid ranges
    newColSpan = Math.max(this.minColSpan, Math.min(newColSpan, this.maxColSpan));
    newRowSpan = Math.max(this.minRowSpan, Math.min(newRowSpan, this.maxRowSpan));
    
    if (this.colSpan === newColSpan && this.rowSpan === newRowSpan) return;
    
    const oldColSpan = this.colSpan;
    const oldRowSpan = this.rowSpan;
    this.colSpan = newColSpan;
    this.rowSpan = newRowSpan;
    
    console.debug(`Widget ${this.widgetId} spans changing from ${oldColSpan}x${oldRowSpan} to ${newColSpan}x${newRowSpan}, user resized: ${isUserResized}`);
    
    // Create and dispatch a custom event for the span change
    const spanChangeEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.widgetId,
        oldColSpan,
        oldRowSpan,
        colSpan: newColSpan,
        rowSpan: newRowSpan,
        isUserResized  // Include whether this was a user-initiated resize
      }
    });
    
    this.dispatchEvent(spanChangeEvent);
  }
  
  /**
   * Increase column span by 1
   */
  increaseColSpan(): void {
    if (this.colSpan < this.maxColSpan) {
      this.changeSpans(this.colSpan + 1, this.rowSpan);
    }
  }
  
  /**
   * Decrease column span by 1
   */
  decreaseColSpan(): void {
    if (this.colSpan > this.minColSpan) {
      this.changeSpans(this.colSpan - 1, this.rowSpan);
    }
  }
  
  /**
   * Increase row span by 1
   */
  increaseRowSpan(): void {
    if (this.rowSpan < this.maxRowSpan) {
      this.changeSpans(this.colSpan, this.rowSpan + 1);
    }
  }
  
  /**
   * Decrease row span by 1
   */
  decreaseRowSpan(): void {
    if (this.rowSpan > this.minRowSpan) {
      this.changeSpans(this.colSpan, this.rowSpan - 1);
    }
  }

  /**
   * Get CSS class for size button based on whether it's the current size
   * @param size The size to check
   * @returns CSS class names for the button
   */
  getSizeButtonClass(size: string): string {
    return size === this.currentSize ? 'size-button size-button-active' : 'size-button';
  }
  
  /**
   * Get display text for size button
   * @param size The size to get display text for
   * @returns Display text for the size button
   */
  getSizeButtonText(size: GridItemSize): string {
    switch (size as string) {
      case 'sm': return 'S';
      case 'md': return 'M';
      case 'lg': return 'L';
      case 'xl': return 'XL';
      default: return size.charAt(0).toUpperCase();
    }
  }
  
  /**
   * Handle size button click event
   * @param event The click event
   * @param size The size selected
   */
  handleSizeButtonClick(event: Event, size: GridItemSize): void {
    event.preventDefault();
    event.stopPropagation();
    this.changeSize(size);
  }
}
