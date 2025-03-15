import { MIN_ROW_HEIGHT, DEFAULT_GRID_GAP, MAX_GRID_COLUMNS, MAX_GRID_ROWS } from "../../constants/grid-constants";

/**
 * Widget sizing functionality
 * Extracted from widget-wrapper.ts to make the code more manageable
 */
export class WidgetSizingManager {
  // Resize block handling
  private resizeBlockActive: boolean = false;
  private resizeBlockTimeoutId: number | null = null;

  // Size lock handling
  private sizeLockActive: boolean = false;
  private sizeLockTargetRows: number = 0;
  private sizeLockTimeoutId: number | null = null;

  constructor(private component: any) { }

  /**
   * Change widget spans (columns and rows) and emit change event
   * Modified to respect preserveRowSpan flag
   */
  changeSpans(newColSpan: number, newRowSpan: number, isUserResized: boolean = true, isContentShrink: boolean = false, detail: any = {}): void {
    // If preserveRowSpan flag is set, use the current row span
    if (detail?.preserveRowSpan) {
      console.debug(`Widget ${this.component.widgetId} preserving current row span: ${this.component.rowSpan}`);
      newRowSpan = this.component.rowSpan;
    }

    // If we have an active size lock from a content shrink operation,
    // prevent any attempts to override the target size UNLESS this is a follow-up call from the same operation
    if (this.sizeLockActive && !isContentShrink) {
      // Only enforce row span lock, allow column span changes
      if (this.sizeLockTargetRows !== newRowSpan) {
        console.debug(`Widget ${this.component.widgetId} rejecting row span change during size lock: 
          attempted ${newRowSpan}, locked at ${this.sizeLockTargetRows}`);
        newRowSpan = this.sizeLockTargetRows; // Force the locked row span
      }
    }

    // Clamp values to valid ranges
    newColSpan = Math.max(this.component.minColSpan, Math.min(newColSpan, this.component.maxColSpan));
    newRowSpan = Math.max(this.component.minRowSpan, Math.min(newRowSpan, this.component.maxRowSpan));

    // Don't do anything if spans haven't changed
    if (this.component.colSpan === newColSpan && this.component.rowSpan === newRowSpan) return;

    const oldColSpan = this.component.colSpan;
    const oldRowSpan = this.component.rowSpan;

    console.debug(`Widget ${this.component.widgetId} spans changing from ${oldColSpan}x${oldRowSpan} to ${newColSpan}x${newRowSpan}, 
      user resized: ${isUserResized}, content shrink: ${isContentShrink}`);

    // Update properties AND attributes for immediate feedback
    this.component.colSpan = newColSpan;
    this.component.rowSpan = newRowSpan;

    // Explicit attribute updates to ensure they're synchronized with properties
    this.component.setAttribute('colSpan', newColSpan.toString());
    this.component.setAttribute('rowSpan', newRowSpan.toString());

    // Update DOM classes
    this.updateRowSpanClasses(newRowSpan);

    // Create span change event with additional flag
    console.debug('WidgetSizingManager: Emitting widget-spans-change event');
    const spanChangeEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.component.widgetId,
        pageType: this.component.pageType,
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
    console.debug(`Dispatching span change event for ${this.component.widgetId}: ${newColSpan}x${newRowSpan}`);
    this.component.dispatchEvent(spanChangeEvent);

    // Track if this was a user-initiated resize
    if (isUserResized) {
      this.component.isManuallyResized = true;
      this.component.resizeTracker.recordUserResize(newRowSpan);

      // Also notify any contained widget
      const widgetElement = this.component.querySelector('[class*="widget"]');
      if (widgetElement && typeof (widgetElement as any).setUserResizePreference === 'function') {
        (widgetElement as any).setUserResizePreference(newRowSpan * (MIN_ROW_HEIGHT + DEFAULT_GRID_GAP));
      }
    }

    // Also update parent grid-layout directly for immediate visual feedback
    this.updateParentGridClasses(newColSpan, newRowSpan);

    // Trigger grid layout update
    this.triggerGridLayoutUpdate();

    // Save the dimensions if needed
    if (this.component.saveDimensions && isUserResized) {
      this.component.settingsManager.saveDimensionsToSettings(newColSpan, newRowSpan);
    }
  }

