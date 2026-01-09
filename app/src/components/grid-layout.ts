import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { repositoryService } from "../services/repository-service";
import { SettingsRepository } from "../repositories/settings-repository";
import { getWidgetColumnSpan, getWidgetRowSpan } from "../widgets/widget-registry";
import {
  MAX_GRID_COLUMNS,
  MAX_GRID_ROWS,
  MIN_COLUMN_WIDTH,
  MIN_ROW_HEIGHT,
  DEFAULT_GRID_GAP
} from "../constants/grid-constants";
import { dragDropService } from "../services/drag-drop-service";

/**
 * A responsive grid layout component that arranges items in a grid
 * based on their preferred column and row spans.
 */
const template = html<GridLayout>/*html*/`
  <div class="grid-container ${x => x.isDragOver ? 'drag-over' : ''}" 
       style="${x => x.gridStyle}"
       @dragover="${(x, c) => x.handleDragOver(c.event as DragEvent)}"
       @dragleave="${(x, c) => x.handleDragLeave(c.event as DragEvent)}"
       @drop="${(x, c) => x.handleDrop(c.event as DragEvent)}">
    <slot></slot>
    <div class="drop-indicator" style="${x => x.dropIndicatorStyle}"></div>
  </div>
`;

// Generate dynamic CSS for column and row spans based on constants
const generateSpanStyles = () => {
  let styles = '';

  // Generate column-span classes
  for (let i = 1; i <= MAX_GRID_COLUMNS; i++) {
    styles += `
    ::slotted(.col-span-${i}) {
      grid-column: span ${i};
    }
    `;
  }

  // Generate row-span classes - ensure we generate all 30 rows
  for (let i = 1; i <= MAX_GRID_ROWS; i++) {
    styles += `
    ::slotted(.row-span-${i}) {
      grid-row: span ${i};
      height: calc(${i} * var(--row-height, 30px) + (${i - 1}) * var(--grid-gap, 8px));
      overflow: auto;
    }
    `;
  }

  // Log to verify all rows are generated when the component loads
  console.debug(`Generated span styles for ${MAX_GRID_ROWS} rows`);

  return styles;
};

const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }
  
.grid-container {
    display: grid;
    grid-template-columns: var(--grid-template-columns);
    grid-auto-rows: var(--row-height, 30px);
    gap: var(--grid-gap, 0.5rem);
    width: 100%;
    min-height: 100%;
    align-items: start;
    align-content: start;
    position: relative;
  }
  
  /* Drag over state */
  .grid-container.drag-over {
    background-color: rgba(0, 120, 212, 0.05);
    outline: 2px dashed rgba(0, 120, 212, 0.3);
    outline-offset: -2px;
  }
  
  /* Drop indicator styling is inline but we can add transitions here */
  .drop-indicator {
    transition: all 0.15s ease-out;
  }
  
  /* Widget being dragged */
  ::slotted(.widget-dragging) {
    opacity: 0.5;
    z-index: 1000;
    /* Note: Do NOT use pointer-events: none here - it cancels the HTML5 drag operation */
  }
  
  /* Smooth transitions for widgets during live shuffle */
  ::slotted(.shuffle-transition) {
    transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  }
  
  /* Dynamically generate span classes */
  ${generateSpanStyles()}
  
  /* When row is set explicitly by user, give it a minimum height but no maximum */
  ::slotted(.row-span-${i => i}.row-constrained) {
    min-height: calc(${i => i} * var(--row-height, 30px) + (${i => i - 1}) * var(--grid-gap, 8px));
  }
  
  /* When content is larger than container, ensure scrollbars appear */
  ::slotted(.overflow) {
    overflow: auto !important;
  }
  
  /* Modified rule for full-width widgets - removed !important to allow overrides */
  ::slotted(.widget-full-width) {
    grid-column: 1 / -1; /* Removed !important to allow span classes to override */
  }
  
  /* Ensure .col-span-* classes override the full-width class */
  ::slotted(.col-span-1) { grid-column: span 1 !important; }
  ::slotted(.col-span-2) { grid-column: span 2 !important; }
  ::slotted(.col-span-3) { grid-column: span 3 !important; }
  ::slotted(.col-span-4) { grid-column: span 4 !important; }
  
  /* For auto-height (default) */
  ::slotted(.row-auto) {
    grid-row: auto;
    height: auto;
    max-height: none;
  }
  
  /* Ensure consistent sizing - crucial for fixed-size grid cells */
  ::slotted(*) {
    box-sizing: border-box;
    overflow: auto; /* Changed from visible to auto to ensure scrollbars appear when needed */
    height: auto; /* Still auto-size to fit content */
    min-height: 100%; /* Fill the grid cell */
    max-height: 100%; /* Don't exceed grid cell height */
    display: flex;
    flex-direction: column;
  }
  
  /* Improved responsive breakpoints to prevent horizontal scrollbars */
  /* First breakpoint for medium screens */
  // @media (max-width: 960px) {
  //   ::slotted([class*="col-span-"]) {
  //     grid-column: span min(var(--current-col-span, 1), 6);
  //   }
  // }
  
  // /* Second breakpoint for smaller screens but before sidebar collapse */
  // @media (max-width: 800px) {
  //   ::slotted([class*="col-span-"]) {
  //     grid-column: span min(var(--current-col-span, 1), 4);
  //   }
  // }
  
  // /* Critical breakpoint for mobile - force full width widgets with 2 column max grid */
  // @media (max-width: 750px) {
  //   ::slotted([class*="col-span-"]) {
  //     grid-column: 1 / -1 !important; /* Force full width regardless of specified col-span */
  //   }
  // }
  
  // /* Smallest screens - ensure single column layout */
  // @media (max-width: 500px) {
  //   ::slotted(*) {
  //     grid-column: 1 / -1 !important;
  //   }
  // }
