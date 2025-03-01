import { FASTElement, customElement, html, css, observable, attr } from "@microsoft/fast-element";

const template = html<WidgetWrapper>/*html*/ `
  <div class="widget-wrapper ${x => x.state}" data-widget-id="${x => x.widgetId}">
    <!-- Loading state -->
    ${(x) => x.state === 'loading' ? html<WidgetWrapper>/*html*/`
      <div class="widget-loading">
        <div class="spinner"></div>
        <p>Loading widget...</p>
      </div>
    ` : ''}
    
    <!-- Error state -->
    ${(x) => x.state === 'error' ? html<WidgetWrapper>/*html*/`
      <div class="widget-error">
        <h3>Widget failed to load</h3>
        <p>${x => x.errorMessage || 'There was an error loading this widget.'}</p>
        <button class="retry-button" @click="${x => x.retry()}">Try Again</button>
        <button class="dismiss-button" @click="${x => x.dismiss()}">Dismiss</button>
      </div>
    ` : ''}
    
    <!-- Timeout warning state (slow loading) -->
    ${(x) => x.state === 'timeout-warning' ? html<WidgetWrapper>/*html*/`
      <div class="widget-timeout">
        <div class="spinner"></div>
        <p>Still loading...</p>
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
  }
  
  .widget-loading, .widget-error, .widget-timeout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    color: var(--text-color, #333);
  }
  
  .widget-error {
    background-color: var(--background-color, #ffffff);
    border: 1px solid var(--error-color-light, #fadbd8);
  }
  
  .widget-error h3 {
    color: var(--error-color, #e74c3c);
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .retry-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 1rem;
    transition: background-color 0.2s;
  }
  
  .retry-button:hover {
    background-color: var(--primary-color-hover, #2980b9);
  }
  
  .dismiss-button {
    background-color: transparent;
    color: var(--text-color, #333);
    border: 1px solid var(--border-color, #ddd);
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 1rem;
    margin-left: 0.5rem;
    transition: background-color 0.2s;
  }
  
  .dismiss-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .cancel-button {
    background-color: transparent;
    color: var(--text-color, #333);
    border: 1px solid var(--border-color, #ddd);
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 1rem;
    transition: background-color 0.2s;
  }
  
  .cancel-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
`;

@customElement({
  name: "widget-wrapper",
  template,
  styles
})
export class WidgetWrapper extends FASTElement {
  @attr widgetId: string = "";
  @attr widgetName: string = "";
  @attr state: 'loading' | 'loaded' | 'error' | 'timeout-warning' = 'loading';
  @attr errorMessage: string = '';

  // Timeout handler for slow-loading widgets
  private timeoutHandler: number | null = null;
  
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

  connectedCallback() {
    super.connectedCallback();
    
    // Start timeout tracking if in loading state
    if (this.state === 'loading') {
      this.startTimeoutTracking();
    }
    
    // Update event detail with current widget ID
    this.retryEvent.detail.widgetId = this.widgetId;
    this.dismissEvent.detail.widgetId = this.widgetId;
    this.cancelEvent.detail.widgetId = this.widgetId;
    
    // Listen for error events from child widgets to automatically handle them
    this.addEventListener('error', this.handleChildError.bind(this));
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimeoutTracking();
    this.removeEventListener('error', this.handleChildError.bind(this));
  }
  
  /**
   * Handle errors from child widgets
   */
  private handleChildError(event: Event) {
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
    // Clear any existing timeout
    this.clearTimeoutTracking();
    
    // Set a timeout to show a warning if widget takes too long to load
    this.timeoutHandler = window.setTimeout(() => {
      if (this.state === 'loading') {
        this.state = 'timeout-warning';
      }
    }, 5000); // Show warning after 5 seconds
  }
  
  /**
   * Clear timeout tracking
   */
  private clearTimeoutTracking() {
    if (this.timeoutHandler !== null) {
      window.clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
  }
  
  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);
    
    // Handle state changes
    if (name === 'state' && oldValue !== newValue) {
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
      // Update event details with current widget ID
      this.retryEvent.detail.widgetId = newValue;
      this.dismissEvent.detail.widgetId = newValue;
      this.cancelEvent.detail.widgetId = newValue;
    }
  }
  
  /**
   * Request retry of widget load
   */
  retry() {
    this.state = 'loading';
    this.startTimeoutTracking();
    this.dispatchEvent(this.retryEvent);
  }
  
  /**
   * Dismiss the failed widget
   */
  dismiss() {
    this.dispatchEvent(this.dismissEvent);
  }
  
  /**
   * Cancel a slow-loading widget
   */
  cancel() {
    this.dispatchEvent(this.cancelEvent);
  }
}
