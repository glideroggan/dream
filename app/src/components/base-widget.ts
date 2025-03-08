import { FASTElement, observable } from "@microsoft/fast-element";
import { workflowManager } from "../services/workflow-manager-service";

/**
 * Base class for widget components that provides common functionality and styling.
 * Extend this class to create new widgets with consistent styling and behavior.
 */
export class BaseWidget extends FASTElement {
  /**
   * Indicates if the widget is in loading state
   */
  @observable isLoading: boolean = true;
  
  /**
   * Indicates if the widget has encountered an error
   */
  @observable hasError: boolean = false;
  
  /**
   * Error message to display if hasError is true
   */
  @observable errorMessage: string = "";

  protected initialized: boolean = false;
  protected error: Error | null = null;

  private startWorkflowHandler = this.workflowHandler.bind(this);

  connectedCallback(): void {
    super.connectedCallback();
    
    // this.addEventListener('start-workflow', this.startWorkflowHandler);

    // Signal that we've connected to the DOM
    this.dispatchEvent(new CustomEvent('widget-connected', {
      bubbles: true,
      composed: true
    }));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    // this.removeEventListener('start-workflow', this.startWorkflowHandler);
  }

  private workflowHandler(event: Event): void {
    event.stopImmediatePropagation()
    const customEvent = event as CustomEvent;
    this.startWorkflow(customEvent.detail.workflowId, customEvent.detail.params);
  }
  
  /**
   * Notify parent components that the widget has finished initializing
   * Call this when your widget has loaded its data and is ready to display
   */
  protected notifyInitialized(): void {
    this.isLoading = false;
    this.initialized = true;
    
    // Dispatch initialized event for the widget wrapper
    this.dispatchEvent(new CustomEvent('initialized', {
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Handle an error in the widget
   * @param error The error object or message
   */
  protected handleError(error: Error | string): void {
    this.hasError = true;
    this.isLoading = false;
    this.error = typeof error === 'string' ? new Error(error) : error;
    
    if (error instanceof Error) {
      this.errorMessage = error.message;
      console.error(`Widget error:`, error);
    } else {
      this.errorMessage = error;
      console.error(`Widget error: ${error}`);
    }
    
    // Dispatch error event for the widget wrapper
    this.dispatchEvent(new ErrorEvent('error', {
      error: error instanceof Error ? error : new Error(error),
      message: this.errorMessage,
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Start a workflow from within a widget
   * @param workflowId The ID of the workflow to start
   * @param params Optional parameters to pass to the workflow
   */
  protected startWorkflow(workflowId: string, params?: Record<string, any>): void {
    try {
      console.debug(`Starting workflow ${workflowId}`);
      // This kicks off the workflow but doesn't return a result
      workflowManager.startWorkflow(workflowId, params);
    } catch (error) {
      console.error(`Error starting workflow ${workflowId}:`, error);
      this.handleError(error instanceof Error ? error : String(error));
    }
  }
  
  /**
   * Request to reload the widget
   */
  protected requestReload(): void {
    this.dispatchEvent(new CustomEvent("widget-reload", {
      bubbles: true,
      composed: true
    }));
  }
}
