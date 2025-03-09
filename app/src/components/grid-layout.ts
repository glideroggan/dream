import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { repositoryService } from "../services/repository-service";
import { SettingsRepository } from "../repositories/settings-repository";
import { getWidgetColumnSpan, getWidgetRowSpan } from "../widgets/widget-registry";

/**
 * A responsive grid layout component that arranges items in a grid
 * based on their preferred column and row spans.
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
    height: 100%; /* Ensure host takes full height */
  }
  
  .grid-container {
    display: grid;
    gap: var(--grid-gap, 0.5rem);
    width: 100%;
    height: 100%; /* Make grid container fill available space */
    min-height: 400px; /* Provide some minimum height */
  }
  
  /* Generate column-span classes */
  ${Array.from({length: 16}, (_, i) => i + 1).map(i => `
  ::slotted(.col-span-${i}) {
    grid-column: span ${i};
  }
  `).join('\n')}
  
  /* Generate row-span classes */
  ${Array.from({length: 8}, (_, i) => i + 1).map(i => `
  ::slotted(.row-span-${i}) {
    grid-row: span ${i};
    /* Height calculation removed - let grid handle sizing */
    overflow: auto;
  }
  `).join('\n')}
  
  /* Add explicit support for full-width widgets */
  ::slotted(.widget-full-width) {
    grid-column: 1 / -1 !important;
  }
  
  /* Ensure consistent sizing */
  ::slotted(*) {
    box-sizing: border-box;
    overflow: auto;
    height: 100%; /* Let items fill their grid cells */
  }
  
  @media (max-width: 800px) {
    ::slotted([class*="col-span-"]) {
      grid-column: span min(var(--current-col-span, 1), 8);
    }
  }
  
  @media (max-width: 500px) {
    ::slotted([class*="col-span-"]) {
      grid-column: span min(var(--current-col-span, 1), 4);
    }
  }
