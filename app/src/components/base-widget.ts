import { FASTElement, observable, css } from "@microsoft/fast-element";
import { workflowManager } from "../services/workflow-manager-service";
import { MIN_ROW_HEIGHT, DEFAULT_GRID_GAP } from "../constants/grid-constants";

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
    // overflow: auto;
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

  // New properties to track content size
  protected lastContentHeight: number = 0;
  protected maxContentHeight: number = 0;
  protected userResizedHeight: number | null = null;
  protected isFirstSizeCheck: boolean = true;

  connectedCallback(): void {
    super.connectedCallback();

    // Set up resize observer to handle content overflow detection
    // this.resizeObserver = new ResizeObserver(entries => {
    //   console.debug('Widget resize observed:', entries[0]);
    //   this.handleResize(entries[0]);

    //   // Also check if we need more rows for our content
    //   this.checkContentFit(entries[0]);
    // });

    // this.resizeObserver.observe(this);

    // Signal that we've connected to the DOM
    this.dispatchEvent(new CustomEvent('widget-connected', {
      bubbles: true,
      composed: true
    }));

    // Get current rowSpan from parent wrapper if available
    this.queryCurrentSpans();

    // Check initial content size after a brief delay to allow rendering
    setTimeout(() => this.checkInitialContentFit(), 100);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    // if (this.resizeObserver) {
    //   this.resizeObserver.disconnect();
    //   this.resizeObserver = null;
    // }
  }

  /**
   * Handle resize events to determine if scrollbars are needed
   */
  protected handleResize(entry: ResizeObserverEntry): void {
    // Use the target (which is this component) scrollHeight for total content height
    const contentHeight = entry.target.scrollHeight;
    // Use contentRect.height for the visible container height
    const containerHeight = entry.contentRect.height;

    console.debug(`Widget resize detected - content height: ${contentHeight}px, container: ${containerHeight}px`);

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
   */
  protected checkContentFit(entry: ResizeObserverEntry): void {
    // Replace debounce with immediate action when possible
    if (this.contentSizingTimer !== null) {
      window.clearTimeout(this.contentSizingTimer);
    }

    // Use requestAnimationFrame instead of setTimeout for visual updates
    requestAnimationFrame(() => {
      const contentHeight = entry.target.scrollHeight;
      const containerHeight = entry.contentRect.height;

      // Get current row span from parent wrapper
      const parent = this.closest('widget-wrapper');
      const currentRowSpan = parent ? parseInt(parent.getAttribute('rowSpan') || '0') : 0;

      // Calculate row height and add additional buffer for borders/padding
      const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;

      // Use ceiling and add a small buffer to prevent scrollbars (extra 0.2 rows)
      const rowsNeeded = Math.ceil(contentHeight / rowHeight);

      console.debug(`Content fit check: content=${contentHeight}px (${rowsNeeded} rows needed), ` +
        `container=${containerHeight}px (${currentRowSpan} rows allocated)`);

      // Keep track of content height changes
      const previousHeight = this.lastContentHeight;
      this.lastContentHeight = contentHeight;

      // Update maximum observed content height if this is larger
      if (contentHeight > this.maxContentHeight) {
        this.maxContentHeight = contentHeight;
      }

      // Don't expand if user has manually set a smaller height
      const shouldExpand = this.userResizedHeight === null || contentHeight <= this.userResizedHeight;

      // If content needs more rows than allocated - be more aggressive with expansion
      if (shouldExpand && (rowsNeeded > currentRowSpan || this.isFirstSizeCheck)) {
        this.isFirstSizeCheck = false;

        if (rowsNeeded > currentRowSpan) {
          console.debug(`Content needs more rows: ${rowsNeeded} vs ${currentRowSpan} allocated`);
          // Add 1 more row than calculated to avoid edge case scrollbars
          this.requestMoreRows(rowsNeeded + 1);
        }
      }
      // If content has shrunk significantly (at least 2 rows and 25% difference)
      else if (contentHeight < previousHeight * 0.8 &&
        currentRowSpan > rowsNeeded + 1 &&
        rowsNeeded < currentRowSpan * 0.75) {
        console.debug(`Content has shrunk significantly to ${rowsNeeded} rows vs ${currentRowSpan} allocated`);
        this.notifyContentShrink(contentHeight, rowsNeeded);
      }
    });
  }

  /**
   * Explicitly request a recalculation of size after content has changed
   * Call this method when collapsing/hiding significant content
   */
  public recalculateSize(): void {
    // Calculate current content height
    const contentHeight = this.scrollHeight;
    const containerHeight = this.clientHeight;

    // Use constants for row calculations
    const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP; // Base row height + gap
    const rowsNeeded = Math.ceil(contentHeight / rowHeight);

    // Get current row span from parent wrapper
    const parent = this.closest('widget-wrapper');
    const currentRowSpan = parent ? parseInt(parent.getAttribute('rowSpan') || '0') : 0;

    console.debug(`Manual recalculate - content height: ${contentHeight}px (${rowsNeeded} rows), ` +
      `current rows: ${currentRowSpan}`);

    // If we have significantly more rows than needed (at least 2 rows and 25% difference)
    if (currentRowSpan > rowsNeeded + 1 && rowsNeeded < currentRowSpan * 0.75) {
      console.debug(`Content requires fewer rows: ${rowsNeeded} vs ${currentRowSpan} allocated`);
      this.notifyContentShrink(contentHeight, rowsNeeded);
    }
  }

  /**
   * Notify the wrapper that content has shrunk significantly
   * Includes the calculated rows needed for accurate resizing
   * @param newHeight The new content height in pixels
   * @param rowsNeeded The calculated number of rows needed for this content
   */
  protected notifyContentShrink(newHeight: number, rowsNeeded?: number): void {
    const parent = this.closest('widget-wrapper');
    if (parent) {
      // Calculate rows if not provided
      if (rowsNeeded === undefined) {
        const rowHeight = 38;
        rowsNeeded = Math.ceil(newHeight / rowHeight);
      }

      // Dispatch an event with row calculation
      const event = new CustomEvent('widget-content-shrink', {
        bubbles: true,
        composed: true,
        detail: {
          newContentHeight: newHeight,
          rowsNeeded: rowsNeeded,
          previousMax: this.maxContentHeight,
          reason: 'content-shrink'
        }
      });

      parent.dispatchEvent(event);

      // Reset the max height tracking
      if (newHeight < this.maxContentHeight * 0.6) {
        this.maxContentHeight = newHeight;
      }
    }
  }

  /**
   * Called when user manually resizes the widget
   * Helps widget understand the user's size preference
   */
  public setUserResizePreference(height: number): void {
    this.userResizedHeight = height;
    console.debug(`Widget user resize preference set: ${height}px`);
  }

  /**
   * Reset user resize preference (e.g., when user clicks "auto size")
   */
  public resetUserResizePreference(): void {
    this.userResizedHeight = null;
    console.debug('Widget user resize preference reset to auto');

    // Check if we need to resize based on current content
    this.checkInitialContentFit();
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
    // Use requestAnimationFrame instead of setTimeout
    requestAnimationFrame(() => {
      // Use direct measurements from the component
      const contentHeight = this.scrollHeight;
      const containerHeight = this.clientHeight;

      // Get current row span
      const parent = this.closest('widget-wrapper');
      const currentRowSpan = parent ? parseInt(parent.getAttribute('rowSpan') || '0') : 0;

      // Calculate row height with extra buffer for padding/scrollbar
      const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
      // Add buffer (0.5 row) to prevent scrollbars in edge cases
      const rowsNeeded = Math.ceil(contentHeight / rowHeight + 0.5);

      console.debug(`Initial content fit check - content height: ${contentHeight}px (${rowsNeeded} rows), ` +
        `container: ${containerHeight}px (${currentRowSpan} rows)`);

      // Request size adjustment if needed
      if (contentHeight > containerHeight * 0.9 && containerHeight > 0) { // Using 90% threshold
        if (rowsNeeded >= currentRowSpan) {
          console.debug(`Content needs more space. Requesting ${rowsNeeded + 1} rows (current: ${currentRowSpan})`);
          // Add 1 more row to prevent scrollbars in edge cases
          this.requestMoreRows(rowsNeeded + 1);
        }
      }
    });
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
  // protected handleContentViewChange(callback?: () => void): void {
  //   return
  //   // Update layout after a small delay to allow DOM to render
  //   setTimeout(() => {
  //     this.checkInitialContentFit();
  //     if (callback) callback();
  //   }, 50);
  // }

  /**
   * Notify accordion changes - components can call this after expand/collapse operations
   * @param expanded Whether the accordion is expanded (true) or collapsed (false)
   */
  // public notifyAccordionChange(expanded: boolean): void {
  //   return
  //   // Use requestAnimationFrame instead of setTimeout for visual updates
  //   requestAnimationFrame(() => {
  //     console.debug(`Accordion ${expanded ? 'expanded' : 'collapsed'}, rechecking content fit`);

  //     if (expanded) {
  //       // For expansion, we need to check if more space is needed - no delay needed
  //       this.checkInitialContentFit();
  //     } else {
  //       // For collapse, trigger shrink calculation immediately 
  //       this.recalculateSize();
  //     }
  //   });
  // }

  /**
   * New helper method for any widget to signal content changes
   * Can be called by any widget component when its content changes significantly
   */
  protected notifyContentChanged(): void {
    // Clear any existing timeout
    if (this.contentSizingTimer !== null) {
      window.clearTimeout(this.contentSizingTimer);
    }

    // Force an immediate recalculation
    const contentHeight = this.scrollHeight;
    const containerHeight = this.clientHeight;

    console.debug(`Content changed notification: height=${contentHeight}px, container=${containerHeight}px`);

    this.$emit('content-change', {
      contentHeight: contentHeight,
      containerHeight: containerHeight
    })

    return
    // If significantly smaller, try to shrink
    // if (contentHeight < this.lastContentHeight * 0.8) {
    //   console.debug(`Content has shrunk significantly, recalculating size`);
    //   this.recalculateSize();
    // } 
    // // If larger, check if we need to expand
    // else if (contentHeight > containerHeight) {
    //   // Use constants for row calculations
    //   const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
    //   const rowsNeeded = Math.ceil(contentHeight / rowHeight);

    //   // Get current row span
    //   const parent = this.closest('widget-wrapper');
    //   const currentRowSpan = parent ? parseInt(parent.getAttribute('rowSpan') || '0') : 0;

    //   if (rowsNeeded > currentRowSpan) {
    //     console.debug(`Content needs more space after change. Requesting ${rowsNeeded} rows`);
    //     this.requestMoreRows(rowsNeeded);
    //   }
    // }

    // // Update our tracking
    // this.lastContentHeight = contentHeight;
  }
}
