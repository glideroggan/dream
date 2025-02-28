import { FASTElement } from "@microsoft/fast-element";

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
   * Close the workflow with a result
   */
  protected complete(success: boolean = true, data?: Record<string, any>, message?: string): void {
    if (this.host) {
      this.host.closeWorkflow({ success, data, message });
    }
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
    this.$emit('workflowValidation', { 
      detail: { isValid, message } as WorkflowValidationEvent 
    });
  }
  
  /**
   * Called when the primary button is clicked
   */
  public handlePrimaryAction(): void {
    // Should be overridden in subclasses
  }
}
