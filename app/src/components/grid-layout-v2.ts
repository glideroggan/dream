/**
 * Grid Layout V2
 * A clean, simplified grid layout component with explicit positioning.
 * Uses the centralized GridService for all calculations and state.
 */

import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { gridService, GridItemPosition } from "../services/grid-service";

// ============================================
// Template
// ============================================

const template = html<GridLayoutV2>/*html*/`
  <div 
    class="grid-container ${x => x.isDragOver ? 'drag-over' : ''}"
    @dragover="${(x, c) => x.handleDragOver(c.event as DragEvent)}"
    @dragleave="${(x, c) => x.handleDragLeave(c.event as DragEvent)}"
    @drop="${(x, c) => x.handleDrop(c.event as DragEvent)}"
  >
    <slot></slot>
    ${x => x.showDropIndicator ? html`
      <div 
        class="drop-indicator"
        style="
          grid-column: ${x => x.dropIndicatorCol} / span ${x => x.dropIndicatorColSpan};
          grid-row: ${x => x.dropIndicatorRow} / span ${x => x.dropIndicatorRowSpan};
        "
      ></div>
    ` : ''}
  </div>
`;

// ============================================
// Styles
// ============================================

const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  .grid-container {
    display: grid;
    grid-template-columns: repeat(24, minmax(40px, 1fr));
    grid-auto-rows: 30px;
    gap: 8px;
    width: 100%;
    min-height: 400px;
    position: relative;
    align-items: start;
    align-content: start;
  }
  
  /* Drag over state */
  .grid-container.drag-over {
    background-color: rgba(0, 120, 212, 0.05);
    outline: 2px dashed rgba(0, 120, 212, 0.3);
    outline-offset: -2px;
  }
  
  /* Drop indicator */
  .drop-indicator {
    background-color: rgba(0, 120, 212, 0.2);
    border: 2px dashed rgba(0, 120, 212, 0.5);
    border-radius: 4px;
    pointer-events: none;
    z-index: 100;
    transition: all 0.15s ease-out;
  }
  
  /* Widget being dragged */
  ::slotted(.widget-dragging) {
    opacity: 0.5;
    z-index: 1000;
  }
  
  /* Widget being pushed/moved */
  ::slotted(.widget-moving) {
    transition: grid-row 0.2s ease-out, grid-column 0.2s ease-out;
  }