`;

// Legacy size mapping to new column spans
// for backward compatibility
export type GridItemSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeToSpanMap: Record<GridItemSize, number> = {
  'sm': 4,
  'md': 8,
  'lg': 12,
  'xl': 16
};

// Define grid item metadata with row and column spans
export interface GridItemMetadata {
  id: string;
  minWidth?: number;
  colSpan?: number;
  rowSpan?: number;
  fullWidth?: boolean;
  userResized?: boolean; // Whether the widget was manually resized by the user
}


@customElement({
  name: "grid-layout",
  template,
  styles
})
export class GridLayout extends FASTElement {
  @attr({ attribute: "min-column-width" }) minColumnWidth = MIN_COLUMN_WIDTH;
  @attr({ attribute: "min-row-height" }) minRowHeight = MIN_ROW_HEIGHT;
  @attr({ attribute: "grid-gap" }) gridGap = DEFAULT_GRID_GAP;
  @attr({ attribute: "data-page" }) dataPage = '';
  @attr({ attribute: "columns" }) totalColumns = MAX_GRID_COLUMNS;
  @attr({ attribute: "rows" }) totalRows = MAX_GRID_ROWS; // This should now be 30
  @observable gridStyle = '';

  // Drag and drop state
  @observable isDragOver = false;
  @observable dropIndicatorStyle = 'display: none;';
  private draggedWidgetId: string | null = null;
  private dragServiceUnsubscribe: (() => void) | null = null;
  private boundDocumentDragOver: ((e: DragEvent) => void) | null = null;
  private boundDocumentDrop: ((e: DragEvent) => void) | null = null;
  private boundDocumentDragEnd: ((e: DragEvent) => void) | null = null;
  
  // Live shuffle state
  private originalWidgetOrder: string[] = [];
  private draggedElement: HTMLElement | null = null;
  private lastShuffleIndex: number = -1;
  private shuffleThrottleTimer: number | null = null;
  private isShuffling: boolean = false;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;

  private settingsRepository: SettingsRepository;

  // Maps item IDs to their metadata
  private itemMetadata = new Map<string, GridItemMetadata>();
  // private resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();
    this.settingsRepository = repositoryService.getSettingsRepository();
  }

  connectedCallback(): void {
    super.connectedCallback();

    // Add debug logging to confirm totalRows is set correctly
    console.debug(`GridLayout: initializing with ${this.totalColumns} columns and ${this.totalRows} rows`);

    // If rows attribute wasn't specified, ensure it's explicitly set to MAX_GRID_ROWS
    if (!this.hasAttribute('rows')) {
      this.totalRows = MAX_GRID_ROWS;
      console.debug(`GridLayout: setting totalRows to MAX_GRID_ROWS (${MAX_GRID_ROWS})`);
    }

    // Set custom CSS properties for row height
    this.style.setProperty('--min-row-height', `${this.minRowHeight}px`);
    this.style.setProperty('--grid-gap', `${this.gridGap}px`);

    // Create a ResizeObserver to handle container resize events
    // this.resizeObserver = new ResizeObserver(entries => {
    //   this.updateGridStyle();
    // });

    // Start observing the container
    // this.resizeObserver.observe(this);

    // Initialize grid style with default settings
    this.updateGridStyle();

    // Listen for widget size change events - improved listeners with explicit callbacks
    // this.addEventListener('widget-size-change', this.handleWidgetSizeChange);
    this.addEventListener('widget-spans-change', (e) => {
      console.debug(`GridLayout: Received widget-spans-change event`, (e as CustomEvent).detail);
      this.handleWidgetSpansChange(e);
    });
    
    // Listen for drag events on the host element to capture events from slotted content
    this.addEventListener('dragover', this.handleDragOver.bind(this));
    this.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.addEventListener('drop', this.handleDrop.bind(this));
    
    // Subscribe to drag service to add/remove document-level listeners during drag
    this.dragServiceUnsubscribe = dragDropService.subscribe((state) => {
      console.info(`GridLayout: drag state change - isDragging=${state.isDragging}, operation=${state.operation}, gridElement match=${state.gridElement === this}`);
      if (state.isDragging && state.operation === 'move' && state.gridElement === this) {
        this.attachDocumentDragListeners();
        this.startLiveShuffle(state.widgetId, state.element);
      } else if (!state.isDragging) {
        this.detachDocumentDragListeners();
        this.endLiveShuffle(false); // false = don't revert, keep current order
      }
    });

    console.debug("GridLayout connected, metadata size:", this.itemMetadata.size);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up the ResizeObserver
    // if (this.resizeObserver) {
    //   this.resizeObserver.disconnect();
    //   this.resizeObserver = null;
    // }

    // Remove event listeners
    // this.removeEventListener('widget-size-change', this.handleWidgetSizeChange);
    this.removeEventListener('widget-spans-change', this.handleWidgetSpansChange);
    this.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    this.removeEventListener('drop', this.handleDrop.bind(this));
    
    // Clean up drag service subscription and document listeners
    if (this.dragServiceUnsubscribe) {
      this.dragServiceUnsubscribe();
      this.dragServiceUnsubscribe = null;
    }
    this.detachDocumentDragListeners();
  }

  /**
   * Attach document-level drag listeners during active drag operations.
   * This ensures drag events are captured even when hovering over slotted widgets.
   */
  private attachDocumentDragListeners(): void {
    if (this.boundDocumentDragOver) return; // Already attached
    
    this.boundDocumentDragOver = (e: DragEvent) => this.handleDocumentDragOver(e);
    this.boundDocumentDrop = (e: DragEvent) => this.handleDocumentDrop(e);
    this.boundDocumentDragEnd = (e: DragEvent) => this.handleDocumentDragEnd(e);
    this.boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    
    document.addEventListener('dragover', this.boundDocumentDragOver);
    document.addEventListener('drop', this.boundDocumentDrop);
    document.addEventListener('dragend', this.boundDocumentDragEnd);
    document.addEventListener('keydown', this.boundKeyDown);
    
    console.debug('GridLayout: Attached document-level drag listeners');
  }

  /**
   * Detach document-level drag listeners when drag operation ends.
   */
  private detachDocumentDragListeners(): void {
    if (this.boundDocumentDragOver) {
      document.removeEventListener('dragover', this.boundDocumentDragOver);
      this.boundDocumentDragOver = null;
    }
    if (this.boundDocumentDrop) {
      document.removeEventListener('drop', this.boundDocumentDrop);
      this.boundDocumentDrop = null;
    }
    if (this.boundDocumentDragEnd) {
      document.removeEventListener('dragend', this.boundDocumentDragEnd);
      this.boundDocumentDragEnd = null;
    }
    if (this.boundKeyDown) {
      document.removeEventListener('keydown', this.boundKeyDown);
      this.boundKeyDown = null;
    }
    
    // Also reset drag state
    this.isDragOver = false;
    this.dropIndicatorStyle = 'display: none;';
  }

  /**
   * Handle keydown events during drag (ESC to cancel)
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isShuffling) {
      console.debug('GridLayout: ESC pressed, cancelling drag');
      this.handleDragCancel();
    }
  }

  /**
   * Handle dragover at document level - forwards to grid if over this grid
   */
  private handleDocumentDragOver(event: DragEvent): void {
    // Check if the event is within our grid bounds
    const rect = this.getBoundingClientRect();
    const isOverGrid = 
      event.clientX >= rect.left && 
      event.clientX <= rect.right && 
      event.clientY >= rect.top && 
      event.clientY <= rect.bottom;
    

    
    if (isOverGrid) {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      
      this.isDragOver = true;
      
      // Calculate drop position and show indicator
      const gridContainer = this.shadowRoot?.querySelector('.grid-container') as HTMLElement;
      if (gridContainer) {
        const { col, row } = this.pixelToGridCell(event.clientX, event.clientY, gridContainer);
        this.updateDropIndicator(col, row);
        console.info(`GridLayout: (document) drop indicator at col=${col}, row=${row}`);
      }
    } else {
      this.isDragOver = false;
      this.dropIndicatorStyle = 'display: none;';
    }
  }

  /**
   * Handle drop at document level - forwards to grid if over this grid
   */
  private handleDocumentDrop(event: DragEvent): void {
    // Check if the event is within our grid bounds
    const rect = this.getBoundingClientRect();
    const isOverGrid = 
      event.clientX >= rect.left && 
      event.clientX <= rect.right && 
      event.clientY >= rect.top && 
      event.clientY <= rect.bottom;
    
    if (isOverGrid) {
      event.preventDefault();
      event.stopPropagation();
      this.handleDrop(event);
    }
  }

  /**
   * Handle dragend at document level - clean up state
   */
  private handleDocumentDragEnd(event: DragEvent): void {
    console.info('GridLayout: (document) dragend received');
    this.detachDocumentDragListeners();
  }

  /**
   * Handle widget spans change events from widget-wrapper components
   */
  private handleWidgetSpansChange = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { widgetId, colSpan, rowSpan, isUserResized, pageType, source, preserveRowSpan } = customEvent.detail;

    console.debug(`GridLayout: Processing spans change for ${widgetId}: ${colSpan}x${rowSpan}, user=${isUserResized}, pageType=${pageType}, source=${source || 'unknown'}, preserveRowSpan=${preserveRowSpan}`);

    // Update the item metadata without needing to find the element
    const metadata = this.itemMetadata.get(widgetId);
    if (metadata) {
      // If preserveRowSpan flag is set, keep the current rowSpan value from metadata
      const finalRowSpan = preserveRowSpan ? metadata.rowSpan || rowSpan : rowSpan;

      console.debug(`GridLayout: Updating metadata for ${widgetId} from ${metadata.colSpan}x${metadata.rowSpan} to ${colSpan}x${finalRowSpan}`);

      // Update metadata with new values
      metadata.colSpan = colSpan;
      metadata.rowSpan = finalRowSpan;
      metadata.userResized = isUserResized;

      // Find element directly by ID - this is more reliable
      const element = this.querySelector(`[data-grid-item-id="${widgetId}"]`);
      if (element && element instanceof HTMLElement) {
        console.debug(`GridLayout: Found element for ${widgetId}, updating spans`);
        // Only update what needs to be updated
        if (preserveRowSpan) {
          this.setItemColumnSpanOnly(element, colSpan);
        } else {
          this.setItemSpans(element, colSpan, finalRowSpan, isUserResized);
        }
      }

      // Update layout regardless of whether we found the element
      this.updateGridStyle();

      // Save to settings repository if this was a user-initiated change
      console.debug(`are we saving? ${isUserResized} ${pageType} ${widgetId}`);
      if (isUserResized && pageType && widgetId) {
        console.debug(`GridLayout: Saving ${widgetId} on ${pageType}: ${colSpan}x${finalRowSpan}`);
        this.saveSpansToSettings(pageType, widgetId, colSpan, finalRowSpan);
      } else if (isUserResized && !pageType) {
        console.warn(`GridLayout: Can't save ${widgetId} because pageType is missing!`);

        // Try to get pageType from nearest parent with data-page attribute
        const gridElement = this.closest('[data-page]');
        const fallbackPageType = gridElement?.getAttribute('data-page');
        if (fallbackPageType) {
          console.debug(`GridLayout: Using fallback pageType "${fallbackPageType}" for ${widgetId}`);
          this.saveSpansToSettings(fallbackPageType, widgetId, colSpan, finalRowSpan);
        }
      }
    } else {
      console.warn(`GridLayout: No metadata found for widget ${widgetId}`);
    }
  }

  /**
   * Save widget spans to settings repository
   */
  private saveSpansToSettings(pageType: string, widgetId: string, colSpan: number, rowSpan: number): void {
    try {
      console.debug(`GridLayout: Saving dimensions for ${widgetId} on ${pageType}: ${colSpan}x${rowSpan}`);
      this.settingsRepository.updateWidgetGridDimensions(pageType, widgetId, colSpan, rowSpan)
        .catch(err => console.error('Error saving widget dimensions:', err));
    } catch (error) {
      console.error('Error saving widget dimensions:', error);
    }
  }

  // /**
  //  * Save widget spans to settings repository
  //  */
  // private saveWidgetSpansToSettings(pageId: string, widgetId: string, colSpan: number, rowSpan: number, isUserResized: boolean): void {
  //   return; // Disable saving to settings for now
  // }

  /**
   * Handle legacy widget size change events (for backward compatibility)
   */
  // private handleWidgetSizeChange(event: Event): void {
  //   const customEvent = event as CustomEvent;
  //   const { widgetId, newSize } = customEvent.detail;

  //   console.debug(`GridLayout: Received legacy size change event for widget ${widgetId} to ${newSize}`);

  //   // Map legacy size to column spans
  //   const colSpan = sizeToSpanMap[newSize as GridItemSize] || 8;

  //   // Create a new spans change event and dispatch it
  //   const spansEvent = new CustomEvent('widget-spans-change', {
  //     bubbles: true,
  //     composed: true,
  //     detail: {
  //       widgetId,
  //       colSpan,
  //       rowSpan: 2, // Default to 2 rows for better proportions with the new smaller grid
  //       isUserResized: false
  //     }
  //   });

  //   this.dispatchEvent(spansEvent);
  // }

  /**
   * Add an item to the grid with its metadata
   */
  addItem(element: HTMLElement, metadata: GridItemMetadata): void {
    console.debug(`GridLayout: Adding item ${metadata.id} with metadata:`, metadata);

    // Store metadata
    this.itemMetadata.set(metadata.id, metadata);

    // Apply default spans based on metadata or registry
    this.applyDefaultSpans(element, metadata);

    // Add data attributes for size calculation and identification
    if (metadata.minWidth) {
      element.setAttribute('data-min-width', metadata.minWidth.toString());
    }

    element.setAttribute('data-grid-item-id', metadata.id);
    element.setAttribute('data-widget-id', metadata.id);
  }

  // /**
  //  * Try to load saved spans from settings
  //  */
  // private async loadSavedSpans(element: HTMLElement, metadata: GridItemMetadata): Promise<void> {
  //   return; // Disable loading from settings for now
  // }

  /**
   * Apply default spans to an element based on its metadata
   */
  private applyDefaultSpans(element: HTMLElement, metadata: GridItemMetadata): void {
    let colSpan = 8; // Default column span (half of 16)
    let rowSpan = 2; // Default row span

    // First priority: Use explicitly provided spans in metadata
    if (metadata.colSpan && metadata.rowSpan) {
      colSpan = metadata.colSpan;
      rowSpan = metadata.rowSpan;
      console.debug(`GridLayout: Using spans from metadata for ${metadata.id}: ${colSpan}x${rowSpan}`);
    }
    // Second priority: Get spans from widget registry
    else {
      const registryColSpan = getWidgetColumnSpan(metadata.id);
      const registryRowSpan = getWidgetRowSpan(metadata.id);

      if (registryColSpan && registryRowSpan) {
        colSpan = registryColSpan;
        rowSpan = registryRowSpan;

        // Update the metadata with registry values for future reference
        metadata.colSpan = colSpan;
        metadata.rowSpan = rowSpan;

        console.debug(`GridLayout: Using spans from registry for ${metadata.id}: ${colSpan}x${rowSpan}`);
      }
    }

    // Apply spans to the element
    this.setItemSpans(element, colSpan, rowSpan);

    // Update widget-wrapper spans
    const widgetWrapper = element.querySelector('widget-wrapper');
    if (widgetWrapper) {
      console.debug(`GridLayout: Updating widget-wrapper spans for ${metadata.id} to ${colSpan}x${rowSpan}`);
      (widgetWrapper as any).colSpan = colSpan;
      (widgetWrapper as any).rowSpan = rowSpan;
    }

    // Add full-width class if specified
    if (metadata.fullWidth) {
      element.classList.add('widget-full-width');
    }

    // Update layout
    this.updateGridStyle();
  }

  /**
   * Remove an item from the grid
   */
  removeItem(id: string): void {
    // Remove metadata
    this.itemMetadata.delete(id);

    // Update layout
    this.updateGridStyle();
  }

  /**
   * Update an item's spans
   */
  updateItemSpans(id: string, colSpan: number, rowSpan: number): void {
    const metadata = this.itemMetadata.get(id);
    if (!metadata) return;

    // Update metadata
    metadata.colSpan = colSpan;
    metadata.rowSpan = rowSpan;

    // Find the element and update its classes
    const element = this.querySelector(`[data-grid-item-id="${id}"]`) as HTMLElement;
    if (element) {
      this.setItemSpans(element, colSpan, rowSpan);

      // Also update the widget-wrapper's current spans if it exists
      const widgetWrapper = element.querySelector('widget-wrapper');
      if (widgetWrapper) {
        (widgetWrapper as any).colSpan = colSpan;
        (widgetWrapper as any).rowSpan = rowSpan;
      }
    }

    console.debug(`GridLayout: Updated spans for ${id} to ${colSpan}x${rowSpan}`);

    // Save to settings if we have a page ID
    if (this.dataPage) {
      // this.saveWidgetSpansToSettings(this.dataPage, id, colSpan, rowSpan);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  updateItemSize(id: string, size: GridItemSize): void {
    const colSpan = sizeToSpanMap[size] || 8;
    this.updateItemSpans(id, colSpan, 2); // Use 2 rows for legacy sizes
  }

  // /**
  //  * Get the maximum min-width from all items
  //  */
  // private getMaxMinWidth(): number {
  //   // For the fine-grained grid, we'll always use the minColumnWidth
  //   return this.minColumnWidth;
  // }

  /**
   * Handle drop event for widget move
   */
  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.isDragOver = false;
    this.dropIndicatorStyle = 'display: none;';

    // Try to get widget ID from dataTransfer or from service state
    let widgetId = event.dataTransfer?.getData('application/x-widget-id') || 
                   event.dataTransfer?.getData('text/plain');
    
    // Fallback to service state if dataTransfer is empty
    if (!widgetId) {
      const state = dragDropService.getState();
      widgetId = state.widgetId || undefined;
    }
    
    if (!widgetId) {
      console.debug('GridLayout: Drop event with no widget ID');
      return;
    }

    console.debug(`GridLayout: Dropped widget ${widgetId}`);

    // Find the widget element and clean up dragging state
    const widgetElement = this.querySelector(`[data-grid-item-id="${widgetId}"]`) as HTMLElement;
    if (!widgetElement) {
      console.warn(`GridLayout: Could not find widget element for ${widgetId}`);
      return;
    }
    
    // Clean up dragging classes
    widgetElement.classList.remove('widget-dragging');
    const widgetWrapper = widgetElement.querySelector('widget-wrapper');
    if (widgetWrapper) {
      widgetWrapper.classList.remove('widget-dragging');
    }

    // Live shuffle already moved the widget to its new position during dragover
    // No need to call reorderWidget here - just finalize

    // End drag operation in service (this will trigger endLiveShuffle via subscription)
    dragDropService.endDrag();

    // Calculate final position for the event
    const gridContainer = this.shadowRoot?.querySelector('.grid-container') as HTMLElement;
    if (gridContainer) {
      const { col, row } = this.pixelToGridCell(event.clientX, event.clientY, gridContainer);
      
      // Dispatch event for position change
      const moveEvent = new CustomEvent('widget-position-change', {
        bubbles: true,
        composed: true,
        detail: {
          widgetId,
          targetCol: col,
          targetRow: row,
          pageType: this.dataPage,
        }
      });
      this.dispatchEvent(moveEvent);
    }
  }

  /**
   * Update the grid CSS style using CSS custom properties
   */
  updateGridStyle(): void {
    const containerWidth = this.clientWidth;
    const columnCount = this.totalColumns;

    // Calculate available space after accounting for gaps
    const totalGapWidth = (columnCount - 1) * this.gridGap;
    const availableWidth = containerWidth - totalGapWidth;

    // Calculate how many columns can actually fit in the available width
    // while respecting the minimum column width
    let maxPossibleColumns = Math.floor((containerWidth - this.gridGap) / (this.minColumnWidth + this.gridGap)) + 1;
    
    // Ensure at least 1 column and at most the configured total columns
    maxPossibleColumns = Math.max(1, Math.min(maxPossibleColumns, columnCount));
    
    // Apply progressive reduction for smaller screens
    let adjustedColumnCount = maxPossibleColumns;
    
    // For very small screens, we might want to force specific layouts
    if (containerWidth < 500) {
      adjustedColumnCount = 1; // Force single column for very small devices
    } 
    // else if (containerWidth < 750) {
    //   // For small screens, cap at 2 columns regardless of calculation
    //   adjustedColumnCount = Math.min(adjustedColumnCount, 2);
    // }
    
    // Log why we're using this column count for debugging
    console.debug(`GridLayout: Container width ${containerWidth}px can fit ${maxPossibleColumns} columns at ${this.minColumnWidth}px min width with ${this.gridGap}px gaps`);
    console.debug(`GridLayout: Using ${adjustedColumnCount} columns (limited by ${columnCount} max configured columns)`);

    // Calculate column width (minimum is minColumnWidth)
    // const columnWidth = Math.max(
    //   this.minColumnWidth,
    //   Math.floor((availableWidth - (adjustedColumnCount - 1) * this.gridGap) / adjustedColumnCount)
    // );
    const columnWidth = this.minColumnWidth;

    // Set a fixed row height that doesn't change based on content
    const rowHeight = this.minRowHeight;

    // Set CSS custom properties instead of inline style string
    this.style.setProperty('--grid-template-columns',
      `repeat(${adjustedColumnCount}, minmax(${columnWidth}px, 1fr))`);
    this.style.setProperty('--row-height', `${rowHeight}px`);
    this.style.setProperty('--grid-gap', `${this.gridGap}px`);
    this.style.setProperty('--total-rows', `${this.totalRows}`);

    console.debug(`GridLayout: Using fixed grid with ${adjustedColumnCount} columns (${columnWidth}px) and rows (${rowHeight}px)`);
  }

  /**
   * Set an item's column and row span classes
   */
  private setItemSpans(item: HTMLElement | null, colSpan: number, rowSpan: number, isUserResized: boolean = false): void {
    // If no element was found, just update layout
    if (!item) {
      console.warn(`GridLayout: Element not found for spans ${colSpan}x${rowSpan}`);
      return;
    }

    // Enforce minimum and maximum spans, but log if we're clamping
    const originalColSpan = colSpan;
    const originalRowSpan = rowSpan;

    colSpan = Math.max(1, Math.min(colSpan, this.totalColumns));
    rowSpan = Math.max(1, Math.min(rowSpan, this.totalRows));

    // Add debug logging if we're clamping 
    if (colSpan !== originalColSpan || rowSpan !== originalRowSpan) {
      console.debug(`GridLayout: Clamping spans - original: ${originalColSpan}x${originalRowSpan}, clamped: ${colSpan}x${rowSpan}, limits: ${this.totalColumns}x${this.totalRows}`);
    }

    // Add debug logging to track span changes
    const id = item.getAttribute('data-grid-item-id') || 'unknown';
    console.debug(`GridLayout: Setting spans for ${id}: ${colSpan}x${rowSpan}`);

    // Remove existing span classes
    for (let i = 1; i <= MAX_GRID_COLUMNS; i++) {
      item.classList.remove(`col-span-${i}`);
    }

    for (let i = 1; i <= MAX_GRID_ROWS; i++) {
      item.classList.remove(`row-span-${i}`);
    }

    // Add the new span classes
    item.classList.add(`col-span-${colSpan}`);
    item.classList.add(`row-span-${rowSpan}`);

    // Toggle the constrained class based on whether user has manually resized
    item.classList.toggle('row-constrained', isUserResized);
    item.classList.remove('row-auto');

    // Set custom property for responsive adjustments
    item.style.setProperty('--current-col-span', colSpan.toString());
    item.style.setProperty('--current-row-span', rowSpan.toString());

    console.debug(`GridLayout: Set item ${id} to spans ${colSpan}x${rowSpan}, constrained: ${isUserResized}`);
  }

  /**
   * Set only the column span of an item, preserving its row span
   */
  private setItemColumnSpanOnly(item: HTMLElement, colSpan: number): void {
    if (!item) return;

    // Enforce column span limits
    colSpan = Math.max(1, Math.min(colSpan, this.totalColumns));

    // Get the current row span from classes
    const rowSpanClass = Array.from(item.classList)
      .find(cls => cls.startsWith('row-span-'));

    // Remove existing column span classes
    for (let i = 1; i <= MAX_GRID_COLUMNS; i++) {
      item.classList.remove(`col-span-${i}`);
    }

    // Add the new column span class
    item.classList.add(`col-span-${colSpan}`);

    // Set custom property for responsive adjustments
    item.style.setProperty('--current-col-span', colSpan.toString());

    // Debug info
    const id = item.getAttribute('data-grid-item-id') || 'unknown';
    const currentRowSpan = rowSpanClass ?
      parseInt(rowSpanClass.replace('row-span-', '')) :
      "preserved";

console.debug(`GridLayout: Set item ${id} column span to ${colSpan}, preserved row span ${currentRowSpan}`);
  }

  // ================== DRAG AND DROP HANDLERS ==================

  /**
   * Handle dragover event for widget move
   */
  handleDragOver(event: DragEvent): void {
    // Allow drop - check if we're currently dragging a widget via service
    // Note: dataTransfer.types may not include custom types during dragover in some browsers
    const state = dragDropService.getState();
    
    if (!state.isDragging || state.operation !== 'move') {
      // Also check dataTransfer as fallback
      if (!event.dataTransfer?.types.includes('text/plain')) {
        return;
      }
    }

    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.isDragOver = true;

    // Calculate drop position
    const gridContainer = this.shadowRoot?.querySelector('.grid-container') as HTMLElement;
    if (gridContainer) {
      const { col, row } = this.pixelToGridCell(event.clientX, event.clientY, gridContainer);
      
      // Perform live shuffle - widgets reorder in real-time
      this.performLiveShuffle(col, row);
      
      // Update drop indicator to show current position
      this.updateDropIndicator(col, row);
    }
  }

  /**
   * Handle dragleave event
   */
  handleDragLeave(event: DragEvent): void {
    // Only hide if actually leaving the grid (not entering a child)
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && this.contains(relatedTarget)) {
      return;
    }

    this.isDragOver = false;
    this.dropIndicatorStyle = 'display: none;';
  }

  /**
   * Reorder a widget to a new position in the grid
   * For CSS Grid, this means changing the order in the DOM or using explicit grid positions
   */
  private reorderWidget(widgetElement: HTMLElement, targetCol: number, targetRow: number): void {
    // Get all widget elements
    const widgets = Array.from(this.querySelectorAll('[data-grid-item-id]'));
    const currentIndex = widgets.indexOf(widgetElement);

    // Calculate target index based on grid position
    // This is a simplified approach - widgets flow left-to-right, top-to-bottom
    const targetIndex = this.calculateInsertIndex(targetCol, targetRow, widgetElement);

    if (targetIndex !== currentIndex && targetIndex >= 0) {
      // Get the target sibling BEFORE removing the element
      // Account for index shift when moving from higher to lower index
      let targetSibling: Element | null = null;
      
      if (targetIndex < widgets.length) {
        // If moving to a lower index (left/up), use the widget at targetIndex
        // If moving to a higher index (right/down), the index shifts after removal
        if (targetIndex < currentIndex) {
          targetSibling = widgets[targetIndex];
        } else {
          // When moving right/down, after removal indices shift down by 1
          // So we need targetIndex + 1 to get the correct position
          targetSibling = widgets[targetIndex + 1] || null;
        }
      }

      // Remove and reinsert at new position
      widgetElement.remove();

      if (targetSibling && targetSibling !== widgetElement) {
        targetSibling.before(widgetElement);
      } else {
        // Append to end
        this.appendChild(widgetElement);
      }

      console.debug(`GridLayout: Moved widget from index ${currentIndex} to ${targetIndex}`);
      this.updateGridStyle();
    }
  }

  /**
   * Calculate where to insert a widget based on target grid position
   */
  private calculateInsertIndex(targetCol: number, targetRow: number, excludeElement: HTMLElement): number {
    const widgets = Array.from(this.querySelectorAll('[data-grid-item-id]'));
    
    // For now, use a simple row-major order calculation
    // Each widget's "position" is approximated by its visual order
    const targetPosition = targetRow * this.totalColumns + targetCol;

    for (let i = 0; i < widgets.length; i++) {
      if (widgets[i] === excludeElement) continue;

      // Get the widget's approximate position from its bounding rect
      const rect = widgets[i].getBoundingClientRect();
      const gridRect = this.getBoundingClientRect();

      const relX = rect.left - gridRect.left;
      const relY = rect.top - gridRect.top;

      const widgetCol = Math.floor(relX / (this.minColumnWidth + this.gridGap));
      const widgetRow = Math.floor(relY / (this.minRowHeight + this.gridGap));
      const widgetPosition = widgetRow * this.totalColumns + widgetCol;

      if (widgetPosition > targetPosition) {
        return i;
      }
    }

    return widgets.length; // Append to end
  }

  /**
   * Update the drop indicator position
   */
  private updateDropIndicator(col: number, row: number): void {
    const cellWidth = this.minColumnWidth;
    const cellHeight = this.minRowHeight;
    const gap = this.gridGap;

    // Calculate position in pixels
    const left = col * (cellWidth + gap);
    const top = row * (cellHeight + gap);

    // Get the dragged widget's span for indicator size
    const state = dragDropService.getState();
    const colSpan = state.colSpan || 1;
    const rowSpan = state.rowSpan || 1;

    const width = colSpan * cellWidth + (colSpan - 1) * gap;
    const height = rowSpan * cellHeight + (rowSpan - 1) * gap;

    this.dropIndicatorStyle = `
      display: block;
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
      background-color: rgba(0, 120, 212, 0.2);
      border: 2px dashed rgba(0, 120, 212, 0.5);
      border-radius: 8px;
      pointer-events: none;
      z-index: 50;
      transition: all 0.15s ease-out;
    `;
  }

  /**
   * Convert pixel position to grid cell coordinates
   */
  private pixelToGridCell(x: number, y: number, gridElement: HTMLElement): { col: number; row: number } {
    const rect = gridElement.getBoundingClientRect();

    // Calculate relative position within grid
    const relX = x - rect.left;
    const relY = y - rect.top;

    // Convert to grid cells
    const cellWidthWithGap = this.minColumnWidth + this.gridGap;
    const cellHeightWithGap = this.minRowHeight + this.gridGap;

    const col = Math.max(0, Math.min(Math.floor(relX / cellWidthWithGap), this.totalColumns - 1));
    const row = Math.max(0, Math.floor(relY / cellHeightWithGap));

    return { col, row };
  }

  // ============================================
  // Live Shuffle Methods
  // ============================================

  /**
   * Start live shuffle mode - capture original order and prepare for live reordering
   */
  private startLiveShuffle(widgetId: string | null, element: HTMLElement | null): void {
    if (!widgetId || !element || this.isShuffling) return;

    // Capture original DOM order for potential revert
    const widgets = Array.from(this.querySelectorAll('[data-grid-item-id]'));
    this.originalWidgetOrder = widgets.map(w => (w as HTMLElement).dataset.gridItemId || '');
    this.draggedElement = element;
    this.draggedWidgetId = widgetId;
    this.lastShuffleIndex = widgets.indexOf(element);
    this.isShuffling = true;

    // Add transition class to all widgets for smooth movement
    widgets.forEach(w => {
      (w as HTMLElement).style.transition = 'transform 0.2s ease-out';
    });

    console.debug(`GridLayout: Started live shuffle for ${widgetId}, original order:`, this.originalWidgetOrder);
  }

  /**
   * End live shuffle mode - either keep current order or revert
   */
  private endLiveShuffle(revert: boolean): void {
    if (!this.isShuffling) return;

    // Clear throttle timer
    if (this.shuffleThrottleTimer !== null) {
      clearTimeout(this.shuffleThrottleTimer);
      this.shuffleThrottleTimer = null;
    }

    if (revert && this.originalWidgetOrder.length > 0) {
      // Revert to original order
      this.restoreOriginalOrder();
    }

    // Remove transition styles
    const widgets = this.querySelectorAll('[data-grid-item-id]');
    widgets.forEach(w => {
      (w as HTMLElement).style.transition = '';
    });

    // Reset state
    this.originalWidgetOrder = [];
    this.draggedElement = null;
    this.draggedWidgetId = null;
    this.lastShuffleIndex = -1;
    this.isShuffling = false;

    console.debug('GridLayout: Ended live shuffle');
  }

  /**
   * Restore widgets to their original order (on drag cancel)
   */
  private restoreOriginalOrder(): void {
    if (this.originalWidgetOrder.length === 0) return;

    console.debug('GridLayout: Restoring original widget order');

    // Get current widgets and reorder them according to original order
    for (let i = 0; i < this.originalWidgetOrder.length; i++) {
      const widgetId = this.originalWidgetOrder[i];
      const widget = this.querySelector(`[data-grid-item-id="${widgetId}"]`);
      if (widget) {
        this.appendChild(widget); // Move to end in correct order
      }
    }
  }

  /**
   * Perform live shuffle during drag - reorder widgets in real-time
   * Called from dragover handler
   */
  private performLiveShuffle(targetCol: number, targetRow: number): void {
    if (!this.isShuffling || !this.draggedElement) return;

    // Throttle shuffles to prevent jank (max once per 150ms)
    if (this.shuffleThrottleTimer !== null) return;

    // Find which widget we're hovering over based on mouse position
    const hoverTarget = this.findWidgetAtPosition(targetCol, targetRow);
    
    // If not hovering over a different widget, do nothing
    if (!hoverTarget || hoverTarget === this.draggedElement) return;

    // Get current widget order
    const widgets = Array.from(this.querySelectorAll('[data-grid-item-id]'));
    const draggedIndex = widgets.indexOf(this.draggedElement);
    const targetIndex = widgets.indexOf(hoverTarget);

    // Skip if indices are invalid or same
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;
    
    // Skip if this is the same shuffle we just did
    if (targetIndex === this.lastShuffleIndex) return;

    // Set throttle
    this.shuffleThrottleTimer = window.setTimeout(() => {
      this.shuffleThrottleTimer = null;
    }, 150);

    // Perform the swap: insert dragged element before or after target based on direction
    if (draggedIndex < targetIndex) {
      // Moving right/down - insert after target
      hoverTarget.after(this.draggedElement);
    } else {
      // Moving left/up - insert before target
      hoverTarget.before(this.draggedElement);
    }

    this.lastShuffleIndex = targetIndex;

    console.debug(`GridLayout: Live shuffle - moved from index ${draggedIndex} to ${targetIndex}`);
  }

  /**
   * Find which widget is at a given grid position
   */
  private findWidgetAtPosition(col: number, row: number): HTMLElement | null {
    const gridContainer = this.shadowRoot?.querySelector('.grid-container') as HTMLElement;
    if (!gridContainer) return null;

    const gridRect = gridContainer.getBoundingClientRect();
    const cellWidth = this.minColumnWidth + this.gridGap;
    const cellHeight = this.minRowHeight + this.gridGap;

    // Calculate pixel position of the target cell center
    const targetX = gridRect.left + col * cellWidth + cellWidth / 2;
    const targetY = gridRect.top + row * cellHeight + cellHeight / 2;

    // Find widget whose bounding rect contains this point
    const widgets = Array.from(this.querySelectorAll('[data-grid-item-id]')) as HTMLElement[];
    
    for (const widget of widgets) {
      if (widget === this.draggedElement) continue;
      
      const rect = widget.getBoundingClientRect();
      if (targetX >= rect.left && targetX <= rect.right &&
          targetY >= rect.top && targetY <= rect.bottom) {
        return widget;
      }
    }

    return null;
  }

  /**
   * Handle drag cancel (ESC key or drag outside grid)
   */
  private handleDragCancel(): void {
    if (this.isShuffling) {
      // Clean up dragging class from the dragged element
      if (this.draggedElement) {
        this.draggedElement.classList.remove('widget-dragging');
        const widgetWrapper = this.draggedElement.querySelector('widget-wrapper');
        if (widgetWrapper) {
          widgetWrapper.classList.remove('widget-dragging');
        }
      }
      
      this.endLiveShuffle(true); // true = revert to original order
      dragDropService.cancelDrag();
    }
  }
}