`;

// Legacy size mapping to new column spans
// for backward compatibility
const sizeToSpanMap = {
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
  preferredSize?: GridItemSize; // For backward compatibility
  fullWidth?: boolean; 
}

// For backward compatibility
export type GridItemSize = 'sm' | 'md' | 'lg' | 'xl';

@customElement({
  name: "grid-layout",
  template,
  styles
})
export class GridLayout extends FASTElement {
  @attr({ attribute: "min-column-width" }) minColumnWidth = 40; // Smaller column width (40px)
  @attr({ attribute: "min-row-height" }) minRowHeight = 40;     // Smaller row height (40px) 
  @attr({ attribute: "grid-gap" }) gridGap = 8;                 // Smaller gap for finer grid
  @attr({ attribute: "data-page" }) dataPage = '';
  @attr({ attribute: "columns" }) totalColumns = 16;
  @attr({ attribute: "rows" }) totalRows = 8;
  @observable gridStyle = '';

  private settingsRepository: SettingsRepository;

  // Maps item IDs to their metadata
  private itemMetadata = new Map<string, GridItemMetadata>();
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();
    this.settingsRepository = repositoryService.getSettingsRepository();
  }

  connectedCallback(): void {
    super.connectedCallback();
    
    // Set custom CSS properties for row height
    this.style.setProperty('--row-height', `${this.minRowHeight}px`);
    this.style.setProperty('--grid-gap', `${this.gridGap}px`);
    
    // Create a ResizeObserver to handle container resize events
    this.resizeObserver = new ResizeObserver(entries => {
      this.updateLayout();
    });
    
    // Start observing the container
    this.resizeObserver.observe(this);
    
    // Initialize grid style with default settings
    this.updateGridStyle();
    
    // Listen for widget size change events
    this.addEventListener('widget-size-change', this.handleWidgetSizeChange.bind(this));
    this.addEventListener('widget-spans-change', this.handleWidgetSpansChange.bind(this));
    
    console.debug("GridLayout connected, metadata size:", this.itemMetadata.size);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up the ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Remove event listeners
    this.removeEventListener('widget-size-change', this.handleWidgetSizeChange.bind(this));
    this.removeEventListener('widget-spans-change', this.handleWidgetSpansChange.bind(this));
  }
  
  /**
   * Handle widget spans change events from widget-wrapper components
   */
  private handleWidgetSpansChange(event: Event): void {
    const customEvent = event as CustomEvent;
    const { widgetId, colSpan, rowSpan } = customEvent.detail;
    
    console.debug(`GridLayout: Received spans change event for widget ${widgetId}: cols=${colSpan}, rows=${rowSpan}`);
    
    // Update the item metadata
    const metadata = this.itemMetadata.get(widgetId);
    if (metadata) {
      metadata.colSpan = colSpan;
      metadata.rowSpan = rowSpan;

      // save new spans to settings if we have a page identifier
      if (this.dataPage) {
        this.saveWidgetSpansToSettings(this.dataPage, widgetId, colSpan, rowSpan);
      }
      
      // Find the element and update its span classes
      const element = this.querySelector(`[data-grid-item-id="${widgetId}"]`) as HTMLElement;
      if (element) {
        this.setItemSpans(element, colSpan, rowSpan);
        console.debug(`GridLayout: Updated spans for ${widgetId} to ${colSpan}x${rowSpan}`);
        
        // Update layout to adjust for the new size
        this.updateLayout();
      }
    }
  }
  
  /**
   * Save widget spans to settings repository
   */
  private saveWidgetSpansToSettings(pageId: string, widgetId: string, colSpan: number, rowSpan: number): void {
    return; // Disable saving to settings for now
  }
  
  /**
   * Handle legacy widget size change events (for backward compatibility)
   */
  private handleWidgetSizeChange(event: Event): void {
    const customEvent = event as CustomEvent;
    const { widgetId, newSize } = customEvent.detail;
    
    console.debug(`GridLayout: Received legacy size change event for widget ${widgetId} to ${newSize}`);
    
    // Map legacy size to column spans
    const colSpan = sizeToSpanMap[newSize as GridItemSize] || 8;
    
    // Create a new spans change event and dispatch it
    const spansEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId,
        colSpan,
        rowSpan: 2 // Default to 2 rows for better proportions with the new smaller grid
      }
    });
    
    this.dispatchEvent(spansEvent);
  }

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
  
  /**
   * Try to load saved spans from settings
   */
  private async loadSavedSpans(element: HTMLElement, metadata: GridItemMetadata): Promise<void> {
    return; // Disable loading from settings for now
  }
  
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
      // Third priority: Use legacy preferredSize if available
      else if (metadata.preferredSize) {
        colSpan = sizeToSpanMap[metadata.preferredSize];
        rowSpan = 2; // Default rows for legacy sizes
        console.debug(`GridLayout: Using spans from preferredSize ${metadata.preferredSize} for ${metadata.id}: ${colSpan}x${rowSpan}`);
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
      this.saveWidgetSpansToSettings(this.dataPage, id, colSpan, rowSpan);
    }
  }
  
  /**
   * Legacy method for backward compatibility
   */
  updateItemSize(id: string, size: GridItemSize): void {
    const colSpan = sizeToSpanMap[size] || 8;
    this.updateItemSpans(id, colSpan, 2); // Use 2 rows for legacy sizes
  }
  
  /**
   * Get the maximum min-width from all items
   */
  private getMaxMinWidth(): number {
    // For the fine-grained grid, we'll always use the minColumnWidth
    return this.minColumnWidth;
  }
  
  /**
   * Update the grid layout based on container size and item requirements
   */
  updateLayout(): void {
    // Update grid style
    this.updateGridStyle();
  }
  
  /**
   * Update the grid CSS style
   */
  private updateGridStyle(): void {
    const containerWidth = this.clientWidth;
    const containerHeight = this.clientHeight || 400; // Fallback to 400px if height is 0
    const columnCount = this.totalColumns;
    const rowCount = this.totalRows;
    
    // Calculate available space after accounting for gaps
    const totalGapWidth = (columnCount - 1) * this.gridGap;
    const totalGapHeight = (rowCount - 1) * this.gridGap;
    
    const availableWidth = containerWidth - totalGapWidth;
    const availableHeight = containerHeight - totalGapHeight;
    
    // Calculate column width (minimum is minColumnWidth)
    const columnWidth = Math.max(
      this.minColumnWidth, 
      Math.floor(availableWidth / columnCount)
    );
    
    // Calculate row height to fill available space
    const rowHeight = Math.max(
      this.minRowHeight,
      Math.floor(availableHeight / rowCount)
    );
    
    // Set the grid template columns and rows CSS to fill available space
    this.gridStyle = `
      grid-template-columns: repeat(${columnCount}, minmax(${columnWidth}px, 1fr));
      grid-template-rows: repeat(${rowCount}, minmax(${rowHeight}px, 1fr));
      gap: ${this.gridGap}px;
    `;
    
    console.debug(`GridLayout: Grid sized to ${columnCount} columns x ${rowCount} rows, filling ${containerWidth}x${containerHeight}px area`);
  }
  
  /**
   * Set an item's column and row span classes
   */
  private setItemSpans(item: HTMLElement, colSpan: number, rowSpan: number): void {
    // Enforce minimum and maximum spans
    colSpan = Math.max(1, Math.min(colSpan, this.totalColumns));
    rowSpan = Math.max(1, Math.min(rowSpan, this.totalRows));
    
    // Remove existing span classes
    for (let i = 1; i <= this.totalColumns; i++) {
      item.classList.remove(`col-span-${i}`);
    }
    
    for (let i = 1; i <= this.totalRows; i++) {
      item.classList.remove(`row-span-${i}`);
    }
    
    // Add the new span classes
    item.classList.add(`col-span-${colSpan}`);
    item.classList.add(`row-span-${rowSpan}`);
    
    // Set custom property for responsive adjustments
    item.style.setProperty('--current-col-span', colSpan.toString());
    item.style.setProperty('--current-row-span', rowSpan.toString());
    
    const id = item.getAttribute('data-grid-item-id') || 'unknown';
    console.debug(`GridLayout: Set item ${id} to spans ${colSpan}x${rowSpan}`);
  }
}