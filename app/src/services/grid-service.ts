/**
 * Grid Service
 * Centralized service for grid layout calculations and state management.
 * Single source of truth for all grid-related operations.
 * 
 * Now page-aware: each page has its own isolated set of positions.
 */

import {
  MAX_GRID_COLUMNS,
  MAX_GRID_ROWS,
  MIN_COLUMN_WIDTH,
  MIN_ROW_HEIGHT,
  DEFAULT_GRID_GAP,
  DEFAULT_COLUMN_SPAN,
  DEFAULT_ROW_SPAN,
} from "../constants/grid-constants";

// ============================================
// Types
// ============================================

/**
 * Position and size of a widget in grid coordinates (1-based)
 */
export interface GridItemPosition {
  id: string;
  col: number;      // 1-based column start
  row: number;      // 1-based row start
  colSpan: number;  // Number of columns
  rowSpan: number;  // Number of rows
}

/**
 * Grid cell dimensions in pixels
 */
export interface GridCellDimensions {
  cellWidth: number;
  cellHeight: number;
  gap: number;
  containerWidth: number;
  containerHeight: number;
}

/**
 * Result of a drag or resize operation
 */
export interface GridOperationResult {
  /** The new positions of all affected items */
  positions: GridItemPosition[];
  /** Whether the operation is valid */
  isValid: boolean;
  /** If invalid, the reason why */
  invalidReason?: string;
}

/**
 * Resize direction (8 possible directions from edges and corners)
 */
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Active drag/resize operation state
 */
export interface ActiveOperation {
  type: 'drag' | 'resize';
  itemId: string;
  pageType: string;  // Track which page the operation is on
  direction?: ResizeDirection;
  /** Starting pointer position */
  startPointer: { x: number; y: number };
  /** Current pointer position */
  currentPointer: { x: number; y: number };
  /** Original position before operation */
  originalPosition: GridItemPosition;
  /** Cached cell dimensions at operation start */
  cellDimensions: GridCellDimensions;
  /** Grid container rect at operation start */
  containerRect: DOMRect;
}

type GridServiceListener = (pageType: string, positions: GridItemPosition[]) => void;

// ============================================
// Grid Service Class
// ============================================

class GridService {
  /** Current positions of all items, organized by page type */
  private pageItems: Map<string, Map<string, GridItemPosition>> = new Map();
  
  /** Active drag/resize operation */
  private activeOperation: ActiveOperation | null = null;
  
  /** Listeners for position changes (per page) */
  private listeners: Set<GridServiceListener> = new Set();

  // ============================================
  // Page Management
  // ============================================

  /**
   * Get or create the items map for a page
   */
  private getPageMap(pageType: string): Map<string, GridItemPosition> {
    if (!this.pageItems.has(pageType)) {
      this.pageItems.set(pageType, new Map());
    }
    return this.pageItems.get(pageType)!;
  }

  // ============================================
  // Item Management
  // ============================================

  /**
   * Register an item with the grid for a specific page
   */
  addItem(pageType: string, item: GridItemPosition): void {
    console.debug(`[GRID-DEBUG] gridService.addItem: page=${pageType}, ${item.id} at (${item.col}, ${item.row}) size ${item.colSpan}x${item.rowSpan}`);
    const pageMap = this.getPageMap(pageType);
    pageMap.set(item.id, { ...item });
    this.notifyListeners(pageType);
  }

  /**
   * Remove an item from the grid for a specific page
   */
  removeItem(pageType: string, id: string): void {
    const pageMap = this.pageItems.get(pageType);
    if (pageMap) {
      pageMap.delete(id);
      this.notifyListeners(pageType);
    }
  }

  /**
   * Get all item positions for a specific page
   */
  getAllPositions(pageType: string): GridItemPosition[] {
    const pageMap = this.pageItems.get(pageType);
    return pageMap ? Array.from(pageMap.values()) : [];
  }

  /**
   * Get a single item's position for a specific page
   */
  getPosition(pageType: string, id: string): GridItemPosition | undefined {
    const pageMap = this.pageItems.get(pageType);
    return pageMap?.get(id);
  }

  /**
   * Update an item's position directly for a specific page
   */
  updatePosition(pageType: string, id: string, updates: Partial<GridItemPosition>): void {
    const pageMap = this.pageItems.get(pageType);
    const item = pageMap?.get(id);
    if (item && pageMap) {
      pageMap.set(id, { ...item, ...updates });
      this.notifyListeners(pageType);
    }
  }

