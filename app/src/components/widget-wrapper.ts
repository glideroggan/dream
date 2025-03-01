import { FASTElement, customElement, html, css, observable, attr } from "@microsoft/fast-element";
import { getWidgetById } from "../widgets/widget-registry";

const template = html<WidgetWrapper>/*html*/ `
  <div class="widget-wrapper ${x => x.state}" data-widget-id="${x => x.widgetId}">
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
  
  .widget-error h3 {
    color: var(--error-color, #e74c3c);
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
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
    color: var(--text-color, #333);
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
  @attr state: 'loading' | 'loaded' | 'error' | 'timeout-warning' = 'loading';
  @attr errorMessage: string = '';
  
  // Computed property for display name
  @observable private _widgetDefinition: any = null;
  
  get displayName(): string {
    if (this._widgetDefinition) {
      return this._widgetDefinition.name;
    }
    return this.widgetId || 'Unknown widget';
  }
  
  // Config options with defaults
  @attr({ mode: "fromView" }) warningTimeout: number = 5000; // 5 seconds for warning
  @attr({ mode: "fromView" }) failureTimeout: number = 10000; // 10 seconds for auto-failure

  // Timeout handlers
  private warningTimeoutHandler: number | null = null;
  private failureTimeoutHandler: number | null = null;
  
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
  
  // Bound event handlers to ensure proper 'this' context
  private boundHandleChildError = this.handleChildError.bind(this);
  private boundHandleInitialized = this.handleInitialized.bind(this);
  
  // Track if widget initialization already happened
  private initialized: boolean = false;

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
    
    // Use bound event handlers to ensure proper 'this' context
    this.addEventListener('error', this.boundHandleChildError);
    this.addEventListener('initialized', this.boundHandleInitialized);
    this.addEventListener('load-complete', this.boundHandleInitialized);
    
    // Handle DOM mutation to detect when widget content appears
    this.observeChildElements();
    
    console.log(`Widget wrapper connected: ${this.widgetId || this.displayName || 'Unknown'}, timeouts: warning=${this.warningTimeout}ms, failure=${this.failureTimeout}ms`);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimeoutTracking();
    
    // Remove bound event listeners
    this.removeEventListener('error', this.boundHandleChildError);
    this.removeEventListener('initialized', this.boundHandleInitialized);
    this.removeEventListener('load-complete', this.boundHandleInitialized);
    
    // Disconnect mutation observer if exists
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
  
  /**
   * Set up a mutation observer to detect when content appears
   * This is a fallback for widgets that don't emit initialization events
   */
  private mutationObserver: MutationObserver | null = null;
  
  private observeChildElements() {
    // Look for slot element
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;
    
    this.mutationObserver = new MutationObserver((mutations) => {
      // Check if we have any assigned nodes in the slot
      const slotNodes = slot.assignedNodes();
      if (slotNodes.length > 0) {
        // Check if there's actual widget content (not just text nodes)
        const hasElements = Array.from(slotNodes).some(node => node.nodeType === Node.ELEMENT_NODE);
        
        if (hasElements && !this.initialized && this.state === 'loading') {
          // Content has been added, treat this as initialization
          console.log(`Widget ${this.widgetId || this.displayName || 'Unknown'} content detected, treating as initialized`);
          this.handleInitialized(new Event('content-detected'));
        }
      }
    });
    
    // Observe both the slot element and the light DOM
    this.mutationObserver.observe(slot, { childList: true, subtree: true });
    this.mutationObserver.observe(this, { childList: true });
  }
  
  /**
   * Handle initialization event from child widget
   */
  private handleInitialized(event: Event) {
    if (this.initialized) return;
    
    console.log(`Widget ${this.widgetId || this.displayName || 'Unknown'} initialized (from ${event.type})`);
    this.initialized = true;
    this.state = 'loaded';
  }
  
  /**
   * Handle errors from child widgets
   */
  private handleChildError(event: Event) {
    console.log(`Widget ${this.widgetId || this.displayName || 'Unknown'} error:`, event);
    
    // Update state to error
    this.state = 'error';
    
    // Update error message if available
    if (event instanceof ErrorEvent && event.message) {
      this.errorMessage = event.message;
    } else {
      this.errorMessage = 'Widget encountered an error during initialization';
    }
    
    // Prevent further propagation
    event.stopPropagation();
  }
  
  /**
   * Start tracking for slow loading widgets
   */
  private startTimeoutTracking() {
    // Clear any existing timeouts
    this.clearTimeoutTracking();
    
    // Create a strong reference to this for timeout callbacks
    const self = this;
    
    // Set a timeout to show a warning if widget takes too long to load
    this.warningTimeoutHandler = window.setTimeout(function() {
      if (self.state === 'loading') {
        console.log(`Widget ${self.displayName} warning timeout reached`);
        self.state = 'timeout-warning';
      }
    }, this.warningTimeout);
    
    // Set a timeout to automatically fail if widget never loads
    this.failureTimeoutHandler = window.setTimeout(function() {
      if (self.state === 'loading' || self.state === 'timeout-warning') {
        console.log(`Widget ${self.displayName} failure timeout reached`);
        self.state = 'error';
        self.errorMessage = `Widget failed to initialize within ${self.failureTimeout/1000} seconds`;
        
        // Dispatch an error event to notify parent components
        const errorEvent = new ErrorEvent('error', {
          message: `Widget ${self.displayName} failed to initialize within the time limit`,
          error: new Error('Widget initialization timeout'),
          bubbles: true,
          composed: true
        });
        self.dispatchEvent(errorEvent);
      }
    }, this.failureTimeout);
    
    console.log(`Started timeout tracking for ${this.displayName} widget`);
  }
  
  /**
   * Clear timeout tracking
   */
  private clearTimeoutTracking() {
    if (this.warningTimeoutHandler !== null) {
      window.clearTimeout(this.warningTimeoutHandler);
      this.warningTimeoutHandler = null;
    }
    
    if (this.failureTimeoutHandler !== null) {
      window.clearTimeout(this.failureTimeoutHandler);
      this.failureTimeoutHandler = null;
    }
  }
  
  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);
    
    // Handle state changes
    if (name === 'state' && oldValue !== newValue) {
      console.log(`Widget ${this.widgetId || this.displayName || 'Unknown'} state changed: ${oldValue} -> ${newValue}`);
      
      // If changing to loading state, start timeout tracking
      if (newValue === 'loading') {
        this.startTimeoutTracking();
      } else {
        // Otherwise clear timeout tracking
        this.clearTimeoutTracking();
      }
    }
    
    // Handle widget ID changes
    if (name === 'widgetId' && oldValue !== newValue) {
      // Update widget definition
      this.updateWidgetDefinition();
      
      // Update event details with current widget ID
      this.retryEvent.detail.widgetId = newValue;
      this.dismissEvent.detail.widgetId = newValue;
      this.cancelEvent.detail.widgetId = newValue;
    }
    
    // Handle timeout configuration changes
    if ((name === 'warningTimeout' || name === 'failureTimeout') && oldValue !== newValue) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || (name === 'warningTimeout' ? 5000 : 10000);
      
      // Update the property with the numeric value
      if (name === 'warningTimeout') {
        this.warningTimeout = numericValue;
      } else {
        this.failureTimeout = numericValue;
      }
      
      // Restart timeout tracking if we're in a loading state
      if (this.state === 'loading') {
        this.startTimeoutTracking();
      }
    }
  }
  
  private updateWidgetDefinition(): void {
    if (this.widgetId) {
      this._widgetDefinition = getWidgetById(this.widgetId);
      console.log(`Widget definition for ${this.widgetId}:`, this._widgetDefinition);
    }
  }
  
  /**
   * Request retry of widget load
   */
  retry() {
    console.log(`Retrying widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.initialized = false;
    this.state = 'loading';
    this.startTimeoutTracking();
    this.dispatchEvent(this.retryEvent);
  }
  
  /**
   * Dismiss the failed widget
   */
  dismiss() {
    console.log(`Dismissing widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.dispatchEvent(this.dismissEvent);
  }
  
  /**
   * Cancel a slow-loading widget
   */
  cancel() {
    console.log(`Cancelling widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.state = 'error';
    this.errorMessage = 'Widget loading cancelled by user';
    this.dispatchEvent(this.cancelEvent);
  }
}
