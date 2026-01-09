/**
 * Widget Wrapper V2
 * A simplified widget wrapper that:
 * - Provides consistent UI (header, loading, error states)
 * - Handles resize via drag handles (8 directions)
 * - Handles drag via header
 * - Uses centralized GridService for all positioning logic
 * - Loads widget modules via widgetService
 */

import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { template } from "./widget-wrapper-v2-template";
import { styles } from "./widget-wrapper-v2-styles";
import { gridService, ResizeDirection } from "../../services/grid-service";
import { getWidgetById, getWidgetColumnSpan, getWidgetRowSpan } from "../../widgets/widget-registry";
import { GridLayoutV2 } from "../grid-layout-v2";
import { widgetService } from "../../services/widget-service";

/**
 * Widget loading states
 */
export type WidgetState = 'loading' | 'loaded' | 'error' | 'timeout';

@customElement({
  name: "widget-wrapper-v2",
  template,
  styles
})
export class WidgetWrapperV2 extends FASTElement {
  // ============================================
  // Attributes
  // ============================================
  
  @attr({ attribute: 'widget-id' }) widgetId: string = "";
  @attr({ attribute: 'widget-title' }) widgetTitle: string = "";
  @attr({ attribute: 'page-type' }) pageType: string = '';
  @attr({ mode: "boolean", attribute: 'hide-close' }) hideClose: boolean = false;
  @attr({ mode: "boolean", attribute: 'show-size-controls' }) showSizeControls: boolean = true;
  
  // Grid position and size (1-based)
  @attr({ mode: "fromView", attribute: 'col-span' }) colSpan: number = 8;
  @attr({ mode: "fromView", attribute: 'row-span' }) rowSpan: number = 4;
  @attr({ mode: "fromView", attribute: 'grid-col' }) gridCol: number = 1;
  @attr({ mode: "fromView", attribute: 'grid-row' }) gridRow: number = 1;
  
  // Min/max constraints
  @attr({ mode: "fromView", attribute: 'min-col-span' }) minColSpan: number = 1;
  @attr({ mode: "fromView", attribute: 'min-row-span' }) minRowSpan: number = 1;
  @attr({ mode: "fromView", attribute: 'max-col-span' }) maxColSpan: number = 24;
  @attr({ mode: "fromView", attribute: 'max-row-span' }) maxRowSpan: number = 30;
  
  // Timeout configuration (ms)
  @attr({ mode: "fromView", attribute: 'warning-timeout' }) warningTimeout: number = 5000;
  @attr({ mode: "fromView", attribute: 'failure-timeout' }) failureTimeout: number = 10000;
  
  // ============================================
  // Observable/Attribute State
  // ============================================
  
  @attr state: WidgetState = 'loading';
  @attr({ attribute: 'error-message' }) errorMessage: string = '';
  @observable isDragging: boolean = false;
  @observable isResizing: boolean = false;
  @observable isSettingsOpen: boolean = false;
  
  // ============================================
  // Computed Properties
  // ============================================
  
  get displayName(): string {
    if (this.widgetTitle) return this.widgetTitle;
    const def = getWidgetById(this.widgetId);
    return def?.name || this.widgetId || 'Widget';
  }
  
  // ============================================
  // Private State
  // ============================================
  
  private resizePointerId: number | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;
  private warningTimeoutId: number | null = null;
  private failureTimeoutId: number | null = null;
  
  // ============================================
  // Lifecycle
  // ============================================
  
  connectedCallback(): void {
    super.connectedCallback();
    
    // Set data attributes for grid layout to find us
    this.setAttribute('data-widget-id', this.widgetId);
    this.setAttribute('data-grid-item-id', this.widgetId);
    
    // Make draggable
    this.setAttribute('draggable', 'true');
    this.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.addEventListener('dragend', this.handleDragEnd.bind(this));
    
    // Load default spans from registry if not set
    if (!this.hasAttribute('col-span')) {
      this.colSpan = getWidgetColumnSpan(this.widgetId);
    }
    if (!this.hasAttribute('row-span')) {
      this.rowSpan = getWidgetRowSpan(this.widgetId);
    }
    
    // Listen for initialization events from child widget
    this.addEventListener('initialized', this.handleWidgetReady.bind(this));
    this.addEventListener('load-complete', this.handleWidgetReady.bind(this));
    this.addEventListener('error', this.handleWidgetError.bind(this));
    
    // Start timeout tracking
    this.startTimeoutTracking();
    
    // Initialize widget module loading
    this.initializeWidgetModule();
    
    console.debug(`WidgetWrapperV2: Connected ${this.widgetId}`);
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTimeoutTracking();
    this.cleanupResize();
  }
  
  // ============================================
  // Timeout Handling
  // ============================================
  