  /**
   * Set all positions at once for a specific page (for loading from persistence)
   */
  setAllPositions(pageType: string, positions: GridItemPosition[]): void {
    const pageMap = this.getPageMap(pageType);
    pageMap.clear();
    for (const pos of positions) {
      pageMap.set(pos.id, { ...pos });
    }
    this.notifyListeners(pageType);
  }

  /**
   * Clear all items for a specific page only
   */
  clear(pageType: string): void {
    const pageMap = this.pageItems.get(pageType);
    const count = pageMap?.size || 0;
    const ids = pageMap ? Array.from(pageMap.keys()) : [];
    console.debug(`[GRID-DEBUG] gridService.clear(${pageType}) called - clearing ${count} items: ${ids.join(', ')}`);
    
    if (pageMap) {
      pageMap.clear();
    }
    
    // Cancel any active operation for this page
    if (this.activeOperation?.pageType === pageType) {
      this.activeOperation = null;
    }
    
    this.notifyListeners(pageType);
  }

  // ============================================
  // Cell Calculations
  // ============================================

  /**
   * Calculate cell dimensions from a grid container element.
   * IMPORTANT: Always pass the actual .grid-container element, not the host.
   */
  getCellDimensions(gridContainer: HTMLElement): GridCellDimensions {
    const rect = gridContainer.getBoundingClientRect();
    const gap = DEFAULT_GRID_GAP;
    
    // Calculate actual column width from container
    const totalGapWidth = (MAX_GRID_COLUMNS - 1) * gap;
    const availableWidth = rect.width - totalGapWidth;
    const cellWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth / MAX_GRID_COLUMNS);
    
    // Row height is fixed
    const cellHeight = MIN_ROW_HEIGHT;
    
