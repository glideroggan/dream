import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { getWidgetById, getWidgetColumnSpan, getWidgetRowSpan } from "../../widgets/widget-registry";
import { template } from "./widget-wrapper-template";
import { styles } from "./widget-wrapper-styles";
import { createWidgetEvents, createBoundEventHandlers } from "./widget-wrapper-events";
import { WidgetTimeoutHandler } from "./widget-wrapper-timeout";
import { WidgetStateManager } from "./widget-wrapper-error-handling";
import { WidgetSizingManager } from "./widget-wrapper-sizing";
import { WidgetSettingsManager } from "./widget-wrapper-settings";
import { DEFAULT_COLUMN_SPAN, DEFAULT_ROW_SPAN, MAX_GRID_COLUMNS, MAX_GRID_ROWS } from "../../constants/grid-constants";
import { WidgetResizeTracker } from "../../utils/resize-tracker";
import { dragDropService, ResizeDirection } from "../../services/drag-drop-service";

/**
 * Widget loading states
 */
export type WidgetWrapperState = 'loading' | 'loaded' | 'error' | 'import-error' | 'timeout-warning';

@customElement({
  name: "widget-wrapper",
  template,
  styles
})
export class WidgetWrapper extends FASTElement {
  // Widget attributes
  @attr widgetTitle: string = "";
  @attr widgetId: string = "";
  @attr state: WidgetWrapperState = 'loading';
  @attr errorMessage: string = '';
  @attr({attribute: 'page-type'}) pageType: string = '';
  @attr moduleImportPath: string = '';
  @attr({ mode: "boolean" }) hideCloseButton: boolean = false;
  @attr widgetName: string = '';
  
  // Computed properties
  get displayName(): string {
    return this.widgetName || this.widgetTitle || this.widgetId || 'Unknown Widget';
  }
  @attr({ attribute: 'seamless-integration', mode: 'boolean' }) seamlessIntegration: boolean = false;
  @attr({ attribute: 'save-dimensions', mode: 'boolean' }) saveDimensions: boolean = true;
  @attr({ attribute: 'load-from-settings', mode: 'boolean' }) loadFromSettings: boolean = true;
  
  // Grid span attributes - using constants for default/max values
  @attr({ mode: "fromView" }) colSpan: number = DEFAULT_COLUMN_SPAN;
  @attr({ mode: "fromView" }) rowSpan: number = DEFAULT_ROW_SPAN;
  @attr({ mode: "boolean" }) showSizeControls: boolean = true;
  @attr maxColSpan: number = MAX_GRID_COLUMNS; // MAX_GRID_COLUMNS
  @attr maxRowSpan: number = MAX_GRID_ROWS; // Changed from 12 to 24 to allow taller widgets
  @attr minColSpan: number = 1;
  @attr minRowSpan: number = 1;

  // NOTE: colSpanChanged is intentionally removed to prevent infinite loops.
  // The sizingManager.changeSpans() method handles span updates directly.
  // Triggering changeSpans from an attribute change callback creates a loop:
  // colSpan setter -> colSpanChanged -> changeSpans -> colSpan setter -> ...

  // Timeout configuration
  @attr({ mode: "fromView" }) warningTimeout: number = 5000; // 5 seconds for warning
  @attr({ mode: "fromView" }) failureTimeout: number = 10000; // 10 seconds for auto-failure

  // Widget definition object
  @observable _widgetDefinition: any = null;



  // Events
  events: ReturnType<typeof createWidgetEvents>;
  
  // Managers for different aspects of widget wrapper
  timeoutHandler: WidgetTimeoutHandler;
  stateManager: WidgetStateManager;
  sizingManager: WidgetSizingManager;
  settingsManager: WidgetSettingsManager;
  
  // Event handlers
  private eventHandlers: ReturnType<typeof createBoundEventHandlers>;
  
  // Track initialization state
  initialized: boolean = false;
  private connectedEventDispatched: boolean = false;