  private startTimeoutTracking(): void {
    if (this.state !== 'loading') return;
    
    // Warning timeout
    this.warningTimeoutId = window.setTimeout(() => {
      if (this.state === 'loading') {
        console.warn(`WidgetWrapperV2: ${this.widgetId} taking too long to load`);
      }
    }, this.warningTimeout);
    
    // Failure timeout
    this.failureTimeoutId = window.setTimeout(() => {
      if (this.state === 'loading') {
        this.state = 'timeout';
        this.errorMessage = `Widget failed to load within ${this.failureTimeout / 1000} seconds`;
      }
    }, this.failureTimeout);
  }
  
  private clearTimeoutTracking(): void {
    if (this.warningTimeoutId !== null) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    if (this.failureTimeoutId !== null) {
      clearTimeout(this.failureTimeoutId);
      this.failureTimeoutId = null;
    }
  }
  
  // ============================================
  // Attribute Change Handlers
  // ============================================
  
  /**
   * Called when state attribute changes - clear timeouts when loaded
   */
  stateChanged(oldValue: WidgetState, newValue: WidgetState): void {
    if (newValue === 'loaded' || newValue === 'error' || newValue === 'timeout') {
      this.clearTimeoutTracking();
    }
    console.debug(`WidgetWrapperV2: ${this.widgetId} state changed: ${oldValue} -> ${newValue}`);
  }
  
  // ============================================
  // Module Loading
  // ============================================
  
  /**
   * Initialize the widget module loading process
   */
  private async initializeWidgetModule(): Promise<void> {
    if (!this.widgetId) {
      console.error("WidgetWrapperV2: Cannot initialize widget module - widget ID is missing");
      this.state = 'error';
      this.errorMessage = "Missing widget ID";
      return;
    }

    try {
      // Get the widget definition from registry
      const widgetDef = widgetService.getWidget(this.widgetId);
      if (!widgetDef) {
        throw new Error(`Widget with ID "${this.widgetId}" not found in registry`);
      }

      // Check if the widget module is already loaded
      if (widgetService.isWidgetLoaded(this.widgetId)) {
        console.debug(`WidgetWrapperV2: ${this.widgetId} module already loaded`);
        return;
      }

      // Check if there are existing errors for this widget
      if (widgetService.hasLoadError(this.widgetId)) {
        const errorMessage = widgetService.getLoadErrorMessage(this.widgetId) || "Unknown widget loading error";
        this.state = 'error';
        this.errorMessage = errorMessage;
        return;
      }

      // Use widget service to load the module
      console.debug(`WidgetWrapperV2: Loading module for ${this.widgetId}`);
      await widgetService.loadWidgetModule(widgetDef);
      console.debug(`WidgetWrapperV2: ${this.widgetId} module loaded successfully`);
    } catch (error) {
      console.error(`WidgetWrapperV2: Error initializing widget ${this.widgetId}:`, error);
      this.state = 'error';
      this.errorMessage = error instanceof Error ? error.message : `Unknown error loading widget ${this.widgetId}`;
    }
  }
  
  // ============================================
  // Widget State Handlers
  // ============================================
  
  private handleWidgetReady(event: Event): void {
    event.stopPropagation();
    this.clearTimeoutTracking();
    this.state = 'loaded';
    console.debug(`WidgetWrapperV2: ${this.widgetId} loaded successfully`);
  }
  
  private handleWidgetError(event: Event): void {
    event.stopPropagation();
    this.clearTimeoutTracking();
    this.state = 'error';
    this.errorMessage = (event as CustomEvent).detail?.message || 'Widget failed to load';
    console.error(`WidgetWrapperV2: ${this.widgetId} error:`, this.errorMessage);
  }
  
  // ============================================
  // Public Actions
  // ============================================
  
  retry(): void {
    this.state = 'loading';
    this.errorMessage = '';
    this.startTimeoutTracking();
    
    // Dispatch event for widget to retry
    this.dispatchEvent(new CustomEvent('widget-retry', {
      bubbles: true,
      composed: true,
      detail: { widgetId: this.widgetId }
    }));
  }
  
  dismiss(): void {
    this.dispatchEvent(new CustomEvent('close-widget', {
      bubbles: true,
      composed: true,
      detail: { widgetId: this.widgetId, pageType: this.pageType }
    }));
  }
  
  closeWidget(): void {
    this.dismiss();
  }
  
  toggleSettings(): void {
    this.isSettingsOpen = !this.isSettingsOpen;
  }
  
  closeSettings(): void {
    this.isSettingsOpen = false;
  }
  
  // ============================================
  // Settings Handlers
  // ============================================
  
  handleColSpanChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);
    if (!isNaN(newValue) && newValue >= this.minColSpan && newValue <= this.maxColSpan) {
      this.colSpan = newValue;
      this.updateGridPosition();
    }
  }
  
  handleRowSpanChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);
    if (!isNaN(newValue) && newValue >= this.minRowSpan && newValue <= this.maxRowSpan) {
      this.rowSpan = newValue;
      this.updateGridPosition();
    }
  }
  
  private updateGridPosition(): void {
    // Update grid service
    gridService.updatePosition(this.widgetId, {
      col: this.gridCol,
      row: this.gridRow,
      colSpan: this.colSpan,
      rowSpan: this.rowSpan,
    });
    
    // Apply inline styles
    this.style.gridColumn = `${this.gridCol} / span ${this.colSpan}`;
    this.style.gridRow = `${this.gridRow} / span ${this.rowSpan}`;
    
    // Dispatch change event
    this.dispatchEvent(new CustomEvent('widget-resized', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.widgetId,
        colSpan: this.colSpan,
        rowSpan: this.rowSpan,
        gridCol: this.gridCol,
        gridRow: this.gridRow,
      }
    }));
  }
  
  // ============================================
  // Drag Handlers (for moving widget)
  // ============================================
  
  handleDragStart(event: DragEvent): void {
    if (!event.dataTransfer) return;
    
    this.isDragging = true;
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.widgetId);
    event.dataTransfer.setData('application/x-widget-id', this.widgetId);
    
    // Find grid layout and start drag via service
    const gridLayout = this.closest('grid-layout-v2') as GridLayoutV2;
    if (gridLayout) {
      gridLayout.startDrag(this.widgetId, event.clientX, event.clientY);
    }
    
    // Visual feedback (delayed to not interfere with drag ghost)
    requestAnimationFrame(() => {
      this.classList.add('widget-dragging');
    });
    
    console.debug(`WidgetWrapperV2: Drag started for ${this.widgetId}`);
  }
  
  handleDragEnd(event: DragEvent): void {
    this.isDragging = false;
    this.classList.remove('widget-dragging');
    console.debug(`WidgetWrapperV2: Drag ended for ${this.widgetId}`);
  }
  
  // ============================================
  // Resize Handlers
  // ============================================
  
  handleResizeStart(event: PointerEvent, direction: ResizeDirection): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Capture pointer
    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.resizePointerId = event.pointerId;
    
    this.isResizing = true;
    this.classList.add('widget-resizing');
    
    // Start resize via grid layout
    const gridLayout = this.closest('grid-layout-v2') as GridLayoutV2;
    if (gridLayout) {
      gridLayout.startResize(this.widgetId, direction, event.clientX, event.clientY);
    }
    
    // Set up global listeners
    this.boundPointerMove = this.handleResizeMove.bind(this);
    this.boundPointerUp = this.handleResizeEnd.bind(this);
    
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
    document.addEventListener('pointercancel', this.boundPointerUp);
    
    // Set cursor
    document.body.style.cursor = this.getCursorForDirection(direction);
    
    console.debug(`WidgetWrapperV2: Resize started (${direction}) for ${this.widgetId}`);
  }
  
  private handleResizeMove(event: PointerEvent): void {
    event.preventDefault();
    
    const gridLayout = this.closest('grid-layout-v2') as GridLayoutV2;
    if (gridLayout) {
      gridLayout.updateResize(event.clientX, event.clientY);
    }
  }
  
  private handleResizeEnd(event: PointerEvent): void {
    // Release pointer capture
    if (this.resizePointerId !== null) {
      const target = event.target as HTMLElement;
      try {
        target.releasePointerCapture(this.resizePointerId);
      } catch (e) {
        // Ignore if already released
      }
      this.resizePointerId = null;
    }
    
    this.isResizing = false;
    this.classList.remove('widget-resizing');
    document.body.style.cursor = '';
    
    // End resize via grid layout
    const gridLayout = this.closest('grid-layout-v2') as GridLayoutV2;
    if (gridLayout) {
      gridLayout.endResize();
    }
    
    // Update our local state from grid service
    const position = gridService.getPosition(this.widgetId);
    if (position) {
      this.gridCol = position.col;
      this.gridRow = position.row;
      this.colSpan = position.colSpan;
      this.rowSpan = position.rowSpan;
    }
    
    this.cleanupResize();
    
    console.debug(`WidgetWrapperV2: Resize ended for ${this.widgetId}`);
  }
  
  private cleanupResize(): void {
    if (this.boundPointerMove) {
      document.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      document.removeEventListener('pointerup', this.boundPointerUp);
      document.removeEventListener('pointercancel', this.boundPointerUp);
      this.boundPointerUp = null;
    }
  }
  
  private getCursorForDirection(direction: ResizeDirection): string {
    const cursorMap: Record<ResizeDirection, string> = {
      'n': 'ns-resize',
      's': 'ns-resize',
      'e': 'ew-resize',
      'w': 'ew-resize',
      'ne': 'nesw-resize',
      'sw': 'nesw-resize',
      'nw': 'nwse-resize',
      'se': 'nwse-resize',
    };
    return cursorMap[direction] || 'default';
  }
}
