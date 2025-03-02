import { FASTElement, customElement, html, css, observable, attr } from "@microsoft/fast-element";
import { getWidgetById } from "../widgets/widget-registry";
import { widgetService } from "../services/widget-service";

const template = html<WidgetWrapper>/*html*/ `
  <div class="widget-wrapper ${x => x.state}" data-widget-id="${x => x.widgetId}">
    <!-- Close button shown only for loaded widgets -->
    ${(x) => x.state === 'loaded' && !x.hideCloseButton ? html<WidgetWrapper>/*html*/`
      <button class="close-button" title="Remove widget" @click="${x => x.closeWidget()}">
        <span aria-hidden="true">&times;</span>
      </button>
    ` : ''}

    <!-- Loading state -->
    ${(x) => x.state === 'loading' ? html<WidgetWrapper>/*html*/`
      <div class="widget-loading">
        <div class="spinner"></div>
        <p>Loading widget...</p>
        <span class="widget-identifier">${x => x.displayName}</span>
      </div>
    ` : ''}
    
    <!-- Error state -->
    ${(x) => x.state === 'error' ? html<WidgetWrapper>/*html*/`
      <div class="widget-error">
        <h3>Widget failed to load</h3>
        <p>${x => x.errorMessage || 'There was an error loading this widget.'}</p>
        <span class="widget-identifier">${x => x.displayName}</span>
        <div class="action-buttons">
          <button class="retry-button" @click="${x => x.retry()}">Try Again</button>
          <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
        </div>
      </div>
    ` : ''}
    
    <!-- Import error state -->
    ${(x) => x.state === 'import-error' ? html<WidgetWrapper>/*html*/`
      <div class="widget-error widget-import-error">
        <h3>Widget Import Error</h3>
        <p>${x => x.errorMessage || 'There was an error loading this widget module.'}</p>
        <code class="module-path">${x => x.moduleImportPath}</code>
        <span class="widget-identifier">${x => x.displayName}</span>
        <div class="action-buttons">
          <button class="retry-button" @click="${x => x.retry()}">Try Again</button>
          <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
        </div>
      </div>
    ` : ''}
    
    <!-- Timeout warning state (slow loading) -->
    ${(x) => x.state === 'timeout-warning' ? html<WidgetWrapper>/*html*/`
      <div class="widget-timeout">
        <div class="spinner"></div>
        <p>Still loading...</p>
        <span class="widget-identifier">${x => x.displayName}</span>
        <button class="cancel-button" @click="${x => x.cancel()}">Cancel</button>
      </div>
    ` : ''}
    
    <!-- Widget content -->
    ${(x) => x.state === 'loaded' ? html<WidgetWrapper>/*html*/`
      <slot></slot>
    ` : ''}
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  .widget-wrapper {
    height: 100%;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    background: var(--background-color, #ffffff);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  /* Close button styles */
  .close-button {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--neutral-layer-4, #f0f0f0);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: var(--neutral-foreground-rest, #333);
    z-index: 10;
    opacity: 0.7;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: var(--neutral-layer-3, #e0e0e0);
  }

  /* Only show close button on hover for cleaner look */
  .close-button {
    opacity: 0;
    transform: scale(0.8);
  }

  .widget-wrapper:hover .close-button {
    opacity: 0.7;
    transform: scale(1);
  }
  
  .widget-loading, .widget-error, .widget-timeout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    text-align: center;
    color: var(--text-color, #333);
    box-sizing: border-box;
    overflow: auto;
    position: relative;
  }
  
  .widget-error {
    background-color: var(--background-color, #ffffff);
    border: 1px solid var(--error-color-light, #fadbd8);
  }
  
  .widget-import-error {
    border: 1px solid var(--warning-color-light, #fdebd0);
    background-color: var(--warning-color-bg, #fef9e7);
  }
  
  .module-path {
    display: block;
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    font-size: 0.8rem;
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    max-width: 90%;
  }
  
  .widget-error h3 {
    color: var(--error-color, #e74c3c);
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }
  
  .widget-import-error h3 {
    color: var(--warning-color, #f39c12);
  }
  
  .widget-error p {
    margin: 0.5rem 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    font-size: 0.9rem;
  }
  
  .widget-identifier {
    font-size: 0.7rem;
    color: var(--subtle-text-color, #aaa);
    margin-top: 0.5rem;
    font-style: italic;
    opacity: 0.75;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .action-buttons {
    display: flex;
    margin-top: 1rem;
  }
  
  .retry-button, .dismiss-button, .cancel-button {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  
  .retry-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
  }
  
  .retry-button:hover {
    background-color: var(--primary-color-hover, #2980b9);
  }
  
  .dismiss-button {
    background-color: transparent;
    color: var (--text-color, #333);
    border: 1px solid var(--border-color, #ddd);
    margin-left: 0.5rem;
  }
  
  .dismiss-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .cancel-button {
    background-color: transparent;
    color: var(--text-color, #333);
    border: 1px solid var(--border-color, #ddd);
    margin-top: 0.75rem;
  }
  
  .cancel-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }

  @media (max-width: 300px) {
    .widget-error, .widget-loading, .widget-timeout {
      padding: 0.75rem;
    }
    
    .widget-error h3 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .widget-error p {
      font-size: 0.8rem;
    }
    
    .retry-button, .dismiss-button, .cancel-button {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }
`;

