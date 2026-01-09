/**
 * Drag and Drop Service
 * Coordinates drag state across grid-layout and widget-wrapper components
 * Uses HTML5 Drag and Drop API for widget moving
 * Uses Pointer Events for resize operations (better control)
 */

import { MIN_COLUMN_WIDTH, MIN_ROW_HEIGHT, DEFAULT_GRID_GAP } from "../constants/grid-constants";

export type DragOperation = 'move' | 'resize';
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface DragState {
  /** Whether a drag operation is currently active */
  isDragging: boolean;
  /** Type of drag operation */
  operation: DragOperation | null;
  /** ID of the widget being dragged */
  widgetId: string | null;
  /** Starting grid column of the widget */
  startCol: number;
  /** Starting grid row of the widget */
  startRow: number;
  /** Current column span */
  colSpan: number;
  /** Current row span */
  rowSpan: number;
  /** For resize: which edge/corner is being dragged */
  resizeDirection: ResizeDirection | null;
  /** Starting mouse/pointer X position */
  startX: number;
  /** Starting mouse/pointer Y position */
  startY: number;
  /** Current mouse/pointer X position */
  currentX: number;
  /** Current mouse/pointer Y position */
  currentY: number;
  /** The element being dragged */
  element: HTMLElement | null;
  /** The grid layout element */
  gridElement: HTMLElement | null;
}

export interface GridCellInfo {
  /** Column index (0-based) */
  col: number;
  /** Row index (0-based) */
  row: number;
  /** Width of a single grid cell in pixels */
  cellWidth: number;
  /** Height of a single grid cell in pixels */
  cellHeight: number;
  /** Grid gap in pixels */
  gap: number;
}

type DragStateListener = (state: DragState) => void;

class DragDropService {
  private state: DragState = this.createEmptyState();
  private listeners: Set<DragStateListener> = new Set();

  /**
   * Create an empty/reset drag state
   */
  private createEmptyState(): DragState {
    return {
      isDragging: false,
      operation: null,
      widgetId: null,
      startCol: 0,
      startRow: 0,
      colSpan: 1,
      rowSpan: 1,
      resizeDirection: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      element: null,
      gridElement: null,
    };
  }

  /**
   * Get current drag state
   */
  getState(): Readonly<DragState> {
    return { ...this.state };
  }

  /**
   * Subscribe to drag state changes
   */
  subscribe(listener: DragStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach(listener => listener(stateCopy));
  }

  /**
   * Start a move operation (HTML5 Drag and Drop)
   */
  startMove(
    widgetId: string,
    element: HTMLElement,
    gridElement: HTMLElement,
    startX: number,
    startY: number,
    startCol: number,
    startRow: number,
    colSpan: number,
    rowSpan: number
  ): void {
    this.state = {
      isDragging: true,
      operation: 'move',
      widgetId,
      startCol,
      startRow,
      colSpan,
      rowSpan,
      resizeDirection: null,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      element,
      gridElement,
    };

    console.debug(`DragDropService: Started move for widget ${widgetId}`);
    this.notifyListeners();
  }

  /**
   * Start a resize operation (Pointer Events)
   */
  startResize(
    widgetId: string,
    element: HTMLElement,
    gridElement: HTMLElement,
    direction: ResizeDirection,
    startX: number,
    startY: number,
    colSpan: number,
    rowSpan: number
  ): void {
    // Get current grid position from element classes or computed position
    const startCol = this.getElementGridColumn(element);
    const startRow = this.getElementGridRow(element);

    this.state = {
      isDragging: true,
      operation: 'resize',
      widgetId,
      startCol,
      startRow,
      colSpan,
      rowSpan,
      resizeDirection: direction,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      element,
      gridElement,
    };

    console.debug(`DragDropService: Started resize (${direction}) for widget ${widgetId}`);
    this.notifyListeners();
  }

  /**
   * Update current pointer position during drag
   */
  updatePosition(x: number, y: number): void {
    if (!this.state.isDragging) return;

    this.state.currentX = x;
    this.state.currentY = y;
    this.notifyListeners();
  }

  /**
   * Calculate delta from start position in grid cells
   */
  getDeltaInCells(cellInfo: GridCellInfo): { deltaCols: number; deltaRows: number } {
    const deltaX = this.state.currentX - this.state.startX;
    const deltaY = this.state.currentY - this.state.startY;

    // Calculate how many cells the pointer has moved
    const cellWidthWithGap = cellInfo.cellWidth + cellInfo.gap;
    const cellHeightWithGap = cellInfo.cellHeight + cellInfo.gap;

    const deltaCols = Math.round(deltaX / cellWidthWithGap);
    const deltaRows = Math.round(deltaY / cellHeightWithGap);

    return { deltaCols, deltaRows };
  }