`;

// ============================================
// Component
// ============================================

@customElement({
  name: "grid-layout-v2",
  template,
  styles,
})
export class GridLayoutV2 extends FASTElement {
  // ============================================
  // Attributes
  // ============================================
  
  @attr({ attribute: 'page-type' }) pageType: string = '';
  
  // ============================================
  // Observable State
  // ============================================
  
  @observable isDragOver: boolean = false;
  @observable showDropIndicator: boolean = false;
  @observable dropIndicatorCol: number = 1;
  @observable dropIndicatorRow: number = 1;
  @observable dropIndicatorColSpan: number = 1;
  @observable dropIndicatorRowSpan: number = 1;
  
  /** Preview positions during drag/resize */
  @observable previewPositions: GridItemPosition[] = [];
  
  // ============================================
  // Private State
  // ============================================
  
  private gridContainer: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private slotChangeObserver: MutationObserver | null = null;
  
  // ============================================
  // Lifecycle
  // ============================================
  
  connectedCallback(): void {
    super.connectedCallback();
    
    // Get grid container from shadow DOM
    this.gridContainer = this.shadowRoot?.querySelector('.grid-container') as HTMLElement;
    
    // Subscribe to grid service updates
    this.unsubscribe = gridService.subscribe(this.handlePositionsChanged.bind(this));
    
    // Initialize items from slotted content
    this.initializeFromSlot();
    
    // Watch for slot changes
    const slot = this.shadowRoot?.querySelector('slot');
    if (slot) {
      slot.addEventListener('slotchange', this.handleSlotChange.bind(this));
    }
    
    console.debug(`GridLayoutV2: Connected for page ${this.pageType}`);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    if (this.slotChangeObserver) {
      this.slotChangeObserver.disconnect();
      this.slotChangeObserver = null;
    }
  }
  
  // ============================================
  // Initialization
  // ============================================
  
  /**
   * Initialize grid items from slotted content
   */
  private initializeFromSlot(): void {
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    
    if (!elements || elements.length === 0) {
      console.debug('GridLayoutV2: No slotted elements found');
      return;
    }
    
    // Clear existing items in service
    gridService.clear();
    
    for (const element of elements) {
      const widgetId = element.getAttribute('data-widget-id') || element.getAttribute('widget-id');
      if (!widgetId) continue;
      
      // Get position from attributes or defaults
      const col = parseInt(element.getAttribute('grid-col') || '0', 10);
      const row = parseInt(element.getAttribute('grid-row') || '0', 10);
      const colSpan = parseInt(element.getAttribute('col-span') || '8', 10);
      const rowSpan = parseInt(element.getAttribute('row-span') || '4', 10);
      
      // If no explicit position, find one
      let position: GridItemPosition;
      if (col > 0 && row > 0) {
        position = { id: widgetId, col, row, colSpan, rowSpan };
      } else {
        const { col: newCol, row: newRow } = gridService.findNextAvailablePosition(colSpan, rowSpan);
        position = { id: widgetId, col: newCol, row: newRow, colSpan, rowSpan };
      }
      
      // Register with service
      gridService.addItem(position);
      
      // Apply position to element
      this.applyPositionToElement(element, position);
    }
    
    console.debug(`GridLayoutV2: Initialized ${elements.length} items`);
  }
  
  /**
   * Handle slot content changes
   */
  private handleSlotChange(): void {
    // Re-check for new items that aren't registered
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    
    for (const element of elements) {
      const widgetId = element.getAttribute('data-widget-id') || element.getAttribute('widget-id');
      if (!widgetId) continue;
      
      // Check if already registered
      if (gridService.getPosition(widgetId)) {
        continue;
      }
      
      // Get position from attributes (may be persisted) or defaults
      const col = parseInt(element.getAttribute('grid-col') || '0', 10);
      const row = parseInt(element.getAttribute('grid-row') || '0', 10);
      const colSpan = parseInt(element.getAttribute('col-span') || '8', 10);
      const rowSpan = parseInt(element.getAttribute('row-span') || '4', 10);
      
      // If no explicit position, find one
      let position: GridItemPosition;
      if (col > 0 && row > 0) {
        position = { id: widgetId, col, row, colSpan, rowSpan };
      } else {
        const { col: newCol, row: newRow } = gridService.findNextAvailablePosition(colSpan, rowSpan);
        position = { id: widgetId, col: newCol, row: newRow, colSpan, rowSpan };
      }
      
      gridService.addItem(position);
      this.applyPositionToElement(element, position);
      
      console.debug(`GridLayoutV2: Added new item ${widgetId} at (${position.col}, ${position.row})`);
    }
  }
  
  // ============================================
  // Position Management
  // ============================================
  
  /**
   * Apply a position to a DOM element
   */
  private applyPositionToElement(element: HTMLElement, position: GridItemPosition): void {
    element.style.gridColumn = `${position.col} / span ${position.colSpan}`;
    element.style.gridRow = `${position.row} / span ${position.rowSpan}`;
  }
  
  /**
   * Handle position changes from grid service
   */
  private handlePositionsChanged(positions: GridItemPosition[]): void {
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    
    for (const position of positions) {
      const element = elements.find(el => 
        el.getAttribute('data-widget-id') === position.id ||
        el.getAttribute('widget-id') === position.id
      );
      
      if (element) {
        this.applyPositionToElement(element, position);
      }
    }
  }
  
  /**
   * Apply preview positions (during drag/resize)
   */
  applyPreviewPositions(positions: GridItemPosition[]): void {
    this.previewPositions = positions;
    
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    
    for (const position of positions) {
      const element = elements.find(el => 
        el.getAttribute('data-widget-id') === position.id ||
        el.getAttribute('widget-id') === position.id
      );
      
      if (element) {
        element.classList.add('widget-moving');
        this.applyPositionToElement(element, position);
      }
    }
  }
  
  /**
   * Clear preview positions
   */
  clearPreviewPositions(): void {
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    
    for (const element of elements) {
      element.classList.remove('widget-moving');
    }
    
    // Restore actual positions from service
    const positions = gridService.getAllPositions();
    this.handlePositionsChanged(positions);
    
    this.previewPositions = [];
  }
  
  // ============================================
  // Drag and Drop Handlers
  // ============================================
  
  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    
    this.isDragOver = true;
    
    // Update drop indicator position
    if (this.gridContainer) {
      const result = gridService.updateDrag(event.clientX, event.clientY);
      if (result) {
        // Show drop indicator at the dragged item's new position
        const draggedItem = result.positions.find(
          p => p.id === gridService.getActiveOperation()?.itemId
        );
        if (draggedItem) {
          this.showDropIndicator = true;
          this.dropIndicatorCol = draggedItem.col;
          this.dropIndicatorRow = draggedItem.row;
          this.dropIndicatorColSpan = draggedItem.colSpan;
          this.dropIndicatorRowSpan = draggedItem.rowSpan;
        }
        
        // Apply preview positions to show pushing
        this.applyPreviewPositions(result.positions);
      }
    }
  }
  
  handleDragLeave(event: DragEvent): void {
    // Only handle leave if actually leaving the container
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && this.contains(relatedTarget)) {
      return;
    }
    
    this.isDragOver = false;
    this.showDropIndicator = false;
    this.clearPreviewPositions();
  }
  
  handleDrop(event: DragEvent): void {
    event.preventDefault();
    
    this.isDragOver = false;
    this.showDropIndicator = false;
    
    // Finalize the drag
    const result = gridService.endDrag();
    if (result && result.isValid) {
      // Emit event for persistence
      this.dispatchEvent(new CustomEvent('grid-layout-changed', {
        bubbles: true,
        composed: true,
        detail: { positions: result.positions, pageType: this.pageType }
      }));
    }
    
    // Remove moving class from all elements
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    for (const element of elements) {
      element.classList.remove('widget-moving', 'widget-dragging');
    }
  }
  
  // ============================================
  // Public API
  // ============================================
  
  /**
   * Get the grid container element (for external use)
   */
  getGridContainer(): HTMLElement | null {
    return this.gridContainer;
  }
  
  /**
   * Start a drag operation (called by widget wrapper)
   */
  startDrag(widgetId: string, pointerX: number, pointerY: number): boolean {
    if (!this.gridContainer) return false;
    return gridService.startDrag(widgetId, pointerX, pointerY, this.gridContainer);
  }
  
  /**
   * Start a resize operation (called by widget wrapper)
   */
  startResize(
    widgetId: string,
    direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    pointerX: number,
    pointerY: number
  ): boolean {
    if (!this.gridContainer) return false;
    return gridService.startResize(widgetId, direction, pointerX, pointerY, this.gridContainer);
  }
  
  /**
   * Update resize (called during pointer move)
   */
  updateResize(pointerX: number, pointerY: number): void {
    const result = gridService.updateResize(pointerX, pointerY);
    if (result) {
      this.applyPreviewPositions(result.positions);
    }
  }
  
  /**
   * End resize operation
   */
  endResize(): void {
    const result = gridService.endResize();
    if (result && result.isValid) {
      // Emit event for persistence
      this.dispatchEvent(new CustomEvent('grid-layout-changed', {
        bubbles: true,
        composed: true,
        detail: { positions: result.positions, pageType: this.pageType }
      }));
    }
    
    // Remove moving class from all elements
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    for (const element of elements) {
      element.classList.remove('widget-moving');
    }
  }
  
  /**
   * Cancel any active operation
   */
  cancelOperation(): void {
    gridService.cancelDrag();
    gridService.cancelResize();
    this.clearPreviewPositions();
    this.showDropIndicator = false;
  }
  
  /**
   * Load positions from persistence
   */
  loadPositions(positions: GridItemPosition[]): void {
    gridService.setAllPositions(positions);
    
    // Apply to DOM
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = slot?.assignedElements() as HTMLElement[];
    
    for (const position of positions) {
      const element = elements.find(el => 
        el.getAttribute('data-widget-id') === position.id ||
        el.getAttribute('widget-id') === position.id
      );
      
      if (element) {
        this.applyPositionToElement(element, position);
      }
    }
  }
  
  /**
   * Get all current positions (for persistence)
   */
  getPositions(): GridItemPosition[] {
    return gridService.getAllPositions();
  }
}
