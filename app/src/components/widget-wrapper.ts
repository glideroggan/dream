import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { getWidgetById } from "../widgets/widget-registry";
import { widgetService } from "../services/widget-service";
import { template } from "./widget-wrapper-template";
import { styles } from "./widget-wrapper-styles";
import { createWidgetEvents, createBoundEventHandlers, isModuleError } from "./widget-wrapper-events";
import { WidgetTimeoutHandler } from "./widget-wrapper-timeout";

@customElement({
  name: "widget-wrapper",
  template,
  styles
})
export class WidgetWrapper extends FASTElement {
  // Widget attributes
  @attr widgetTitle: string = "";
  @attr widgetId: string = "";
  @attr state: 'loading' | 'loaded' | 'error' | 'import-error' | 'timeout-warning' = 'loading';
  @attr errorMessage: string = '';
  @attr({attribute: 'page-type'}) pageType: string = '';
  @attr moduleImportPath: string = '';
  @attr({ mode: "boolean" }) hideCloseButton: boolean = false;
  @attr widgetName: string = '';

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

    console.debug(`Widget wrapper connected: ${this.displayName}, timeouts: warning=${this.warningTimeout}ms, failure=${this.failureTimeout}ms`);

    // Important: Dispatch connected-to-dom event to notify child elements
    // We do this on next tick to ensure all initialization is complete
    setTimeout(() => {
      if (!this.connectedEventDispatched) {
        Array.from(this.children).forEach(child => {
          child.dispatchEvent(this.events.connectedToDomEvent);
        });
        this.connectedEventDispatched = true;
      }
    }, 0);
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
}