  // Add new properties for content-aware resizing
  resizeTracker: WidgetResizeTracker;
  contentResizeObserver: ResizeObserver | null = null;
  isManuallyResized: boolean = false;
  autoSizeEnabled: boolean = true;
  
  @attr({ mode: "boolean" }) enableAutoSize: boolean = true;

  // Drag and drop state
  @observable isDragging: boolean = false;
  private resizePointerId: number | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;
  private boundHandleDragEnd: ((e: DragEvent) => void) | null = null;
  private boundHandleDragStart: ((e: DragEvent) => void) | null = null;
  private boundHandleDragEndLocal: ((e: DragEvent) => void) | null = null;

  constructor() {
    super();
    
    // Create custom events
    this.events = createWidgetEvents(this.widgetId, this.pageType);
    
    // Initialize managers first
    this.stateManager = new WidgetStateManager(this);
    this.sizingManager = new WidgetSizingManager(this);
    this.settingsManager = new WidgetSettingsManager(this);
    
    // Initialize timeout handler
    this.timeoutHandler = new WidgetTimeoutHandler(
      this.widgetId || 'unknown',
      // Warning timeout callback
      () => {
        if (this.state === 'loading') {
          this.state = 'timeout-warning';
        }
      },
      // Failure timeout callback
      () => {
        this.state = 'error';
        this.errorMessage = `Widget failed to initialize within ${this.failureTimeout / 1000} seconds`;
      },
      this.warningTimeout,
      this.failureTimeout
    );

    // Initialize resize tracker with default row span
    this.resizeTracker = new WidgetResizeTracker(this.rowSpan);
    
    // Create bound event handlers - provide explicit handlers from state manager
    this.eventHandlers = createBoundEventHandlers(this, {
      handleChildError: this.handleChildError,
      handleInitialized: this.handleInitialized,
      handleModuleError: this.handleModuleError
    });
  }

  // These handler methods delegate to the state manager
  handleChildError(event: Event): void {
    this.stateManager.handleChildError(event);
  }
  
  handleInitialized(event: Event): void {
    this.stateManager.handleInitialized(event);
  }
  
  handleModuleError(event: Event): void {
    this.stateManager.handleModuleError(event);
  }