    return {
      cellWidth,
      cellHeight,
      gap,
      containerWidth: rect.width,
      containerHeight: rect.height,
    };
  }

  /**
   * Convert pixel coordinates to grid cell (1-based)
   */
  pixelToCell(
    x: number,
    y: number,
    containerRect: DOMRect,
    cellDimensions: GridCellDimensions
  ): { col: number; row: number } {
    const { cellWidth, cellHeight, gap } = cellDimensions;
    
    // Relative position within container
    const relX = x - containerRect.left;
    const relY = y - containerRect.top;
    
    // Convert to grid cells (1-based)
    const cellWidthWithGap = cellWidth + gap;
    const cellHeightWithGap = cellHeight + gap;
    
    const col = Math.floor(relX / cellWidthWithGap) + 1;
    const row = Math.floor(relY / cellHeightWithGap) + 1;
    
    // Clamp to valid range
    return {
      col: Math.max(1, Math.min(col, MAX_GRID_COLUMNS)),
      row: Math.max(1, Math.min(row, MAX_GRID_ROWS)),
    };
  }

  /**
   * Convert grid cell to pixel position (top-left corner of cell)
   */
  cellToPixel(
    col: number,
    row: number,
    cellDimensions: GridCellDimensions
  ): { x: number; y: number } {
    const { cellWidth, cellHeight, gap } = cellDimensions;
    
    // Convert 1-based to 0-based for calculation
    const x = (col - 1) * (cellWidth + gap);
    const y = (row - 1) * (cellHeight + gap);
    
    return { x, y };
  }

  // ============================================
  // Collision Detection & Pushing
  // ============================================

  /**
   * Check if two items overlap
   */
  private itemsOverlap(a: GridItemPosition, b: GridItemPosition): boolean {
    // No overlap if one is completely to the left, right, above, or below the other
    const aRight = a.col + a.colSpan;
    const aBottom = a.row + a.rowSpan;
    const bRight = b.col + b.colSpan;
    const bBottom = b.row + b.rowSpan;
    
    return !(aRight <= b.col || bRight <= a.col || aBottom <= b.row || bBottom <= a.row);
  }

  /**
   * Find all items that overlap with the given position (excluding the item itself)
   */
  findOverlappingItems(pageType: string, position: GridItemPosition): GridItemPosition[] {
    const overlapping: GridItemPosition[] = [];
    const pageMap = this.pageItems.get(pageType);
    
    if (pageMap) {
      for (const item of pageMap.values()) {
        if (item.id !== position.id && this.itemsOverlap(position, item)) {
          overlapping.push({ ...item });
        }
      }
    }
    
    return overlapping;
  }

  /**
   * Push items down to make room for a widget.
   * Returns new positions for all affected items.
   */
  pushItemsDown(
    movingItem: GridItemPosition,
    allItems: GridItemPosition[]
  ): GridItemPosition[] {
    // Create a working copy
    const positions = allItems.map(item => ({ ...item }));
    
    // Find the moving item in positions
    const movingIndex = positions.findIndex(p => p.id === movingItem.id);
    if (movingIndex >= 0) {
      positions[movingIndex] = { ...movingItem };
    }
    
    // Iteratively push items down until no overlaps
    let maxIterations = 100; // Prevent infinite loops
    let hasOverlaps = true;
    
    while (hasOverlaps && maxIterations > 0) {
      hasOverlaps = false;
      maxIterations--;
      
      for (let i = 0; i < positions.length; i++) {
        const item = positions[i];
        if (item.id === movingItem.id) continue;
        
        // Check if this item overlaps with the moving item
        if (this.itemsOverlap(movingItem, item)) {
          // Push this item down below the moving item
          const newRow = movingItem.row + movingItem.rowSpan;
          
          // Only push if it actually moves the item
          if (newRow > item.row) {
            positions[i] = { ...item, row: newRow };
            hasOverlaps = true;
          }
        }
      }
      
      // Now check for cascading overlaps between pushed items
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          if (this.itemsOverlap(positions[i], positions[j])) {
            // Push the one that's higher to below the lower one
            const higher = positions[i].row <= positions[j].row ? positions[i] : positions[j];
            const lower = positions[i].row <= positions[j].row ? positions[j] : positions[i];
            const lowerIndex = positions[i].row <= positions[j].row ? j : i;
            
            const newRow = higher.row + higher.rowSpan;
            if (newRow > lower.row) {
              positions[lowerIndex] = { ...lower, row: newRow };
              hasOverlaps = true;
            }
          }
        }
      }
    }
    
    return positions;
  }

  /**
   * Compact items upward to fill gaps (after an item is removed or moved)
   */
  compactItems(allItems: GridItemPosition[]): GridItemPosition[] {
    // Sort by row (top to bottom), then by column
    const sorted = [...allItems].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    
    const result: GridItemPosition[] = [];
    
    for (const item of sorted) {
      // Find the highest row this item can move to without overlap
      let bestRow = 1;
      
      for (let row = 1; row <= item.row; row++) {
        const testPosition = { ...item, row };
        let canPlace = true;
        
        for (const placed of result) {
          if (this.itemsOverlap(testPosition, placed)) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          bestRow = row;
        } else {
          break;
        }
      }
      
      result.push({ ...item, row: bestRow });
    }
    
    return result;
  }

  // ============================================
  // Drag Operations
  // ============================================

  /**
   * Start a drag operation
   */
  startDrag(
    pageType: string,
    itemId: string,
    pointerX: number,
    pointerY: number,
    gridContainer: HTMLElement
  ): boolean {
    const item = this.getPosition(pageType, itemId);
    if (!item) {
      console.warn(`GridService: Cannot start drag - item ${itemId} not found on page ${pageType}`);
      return false;
    }
    
    const containerRect = gridContainer.getBoundingClientRect();
    const cellDimensions = this.getCellDimensions(gridContainer);
    
    this.activeOperation = {
      type: 'drag',
      itemId,
      pageType,
      startPointer: { x: pointerX, y: pointerY },
      currentPointer: { x: pointerX, y: pointerY },
      originalPosition: { ...item },
      cellDimensions,
      containerRect,
    };
    
    console.debug(`GridService: Started drag for ${itemId} on page ${pageType} at (${item.col}, ${item.row})`);
    return true;
  }

  /**
   * Update drag position and calculate preview
   */
  updateDrag(pointerX: number, pointerY: number): GridOperationResult | null {
    if (!this.activeOperation || this.activeOperation.type !== 'drag') {
      return null;
    }
    
    this.activeOperation.currentPointer = { x: pointerX, y: pointerY };
    
    const { originalPosition, cellDimensions, pageType } = this.activeOperation;
    
    // Calculate delta in cells
    const deltaX = pointerX - this.activeOperation.startPointer.x;
    const deltaY = pointerY - this.activeOperation.startPointer.y;
    
    const cellWidthWithGap = cellDimensions.cellWidth + cellDimensions.gap;
    const cellHeightWithGap = cellDimensions.cellHeight + cellDimensions.gap;
    
    const deltaCols = Math.round(deltaX / cellWidthWithGap);
    const deltaRows = Math.round(deltaY / cellHeightWithGap);
    
    // Calculate new position
    let newCol = originalPosition.col + deltaCols;
    let newRow = originalPosition.row + deltaRows;
    
    // Clamp to grid bounds
    newCol = Math.max(1, Math.min(newCol, MAX_GRID_COLUMNS - originalPosition.colSpan + 1));
    newRow = Math.max(1, newRow); // No upper limit on rows for now
    
    const newPosition: GridItemPosition = {
      ...originalPosition,
      col: newCol,
      row: newRow,
    };
    
    // Calculate positions with pushing
    const allItems = this.getAllPositions(pageType);
    const newPositions = this.pushItemsDown(newPosition, allItems);
    
    return {
      positions: newPositions,
      isValid: true,
    };
  }

  /**
   * End drag operation and apply changes
   */
  endDrag(): GridOperationResult | null {
    if (!this.activeOperation || this.activeOperation.type !== 'drag') {
      return null;
    }
    
    const result = this.updateDrag(
      this.activeOperation.currentPointer.x,
      this.activeOperation.currentPointer.y
    );
    
    const { pageType } = this.activeOperation;
    
    if (result && result.isValid) {
      // Apply the new positions
      const pageMap = this.getPageMap(pageType);
      for (const pos of result.positions) {
        pageMap.set(pos.id, pos);
      }
      this.notifyListeners(pageType);
    }
    
    this.activeOperation = null;
    return result;
  }

  /**
   * Cancel drag operation
   */
  cancelDrag(): void {
    this.activeOperation = null;
  }

  // ============================================
  // Resize Operations
  // ============================================

  /**
   * Start a resize operation
   */
  startResize(
    pageType: string,
    itemId: string,
    direction: ResizeDirection,
    pointerX: number,
    pointerY: number,
    gridContainer: HTMLElement
  ): boolean {
    const item = this.getPosition(pageType, itemId);
    if (!item) {
      console.warn(`GridService: Cannot start resize - item ${itemId} not found on page ${pageType}`);
      return false;
    }
    
    const containerRect = gridContainer.getBoundingClientRect();
    const cellDimensions = this.getCellDimensions(gridContainer);
    
    this.activeOperation = {
      type: 'resize',
      itemId,
      pageType,
      direction,
      startPointer: { x: pointerX, y: pointerY },
      currentPointer: { x: pointerX, y: pointerY },
      originalPosition: { ...item },
      cellDimensions,
      containerRect,
    };
    
    console.debug(`GridService: Started resize (${direction}) for ${itemId} on page ${pageType}`);
    return true;
  }

  /**
   * Update resize and calculate preview
   */
  updateResize(pointerX: number, pointerY: number): GridOperationResult | null {
    if (!this.activeOperation || this.activeOperation.type !== 'resize') {
      return null;
    }
    
    this.activeOperation.currentPointer = { x: pointerX, y: pointerY };
    
    const { originalPosition, cellDimensions, direction, pageType } = this.activeOperation;
    
    // Calculate delta in cells
    const deltaX = pointerX - this.activeOperation.startPointer.x;
    const deltaY = pointerY - this.activeOperation.startPointer.y;
    
    const cellWidthWithGap = cellDimensions.cellWidth + cellDimensions.gap;
    const cellHeightWithGap = cellDimensions.cellHeight + cellDimensions.gap;
    
    const deltaCols = Math.round(deltaX / cellWidthWithGap);
    const deltaRows = Math.round(deltaY / cellHeightWithGap);
    
    // Calculate new position and size based on direction
    let { col, row, colSpan, rowSpan } = originalPosition;
    
    if (direction?.includes('e')) {
      // Resize from east (right) edge
      colSpan = Math.max(1, originalPosition.colSpan + deltaCols);
    }
    if (direction?.includes('w')) {
      // Resize from west (left) edge
      const newCol = originalPosition.col + deltaCols;
      const newColSpan = originalPosition.colSpan - deltaCols;
      if (newCol >= 1 && newColSpan >= 1) {
        col = newCol;
        colSpan = newColSpan;
      }
    }
    if (direction?.includes('s')) {
      // Resize from south (bottom) edge
      rowSpan = Math.max(1, originalPosition.rowSpan + deltaRows);
    }
    if (direction?.includes('n')) {
      // Resize from north (top) edge
      const newRow = originalPosition.row + deltaRows;
      const newRowSpan = originalPosition.rowSpan - deltaRows;
      if (newRow >= 1 && newRowSpan >= 1) {
        row = newRow;
        rowSpan = newRowSpan;
      }
    }
    
    // Clamp to grid bounds
    if (col + colSpan - 1 > MAX_GRID_COLUMNS) {
      colSpan = MAX_GRID_COLUMNS - col + 1;
    }
    colSpan = Math.max(1, colSpan);
    rowSpan = Math.max(1, rowSpan);
    
    const newPosition: GridItemPosition = {
      id: originalPosition.id,
      col,
      row,
      colSpan,
      rowSpan,
    };
    
    // Calculate positions with pushing
    const allItems = this.getAllPositions(pageType);
    const newPositions = this.pushItemsDown(newPosition, allItems);
    
    return {
      positions: newPositions,
      isValid: true,
    };
  }

  /**
   * End resize operation and apply changes
   */
  endResize(): GridOperationResult | null {
    if (!this.activeOperation || this.activeOperation.type !== 'resize') {
      return null;
    }
    
    const result = this.updateResize(
      this.activeOperation.currentPointer.x,
      this.activeOperation.currentPointer.y
    );
    
    const { pageType } = this.activeOperation;
    
    if (result && result.isValid) {
      // Apply the new positions
      const pageMap = this.getPageMap(pageType);
      for (const pos of result.positions) {
        pageMap.set(pos.id, pos);
      }
      this.notifyListeners(pageType);
    }
    
    this.activeOperation = null;
    return result;
  }

  /**
   * Cancel resize operation
   */
  cancelResize(): void {
    this.activeOperation = null;
  }

  // ============================================
  // Active Operation State
  // ============================================

  /**
   * Check if an operation is active
   */
  isOperationActive(): boolean {
    return this.activeOperation !== null;
  }

  /**
   * Get the active operation
   */
  getActiveOperation(): ActiveOperation | null {
    return this.activeOperation;
  }

  // ============================================
  // Listeners
  // ============================================

  /**
   * Subscribe to position changes
   */
  subscribe(listener: GridServiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of position changes for a specific page
   */
  private notifyListeners(pageType: string): void {
    const positions = this.getAllPositions(pageType);
    this.listeners.forEach(listener => listener(pageType, positions));
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Find the next available position for a new item on a specific page
   */
  findNextAvailablePosition(pageType: string, colSpan: number, rowSpan: number): { col: number; row: number } {
    const allItems = this.getAllPositions(pageType);
    
    // Try each row starting from 1
    for (let row = 1; row <= MAX_GRID_ROWS * 2; row++) {
      // Try each column
      for (let col = 1; col <= MAX_GRID_COLUMNS - colSpan + 1; col++) {
        const testPosition: GridItemPosition = {
          id: '__test__',
          col,
          row,
          colSpan,
          rowSpan,
        };
        
        let fits = true;
        for (const item of allItems) {
          if (this.itemsOverlap(testPosition, item)) {
            fits = false;
            break;
          }
        }
        
        if (fits) {
          return { col, row };
        }
      }
    }
    
    // If no space found, put at the bottom
    const maxRow = allItems.reduce((max, item) => Math.max(max, item.row + item.rowSpan), 1);
    return { col: 1, row: maxRow };
  }

  /**
   * Get grid configuration constants
   */
  getGridConfig() {
    return {
      columns: MAX_GRID_COLUMNS,
      rows: MAX_GRID_ROWS,
      minColumnWidth: MIN_COLUMN_WIDTH,
      rowHeight: MIN_ROW_HEIGHT,
      gap: DEFAULT_GRID_GAP,
      defaultColSpan: DEFAULT_COLUMN_SPAN,
      defaultRowSpan: DEFAULT_ROW_SPAN,
    };
  }
}

// Export singleton instance
export const gridService = new GridService();
