import { FASTElement, observable, css } from "@microsoft/fast-element";
import { workflowManager } from "../services/workflow-manager-service";

// Common styles that will be applied to all widgets through inheritance
export const baseWidgetStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: auto; /* Auto adds scrollbars only when needed */
    box-sizing: border-box;
  }

  .widget-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: visible;
  }

  .widget-content {
    flex: 1;
  }

  /* For widgets with a fixed height that shouldn't expand */
  :host(.fixed-height) {
    height: auto;
    overflow: auto;
  }

  /* For widgets that need to scroll internally */
  :host(.scroll-content) .widget-content {
    overflow: auto;
  }
`;

/**
 * Base class for widget components that provides common functionality and styling.
 * Extend this class to create new widgets with consistent styling and behavior.
 */
export class BaseWidget extends FASTElement {
  /**
   * Indicates if the widget is in loading state
   */
  @observable isLoading: boolean = true;
  
  /**
   * Indicates if the widget has encountered an error
   */
  @observable hasError: boolean = false;
  
  /**
   * Error message to display if hasError is true
   */
  @observable errorMessage: string = "";

  protected initialized: boolean = false;
  protected error: Error | null = null;
  protected resizeObserver: ResizeObserver | null = null;
  protected currentHeight: number = 0;
  protected currentRowSpan: number = 0;
  protected contentSizingTimer: number | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    
    // Set up resize observer to handle content overflow detection
    this.resizeObserver = new ResizeObserver(entries => {
      this.handleResize(entries[0]);
      
      // Also check if we need more rows for our content
      this.checkContentFit(entries[0]);
    });
    
    this.resizeObserver.observe(this);

    // Signal that we've connected to the DOM
    this.dispatchEvent(new CustomEvent('widget-connected', {
      bubbles: true,
      composed: true
    }));
    
    // Get current rowSpan from parent wrapper if available
    this.queryCurrentSpans();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Handle resize events to determine if scrollbars are needed
   */
  protected handleResize(entry: ResizeObserverEntry): void {
    // Get the content element (most widgets will have a main container)
    const contentEl = this.shadowRoot?.querySelector('.widget-content') as HTMLElement;
    if (!contentEl) return;

    // If the content height is greater than the container height, add overflow class
    const containerHeight = entry.contentRect.height;
    const contentHeight = contentEl.scrollHeight;
    
    if (contentHeight > containerHeight) {
      this.classList.add('scroll-content');
    } else {
      this.classList.remove('scroll-content');
    }
  }

  /**
   * Query the parent wrapper for current span values
   */
  private queryCurrentSpans(): void {
    // Find parent widget wrapper
    const parent = this.closest('widget-wrapper');
    if (parent) {
      const rowSpan = parseInt(parent.getAttribute('rowSpan') || '0');
      if (rowSpan > 0) {
        this.currentRowSpan = rowSpan;
      }
    }
  }

  /**
   * Check if the content fits in the current space
   * If not, request more rows from the parent wrapper
   */
  protected checkContentFit(entry: ResizeObserverEntry): void {
    // Debounce calls to avoid too many resize events
    if (this.contentSizingTimer !== null) {
      window.clearTimeout(this.contentSizingTimer);
    }
    
    this.contentSizingTimer = window.setTimeout(() => {
      const contentEl = this.shadowRoot?.querySelector('.widget-content') as HTMLElement;
      if (!contentEl) return;
      
      const containerHeight = entry.contentRect.height;
      const contentHeight = contentEl.scrollHeight;
      
      // If we need more space, request additional rows
      if (contentHeight > containerHeight && this.currentRowSpan > 0) {
        // Calculate how many more rows we need
        // Assuming each row is about 30px + 8px gap
        const rowHeight = 38; // 30px row + 8px gap
        const currentSpace = this.currentRowSpan * rowHeight;
        const neededSpace = contentHeight;
        
        if (neededSpace > currentSpace) {
          const additionalRowsNeeded = Math.ceil((neededSpace - currentSpace) / rowHeight);
          if (additionalRowsNeeded > 0) {
            const newRowSpan = Math.min(16, this.currentRowSpan + additionalRowsNeeded);
            
            console.debug(`Widget content overflow detected. ` +
              `Content height: ${contentHeight}px, Container: ${containerHeight}px. ` +
              `Requesting row span increase from ${this.currentRowSpan} to ${newRowSpan}`);
              
            // Only request more space if significant change and not too frequent
            this.requestMoreRows(newRowSpan);
          }
        }
      }
    }, 250); // Debounce to avoid excessive updates
  }
  
  /**
   * Request more rows from the parent widget-wrapper
   */
  protected requestMoreRows(newRowSpan: number): void {
    if (newRowSpan <= this.currentRowSpan) return;
    
    // Find parent widget wrapper
    const parent = this.closest('widget-wrapper');
    if (parent) {
      // Update our tracking
      this.currentRowSpan = newRowSpan;
      
      // Dispatch an event requesting a row span change
      const event = new CustomEvent('widget-request-resize', {
        bubbles: true,
        composed: true,
        detail: {
          rowSpan: newRowSpan,
          reason: 'content-overflow'
        }
      });
      
      parent.dispatchEvent(event);
    }
  }
  
  /**
   * Notify parent components that the widget has finished initializing
   * Call this when your widget has loaded its data and is ready to display
   */
  protected notifyInitialized(): void {
    this.isLoading = false;
    this.initialized = true;
    
    // Dispatch initialized event for the widget wrapper
    this.dispatchEvent(new CustomEvent('initialized', {
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Handle an error in the widget
   * @param error The error object or message
   */
  protected handleError(error: Error | string): void {
    this.hasError = true;
    this.isLoading = false;
    this.error = typeof error === 'string' ? new Error(error) : error;
    
    if (error instanceof Error) {
      this.errorMessage = error.message;
      console.error(`Widget error:`, error);
    } else {
      this.errorMessage = error;
      console.error(`Widget error: ${error}`);
    }
    
    // Dispatch error event for the widget wrapper
    this.dispatchEvent(new ErrorEvent('error', {
      error: error instanceof Error ? error : new Error(error),
      message: this.errorMessage,
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Start a workflow from within a widget
   * @param workflowId The ID of the workflow to start
   * @param params Optional parameters to pass to the workflow
   */
  protected startWorkflow(workflowId: string, params?: Record<string, any>): void {
    try {
      console.debug(`Starting workflow ${workflowId}`);
      // This kicks off the workflow but doesn't return a result
      workflowManager.startWorkflow(workflowId, params);
    } catch (error) {
      console.error(`Error starting workflow ${workflowId}:`, error);
      this.handleError(error instanceof Error ? error : String(error));
    }
  }
  
  /**
   * Request to reload the widget
   */
  protected requestReload(): void {
    this.dispatchEvent(new CustomEvent("widget-reload", {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Check if initial content requires more rows and adjust accordingly
   * Call this from connectedCallback or after initialization
   */
  protected checkInitialContentFit(): void {
    // Wait for rendering to complete
    setTimeout(() => {
      // Find the main content container - look for .widget-content first,
      // then fall back to first child of shadow root
      const container = this.shadowRoot?.querySelector('.widget-content') || 
                      this.shadowRoot?.firstElementChild as HTMLElement;
      
      if (!container) return;
      
      const contentHeight = container.scrollHeight;
      const containerHeight = this.clientHeight;
      
      console.debug(`BaseWidget: Content fit check - content height: ${contentHeight}px, container: ${containerHeight}px`);
      
      // Request size adjustment if needed
      if (contentHeight > containerHeight && containerHeight > 0) {
        // Estimate needed rows (using standard row height + gap)
        const rowHeight = 38; // Typical row height (30px) + gap (8px)
        const neededRows = Math.ceil(contentHeight / rowHeight);
        
        if (neededRows > 0 && neededRows > this.currentRowSpan) {
          console.debug(`BaseWidget: Content needs more space. Requesting ${neededRows} rows (current: ${this.currentRowSpan})`);
          this.requestMoreRows(neededRows);
        }
      }
    }, 100);
  }
  
  /**
   * Check content after important DOM updates that could affect layout
   * Call this after significant content changes or tab switches
   */
  protected updateContentLayout(): void {
    if (this.contentSizingTimer !== null) {
      window.clearTimeout(this.contentSizingTimer);
    }
    
    // Debounce to avoid multiple calls
    this.contentSizingTimer = window.setTimeout(() => {
      this.checkInitialContentFit();
    }, 50);
  }
  
  /**
   * React to tab or section changes that may affect content height
   * @param callback Optional callback to run after layout update
   */
  protected handleContentViewChange(callback?: () => void): void {
    // Update layout after a small delay to allow DOM to render
    setTimeout(() => {
      this.checkInitialContentFit();
      if (callback) callback();
    }, 50);
  }
}