  connectedCallback() {
    super.connectedCallback();

    // Prevent unwanted tooltips by removing any title attribute from the host element
    if (this.hasAttribute('title')) {
      this.removeAttribute('title');
    }
    
    // Ensure data attributes are consistent - this is critical for grid layout to find the wrapper
    this.setAttribute('data-widget-id', this.widgetId);
    
    // Make the host element draggable (avoids shadow DOM issues with drag events)
    this.setAttribute('draggable', 'true');
    this.boundHandleDragStart = this.handleDragStart.bind(this);
    this.boundHandleDragEndLocal = this.handleDragEnd.bind(this);
    this.addEventListener('dragstart', this.boundHandleDragStart);
    this.addEventListener('dragend', this.boundHandleDragEndLocal);
    
    // Get widget info from registry
    this.updateWidgetDefinition();
    
    // Load dimensions from settings if enabled
    if (this.loadFromSettings && this.pageType && this.widgetId) {
      this.settingsManager.loadDimensionsFromSettings();
    } else {
      // If spans are not set explicitly, get them from widget definition
      if (this._widgetDefinition) {
        if (!this.hasAttribute('colSpan') && this._widgetDefinition.colSpan) {
          this.colSpan = this._widgetDefinition.colSpan;
          console.debug(`Widget wrapper ${this.widgetId} setting colSpan from registry: ${this.colSpan}`);
        }
        
        if (!this.hasAttribute('rowSpan') && this._widgetDefinition.rowSpan) {
          this.rowSpan = this._widgetDefinition.rowSpan;
          console.debug(`Widget wrapper ${this.widgetId} setting rowSpan from registry: ${this.rowSpan}`);
        }
      } else {
        // If no definition, get spans directly from registry functions
        if (!this.hasAttribute('colSpan')) {
          const colSpan = this.getWidgetColumnSpanFromRegistry();
          if (colSpan) {
            this.colSpan = colSpan;
            console.debug(`Widget wrapper ${this.widgetId} setting colSpan from registry function: ${this.colSpan}`);
          }
        }
        
        if (!this.hasAttribute('rowSpan')) {
          const rowSpan = this.getWidgetRowSpanFromRegistry();
          if (rowSpan) {
            this.rowSpan = rowSpan;
            console.debug(`Widget wrapper ${this.widgetId} setting rowSpan from registry function: ${this.rowSpan}`);
          }
        }
      }
    }
    
    console.debug(`Widget wrapper connected: ${this.displayName}, spans: ${this.colSpan}x${this.rowSpan}`);

    // Start timeout tracking if in loading state
    if (this.state === 'loading') {
      this.timeoutHandler.startTracking();
    }

    // Update event details with current widget ID and page type
    this.events.updateEventDetails(this.widgetId, this.pageType);

    // Use bound event handlers to ensure proper 'this' context
    this.addEventListener('error', this.eventHandlers.handleChildError);
    this.addEventListener('initialized', this.eventHandlers.handleInitialized);
    this.addEventListener('load-complete', this.eventHandlers.handleInitialized);
    
    // Listen for dragend at document level since widget has pointer-events: none during drag
    this.boundHandleDragEnd = this.handleDocumentDragEnd.bind(this);
    document.addEventListener('dragend', this.boundHandleDragEnd);

    // Also listen for module errors that bubble up from widget-service
    document.addEventListener('widget-module-error', this.eventHandlers.handleModuleError);

    // Listen for resize requests from the widget
    // this.addEventListener('widget-request-resize', this.handleResizeRequest.bind(this));

    // Check for existing error in widget service
    this.stateManager.checkForExistingErrors();

    // Check if we need to load the module for this widget
    this.stateManager.initializeWidgetModule();

    this.addEventListener('content-change', this.sizingManager.handleContentChange.bind(this.sizingManager));
    // Set up content resize observer
    // if (this.enableAutoSize) {
    //   this.sizingManager.setupContentResizeObserver();
    // }
    
    // Listen for content overflow events from the widget
    // this.addEventListener('widget-request-resize', this.sizingManager.handleResizeRequest.bind(this.sizingManager));
    
    // Listen for content shrink events
    // this.addEventListener('widget-content-shrink', this.sizingManager.handleContentShrink.bind(this.sizingManager));

    console.debug(`Widget wrapper connected: ${this.displayName}, spans: ${this.colSpan}x${this.rowSpan}`);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.timeoutHandler.clearTracking();

    // Remove bound event listeners
    this.removeEventListener('error', this.eventHandlers.handleChildError);
    this.removeEventListener('initialized', this.eventHandlers.handleInitialized);
    this.removeEventListener('load-complete', this.eventHandlers.handleInitialized);
    document.removeEventListener('widget-module-error', this.eventHandlers.handleModuleError);
    
    // Remove document-level drag end listener
    if (this.boundHandleDragEnd) {
      document.removeEventListener('dragend', this.boundHandleDragEnd);
      this.boundHandleDragEnd = null;
    }
    
    // Remove host-level drag listeners
    if (this.boundHandleDragStart) {
      this.removeEventListener('dragstart', this.boundHandleDragStart);
      this.boundHandleDragStart = null;
    }
    if (this.boundHandleDragEndLocal) {
      this.removeEventListener('dragend', this.boundHandleDragEndLocal);
      this.boundHandleDragEndLocal = null;
    }

    this.removeEventListener('content-change', this.sizingManager.handleContentChange.bind(this.sizingManager));
    
    // Remove resize-related event listeners
    // this.removeEventListener('widget-request-resize', this.handleResizeRequest.bind(this));
    // this.removeEventListener('widget-request-resize', this.sizingManager.handleResizeRequest.bind(this.sizingManager));
    // this.removeEventListener('widget-content-shrink', this.sizingManager.handleContentShrink.bind(this.sizingManager));

    // Clean up content resize observer
    // if (this.contentResizeObserver) {
    //   this.contentResizeObserver.disconnect();
    //   this.contentResizeObserver = null;
    // }
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    // Make sure stateManager is initialized before using it
    // Handle state changes
    if (name === 'state' && oldValue !== newValue && this.stateManager) {
      this.stateManager.handleStateChange(oldValue as WidgetWrapperState, newValue as WidgetWrapperState);
    }

    // Handle widget ID changes
    if ((name === 'widgetId' || name === 'widget-id') && oldValue !== newValue) {
      // For consistency, always use widgetId internally
      if (name === 'widget-id') {
        this.widgetId = newValue;
      }

      // Update widget definition
      this.updateWidgetDefinition();

      // Update event details if events object is initialized
      if (this.events) {
        this.events.updateEventDetails(this.widgetId, this.pageType);
      }
      
      // Update timeout handler if initialized
      if (this.timeoutHandler) {
        this.timeoutHandler = new WidgetTimeoutHandler(
          this.widgetId || 'unknown',
          () => { if (this.state === 'loading') this.state = 'timeout-warning'; },
          () => {
            this.state = 'error';
            this.errorMessage = `Widget failed to initialize within ${this.failureTimeout / 1000} seconds`;
          },
          this.warningTimeout,
          this.failureTimeout
        );
      }
    }

    // Handle page type changes
    if ((name === 'pageType' || name === 'page-type') && oldValue !== newValue && this.events) {
      this.events.updateEventDetails(this.widgetId, newValue);
    }

    // Handle timeout configuration changes
    if ((name === 'warningTimeout' || name === 'warning-timeout') && oldValue !== newValue && this.timeoutHandler) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 5000;
      this.warningTimeout = numericValue;
      this.timeoutHandler.updateTimeouts(numericValue);
    }