  /**
   * Increase column span by 1
   */
  increaseColSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentColSpan = Number(this.component.colSpan);
    const maxColSpan = Number(this.component.maxColSpan);

    if (currentColSpan < maxColSpan) {
      const oldColSpan = currentColSpan;
      const newColSpan = Math.min(oldColSpan + 1, maxColSpan);

      console.debug(`WidgetWrapper: Increasing column span for ${this.component.widgetId} from ${oldColSpan} to ${newColSpan}`);

      // Only update column span, preserve current row span exactly as is
      this.changeColSpanOnly(newColSpan);
    }
  }

  /**
   * Decrease column span by 1
   */
  decreaseColSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentColSpan = Number(this.component.colSpan);
    const minColSpan = Number(this.component.minColSpan);

    if (currentColSpan > minColSpan) {
      const oldColSpan = currentColSpan;
      const newColSpan = Math.max(oldColSpan - 1, minColSpan);

      console.debug(`WidgetWrapper: Decreasing column span for ${this.component.widgetId} from ${oldColSpan} to ${newColSpan}`);

      // Only update column span, preserve current row span exactly as is
      this.changeColSpanOnly(newColSpan);
    }
  }

  /**
   * Change only column span without affecting row span
   * This prevents the automatic row recalculation that happens in changeSpans
   */
  private changeColSpanOnly(newColSpan: number): void {
    const currentRowSpan = this.component.rowSpan;
    const oldColSpan = this.component.colSpan;

    // Direct property update first for immediate UI feedback
    this.component.colSpan = newColSpan;

    // CRITICAL: First update DOM attributes directly 
    this.component.style.setProperty('--col-span', newColSpan.toString());
    this.component.setAttribute('colSpan', newColSpan.toString());

    // Create event that explicitly preserves the current row span
    // const spanChangeEvent = new CustomEvent('widget-spans-change', {
    //   bubbles: true,
    //   composed: true,
    //   detail: {
    //     widgetId: this.component.widgetId,
    //     pageType: this.component.pageType,
    //     oldColSpan: this.component.colSpan,
    //     oldRowSpan: currentRowSpan,
    //     colSpan: newColSpan,
    //     rowSpan: currentRowSpan, // Important: keep current row span
    //     isUserResized: true,
    //     source: 'colSpanChangeOnly',
    //     preserveRowSpan: true // Add a flag to indicate row span should be preserved
    //   }
    // });


    const spanChangeEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.component.widgetId,
        pageType: this.component.pageType, // Ensure pageType is always included
        oldColSpan: oldColSpan,
        oldRowSpan: this.component.rowSpan,
        colSpan: newColSpan,
        rowSpan: this.component.rowSpan,
        isUserResized: true,
        source: 'changeColSpanOnly'
      }
    });
    this.component.dispatchEvent(spanChangeEvent);

    return
    // // Also update our own classes if we're directly in a grid layout
    // const parentElement = this.component.parentElement;
    // if (parentElement && parentElement.classList.contains('widgets-container')) {
    //   // Remove all existing col-span-* classes
    //   for (let i = 1; i <= this.component.maxColSpan; i++) {
    //     this.component.classList.remove(`col-span-${i}`);
    //   }
    //   // Add the new col-span class
    //   this.component.classList.add(`col-span-${newColSpan}`);
    // }

    // // Update parent grid styles directly but ONLY for columns
    // if (parentElement) {
    //   // Remove existing column span classes
    //   for (let i = 1; i <= this.component.maxColSpan; i++) {
    //     parentElement.classList.remove(`col-span-${i}`);
    //   }
    //   parentElement.classList.add(`col-span-${newColSpan}`);
    //   parentElement.style.gridColumn = `span ${newColSpan}`;
    // }

    // // Then dispatch the event for the grid to handle
    // // this.component.dispatchEvent(spanChangeEvent);

    // // Save the dimensions if needed
    // if (this.component.saveDimensions) {
    //   this.component.settingsManager.saveDimensionsToSettings(newColSpan, this.component.rowSpan);
    // }
  }

  /**
   * Increase row span by 1
   */
  increaseRowSpan(): void {
    // Explicitly convert to numbers to avoid string concatenation
    const currentRowSpan = Number(this.component.rowSpan);
    const maxRowSpan = Number(this.component.maxRowSpan);
    console.debug('currentRowSpan', currentRowSpan, 'maxRowSpan', maxRowSpan);

    if (currentRowSpan < maxRowSpan) {
      const oldRowSpan = currentRowSpan;
      const newRowSpan = Math.min(oldRowSpan + 1, maxRowSpan);
      
      console.debug(`WidgetWrapper: Increasing row span for ${this.component.widgetId} from ${oldRowSpan} to ${newRowSpan}`);
      
      // Direct property update first for immediate UI feedback
      this.component.rowSpan = newRowSpan;
      
      try {
        // Flag as manually resized BEFORE dispatching events
        this.component.isManuallyResized = true;
        
        // Block any auto-resize events that might immediately follow this manual resize
        this.blockResizeEvents(500);
        
        // Create event with complete details matching the column span events
        // const spanChangeEvent = new CustomEvent('widget-spans-change', {
        //   bubbles: true,
        //   composed: true,
        //   detail: {
        //     widgetId: this.component.widgetId,
        //     pageType: this.component.pageType,
        //     oldColSpan: this.component.colSpan,
        //     oldRowSpan: oldRowSpan,
        //     colSpan: this.component.colSpan,
        //     rowSpan: newRowSpan,
        //     isUserResized: true,
        //     source: 'increaseRowSpan'
        //   }
        // });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.component.widgetId} with pageType ${this.component.pageType}`);
        
        // Update DOM attributes directly 
        this.component.style.setProperty('--row-span', newRowSpan.toString());
        this.component.setAttribute('rowSpan', newRowSpan.toString());
        
        // Update row span classes
        this.updateRowSpanClasses(newRowSpan);

        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.component.widgetId,
            pageType: this.component.pageType, // Ensure pageType is always included
            oldColSpan: this.component.colSpan,
            oldRowSpan: oldRowSpan,
            colSpan: this.component.colSpan,
            rowSpan: newRowSpan,
            isUserResized: true,
            source: 'decreaseRowSpan'
          }
        });
        this.component.dispatchEvent(spanChangeEvent);

        
        
        return
        // Record user resize preference in the resize tracker
        // this.component.resizeTracker.recordUserResize(newRowSpan);
        
        // // Notify contained widget about manual resize to prevent auto-sizing
        // const widgetElement = this.component.querySelector('[class*="widget"]');
        // if (widgetElement && typeof (widgetElement as any).setUserResizePreference === 'function') {
        //   (widgetElement as any).setUserResizePreference(newRowSpan * (MIN_ROW_HEIGHT + DEFAULT_GRID_GAP));
        // }
        
        // // Also disable auto-size if not already disabled
        // if (this.component.autoSizeEnabled) {
        //   console.debug(`Disabling auto-size after manual resize for ${this.component.widgetId}`);
        //   this.component.autoSizeEnabled = false;
        // }
        
        // // Then dispatch the event for the grid to handle
        // // this.component.dispatchEvent(spanChangeEvent);
        
        // // Save the dimensions if needed
        // if (this.component.saveDimensions) {
        //   this.component.settingsManager.saveDimensionsToSettings(this.component.colSpan, newRowSpan);
        // }
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    } else {
      console.debug(`Cannot increase row span beyond maximum (${maxRowSpan})`);
    }
  }

  /**
   * Decrease row span by 1
   */
  decreaseRowSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentRowSpan = Number(this.component.rowSpan);
    const minRowSpan = Number(this.component.minRowSpan);

    if (currentRowSpan > minRowSpan) {
      const oldRowSpan = currentRowSpan;
      const newRowSpan = Math.max(oldRowSpan - 1, minRowSpan);

      console.debug(`WidgetWrapper: Decreasing row span for ${this.component.widgetId} from ${oldRowSpan} to ${newRowSpan}`);

      // Direct property update first for immediate UI feedback
      this.component.rowSpan = newRowSpan;

      try {
        // Create event with complete details

        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.component.widgetId,
            pageType: this.component.pageType, // Ensure pageType is always included
            oldColSpan: this.component.colSpan,
            oldRowSpan: oldRowSpan,
            colSpan: this.component.colSpan,
            rowSpan: newRowSpan,
            isUserResized: true,
            source: 'decreaseRowSpan'
          }
        });

        console.debug(`WidgetWrapper: Dispatching span change for ${this.component.widgetId} with pageType ${this.component.pageType}`);

        // Update DOM attributes directly
        this.component.style.setProperty('--row-span', newRowSpan.toString());
        this.component.setAttribute('rowSpan', newRowSpan.toString());

        // Update row span classes
        this.updateRowSpanClasses(newRowSpan);

        // Then dispatch the event for the grid to handle
        this.component.dispatchEvent(spanChangeEvent);

        // Save the dimensions if needed
        if (this.component.saveDimensions) {
          this.component.settingsManager.saveDimensionsToSettings(this.component.colSpan, newRowSpan);
        }
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }

  /**
   * Handle resize requests from widgets
   */
  handleResizeRequest(event: Event): void {
    const customEvent = event as CustomEvent;
    const { rowSpan, reason } = customEvent.detail;

    // If resize events are blocked, ignore this request
    if (this.resizeBlockActive) {
      console.debug(`Widget ${this.component.widgetId} ignoring resize request during blocking period`);
      event.stopPropagation();
      return;
    }

    // IMPORTANT: If user has manually resized, do NOT auto-resize regardless of autoSizeEnabled setting
    if (this.component.isManuallyResized) {
      console.debug(`Widget ${this.component.widgetId} ignoring resize request - manually sized by user`);
      event.stopPropagation();
      return;
    }

    console.debug(`Widget ${this.component.widgetId} received resize request: ${rowSpan} rows (${reason})`);

    // Get appropriate row span from resize tracker
    const newRowSpan = this.component.resizeTracker.getExpandedRowSpan(rowSpan);

    // Only increase, never decrease rows from content fit requests
    if (newRowSpan > this.component.rowSpan && reason === 'content-overflow') {
      this.changeSpans(this.component.colSpan, newRowSpan, false);
    }

    // Stop propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Set up observer to monitor content size changes
   */
  // setupContentResizeObserver(): void {
  //   return
  //   if (this.component.contentResizeObserver) {
  //     this.component.contentResizeObserver.disconnect();
  //   }

  //   this.component.contentResizeObserver = new ResizeObserver(entries => {
  //     // Only proceed if auto-size is enabled
  //     if (!this.component.enableAutoSize || this.sizeLockActive) return;

  //     const contentElement = entries[0];
  //     if (!contentElement) return;

  //     const contentRect = contentElement.contentRect;
  //     const contentScrollHeight = contentElement.target.scrollHeight;

  //     // More aggressive overflow detection (5px threshold instead of 20px)
  //     if (contentScrollHeight > contentRect.height + 5) {
  //       // Process immediately without timeout
  //       this.handleContentOverflow(contentScrollHeight);
  //     }
  //   });

  //   // Immediate observation
  //     const contentSlot = this.component.shadowRoot?.querySelector('.widget-content');
  //   if (contentSlot) {
  //     this.component.contentResizeObserver?.observe(contentSlot);
  //     console.debug(`Widget wrapper content observer set up for ${this.component.widgetId}`);
  //   }
  // }

  public handleContentChange(event: Event): void {
    console.debug('Content change detected');
    const contentElement = event.target as HTMLElement;
    const contentScrollHeight = contentElement.scrollHeight;
    const contentHeight = contentElement.clientHeight;
    console.debug(`Content height: ${contentHeight}px, scroll height: ${contentScrollHeight}px`);

    const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
    const neededRows = Math.ceil(contentScrollHeight / rowHeight + 1.5); // Add 0.5 row buffer
    console.debug(`Content needs ${neededRows} rows`);
    this.changeSpans(this.component.colSpan, neededRows + 1, false);
  }

  /**
   * Handle content overflow by requesting more rows if needed
   */
  // private handleContentOverflow(contentHeight: number): void {
  //   // Skip if auto-size is disabled or if manually resized
  //   if (!this.component.enableAutoSize ||
  //     (this.component.isManuallyResized && !this.component.autoSizeEnabled)) {
  //     return;
  //   }

  //   // Calculate how many rows are needed for this content with buffer
  //   const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
  //   const neededRows = Math.ceil(contentHeight / rowHeight + 0.5); // Add 0.5 row buffer

  //   // Get appropriate row span from resize tracker
  //   const newRowSpan = this.component.resizeTracker.getExpandedRowSpan(neededRows);

  //   // Only resize if different from current - be more aggressive with expansion
  //   if (newRowSpan > this.component.rowSpan) {
  //     console.debug(`Widget ${this.component.widgetId} content overflow detected. ` +
  //       `Content height: ${contentHeight}px. Expanding from ${this.component.rowSpan} to ${newRowSpan + 1} rows.`);

  //     // Add one extra row to prevent edge case scrollbars
  //     this.changeSpans(this.component.colSpan, newRowSpan + 1, false);
  //   }
  // }

  /**
   * Handle content shrink events from widgets
   */
  // handleContentShrink(event: Event): void {
  //   return
  //   const customEvent = event as CustomEvent;
  //   const { newContentHeight, rowsNeeded } = customEvent.detail;

  //   console.debug(`Widget ${this.component.widgetId} received content shrink notification: ${newContentHeight}px (${rowsNeeded} rows needed)`);

  //   // Skip if auto-size is disabled
  //   if (!this.component.autoSizeEnabled) {
  //     console.debug(`Widget ${this.component.widgetId} ignoring content shrink - auto-size disabled`);
  //     return;
  //   }

  //   // If we got rows needed directly from the event, use that
  //   // Otherwise calculate based on height
  //   let neededRows = rowsNeeded;
  //   if (!neededRows) {
  //     const rowHeight = MIN_ROW_HEIGHT + DEFAULT_GRID_GAP;
  //     neededRows = Math.max(Math.ceil(newContentHeight / rowHeight), this.component.minRowSpan);
  //   }

  //   // Add larger buffer to avoid aggressive shrinking (20% instead of 10%)
  //   const targetRows = Math.ceil(neededRows * 1.2);

  //   // Ensure we don't shrink below the minimum
  //   const newRowSpan = Math.max(targetRows, this.component.minRowSpan);

  //   console.debug(`Widget ${this.component.widgetId} content shrink calculation:
  //     Content height: ${newContentHeight}px
  //     Content needs ${rowsNeeded} rows
  //     Current row span: ${this.component.rowSpan}
  //     Target row span: ${newRowSpan}`);

  //   // Only shrink if new size is significantly smaller (at least 20%)
  //   if (newRowSpan < this.component.rowSpan * 0.8) {
  //     console.debug(`Widget ${this.component.widgetId} shrinking from ${this.component.rowSpan} to ${newRowSpan} rows`);

  //     // Set the size lock
  //     this.sizeLockActive = true;
  //     this.sizeLockTargetRows = newRowSpan;

  //     // Clear any existing size lock timeout
  //     if (this.sizeLockTimeoutId !== null) {
  //       window.clearTimeout(this.sizeLockTimeoutId);
  //     }

  //     // Force immediate DOM update using direct manipulation
  //     this.updateRowSpanClasses(newRowSpan);
  //     this.changeSpans(this.component.colSpan, newRowSpan, false, true);
  //     this.updateParentGridClasses(this.component.colSpan, newRowSpan);

  //     // Use requestAnimationFrame for reliable DOM updates
  //     requestAnimationFrame(() => {
  //       // Force reflow to ensure DOM is updated
  //       void document.body.offsetHeight;

  //       // Find and notify parent grid-layout that it needs to update
  //       this.triggerGridLayoutUpdate();

  //       // Release size lock after a short delay
  //       this.sizeLockTimeoutId = window.setTimeout(() => {
  //         console.debug(`Widget ${this.component.widgetId}: Size lock released after shrink operation`);
  //         this.sizeLockActive = false;
  //         this.sizeLockTimeoutId = null;
  //       }, 200); // Short timeout to prevent oscillation
  //     });
  //   } else {
  //     console.debug(`Widget ${this.component.widgetId} NOT shrinking - difference not significant enough`);
  //   }

  //   // Stop propagation since we've handled it
  //   event.stopPropagation();
  // }

  /**
   * Block resize events temporarily to prevent oscillation
   */
  blockResizeEvents(duration: number = 500): void {
    // Set flag to block resize events
    this.resizeBlockActive = true;
    console.debug(`Widget ${this.component.widgetId}: Blocking resize events for ${duration}ms to prevent oscillation`);

    // Clear any existing timeout
    if (this.resizeBlockTimeoutId !== null) {
      window.clearTimeout(this.resizeBlockTimeoutId);
    }

    // Set timeout to unblock after specified duration
    this.resizeBlockTimeoutId = window.setTimeout(() => {
      this.resizeBlockActive = false;
      this.resizeBlockTimeoutId = null;
      console.debug(`Widget ${this.component.widgetId}: Resize events unblocked`);
    }, duration);
  }

  /**
   * Trigger parent grid-layout to update its layout
   */
  private triggerGridLayoutUpdate(): void {
    // Find parent grid-layout
    const gridLayout = this.component.closest('grid-layout');
    if (gridLayout) {
      console.debug(`Triggering layout update on parent grid-layout`);

      // Try to call updateLayout if it exists
      if (typeof (gridLayout as any).updateLayout === 'function') {
        (gridLayout as any).updateLayout();
      }

      // Also dispatch a resize event that the grid might be listening for
      const resizeEvent = new CustomEvent('grid-item-resize', {
        bubbles: true,
        composed: true,
        detail: {
          widgetId: this.component.widgetId,
          rowSpan: this.component.rowSpan,
          colSpan: this.component.colSpan
        }
      });

      this.component.dispatchEvent(resizeEvent);
    }
  }

  /**
   * Update row-span classes directly to ensure DOM is updated
   */
  private updateRowSpanClasses(rowSpan: number): void {
    // Remove all existing row-span classes
    for (let i = 1; i <= MAX_GRID_ROWS; i++) {
      this.component.classList.remove(`row-span-${i}`);
    }

    // Add the new row span class
    this.component.classList.add(`row-span-${rowSpan}`);

    // Also update any parent grid item if we're in a grid
    const parentElement = this.component.parentElement;
    if (parentElement) {
      for (let i = 1; i <= MAX_GRID_ROWS; i++) {
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
    const gridItemParent = this.component.parentElement;
    // const gridContainer = this.component.closest('.grid-container') || this.component.closest('grid-layout');

    // Update immediate parent (usually grid-item)
    if (gridItemParent) {
      // Apply classes
      for (let i = 1; i <= MAX_GRID_COLUMNS; i++) {
        gridItemParent.classList.remove(`col-span-${i}`);
      }
      gridItemParent.classList.add(`col-span-${colSpan}`);

      for (let i = 1; i <= MAX_GRID_ROWS; i++) {
        gridItemParent.classList.remove(`row-span-${i}`);
      }
      gridItemParent.classList.add(`row-span-${rowSpan}`);

      // Apply inline styles for immediate visual feedback
      gridItemParent.style.gridColumn = `span ${colSpan}`;
      gridItemParent.style.gridRow = `span ${rowSpan}`;
    }

    console.debug(`Direct grid update: ${colSpan}x${rowSpan} applied to DOM`);
  }

  /**
   * Toggle auto-sizing behavior
   */
  // toggleAutoSize(): void {
  //   // Toggle the state
  //   this.component.autoSizeEnabled = !this.component.autoSizeEnabled;
  //   console.debug(`Widget ${this.component.widgetId} auto-size ${this.component.autoSizeEnabled ? 'enabled' : 'disabled'}`);

  //   if (this.component.autoSizeEnabled) {
  //     // Reset user resize preference
  //     this.component.isManuallyResized = false;
  //     this.component.resizeTracker.resetUserPreference();

  //     // Notify contained widget
  //     const widgetElement = this.component.querySelector('[class*="widget"]');
  //     if (widgetElement && typeof (widgetElement as any).resetUserResizePreference === 'function') {
  //       (widgetElement as any).resetUserResizePreference();
  //     }

  //     // Check if we need to resize based on current content
  //     this.setupContentResizeObserver();
  //   } else {
  //     // When auto-size is disabled, mark as manually sized to prevent auto-expansion
  //     this.component.isManuallyResized = true;

  //     // Disconnect resize observer when auto-sizing is disabled
  //     if (this.component.contentResizeObserver) {
  //       this.component.contentResizeObserver.disconnect();
  //       this.component.contentResizeObserver = null;
  //     }
  //   }
  // }
}