@customElement({
  name: "widget-wrapper",
  template,
  styles
})
export class WidgetWrapper extends FASTElement {
  @attr widgetId: string = "";
  @attr state: 'loading' | 'loaded' | 'error' | 'import-error' | 'timeout-warning' = 'loading';
  @attr errorMessage: string = '';
  @attr moduleImportPath: string = '';
  
  // New attribute to control close button visibility
  @attr({ mode: "boolean" }) hideCloseButton: boolean = false;

  // Optional attribute for widget name (to be consistent)
  @attr widgetName: string = '';

  // Computed property for display name
  @observable private _widgetDefinition: any = null;

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

  // Config options with defaults
  @attr({ mode: "fromView" }) warningTimeout: number = 5000; // 5 seconds for warning
  @attr({ mode: "fromView" }) failureTimeout: number = 10000; // 10 seconds for auto-failure

  // Timeout handlers
  private timeoutInterval: number | null = null;
  private startTime: number = 0;

  // Event for retry requests
  private retryEvent = new CustomEvent('retry-widget', {
    bubbles: true,
    composed: true,
    detail: { widgetId: this.widgetId }
  });

  // Event for dismiss requests
  private dismissEvent = new CustomEvent('dismiss-widget', {
    bubbles: true,
    composed: true,
    detail: { widgetId: this.widgetId }
  });

  // Event for cancel requests
  private cancelEvent = new CustomEvent('cancel-widget-load', {
    bubbles: true,
    composed: true,
    detail: { widgetId: this.widgetId }
  });

  // Create a new event for notifying when the wrapper is connected
  private connectedToDomEvent = new CustomEvent('connected-to-dom', {
    bubbles: true,
    composed: false,
    detail: { widgetId: this.widgetId }
  });

  // Event for close requests
  private closeEvent = new CustomEvent('close-widget', {
    bubbles: true,
    composed: true,
    detail: { widgetId: this.widgetId }
  });

  // Bound event handlers to ensure proper 'this' context
  private boundHandleChildError = this.handleChildError.bind(this);
  private boundHandleInitialized = this.handleInitialized.bind(this);
  private boundHandleModuleError = this.handleModuleError.bind(this);

  // Track if widget initialization already happened
  private initialized: boolean = false;
  
  // Track if we've dispatched the connected-to-dom event
  private connectedEventDispatched: boolean = false;