    if ((name === 'failureTimeout' || name === 'failure-timeout') && oldValue !== newValue && this.timeoutHandler) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 10000;
      this.failureTimeout = numericValue;
      this.timeoutHandler.updateTimeouts(undefined, numericValue);
    }
  }

  /**
   * Update widget definition from registry
   */
  private updateWidgetDefinition(): void {
    if (this.widgetId) {
      this._widgetDefinition = this.getWidgetFromRegistry();
      console.debug(`Widget definition for ${this.widgetId}:`, this._widgetDefinition);
    }
  }

  /**
   * Get widget definition from registry
   */
  getWidgetFromRegistry(): any {
    return getWidgetById(this.widgetId);
  }

  /**
   * Get column span from registry
   */
  getWidgetColumnSpanFromRegistry(): number {
    return getWidgetColumnSpan(this.widgetId);
  }

  /**
   * Get row span from registry
   */
  getWidgetRowSpanFromRegistry(): number {
    return getWidgetRowSpan(this.widgetId);
  }

  /**
   * Handle resize requests from widgets - delegate to sizing manager
   */
  // handleResizeRequest(event: Event): void {
  //   this.sizingManager.handleResizeRequest(event);
  // }

  /**
   * Request retry of widget load - delegate to state manager
   */
  retry() {
    this.stateManager.retry();
  }

  /**
   * Dismiss the failed widget - delegate to state manager
   */
  dismiss() {
    this.stateManager.dismiss();
  }

  /**
   * Cancel a slow-loading widget - delegate to state manager
   */
  cancel() {
    this.stateManager.cancel();
  }

  /**
   * Close the widget - delegate to state manager
   */
  closeWidget() {
    this.stateManager.closeWidget();
  }

  /**
   * Change widget spans - delegate to sizing manager
   */
  // changeSpans(newColSpan: number, newRowSpan: number, isUserResized: boolean = true, isContentShrink: boolean = false, detail: any = {}): void {
  //   this.sizingManager.changeSpans(newColSpan, newRowSpan, isUserResized, isContentShrink, detail);
  // }

  /**
   * Increase column span - delegate to sizing manager
   */
  increaseColSpan(): void {
    this.sizingManager.increaseColSpan();
  }
  
  /**
   * Decrease column span - delegate to sizing manager
   */
  decreaseColSpan(): void {
    this.sizingManager.decreaseColSpan();
  }
  
  /**
   * Increase row span - delegate to sizing manager
   */
  increaseRowSpan(): void {
    this.sizingManager.increaseRowSpan();
  }
  
  /**
   * Decrease row span - delegate to sizing manager
   */
  decreaseRowSpan(): void {
    this.sizingManager.decreaseRowSpan();
  }

