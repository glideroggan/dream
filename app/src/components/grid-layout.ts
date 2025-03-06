import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";

/**
 * A responsive grid layout component that automatically arranges items in a grid
 * based on their preferred sizes and minimum width requirements.
 */
const template = html<GridLayout>/*html*/`
  <div class="grid-container" style="${x => x.gridStyle}">
    <slot></slot>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
  }
  
  .grid-container {
    display: grid;
    gap: var(--grid-gap, 1.5rem);
    width: 100%;
  }
  
  /* Size classes directly map to column spans */
  ::slotted(.span-1) {
    grid-column: span 1;
  }
  
  ::slotted(.span-2) {
    grid-column: span 2;
  }
  
  ::slotted(.span-3) {
    grid-column: span 3;
  }
  
  ::slotted(.span-4) {
    grid-column: span 4;
  }
  
  ::slotted(.grid-item-needs-space) {
    grid-column: 1 / -1;
  }
  
  /* Add explicit support for full-width widgets */
  ::slotted(.widget-full-width) {
    grid-column: 1 / -1 !important;
  }
  
  @media (max-width: 800px) {
    ::slotted(.span-1),
    ::slotted(.span-2),
    ::slotted(.span-3),
    ::slotted(.span-4) {
      grid-column: span 1;
    }
  }
`;

// Define size types - these names represent user-facing sizes
// but will be mapped to specific column spans internally
export type GridItemSize = 'sm' | 'md' | 'lg' | 'xl';

// Map of size names to their column spans
// Updated to properly map xl to 3 columns
const sizeToSpanMap: Record<GridItemSize, number> = {
  'sm': 1,
  'md': 2,
  'lg': 3,
  'xl': 3  // Set xl to 3 columns (was 4 before which is too wide for most layouts)
};

// Define grid item metadata
export interface GridItemMetadata {
  id: string;
  minWidth?: number;
  preferredSize?: GridItemSize;
  fullWidth?: boolean; 
}

@customElement({
  name: "grid-layout",
  template,
  styles
})
export class GridLayout extends FASTElement {
  @attr({ attribute: "min-column-width" }) minColumnWidth = 350;
  @attr({ attribute: "grid-gap" }) gridGap = 24;
  @observable gridStyle = '';
  
  // Maps item IDs to their metadata
  private itemMetadata = new Map<string, GridItemMetadata>();
  private resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    
    // Create a ResizeObserver to handle container resize events
    this.resizeObserver = new ResizeObserver(entries => {
      this.updateLayout();
    });
    
    // Start observing the container
    this.resizeObserver.observe(this);
    
    // Initialize grid style with default settings
    this.updateGridStyle();
    
    console.debug("GridLayout connected, metadata size:", this.itemMetadata.size);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up the ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
  
  /**
   * Add an item to the grid with its metadata
   */
  addItem(element: HTMLElement, metadata: GridItemMetadata): void {
    console.debug(`GridLayout: Adding item ${metadata.id} with size ${metadata.preferredSize}`, metadata);
    
    // Store metadata
    this.itemMetadata.set(metadata.id, metadata);
    
    // Apply appropriate span class based on preferred size
    if (metadata.preferredSize) {
      this.setItemSize(element, metadata.preferredSize);
    } else {
      this.setItemSize(element, 'md');
    }
    
    // Add full-width class if specified
    if (metadata.fullWidth) {
      element.classList.add('widget-full-width');
    }
    
    // Check if the element already has the widget-full-width class
    // and update metadata accordingly to ensure consistency
    if (element.classList.contains('widget-full-width') && !metadata.fullWidth) {
      metadata.fullWidth = true;
    }
    
    // Add data attributes for size calculation
    if (metadata.minWidth) {
      element.setAttribute('data-min-width', metadata.minWidth.toString());
    }
    
    element.setAttribute('data-grid-item-id', metadata.id);
    
    // Update layout to account for new item
    this.updateLayout();
  }
  
  /**
   * Remove an item from the grid
   */
  removeItem(id: string): void {
    // Remove metadata
    this.itemMetadata.delete(id);
    
    // Update layout
    this.updateLayout();
  }
  
  /**
   * Update an item's size
   */
  updateItemSize(id: string, size: GridItemSize): void {
    const metadata = this.itemMetadata.get(id);
    if (!metadata) return;
    
    // Update metadata
    metadata.preferredSize = size;
    
    // Find the element and update its class
    const element = this.querySelector(`[data-grid-item-id="${id}"]`) as HTMLElement;
    if (element) {
      this.setItemSize(element, size);
    }
    
    console.debug(`GridLayout: Updated size for ${id} to ${size}`);
  }
  
  /**
   * Get the maximum min-width from all items
   */
  private getMaxMinWidth(): number {
    let maxMinWidth = this.minColumnWidth;
    
    // Search for data-min-width attributes among all grid items
    const items = this.querySelectorAll('[data-grid-item-id]');
    items.forEach(item => {
      const minWidthAttr = item.getAttribute('data-min-width');
      if (minWidthAttr) {
        const minWidth = parseInt(minWidthAttr, 10);
        if (!isNaN(minWidth)) {
          maxMinWidth = Math.max(maxMinWidth, minWidth);
        }
      }
    });
    
    return maxMinWidth;
  }
  