  /**
   * Calculate new spans based on resize direction and delta
   */
  getNewSpans(cellInfo: GridCellInfo): { newColSpan: number; newRowSpan: number } {
    if (this.state.operation !== 'resize' || !this.state.resizeDirection) {
      return { newColSpan: this.state.colSpan, newRowSpan: this.state.rowSpan };
    }

    const { deltaCols, deltaRows } = this.getDeltaInCells(cellInfo);
    const direction = this.state.resizeDirection;

    let newColSpan = this.state.colSpan;
    let newRowSpan = this.state.rowSpan;

    console.debug(`getNewSpans: initial spans ${this.state.colSpan}x${this.state.rowSpan}, delta ${deltaCols}x${deltaRows}, direction ${direction}`);

    // Handle horizontal resize
    if (direction.includes('e')) {
      newColSpan = Math.max(1, this.state.colSpan + deltaCols);
    } else if (direction.includes('w')) {
      newColSpan = Math.max(1, this.state.colSpan - deltaCols);
    }

    // Handle vertical resize
    if (direction.includes('s')) {
      newRowSpan = Math.max(1, this.state.rowSpan + deltaRows);
    } else if (direction.includes('n')) {
      newRowSpan = Math.max(1, this.state.rowSpan - deltaRows);
    }

    return { newColSpan, newRowSpan };
  }

  /**
   * End the current drag operation
   */
  endDrag(): { success: boolean; widgetId: string | null; operation: DragOperation | null } {
    const result = {
      success: this.state.isDragging,
      widgetId: this.state.widgetId,
      operation: this.state.operation,
    };

    console.debug(`DragDropService: Ended ${this.state.operation} for widget ${this.state.widgetId}`);

    this.state = this.createEmptyState();
    this.notifyListeners();

    return result;
  }

  /**
   * Cancel the current drag operation
   */
  cancelDrag(): void {
    console.debug(`DragDropService: Cancelled drag for widget ${this.state.widgetId}`);
    this.state = this.createEmptyState();
    this.notifyListeners();
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.state.isDragging;
  }

  /**
   * Check if currently dragging a specific widget
   */
  isDraggingWidget(widgetId: string): boolean {
    return this.state.isDragging && this.state.widgetId === widgetId;
  }

  /**
   * Get element's current grid column from classes or style
   */
  private getElementGridColumn(element: HTMLElement): number {
    // Try to get from col-span class or computed style
    const parent = element.closest('[data-grid-item-id]') || element;
    const style = window.getComputedStyle(parent);
    const gridColumn = style.gridColumnStart;
    
    if (gridColumn && gridColumn !== 'auto') {
      return parseInt(gridColumn, 10) - 1; // Convert to 0-based
    }
    
    return 0;
  }

  /**
   * Get element's current grid row from classes or style
   */
  private getElementGridRow(element: HTMLElement): number {
    const parent = element.closest('[data-grid-item-id]') || element;
    const style = window.getComputedStyle(parent);
    const gridRow = style.gridRowStart;
    
    if (gridRow && gridRow !== 'auto') {
      return parseInt(gridRow, 10) - 1; // Convert to 0-based
    }
    
    return 0;
  }

  /**
   * Calculate grid cell info from a grid element
   * Uses known constants since grid dimensions are fixed
   */
  getGridCellInfo(gridElement: HTMLElement): GridCellInfo {
    // Use known grid constants - these are fixed values from grid-constants.ts
    // This is more reliable than parsing CSS from shadow DOM
    const gap = DEFAULT_GRID_GAP; // 8px
    const cellWidth = MIN_COLUMN_WIDTH; // 40px
    const cellHeight = MIN_ROW_HEIGHT; // 30px

    return {
      col: 0,
      row: 0,
      cellWidth,
      cellHeight,
      gap,
    };
  }

  /**
   * Convert pixel position to grid cell coordinates
   */
  pixelToGridCell(
    x: number,
    y: number,
    gridElement: HTMLElement
  ): { col: number; row: number } {
    const cellInfo = this.getGridCellInfo(gridElement);
    const rect = gridElement.getBoundingClientRect();

    // Calculate relative position within grid
    const relX = x - rect.left;
    const relY = y - rect.top;

    // Convert to grid cells
    const cellWidthWithGap = cellInfo.cellWidth + cellInfo.gap;
    const cellHeightWithGap = cellInfo.cellHeight + cellInfo.gap;

    const col = Math.floor(relX / cellWidthWithGap);
    const row = Math.floor(relY / cellHeightWithGap);

    return { col: Math.max(0, col), row: Math.max(0, row) };
  }
}

// Export singleton instance
export const dragDropService = new DragDropService();