/**
   * Toggle auto-sizing behavior - delegate to sizing manager
   */
  // toggleAutoSize(): void {
  //   this.sizingManager.toggleAutoSize();
  // }

  // ================== DRAG AND DROP HANDLERS ==================

  /**
   * Handle drag start for widget move (HTML5 Drag and Drop)
   */
  handleDragStart(event: DragEvent): void {
    if (!event.dataTransfer) return;

    this.isDragging = true;
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.widgetId);
    event.dataTransfer.setData('application/x-widget-id', this.widgetId);
    
    // Find grid layout parent
    const gridElement = this.closest('grid-layout') as HTMLElement;
    const widgetElement = this.closest('[data-grid-item-id]') as HTMLElement || this;
    
    // Ensure we have numeric values for spans
    const currentColSpan = Number(this.colSpan) || 1;
    const currentRowSpan = Number(this.rowSpan) || 1;
    
    if (gridElement) {
      dragDropService.startMove(
        this.widgetId,
        widgetElement,
        gridElement,
        event.clientX,
        event.clientY,
        0, // startCol - will be calculated from current position
        0, // startRow - will be calculated from current position
        currentColSpan,
        currentRowSpan
      );
    }

    // Add dragging class for visual feedback - add to both this element and parent
    // Use requestAnimationFrame to delay the visual change until after the drag has started
    // This prevents the browser from cancelling the drag or failing to create the ghost image
    // due to immediate DOM/style changes during the dragstart event
    requestAnimationFrame(() => {
      this.classList.add('widget-dragging');
      widgetElement?.classList.add('widget-dragging');
    });
    

    
    console.info(`Widget ${this.widgetId}: Drag started with spans ${currentColSpan}x${currentRowSpan}`);
  }

  /**
   * Handle drag end for widget move
   */
  handleDragEnd(event: DragEvent): void {
    this.cleanupDragState();
  }

  /**
   * Handle drag end at document level (fires even when widget has pointer-events: none)
   */
  handleDocumentDragEnd(event: DragEvent): void {
    // Only clean up if this widget is currently dragging
    if (this.isDragging) {
      this.cleanupDragState();
    }
  }

  /**
   * Shared cleanup logic for drag end
   */
  private cleanupDragState(): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Remove dragging class from both this element and parent
    this.classList.remove('widget-dragging');
    const widgetElement = this.closest('[data-grid-item-id]') as HTMLElement || this;
    widgetElement?.classList.remove('widget-dragging');
    
    dragDropService.endDrag();
    
    console.info(`Widget ${this.widgetId}: Drag ended`);
  }

  /**
   * Handle resize start (Pointer Events for precise control)
   */
  handleResizeStart(event: PointerEvent, direction: ResizeDirection): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Capture pointer for this element
    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.resizePointerId = event.pointerId;
    
    this.isDragging = true;
    
    // Find grid layout parent
    const gridElement = this.closest('grid-layout') as HTMLElement;
    const widgetElement = this.closest('[data-grid-item-id]') as HTMLElement || this;
    
    // Ensure we have numeric values for spans
    const currentColSpan = Number(this.colSpan) || 1;
    const currentRowSpan = Number(this.rowSpan) || 1;
    
    console.debug(`Widget ${this.widgetId}: Starting resize with spans ${currentColSpan}x${currentRowSpan}`);
    
    if (gridElement) {
      dragDropService.startResize(
        this.widgetId,
        widgetElement,
        gridElement,
        direction,
        event.clientX,
        event.clientY,
        currentColSpan,
        currentRowSpan
      );
    }
    
    // Add resize class for visual feedback
    widgetElement?.classList.add('widget-resizing');
    document.body.style.cursor = this.getCursorForDirection(direction);
    
    // Set up global pointer move/up listeners
    this.boundPointerMove = this.handleResizeMove.bind(this);
    this.boundPointerUp = this.handleResizeEnd.bind(this);
    
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
    document.addEventListener('pointercancel', this.boundPointerUp);
    
    console.debug(`Widget ${this.widgetId}: Resize started (${direction})`);
  }

  /**
   * Handle resize move
   */
  private handleResizeMove(event: PointerEvent): void {
    if (!dragDropService.isDragging()) return;
    
    event.preventDefault();
    
    // Update position in service
    dragDropService.updatePosition(event.clientX, event.clientY);
    
    // Get grid element and calculate new spans
    const gridElement = this.closest('grid-layout') as HTMLElement;
    if (gridElement) {
      const cellInfo = dragDropService.getGridCellInfo(gridElement);
      const { newColSpan, newRowSpan } = dragDropService.getNewSpans(cellInfo);
      
      console.debug(`Resize move: calculated spans ${newColSpan}x${newRowSpan}, cell size ${cellInfo.cellWidth}x${cellInfo.cellHeight}`);
      
      // Clamp to valid range
      const clampedColSpan = Math.max(this.minColSpan, Math.min(newColSpan, this.maxColSpan));
      const clampedRowSpan = Math.max(this.minRowSpan, Math.min(newRowSpan, this.maxRowSpan));
      
      // Update spans if changed (visual preview during drag)
      if (clampedColSpan !== this.colSpan || clampedRowSpan !== this.rowSpan) {
        console.debug(`Resize: updating spans from ${this.colSpan}x${this.rowSpan} to ${clampedColSpan}x${clampedRowSpan}`);
        // Update spans for visual feedback
        this.sizingManager.changeSpans(clampedColSpan, clampedRowSpan, true, false);
      }
    }
  }

  /**
   * Handle resize end
   */
  private handleResizeEnd(event: PointerEvent): void {
    if (this.resizePointerId !== null) {
      const target = event.target as HTMLElement;
      try {
        target.releasePointerCapture(this.resizePointerId);
      } catch (e) {
        // Ignore if pointer capture was already released
      }
      this.resizePointerId = null;
    }
    
    this.isDragging = false;
    
    const widgetElement = this.closest('[data-grid-item-id]') as HTMLElement || this;
    widgetElement?.classList.remove('widget-resizing');
    document.body.style.cursor = '';
    
    // Remove global listeners
    if (this.boundPointerMove) {
      document.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      document.removeEventListener('pointerup', this.boundPointerUp);
      document.removeEventListener('pointercancel', this.boundPointerUp);
      this.boundPointerUp = null;
    }
    
    // Finalize the resize
    const result = dragDropService.endDrag();
    
    // Save dimensions if this was a successful resize
    if (result.success && this.saveDimensions) {
      this.settingsManager.saveDimensionsToSettings(this.colSpan, this.rowSpan);
    }
    
    console.debug(`Widget ${this.widgetId}: Resize ended - final size ${this.colSpan}x${this.rowSpan}`);
  }

  /**
   * Get appropriate cursor for resize direction
   */
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