  connectedCallback() {
    super.connectedCallback();

    // Get widget info from registry
    this.updateWidgetDefinition();

    // Start timeout tracking if in loading state
    if (this.state === 'loading') {
      this.startTimeoutTracking();
    }

    // Update event detail with current widget ID
    this.retryEvent.detail.widgetId = this.widgetId;
    this.dismissEvent.detail.widgetId = this.widgetId;
    this.cancelEvent.detail.widgetId = this.widgetId;
    this.closeEvent.detail.widgetId = this.widgetId;
    this.connectedToDomEvent.detail.widgetId = this.widgetId;

    // Use bound event handlers to ensure proper 'this' context
    this.addEventListener('error', this.boundHandleChildError);
    this.addEventListener('initialized', this.boundHandleInitialized);
    this.addEventListener('load-complete', this.boundHandleInitialized);
    
    // Also listen for module errors that bubble up from widget-service
    document.addEventListener('widget-module-error', this.boundHandleModuleError);

    // Handle DOM mutation to detect when widget content appears
    // this.observeChildElements();

    // Check for existing error in widget service
    this.checkForExistingErrors();

    // NEW: Check if we need to load the module for this widget
    this.initializeWidgetModule();

    console.debug(`Widget wrapper connected: ${this.widgetId || this.displayName || 'Unknown'}, timeouts: warning=${this.warningTimeout}ms, failure=${this.failureTimeout}ms`);
    
    // Important: Dispatch connected-to-dom event to notify child elements
    // We do this on next tick to ensure all initialization is complete
    setTimeout(() => {
      if (!this.connectedEventDispatched) {
        Array.from(this.children).forEach(child => {
          child.dispatchEvent(this.connectedToDomEvent);
        });
        this.connectedEventDispatched = true;
      }
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimeoutTracking();

    // Remove bound event listeners
    this.removeEventListener('error', this.boundHandleChildError);
    this.removeEventListener('initialized', this.boundHandleInitialized);
    this.removeEventListener('load-complete', this.boundHandleInitialized);
    document.removeEventListener('widget-module-error', this.boundHandleModuleError);

    // Disconnect mutation observer if exists
    // if (this.mutationObserver) {
    //   this.mutationObserver.disconnect();
    //   this.mutationObserver = null;
    // }
  }
  
  /**
   * Check if the widget service already has errors for this widget
   * This handles the case where module loading failed before we added the event listener
   */
  private checkForExistingErrors(): void {
    if (!this.widgetId) return;
    
    if (widgetService.hasLoadError(this.widgetId)) {
      const errorMessage = widgetService.getLoadErrorMessage(this.widgetId);
      
      // Check if it's an import error or other error
      if (errorMessage && (
          errorMessage.includes('import') || 
          errorMessage.includes('module') ||
          errorMessage.includes('not found'))) {
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
  private handleModuleError(event: Event): void {
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
  private handleImportError(errorMessage: string, modulePath?: string): void {
    this.state = 'import-error';
    this.errorMessage = errorMessage;
    
    // If we have the module definition, show the path
    if (modulePath) {
      this.moduleImportPath = modulePath;
    } else if (this._widgetDefinition?.module) {
      this.moduleImportPath = this._widgetDefinition.module;
    }
    
    this.clearTimeoutTracking();
  }

  // /**
  //  * Set up a mutation observer to detect when content appears
  //  * This is a fallback for widgets that don't emit initialization events
  //  */
  // private mutationObserver: MutationObserver | null = null;

  // private observeChildElements() {
  //   // Look for slot element
  //   const slot = this.shadowRoot?.querySelector('slot');
  //   if (!slot) return;

  //   this.mutationObserver = new MutationObserver((mutations) => {
  //     // Check if we have any assigned nodes in the slot
  //     const slotNodes = slot.assignedNodes();
  //     if (slotNodes.length > 0) {
  //       // Check if there's actual widget content (not just text nodes)
  //       const hasElements = Array.from(slotNodes).some(node => node.nodeType === Node.ELEMENT_NODE);

  //       if (hasElements && !this.initialized && this.state === 'loading') {
  //         // Content has been added, treat this as initialization
  //         console.debug(`Widget ${this.widgetId || this.displayName || 'Unknown'} content detected, treating as initialized`);
  //         this.handleInitialized(new Event('content-detected'));
          
  //         // If we haven't dispatched the connected event, do so now
  //         if (!this.connectedEventDispatched) {
  //           Array.from(this.children).forEach(child => {
  //             child.dispatchEvent(this.connectedToDomEvent);
  //           });
  //           this.connectedEventDispatched = true;
  //         }
  //       }
  //     }
  //   });

  //   // Observe both the slot element and the light DOM
  //   this.mutationObserver.observe(slot, { childList: true, subtree: true });
  //   this.mutationObserver.observe(this, { childList: true });
  // }

  /**
   * Handle initialization event from child widget
   */
  private handleInitialized(event: Event) {
    if (this.initialized) return;

    console.debug(`Widget ${this.widgetId || this.displayName || 'Unknown'} initialized (from ${event.type}) after ${Date.now() - this.startTime}ms`);
    this.initialized = true;
    this.state = 'loaded';
    
    // Clear timeout tracking since we're initialized
    this.clearTimeoutTracking();
  }

  /**
   * Handle errors from child widgets
   */
  private handleChildError(event: Event) {
    // Record elapsed time for better debugging
    const elapsedTime = this.startTime ? `${Date.now() - this.startTime}ms` : 'unknown';
    
    console.debug(`Widget ${this.widgetId || this.displayName || 'Unknown'} error after ${elapsedTime}:`, event);
  
    // Update state to error
    this.state = 'error';
  
    // Update error message if available
    if (event instanceof ErrorEvent && event.message) {
      this.errorMessage = event.message;
    } else {
      this.errorMessage = 'Widget encountered an error during initialization';
    }
  
    // Clear timeout tracking
    this.clearTimeoutTracking();
  
    // Prevent further propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Start tracking for slow loading widgets using interval
   */
  private startTimeoutTracking() {
    // Clear any existing interval
    this.clearTimeoutTracking();

    // Record the start time
    this.startTime = Date.now();

    console.debug(`Started timeout tracking for ${this.displayName} widget: warning=${this.warningTimeout}ms, failure=${this.failureTimeout}ms`);

    // Start an interval that checks elapsed time
    this.timeoutInterval = window.setInterval(() => {
      this.checkTimeouts();
    }, 500); // Check every 500ms
  }

  /**
   * Check if timeouts have been reached
   */
  private checkTimeouts() {
    const elapsedTime = Date.now() - this.startTime;

    // Only check timeouts if we're still in a loading-related state
    // (but don't check if we're already in error or loaded state)
    if (this.state !== 'loading' && this.state !== 'timeout-warning') {
      this.clearTimeoutTracking();
      return;
    }

    // Check for failure timeout first (more severe)
    if (elapsedTime >= this.failureTimeout) {
      console.debug(`Widget ${this.displayName} failure timeout reached after ${elapsedTime}ms`);
      
      // Clear the interval since we're done monitoring
      this.clearTimeoutTracking();
      
      // Set error state
      this.state = 'error';
      this.errorMessage = `Widget failed to initialize within ${this.failureTimeout / 1000} seconds`;
      
      return;
    }
    
    // Check for warning timeout
    if (elapsedTime >= this.warningTimeout && this.state === 'loading') {
      console.debug(`Widget ${this.displayName} warning timeout reached after ${elapsedTime}ms`);
      this.state = 'timeout-warning';
      
      // Important: We don't clear timeouts here, just change the visual state
    }
  }

  /**
   * Clear timeout tracking
   */
  private clearTimeoutTracking() {
    if (this.timeoutInterval !== null) {
      window.clearInterval(this.timeoutInterval);
      this.timeoutInterval = null;
    }
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    // Handle state changes
    if (name === 'state' && oldValue !== newValue) {
      console.debug(`Widget ${this.widgetId || this.displayName || 'Unknown'} state changed: ${oldValue} -> ${newValue}`);

      // State transition logic
      switch (newValue) {
        case 'loading':
          // Start timeout tracking when entering loading state
          this.startTimeoutTracking();
          break;
        
        case 'loaded':
        case 'error':
          // Stop timeout tracking when the widget is fully loaded or has errored
          this.clearTimeoutTracking();
          break;
          
        case 'timeout-warning':
          // Continue timeout tracking when showing warning
          // Don't reset or clear timeouts here
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

      // Update event details with current widget ID
      this.retryEvent.detail.widgetId = this.widgetId;
      this.dismissEvent.detail.widgetId = this.widgetId;
      this.cancelEvent.detail.widgetId = this.widgetId;
      this.closeEvent.detail.widgetId = this.widgetId;
    }

    // Handle timeout configuration changes
    if ((name === 'warningTimeout' || name === 'warning-timeout') && oldValue !== newValue) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 5000;

      // Update the property
      this.warningTimeout = numericValue;

      // Restart timeout tracking if we're in a loading state
      if (this.state === 'loading') {
        this.startTimeoutTracking();
      }
    }

    if ((name === 'failureTimeout' || name === 'failure-timeout') && oldValue !== newValue) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 10000;

      // Update the property
      this.failureTimeout = numericValue;

      // Restart timeout tracking if we're in a loading state
      if (this.state === 'loading') {
        this.startTimeoutTracking();
      }
    }

    // Handle error message
    if ((name === 'errorMessage' || name === 'error-message') && oldValue !== newValue) {
      this.errorMessage = newValue;
    }

    // Handle widget name
    if ((name === 'widgetName' || name === 'widget-name') && oldValue !== newValue) {
      this.widgetName = newValue;
    }
  }

  private updateWidgetDefinition(): void {
    if (this.widgetId) {
      this._widgetDefinition = getWidgetById(this.widgetId);
      console.debug(`Widget definition for ${this.widgetId}:`, this._widgetDefinition);
    }
  }

  /**
   * Initialize the widget module loading process
   * This method directly interacts with the widget service to handle module loading
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
        // No need to do anything, child elements will trigger their own initialization events
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
        
        // Note: We don't set state=loaded here because we wait for the 
        // actual widget element to initialize itself
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
    if (message.includes('import') || 
        message.includes('module') ||
        message.includes('not found')) {
      
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
    this.clearTimeoutTracking();
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
    this.startTimeoutTracking();
    
    // Re-initialize the widget module
    this.initializeWidgetModule();
    
    // Also dispatch the retry event for parent containers
    this.dispatchEvent(this.retryEvent);
  }

  /**
   * Dismiss the failed widget
   */
  dismiss() {
    console.debug(`Dismissing widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.dispatchEvent(this.dismissEvent);
  }

  /**
   * Cancel a slow-loading widget
   */
  cancel() {
    console.debug(`Cancelling widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.state = 'error';
    this.errorMessage = 'Widget loading cancelled by user';
    this.dispatchEvent(this.cancelEvent);
  }

  /**
   * Close the widget 
   */
  closeWidget() {
    console.debug(`Closing widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.dispatchEvent(this.closeEvent);
  }
}
