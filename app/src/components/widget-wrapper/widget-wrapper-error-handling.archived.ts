import { widgetService } from "../../services/widget-service";
import { WidgetWrapperState } from "./widget-wrapper";

/**
 * Widget state management functionality
 * Extracted from widget-wrapper.ts to make the code more manageable
 */
export class WidgetStateManager {
  constructor(private component: any) {}

  /**
   * Check if the widget service already has errors for this widget
   */
  checkForExistingErrors(): void {
    const widgetId = this.component.widgetId;
    if (!widgetId) return;

    if (widgetService.hasLoadError(widgetId)) {
      const errorMessage = widgetService.getLoadErrorMessage(widgetId);

      // Check if it's an import error or other error
      if (isModuleError(errorMessage)) {
        // It's an import error
        this.handleImportError(errorMessage);
      } else {
        // Standard error
        this.setErrorState(errorMessage || 'Unknown widget error');
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
    if (widgetId !== this.component.widgetId) return;

    console.debug(`Widget ${this.component.widgetId} received module error:`, error);

    // Handle as an import error
    this.handleImportError(error?.message || 'Failed to load widget module', modulePath);
  }

  /**
   * Handle import errors specifically
   */
  handleImportError(errorMessage: string | undefined, modulePath?: string): void {
    this.component.state = 'import-error';
    this.component.errorMessage = errorMessage!;

    // If we have the module definition, show the path
    if (modulePath) {
      this.component.moduleImportPath = modulePath;
    } else if (this.component._widgetDefinition?.module) {
      this.component.moduleImportPath = this.component._widgetDefinition.module;
    }

    this.component.timeoutHandler.clearTracking();
  }

  /**
   * Handle initialization event from child widget
   */
  handleInitialized(event: Event): void {
    if (this.component.initialized) return;

    console.debug(`Widget ${this.component.displayName} initialized (from ${event.type}) after ${this.component.timeoutHandler.getElapsedTime()}`);
    this.component.initialized = true;
    this.component.state = 'loaded';

    // Clear timeout tracking since we're initialized
    this.component.timeoutHandler.clearTracking();
  }

  /**
   * Handle errors from child widgets
   */
  handleChildError(event: Event): void {
    console.debug(`Widget ${this.component.displayName} error after ${this.component.timeoutHandler.getElapsedTime()}:`, event);

    // Update state to error
    this.component.state = 'error';

    // Update error message if available
    if (event instanceof ErrorEvent && event.message) {
      this.component.errorMessage = event.message;
    } else {
      this.component.errorMessage = 'Widget encountered an error during initialization';
    }

    // Clear timeout tracking
    this.component.timeoutHandler.clearTracking();

    // Prevent further propagation since we've handled it
    event.stopPropagation();
  }

  /**
   * Set the widget to error state
   */
  setErrorState(message: string): void {
    this.component.state = 'error';
    this.component.errorMessage = message;
    this.component.timeoutHandler.clearTracking();
  }

  /**
   * Initialize the widget module loading process
   */
  async initializeWidgetModule(): Promise<void> {
    if (!this.component.widgetId) {
      console.error("Cannot initialize widget module - widget ID is missing");
      this.setErrorState("Missing widget ID");
      return;
    }

    try {
      // Check if widget definition exists
      this.component._widgetDefinition = this.component.getWidgetFromRegistry();
      if (!this.component._widgetDefinition) {
        throw new Error(`Widget with ID "${this.component.widgetId}" not found in registry`);
      }

      // Check if the widget module is already loaded
      if (widgetService.isWidgetLoaded(this.component.widgetId)) {
        console.debug(`Widget ${this.component.widgetId} module already loaded, no need to load again`);
        return;
      }

      // Check if there are existing errors for this widget
      if (widgetService.hasLoadError(this.component.widgetId)) {
        const errorMessage = widgetService.getLoadErrorMessage(this.component.widgetId) ||
          "Unknown widget loading error";

        this.handleWidgetLoadError(errorMessage);
        return;
      }

      // Register a load handler with the widget service
      console.debug(`Requesting widget service to load module for ${this.component.widgetId}`);

      try {
        // Use widget service to load the module
        await widgetService.loadWidgetModule(this.component._widgetDefinition);
        console.debug(`Widget ${this.component.widgetId} module loaded successfully`);
      } catch (error) {
        // Handle the error from widget service
        this.handleWidgetLoadError(
          error instanceof Error ? error.message : `Unknown error loading widget ${this.component.widgetId}`
        );
      }
    } catch (error) {
      console.error(`Error initializing widget ${this.component.widgetId}:`, error);
      this.setErrorState(
        error instanceof Error ? error.message : `Unknown error initializing widget ${this.component.widgetId}`
      );
    }
  }

  /**
   * Handle widget load errors, distinguishing between import errors and other errors
   */
  handleWidgetLoadError(message: string): void {
    console.error(`Widget ${this.component.widgetId} load error:`, message);

    // Determine if this is an import error or a general error
    if (isModuleError(message)) {
      this.component.state = 'import-error';
      this.component.errorMessage = message;

      // Add module path info if available
      if (this.component._widgetDefinition?.module) {
        this.component.moduleImportPath = this.component._widgetDefinition.module;
      }
    } else {
      this.setErrorState(message);
    }
  }

  /**
   * Handle state transitions based on state changes
   */
  handleStateChange(oldValue: WidgetWrapperState, newValue: WidgetWrapperState): void {
    console.debug(`Widget ${this.component.displayName} state changed: ${oldValue} -> ${newValue}`);

    // State transition logic
    switch (newValue) {
      case 'loading':
        // Start timeout tracking when entering loading state
        this.component.timeoutHandler.startTracking();
        break;

      case 'loaded':
      case 'error':
      case 'import-error':
        // Stop timeout tracking when the widget is fully loaded or has errored
        this.component.timeoutHandler.clearTracking();
        break;
    }
  }

  /**
   * Request retry of widget load
   */
  retry(): void {
    console.debug(`Retrying widget: ${this.component.widgetId || this.component.displayName || 'Unknown'}`);

    // Clear any errors in the widget service for this widget
    widgetService.clearLoadError(this.component.widgetId);

    this.component.initialized = false;
    this.component.state = 'loading';
    this.component.errorMessage = '';
    this.component.moduleImportPath = '';

    // Start timeout tracking again
    this.component.timeoutHandler.startTracking();

    // Re-initialize the widget module
    this.initializeWidgetModule();

    // Also dispatch the retry event for parent containers
    this.component.dispatchEvent(this.component.events.retryEvent);
  }

  /**
   * Dismiss the failed widget
   */
  dismiss(): void {
    console.debug(`Dismissing widget: ${this.component.widgetId || this.component.displayName || 'Unknown'}`);
    this.component.dispatchEvent(this.component.events.dismissEvent);
  }

  /**
   * Cancel a slow-loading widget
   */
  cancel(): void {
    console.debug(`Cancelling widget: ${this.component.widgetId || this.component.displayName || 'Unknown'}`);
    this.component.state = 'error';
    this.component.errorMessage = 'Widget loading cancelled by user';
    this.component.dispatchEvent(this.component.events.cancelEvent);
  }

  /**
   * Close the widget 
   */
  closeWidget(): void {
    console.debug(`Closing widget: ${this.component.widgetId || this.component.displayName || 'Unknown'} - page type: ${this.component.pageType}`);
    this.component.dispatchEvent(this.component.events.closeEvent);
  }
}

/**
 * Helper to determine if an error is an import/module error
 */
export function isModuleError(errorMessage: string | undefined): boolean {
  return !!(errorMessage && (
    errorMessage.includes('import') ||
    errorMessage.includes('module') ||
    errorMessage.includes('not found')
  ));
}