  /**
   * Update the grid layout based on container size and item requirements
   */
  updateLayout(): void {
    // Update grid style
    this.updateGridStyle();
    
    // Get all grid items
    const items = Array.from(this.querySelectorAll('[data-grid-item-id]')) as HTMLElement[];
    if (items.length === 0) return;
    
    const containerWidth = this.clientWidth;
    const maxMinWidth = this.getMaxMinWidth();
    
    // Calculate how many columns we can fit
    const possibleColumns = Math.max(1, Math.floor(containerWidth / maxMinWidth));
    
    console.debug(`GridLayout: Updating layout with ${items.length} items, container width: ${containerWidth}px, columns: ${possibleColumns}`);
    
    // Distribute item sizes based on available space
    this.distributeItemSizes(items, possibleColumns, containerWidth);
    
    // Mark items that need extra space
    items.forEach(item => {
      const id = item.getAttribute('data-grid-item-id') || '';
      const metadata = this.itemMetadata.get(id);
      if (!metadata) return;
      
      const minWidth = metadata.minWidth || this.minColumnWidth;
      
      // If an item's minimum width is more than half the container width,
      // and we have multiple columns, make it span the full width
      if (minWidth > containerWidth / 2 && possibleColumns > 1) {
        item.classList.add('grid-item-needs-space');
      } else {
        item.classList.remove('grid-item-needs-space');
      }
    });
  }
  
  /**
   * Update the grid CSS style
   */
  private updateGridStyle(): void {
    const containerWidth = this.clientWidth;
    const maxMinWidth = this.getMaxMinWidth();
    
    // Calculate how many columns we can fit
    const possibleColumns = Math.max(1, Math.floor(containerWidth / maxMinWidth));
    
    // Set the grid template columns CSS
    if (possibleColumns === 1) {
      this.gridStyle = `grid-template-columns: 1fr; gap: ${this.gridGap}px;`;
    } else {
      const columnWidth = Math.max(maxMinWidth, Math.floor(containerWidth / possibleColumns) - this.gridGap);
      this.gridStyle = `grid-template-columns: repeat(${possibleColumns}, minmax(${columnWidth}px, 1fr)); gap: ${this.gridGap}px;`;
    }
    
    console.debug(`GridLayout: Updated grid style for ${possibleColumns} columns`);
  }
  
  /**
   * Distribute item sizes based on container width and column count
   */
  private distributeItemSizes(items: HTMLElement[], columnCount: number, containerWidth: number): void {
    console.debug(`GridLayout: Distributing sizes for ${items.length} items with ${columnCount} columns`);
    
    // If we can only fit one column, make everything small (one column span)
    if (columnCount <= 1) {
      items.forEach(item => this.setItemSize(item, 'sm'));
      return;
    }
    
    // For wider layouts, use preferred sizes if they fit
    items.forEach(item => {
      const id = item.getAttribute('data-grid-item-id') || '';
      const metadata = this.itemMetadata.get(id);
      if (!metadata) {
        console.warn(`GridLayout: No metadata found for item ${id}`);
        return;
      }
      
      // Skip items that should be full width - they already have the appropriate class
      if (metadata.fullWidth) {
        item.classList.add('widget-full-width');
        console.debug(`GridLayout: Item ${id} set to full width`);
        return;
      }
      
      const minWidth = metadata.minWidth || this.minColumnWidth;
      let size = metadata.preferredSize || 'md';
      
      console.debug(`GridLayout: Setting size for ${id}, preferred: ${size}, min width: ${minWidth}px`);
      
      // Ensure we don't try to span more columns than are available
      const preferredSpan = sizeToSpanMap[size];
      if (preferredSpan > columnCount) {
        // Find a size that fits within available columns
        for (const [sizeKey, span] of Object.entries(sizeToSpanMap)) {
          if (span <= columnCount) {
            size = sizeKey as GridItemSize;
            break;
          }
        }
        console.debug(`GridLayout: Adjusted size for ${id} to ${size} to fit columns`);
      }
      
      this.setItemSize(item, size);
    });
    
    // Special layout cases
    if (columnCount >= 3 && items.length >= 3) {
      // In 3+ column layouts with several items, make first item larger for emphasis
      const firstItem = items[0];
      const firstId = firstItem.getAttribute('data-grid-item-id') || '';
      console.debug(`GridLayout: Making first item ${firstId} larger for emphasis`);
      this.setItemSize(firstItem, 'lg');
    }
    
    // If we have an odd number of items in a 2-column layout, 
    // make the last item span full width for a clean look
    if (columnCount === 2 && items.length % 2 === 1) {
      const lastItem = items[items.length - 1];
      const lastId = lastItem.getAttribute('data-grid-item-id') || '';
      console.debug(`GridLayout: Making last item ${lastId} larger to balance layout`);
      this.setItemSize(lastItem, 'lg');
    }
  }
  
  /**
   * Set an item's size class based on the desired column span
   */
  private setItemSize(item: HTMLElement, size: GridItemSize): void {
    // Remove existing span classes
    item.classList.remove('span-1', 'span-2', 'span-3', 'span-4');
    
    // Add the new span class that corresponds to the size
    const span = sizeToSpanMap[size];
    item.classList.add(`span-${span}`);
    
    const id = item.getAttribute('data-grid-item-id') || 'unknown';
    console.debug(`GridLayout: Set item ${id} to size ${size} (span-${span})`);
  }
}
