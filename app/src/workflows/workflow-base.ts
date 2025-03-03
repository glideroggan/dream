import { FASTElement } from "@microsoft/fast-element";
import { workflowManager } from "../services/workflow-manager-service";

export interface WorkflowResult {
  success: boolean;
  data?: Record<string, any>;
  message?: string;
}

export interface WorkflowValidationEvent {
  isValid: boolean;
  message?: string;
}

// Simplify the host interface - no validation methods needed, we'll use events
export interface WorkflowHost {
  closeWorkflow(result?: WorkflowResult): void;
  updateTitle?(title: string): void;
  updateFooter?(showFooter: boolean, primaryButtonText?: string): void;
}

export abstract class WorkflowBase extends FASTElement {
  private _host: WorkflowHost | null = null;
  private _currentNestedWorkflowPromise: Promise<WorkflowResult> | null = null;
  
  /**
   * Get workflow host interface
   */
  protected get host(): WorkflowHost | null {
    return this._host;
  }
  
  /**
   * Set the host for this workflow - called by the container
   */
  public setHost(host: WorkflowHost): void {
    this._host = host;
  }
  
  /**
   * Called when the workflow is first loaded
   */
  public initialize(params?: Record<string, any>): void {
    // Override in subclasses if needed
  }
  
  /**
   * Called when the workflow is resumed after a nested workflow completes
   * @param result The result from the nested workflow that just completed
   */
  public resume(result?: WorkflowResult): void {
    // Override in subclasses if needed
  }
  
  /**
   * Close the workflow with a result
   */
  protected complete(success: boolean = true, data?: Record<string, any>, message?: string): void {
    console.log(`base workflow complete: ${success}, ${message}`);
    if (this.host) {
      this.host.closeWorkflow({ success, data, message });
    }
    
    // Dispatch event for workflow completion
    console.log('[base workflow] dispatching workflow-complete event');
    // TODO: nobody listens to this? who is it for?
    this.dispatchEvent(new CustomEvent('workflow-complete', {
      bubbles: true,
      composed: true,
      detail: { success, data, message } as WorkflowResult
    }));
  }
  
  /**
   * Cancel the workflow
   */
  protected cancel(message?: string): void {
    this.complete(false, undefined, message || "Workflow cancelled");
  }
  
  /**
   * Update the modal title
   */
  protected updateTitle(title: string): void {
    if (this.host && this.host.updateTitle) {
      this.host.updateTitle(title);
    }
  }
  
  /**
   * Update the modal footer
   */
  protected updateFooter(showFooter: boolean, primaryButtonText?: string): void {
    if (this.host && this.host.updateFooter) {
      this.host.updateFooter(showFooter, primaryButtonText);
    }
  }
  
  /**
   * Emit a validation state event
   * The modal will listen for this event
   */
  protected notifyValidation(isValid: boolean, message?: string): void {
    this.dispatchEvent(new CustomEvent('workflowValidation', {
      detail: { isValid, message } as WorkflowValidationEvent,
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Start a nested workflow and get its result
   * This will pause the current workflow and start a new one
   */
  protected async startNestedWorkflow(
    workflowId: string, 
    params?: Record<string, any>
  ): Promise<WorkflowResult> {
    console.debug(`Starting nested workflow: ${workflowId}`);
    // Prevent multiple nested workflows from starting
    if (this._currentNestedWorkflowPromise) {
      return this._currentNestedWorkflowPromise;
    }
    
    this._currentNestedWorkflowPromise = workflowManager.startWorkflow(workflowId, params, true);
    
    try {
      const result = await this._currentNestedWorkflowPromise;
      return result;
    } finally {
      this._currentNestedWorkflowPromise = null;
    }
  }
  
  /**
   * Called when the primary button is clicked
   */
  public handlePrimaryAction(): void {
    // Should be overridden in subclasses
  }
}
