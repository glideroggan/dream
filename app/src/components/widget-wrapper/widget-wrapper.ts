import { FASTElement, customElement, observable, attr } from "@microsoft/fast-element";
import { getWidgetById, getWidgetColumnSpan, getWidgetRowSpan } from "../../widgets/widget-registry";
import { widgetService } from "../../services/widget-service";
import { template } from "./widget-wrapper-template";
import { styles } from "./widget-wrapper-styles";
import { createWidgetEvents, createBoundEventHandlers, isModuleError } from "./widget-wrapper-events";
import { WidgetTimeoutHandler } from "./widget-wrapper-timeout";
import { repositoryService } from "../../services/repository-service";

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
  
  // Grid span attributes
  @attr({ mode: "fromView" }) colSpan: number = 8; // Default to half width (8/16 columns)
  @attr({ mode: "fromView" }) rowSpan: number = 1; // Default to single row
  @attr({ mode: "boolean" }) showSizeControls: boolean = true;
  @attr maxColSpan: number = 16;
  @attr maxRowSpan: number = 16; 
  @attr minColSpan: number = 1;
  @attr minRowSpan: number = 1;

  // Timeout configuration
  @attr({ mode: "fromView" }) warningTimeout: number = 5000; // 5 seconds for warning
  @attr({ mode: "fromView" }) failureTimeout: number = 10000; // 10 seconds for auto-failure

  // Widget definition object
  @observable private _widgetDefinition: any = null;

  // Events
  private events: ReturnType<typeof createWidgetEvents>;
  
  // Timeout handler
  private timeoutHandler: WidgetTimeoutHandler;
  
  // Event handlers
  private eventHandlers: ReturnType<typeof createBoundEventHandlers>;
  
  // Track initialization state
  private initialized: boolean = false;
  private connectedEventDispatched: boolean = false;

  constructor() {
    super();
    
    // Create custom events
    this.events = createWidgetEvents(this.widgetId, this.pageType);
    
    // Create bound event handlers
    this.eventHandlers = createBoundEventHandlers(this);
    
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
  }

  connectedCallback() {
    super.connectedCallback();

    // Prevent unwanted tooltips by removing any title attribute from the host element
    if (this.hasAttribute('title')) {
      this.removeAttribute('title');
    }
    
    // Ensure data attributes are consistent - this is critical for grid layout to find the wrapper
    this.setAttribute('data-widget-id', this.widgetId);
    
    // If we're inside a grid item, ensure it has consistent data attributes
    const parentElement = this.parentElement;
    if (parentElement) {
      parentElement.setAttribute('data-grid-item-id', this.widgetId);
      parentElement.setAttribute('data-widget-id', this.widgetId);
    }
    
    // Get widget info from registry
    this.updateWidgetDefinition();
    
    // Load dimensions from settings if enabled
    if (this.loadFromSettings && this.pageType && this.widgetId) {
      this.loadDimensionsFromSettings();
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
          const colSpan = getWidgetColumnSpan(this.widgetId);
          if (colSpan) {
            this.colSpan = colSpan;
            console.debug(`Widget wrapper ${this.widgetId} setting colSpan from registry function: ${this.colSpan}`);
          }
        }
        
        if (!this.hasAttribute('rowSpan')) {
          const rowSpan = getWidgetRowSpan(this.widgetId);
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

    // Also listen for module errors that bubble up from widget-service
    document.addEventListener('widget-module-error', this.eventHandlers.handleModuleError);

    // Listen for resize requests from the widget
    this.addEventListener('widget-request-resize', this.handleResizeRequest.bind(this));

    // Check for existing error in widget service
    this.checkForExistingErrors();

    // Check if we need to load the module for this widget
    this.initializeWidgetModule();

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
    this.removeEventListener('widget-request-resize', this.handleResizeRequest.bind(this));
  }

  /**
   * Check if the widget service already has errors for this widget
   */
  private checkForExistingErrors(): void {
    if (!this.widgetId) return;

    if (widgetService.hasLoadError(this.widgetId)) {
      const errorMessage = widgetService.getLoadErrorMessage(this.widgetId);

      // Check if it's an import error or other error
      if (isModuleError(errorMessage)) {
        // It's an import error
        this.handleImportError(errorMessage);
      } else {
        // Standard error
        this.state = 'error';
        this.errorMessage = errorMessage || 'Unknown widget error';
      }
    }
  }

  /**
   * Handle widget module error events
   */
  handleModuleError(event: Event): void {
    const customEvent = event as CustomEvent;
    const { widgetId, error, modulePath } = customEvent.detail;

    // Only process if it's for our widget
    if (widgetId !== this.widgetId) return;

    console.debug(`Widget ${this.widgetId} received module error:`, error);

    // Handle as an import error
    this.handleImportError(error?.message || 'Failed to load widget module', modulePath);
  }

  /**
   * Handle import errors specifically
   */
  private handleImportError(errorMessage: string | undefined, modulePath?: string): void {
    this.state = 'import-error';
    this.errorMessage = errorMessage!;

    // If we have the module definition, show the path
    if (modulePath) {
      this.moduleImportPath = modulePath;
    } else if (this._widgetDefinition?.module) {
      this.moduleImportPath = this._widgetDefinition.module;
    }

    this.timeoutHandler.clearTracking();
  }

  /**
   * Handle initialization event from child widget
   */
  handleInitialized(event: Event) {
    if (this.initialized) return;

    console.debug(`Widget ${this.displayName} initialized (from ${event.type}) after ${this.timeoutHandler.getElapsedTime()}`);
    this.initialized = true;
    this.state = 'loaded';

    // Clear timeout tracking since we're initialized
    this.timeoutHandler.clearTracking();
  }

  /**
   * Handle errors from child widgets
   */
  handleChildError(event: Event) {
    console.debug(`Widget ${this.displayName} error after ${this.timeoutHandler.getElapsedTime()}:`, event);

    // Update state to error
    this.state = 'error';

    // Update error message if available
    if (event instanceof ErrorEvent && event.message) {
      this.errorMessage = event.message;
    } else {
      this.errorMessage = 'Widget encountered an error during initialization';
    }

    // Clear timeout tracking
    this.timeoutHandler.clearTracking();

    // Prevent further propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    // Handle state changes
    if (name === 'state' && oldValue !== newValue) {
      console.debug(`Widget ${this.displayName} state changed: ${oldValue} -> ${newValue}`);

      // State transition logic
      switch (newValue) {
        case 'loading':
          // Start timeout tracking when entering loading state
          this.timeoutHandler.startTracking();
          break;

        case 'loaded':
        case 'error':
        case 'import-error':
          // Stop timeout tracking when the widget is fully loaded or has errored
          this.timeoutHandler.clearTracking();
          break;
      }
    }

    // Handle widget ID changes
    if ((name === 'widgetId' || name === 'widget-id') && oldValue !== newValue) {
      // For consistency, always use widgetId internally
      if (name === 'widget-id') {
        this.widgetId = newValue;
      }

      // Update widget definition
      this.updateWidgetDefinition();

      // Update event details
      this.events.updateEventDetails(this.widgetId, this.pageType);
      
      // Update timeout handler
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

    // Handle page type changes
    if ((name === 'pageType' || name === 'page-type') && oldValue !== newValue) {
      this.events.updateEventDetails(this.widgetId, newValue);
    }

    // Handle timeout configuration changes
    if ((name === 'warningTimeout' || name === 'warning-timeout') && oldValue !== newValue) {
      // Convert string to number
      const numericValue = parseInt(newValue, 10) || 5000;
      this.warningTimeout = numericValue;
      this.timeoutHandler.updateTimeouts(numericValue);
    }

    if ((name === 'failureTimeout' || name === 'failure-timeout') && oldValue !== newValue) {
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
      this._widgetDefinition = getWidgetById(this.widgetId);
      console.debug(`Widget definition for ${this.widgetId}:`, this._widgetDefinition);
    }
  }

  /**
   * Initialize the widget module loading process
   */
  private async initializeWidgetModule(): Promise<void> {
    if (!this.widgetId) {
      console.error("Cannot initialize widget module - widget ID is missing");
      this.setErrorState("Missing widget ID");
      return;
    }

    try {
      // Check if widget definition exists
      this._widgetDefinition = getWidgetById(this.widgetId);
      if (!this._widgetDefinition) {
        throw new Error(`Widget with ID "${this.widgetId}" not found in registry`);
      }

      // Check if the widget module is already loaded
      if (widgetService.isWidgetLoaded(this.widgetId)) {
        console.debug(`Widget ${this.widgetId} module already loaded, no need to load again`);
        return;
      }

      // Check if there are existing errors for this widget
      if (widgetService.hasLoadError(this.widgetId)) {
        const errorMessage = widgetService.getLoadErrorMessage(this.widgetId) ||
          "Unknown widget loading error";

        this.handleWidgetLoadError(errorMessage);
        return;
      }

      // Register a load handler with the widget service
      console.debug(`Requesting widget service to load module for ${this.widgetId}`);

      try {
        // Use widget service to load the module
        await widgetService.loadWidgetModule(this._widgetDefinition);
        console.debug(`Widget ${this.widgetId} module loaded successfully`);
      } catch (error) {
        // Handle the error from widget service
        this.handleWidgetLoadError(
          error instanceof Error ? error.message : `Unknown error loading widget ${this.widgetId}`
        );
      }
    } catch (error) {
      console.error(`Error initializing widget ${this.widgetId}:`, error);
      this.setErrorState(
        error instanceof Error ? error.message : `Unknown error initializing widget ${this.widgetId}`
      );
    }
  }

  /**
   * Handle widget load errors, distinguishing between import errors and other errors
   */
  private handleWidgetLoadError(message: string): void {
    console.error(`Widget ${this.widgetId} load error:`, message);

    // Determine if this is an import error or a general error
    if (isModuleError(message)) {
      this.state = 'import-error';
      this.errorMessage = message;

      // Add module path info if available
      if (this._widgetDefinition?.module) {
        this.moduleImportPath = this._widgetDefinition.module;
      }
    } else {
      this.setErrorState(message);
    }
  }

  /**
   * Set the widget to error state
   */
  private setErrorState(message: string): void {
    this.state = 'error';
    this.errorMessage = message;
    this.timeoutHandler.clearTracking();
  }

  /**
   * Request retry of widget load
   */
  retry() {
    console.debug(`Retrying widget: ${this.widgetId || this.displayName || 'Unknown'}`);

    // Clear any errors in the widget service for this widget
    widgetService.clearLoadError(this.widgetId);

    this.initialized = false;
    this.state = 'loading';
    this.errorMessage = '';
    this.moduleImportPath = '';

    // Start timeout tracking again
    this.timeoutHandler.startTracking();

    // Re-initialize the widget module
    this.initializeWidgetModule();

    // Also dispatch the retry event for parent containers
    this.dispatchEvent(this.events.retryEvent);
  }

  /**
   * Dismiss the failed widget
   */
  dismiss() {
    console.debug(`Dismissing widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.dispatchEvent(this.events.dismissEvent);
  }

  /**
   * Cancel a slow-loading widget
   */
  cancel() {
    console.debug(`Cancelling widget: ${this.widgetId || this.displayName || 'Unknown'}`);
    this.state = 'error';
    this.errorMessage = 'Widget loading cancelled by user';
    this.dispatchEvent(this.events.cancelEvent);
  }

  /**
   * Close the widget 
   */
  closeWidget() {
    console.debug(`Closing widget: ${this.widgetId || this.displayName || 'Unknown'} - page type: ${this.pageType}`);
    this.dispatchEvent(this.events.closeEvent);
  }

  /**
   * Change widget spans (columns and rows) and emit change event
   */
  changeSpans(newColSpan: number, newRowSpan: number, isUserResized: boolean = true): void {
    // Clamp values to valid ranges
    newColSpan = Math.max(this.minColSpan, Math.min(newColSpan, this.maxColSpan));
    newRowSpan = Math.max(this.minRowSpan, Math.min(newRowSpan, this.maxRowSpan));
    
    // Use === for precise comparison
    if (this.colSpan === newColSpan && this.rowSpan === newRowSpan) return;
    
    const oldColSpan = this.colSpan;
    const oldRowSpan = this.rowSpan;
    
    console.debug(`Widget ${this.widgetId} spans changing from ${oldColSpan}x${oldRowSpan} to ${newColSpan}x${newRowSpan}, user resized: ${isUserResized}`);
    
    // Update properties immediately
    this.colSpan = newColSpan;
    this.rowSpan = newRowSpan;
    
    // Create span change event
    const spanChangeEvent = new CustomEvent('widget-spans-change', {
      bubbles: true,
      composed: true,
      detail: {
        widgetId: this.widgetId,
        pageType: this.pageType, // Include pageType in the event details
        oldColSpan,
        oldRowSpan,
        colSpan: newColSpan,
        rowSpan: newRowSpan,
        isUserResized
      }
    });
    
    // We'll let the base-page handle the settings update directly
    // Remove local save to settings since base-page will handle it
    // if (isUserResized && this.saveDimensions) {
    //   this.saveDimensionsToSettings(newColSpan, newRowSpan);
    // }
    
    // Dispatch the event immediately
    console.debug(`Dispatching span change event for ${this.widgetId}: ${newColSpan}x${newRowSpan}`);
    this.dispatchEvent(spanChangeEvent);
  }

  /**
   * Increase column span by 1
   */
  increaseColSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentColSpan = Number(this.colSpan);
    const maxColSpan = Number(this.maxColSpan);
    
    if (currentColSpan < maxColSpan) {
      const oldColSpan = currentColSpan;
      const newColSpan = Math.min(oldColSpan + 1, maxColSpan);
      
      console.debug(`WidgetWrapper: Increasing column span for ${this.widgetId} from ${oldColSpan} to ${newColSpan}`);
      
      // Direct property update first for immediate UI feedback
      this.colSpan = newColSpan;
      
      try {
        // Create the event with proper details
        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.widgetId,
            pageType: this.pageType, // Ensure pageType is always included
            oldColSpan: oldColSpan,
            oldRowSpan: this.rowSpan,
            colSpan: newColSpan,
            rowSpan: this.rowSpan,
            isUserResized: true,
            source: 'increaseColSpan'
          }
        });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.widgetId} with pageType ${this.pageType}`);
        
        // CRITICAL: First update DOM attributes directly 
        this.style.setProperty('--col-span', newColSpan.toString());
        this.setAttribute('colSpan', newColSpan.toString());
        
        // Also update our own classes if we're directly in a grid layout
        const parentElement = this.parentElement;
        if (parentElement && parentElement.classList.contains('widgets-container')) {
          // Remove all existing col-span-* classes
          for (let i = 1; i <= this.maxColSpan; i++) {
            this.classList.remove(`col-span-${i}`);
          }
          // Add the new col-span class
          this.classList.add(`col-span-${newColSpan}`);
          console.debug(`WidgetWrapper: Updated own col-span class to col-span-${newColSpan}`);
        }
        
        // Then dispatch the event for the grid to handle
        this.dispatchEvent(spanChangeEvent);
        
        // Check if the event was handled
        setTimeout(() => {
          console.debug(`WidgetWrapper: After event dispatch - ${this.widgetId} colSpan attribute: ${this.getAttribute('colSpan')}`);
          
          // Check parent element
          if (parentElement) {
            // Check if we need to check ourselves or parent
            if (parentElement.classList.contains('widgets-container')) {
              const selfHasColSpanClass = Array.from(this.classList).some(c => c.startsWith('col-span-'));
              console.debug(`WidgetWrapper: Direct grid child has col-span class: ${selfHasColSpanClass}, classes: ${this.className}`);
            } else {
              // Normal case - check parent
              const hasColSpanClass = Array.from(parentElement.classList).some(c => c.startsWith('col-span-'));
              console.debug(`WidgetWrapper: Parent element has col-span class: ${hasColSpanClass}, classes: ${parentElement.className}`);
            }
          }
        }, 50);
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }
  
  /**
   * Decrease column span by 1
   */
  decreaseColSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentColSpan = Number(this.colSpan);
    const minColSpan = Number(this.minColSpan);
    
    if (currentColSpan > minColSpan) {
      const oldColSpan = currentColSpan;
      const newColSpan = Math.max(oldColSpan - 1, minColSpan);
      
      console.debug(`WidgetWrapper: Decreasing column span for ${this.widgetId} from ${oldColSpan} to ${newColSpan}`);
      
      // Direct property update for immediate feedback
      this.colSpan = newColSpan;
      
      try {
        // Create the event with proper details
        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.widgetId,
            pageType: this.pageType, // Ensure pageType is always included
            oldColSpan: oldColSpan,
            oldRowSpan: this.rowSpan,
            colSpan: newColSpan,
            rowSpan: this.rowSpan,
            isUserResized: true,
            source: 'decreaseColSpan'
          }
        });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.widgetId} with pageType ${this.pageType}`);
        
        // CRITICAL: First update DOM attributes directly
        this.style.setProperty('--col-span', newColSpan.toString());
        this.setAttribute('colSpan', newColSpan.toString());
        
        // Also update our own classes if we're directly in a grid layout
        const parentElement = this.parentElement;
        if (parentElement && parentElement.classList.contains('widgets-container')) {
          // Remove all existing col-span-* classes
          for (let i = 1; i <= this.maxColSpan; i++) {
            this.classList.remove(`col-span-${i}`);
          }
          // Add the new col-span class
          this.classList.add(`col-span-${newColSpan}`);
          console.debug(`WidgetWrapper: Updated own col-span class to col-span-${newColSpan}`);
        }
        
        // Then dispatch the event for the grid to handle
        this.dispatchEvent(spanChangeEvent);
        
        // Check if the event was handled
        setTimeout(() => {
          console.debug(`WidgetWrapper: After event dispatch - ${this.widgetId} colSpan attribute: ${this.getAttribute('colSpan')}`);
          
          // Check parent element
          if (parentElement) {
            // Check if we need to check ourselves or parent
            if (parentElement.classList.contains('widgets-container')) {
              const selfHasColSpanClass = Array.from(this.classList).some(c => c.startsWith('col-span-'));
              console.debug(`WidgetWrapper: Direct grid child has col-span class: ${selfHasColSpanClass}, classes: ${this.className}`);
            } else {
              // Normal case - check parent
              const hasColSpanClass = Array.from(parentElement.classList).some(c => c.startsWith('col-span-'));
              console.debug(`WidgetWrapper: Parent element has col-span class: ${hasColSpanClass}, classes: ${parentElement.className}`);
            }
          }
        }, 50);
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }
  
  /**
   * Increase row span by 1
   */
  increaseRowSpan(): void {
    // Explicitly convert to numbers to avoid string concatenation
    const currentRowSpan = Number(this.rowSpan);
    const maxRowSpan = Number(this.maxRowSpan);
    
    if (currentRowSpan < maxRowSpan) {
      const oldRowSpan = currentRowSpan;
      const newRowSpan = Math.min(oldRowSpan + 1, maxRowSpan); 
      
      console.debug(`WidgetWrapper: Increasing row span for ${this.widgetId} from ${oldRowSpan} to ${newRowSpan}`);
      
      // Direct property update first for immediate UI feedback
      this.rowSpan = newRowSpan;
      
      try {
        // Create event with complete details matching the column span events
        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.widgetId,
            pageType: this.pageType, // Ensure pageType is always included
            oldColSpan: this.colSpan,
            oldRowSpan: oldRowSpan,
            colSpan: this.colSpan,
            rowSpan: newRowSpan,
            isUserResized: true,
            source: 'increaseRowSpan'
          }
        });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.widgetId} with pageType ${this.pageType}`);
        
        // Update DOM attributes directly 
        this.style.setProperty('--row-span', newRowSpan.toString());
        this.setAttribute('rowSpan', newRowSpan.toString());
        
        // The issue: Also ensure our own classes are updated if we're directly in a grid layout
        // Detect if we're directly in the grid-layout (parent is widgets-container)
        const parentElement = this.parentElement;
        if (parentElement && parentElement.classList.contains('widgets-container')) {
          // We're directly in the grid layout, so we need to update our own classes
          // Remove all existing row-span-* classes
          for (let i = 1; i <= this.maxRowSpan; i++) {
            this.classList.remove(`row-span-${i}`);
          }
          // Add the new row-span class
          this.classList.add(`row-span-${newRowSpan}`);
          console.debug(`WidgetWrapper: Updated own row-span class to row-span-${newRowSpan}`);
        }
        
        // Then dispatch the event for the grid to handle
        this.dispatchEvent(spanChangeEvent);
        
        // Check if the event was handled
        setTimeout(() => {
          console.debug(`WidgetWrapper: After event dispatch - ${this.widgetId} rowSpan attribute: ${this.getAttribute('rowSpan')}`);
          
          // Check parent element
          if (parentElement) {
            // Check if we need to set the class on ourselves when directly in grid
            if (parentElement.classList.contains('widgets-container')) {
              const selfHasRowSpanClass = Array.from(this.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Direct grid child has row-span class: ${selfHasRowSpanClass}, classes: ${this.className}`);
            } else {
              // Normal case - check parent
              const hasRowSpanClass = Array.from(parentElement.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Parent element has row-span class: ${hasRowSpanClass}, classes: ${parentElement.className}`);
            }
          }
        }, 50);
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }
  
  /**
   * Decrease row span by 1
   */
  decreaseRowSpan(): void {
    // Explicitly convert to numbers to avoid string conversion issues
    const currentRowSpan = Number(this.rowSpan);
    const minRowSpan = Number(this.minRowSpan);
    
    if (currentRowSpan > minRowSpan) {
      const oldRowSpan = currentRowSpan;
      const newRowSpan = Math.max(oldRowSpan - 1, minRowSpan);
      
      console.debug(`WidgetWrapper: Decreasing row span for ${this.widgetId} from ${oldRowSpan} to ${newRowSpan}`);
      
      // Direct property update first for immediate UI feedback
      this.rowSpan = newRowSpan;
      
      try {
        // Create event with complete details
        const spanChangeEvent = new CustomEvent('widget-spans-change', {
          bubbles: true,
          composed: true,
          detail: {
            widgetId: this.widgetId,
            pageType: this.pageType, // Ensure pageType is always included
            oldColSpan: this.colSpan,
            oldRowSpan: oldRowSpan,
            colSpan: this.colSpan,
            rowSpan: newRowSpan,
            isUserResized: true,
            source: 'decreaseRowSpan'
          }
        });
        
        console.debug(`WidgetWrapper: Dispatching span change for ${this.widgetId} with pageType ${this.pageType}`);
        
        // Update DOM attributes directly
        this.style.setProperty('--row-span', newRowSpan.toString());
        this.setAttribute('rowSpan', newRowSpan.toString());
        
        // The issue: Also ensure our own classes are updated if we're directly in a grid layout
        // Detect if we're directly in the grid-layout (parent is widgets-container)
        const parentElement = this.parentElement;
        if (parentElement && parentElement.classList.contains('widgets-container')) {
          // We're directly in the grid layout, so we need to update our own classes
          // Remove all existing row-span-* classes
          for (let i = 1; i <= this.maxRowSpan; i++) {
            this.classList.remove(`row-span-${i}`);
          }
          // Add the new row-span class
          this.classList.add(`row-span-${newRowSpan}`);
          console.debug(`WidgetWrapper: Updated own row-span class to row-span-${newRowSpan}`);
        }
        
        // Then dispatch the event for the grid to handle
        this.dispatchEvent(spanChangeEvent);
        
        // Check if the event was handled
        setTimeout(() => {
          console.debug(`WidgetWrapper: After event dispatch - ${this.widgetId} rowSpan attribute: ${this.getAttribute('rowSpan')}`);
          
          // Check parent element
          if (parentElement) {
            // Check if we need to set the class on ourselves when directly in grid
            if (parentElement.classList.contains('widgets-container')) {
              const selfHasRowSpanClass = Array.from(this.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Direct grid child has row-span class: ${selfHasRowSpanClass}, classes: ${this.className}`);
            } else {
              // Normal case - check parent
              const hasRowSpanClass = Array.from(parentElement.classList).some(c => c.startsWith('row-span-'));
              console.debug(`WidgetWrapper: Parent element has row-span class: ${hasRowSpanClass}, classes: ${parentElement.className}`);
            }
          }
        }, 50);
      } catch (error) {
        console.error(`Error dispatching span change event:`, error);
      }
    }
  }

  // /**
  //  * Get CSS class for size button based on whether it's the current size
  //  * @param size The size to check
  //  * @returns CSS class names for the button
  //  */
  // getSizeButtonClass(size: string): string {
  //   return size === this.currentSize ? 'size-button size-button-active' : 'size-button';
  // }
  
  // /**
  //  * Get display text for size button
  //  * @param size The size to get display text for
  //  * @returns Display text for the size button
  //  */
  // getSizeButtonText(size: GridItemSize): string {
  //   switch (size as string) {
  //     case 'sm': return 'S';
  //     case 'md': return 'M';
  //     case 'lg': return 'L';
  //     case 'xl': return 'XL';
  //     default: return size.charAt(0).toUpperCase();
  //   }
  // }
  
  // /**
  //  * Handle size button click event
  //  * @param event The click event
  //  * @param size The size selected
  //  */
  // handleSizeButtonClick(event: Event, size: GridItemSize): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.changeSize(size);
  // }

  /**
   * Handle resize requests from widgets
   */
  private handleResizeRequest(event: Event): void {
    const customEvent = event as CustomEvent;
    const { rowSpan, reason } = customEvent.detail;
    
    console.debug(`Widget ${this.widgetId} received resize request: ${rowSpan} rows (${reason})`);
    
    // Only increase, never decrease rows from content fit requests
    if (rowSpan > this.rowSpan && reason === 'content-overflow') {
      this.changeSpans(this.colSpan, rowSpan, true);
    }
    
    // Stop propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Load widget dimensions from user settings
   */
  private async loadDimensionsFromSettings(): Promise<void> {
    if (!this.widgetId || !this.pageType) return;
    
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      const dimensions = await settingsRepo.getWidgetGridDimensions(this.pageType, this.widgetId);
      
      console.debug(`Loaded dimensions for ${this.widgetId} from settings: ${dimensions.colSpan}x${dimensions.rowSpan}`);
      
      // Apply dimensions from settings
      if (dimensions.colSpan && dimensions.colSpan > 0) {
        this.colSpan = dimensions.colSpan;
      }
      
      if (dimensions.rowSpan && dimensions.rowSpan > 0) {
        this.rowSpan = dimensions.rowSpan;
      }
    } catch (error) {
      console.warn(`Failed to load dimensions from settings for widget ${this.widgetId}:`, error);
      
      // Fall back to widget registry values
      if (!this.hasAttribute('colSpan')) {
        this.colSpan = getWidgetColumnSpan(this.widgetId);
      }
      
      if (!this.hasAttribute('rowSpan')) {
        this.rowSpan = getWidgetRowSpan(this.widgetId);
      }
    }
  }

  /**
   * Save widget dimensions to user settings
   */
  private async saveDimensionsToSettings(colSpan: number, rowSpan: number): Promise<void> {
    if (!this.saveDimensions || !this.widgetId || !this.pageType) return;
    
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      await settingsRepo.updateWidgetGridDimensions(
        this.pageType, 
        this.widgetId, 
        colSpan, 
        rowSpan
      );
      
      console.debug(`Saved dimensions for ${this.widgetId} to settings: ${colSpan}x${rowSpan}`);
    } catch (error) {
      console.warn(`Failed to save dimensions to settings for widget ${this.widgetId}:`, error);
    }
  }
}
