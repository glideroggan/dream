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
  
  /* These classes are applied to slotted elements */
  ::slotted(.grid-item-sm) {
    grid-column: span 1;
  }
  
  ::slotted(.grid-item-md) {
    grid-column: span 1;
  }
  
  ::slotted(.grid-item-lg) {
    grid-column: span 2;
  }
  
  ::slotted(.grid-item-xl) {
    grid-column: span 3;
  }
  
  ::slotted(.grid-item-needs-space) {
    grid-column: 1 / -1;
  }
  
  /* Add explicit support for full-width widgets */
  ::slotted(.widget-full-width) {
    grid-column: 1 / -1 !important;
  }
  
  @media (max-width: 800px) {
    ::slotted(.grid-item-sm),
    ::slotted(.grid-item-md),
    ::slotted(.grid-item-lg),
    ::slotted(.grid-item-xl) {
      grid-column: span 1;
    }
  }
`;

// Define size types
export type GridItemSize = 'sm' | 'md' | 'lg' | 'xl';

// Define grid item metadata
export interface GridItemMetadata {
  id: string;
  minWidth?: number;
  preferredSize?: GridItemSize;
  fullWidth?: boolean; // Add this property
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
      for (const entry of entries) {
        if (entry.target === this) {
          this.updateLayout();
        }
      }
    });
    
    // Start observing the container
    this.resizeObserver.observe(this);
    
    // Initialize grid style with default settings
    this.updateGridStyle();
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
    // Store metadata
    this.itemMetadata.set(metadata.id, metadata);
    
    // Apply appropriate CSS class based on preferred size
    if (metadata.preferredSize) {
      element.classList.add(`grid-item-${metadata.preferredSize}`);
    } else {
      element.classList.add('grid-item-md');
    }
    
    // Add full-width class if specified
    if (metadata.fullWidth) {
      element.classList.add('widget-full-width');
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
    if (this.shadowRoot) {
      const element = this.querySelector(`[data-grid-item-id="${id}"]`) as HTMLElement;
      if (element) {
        // Remove all size classes
        element.classList.remove('grid-item-sm', 'grid-item-md', 'grid-item-lg', 'grid-item-xl');
        // Add the new size class
        element.classList.add(`grid-item-${size}`);
      }
    }
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
  }
  
  /**
   * Distribute item sizes based on container width and column count
   */
  private distributeItemSizes(items: HTMLElement[], columnCount: number, containerWidth: number): void {
    // If we can only fit one column, make everything full width
    if (columnCount <= 1) {
      items.forEach(item => this.setItemSize(item, 'xl'));
      return;
    }
    
    // For wider layouts, use preferred sizes if they fit
    items.forEach(item => {
      const id = item.getAttribute('data-grid-item-id') || '';
      const metadata = this.itemMetadata.get(id);
      if (!metadata) return;
      
      // Skip items that should be full width - they already have the appropriate class
      if (metadata.fullWidth) return;
      
      const minWidth = metadata.minWidth || this.minColumnWidth;
      let size = metadata.preferredSize || 'md';
      
      // Adjust size for very wide items or narrow containers
      if (minWidth > containerWidth / 2) {
        size = columnCount >= 3 ? 'lg' : 'xl';
      } else if (columnCount <= 2 && size === 'lg') {
        size = 'md'; // In 2-column layout, limit large items to medium
      }
      
      this.setItemSize(item, size);
    });
    
    // Special layout cases
    if (columnCount >= 3 && items.length >= 3) {
      // In 3+ column layouts with several items, make first item larger for emphasis
      this.setItemSize(items[0], 'lg');
    }
    
    // If we have an odd number of items in a 2-column layout, 
    // make the last item span full width for a clean look
    if (columnCount === 2 && items.length % 2 === 1) {
      this.setItemSize(items[items.length - 1], 'lg');
    }
  }
  
  /**
   * Set an item's size class
   */
  private setItemSize(item: HTMLElement, size: GridItemSize): void {
    // Remove existing size classes
    item.classList.remove('grid-item-sm', 'grid-item-md', 'grid-item-lg', 'grid-item-xl');
    
    // Add the new size class
    item.classList.add(`grid-item-${size}`);
  }
}
