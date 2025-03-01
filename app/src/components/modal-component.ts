import { FASTElement, customElement, html, css, attr, observable, when } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult, WorkflowHost, WorkflowValidationEvent } from "../workflows/workflow-base";
import { workflowService } from '../services/workflow-service';

// Update the template to include the disabled state for the primary button
const template = html<ModalComponent>/*html*/`
  <div class="modal-overlay ${x => x.isOpen ? 'visible' : ''}" @click="${(x, c) => x.handleOverlayClick(c)}">
    <div class="modal-container" @click="${(x, c) => c.event.stopPropagation()}">
      <div class="modal-header">
        <h3>${x => x.title}</h3>
        <button class="modal-close-button" @click="${x => x.close()}" aria-label="Close">
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      ${when(x => x.showFooter, html<ModalComponent>/*html*/`
        <div class="modal-footer">
          <slot name="footer">
            <button class="modal-button secondary" @click="${x => x.close()}">Cancel</button>
            <button class="modal-button primary" 
                  ?disabled="${x => !x.isPrimaryActionEnabled}"
                  @click="${x => x.handlePrimaryAction()}">
              ${x => x.primaryButtonText}
            </button>
          </slot>
        </div>
      `)}
    </div>
  </div>
`;

const styles = css`
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0s 0.3s;
  }

  .modal-overlay.visible {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.3s;
  }

  .modal-container {
    background-color: var(--modal-bg, #ffffff);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: var(--modal-width, 500px);
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    transform: translateY(20px);
    transition: transform 0.3s;
  }

  .modal-overlay.visible .modal-container {
    transform: translateY(0);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--heading-color, #333);
  }

  .modal-close-button {
    background: transparent;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary, #666);
    font-size: 18px;
    transition: background-color 0.2s, color 0.2s;
  }

  .modal-close-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-primary, #333);
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-color, #e0e0e0);
  }

  .modal-button {
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s, color 0.2s, opacity 0.2s;
  }
  
  .modal-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .modal-button.primary {
    background-color: var(--primary-color, #3498db);
    color: white;
  }

  .modal-button.primary:hover:not(:disabled) {
    background-color: var(--primary-hover, #2980b9);
  }
  
  .modal-button.primary:disabled {
    background-color: var(--primary-disabled, #95c8ec);
  }

  .modal-button.secondary {
    background-color: var(--secondary-bg, #f5f5f5);
    color: var(--text-primary, #333);
  }

  .modal-button.secondary:hover:not(:disabled) {
    background-color: var(--secondary-hover, #e0e0e0);
  }
`;

@customElement({
  name: "dream-modal",
  template,
  styles
})
export class ModalComponent extends FASTElement implements WorkflowHost {
  @attr title: string = "Modal Title";
  @attr({ mode: "boolean" }) isOpen: boolean = false;
  @attr primaryButtonText: string = "OK";
  @attr({ mode: "boolean" }) showFooter: boolean = false;
  @attr({ mode: "boolean" }) closeOnOverlayClick: boolean = true;
  
  @observable private modalWidth: string = "500px";
  @observable private activeWorkflow: WorkflowBase | null = null;
  @observable isPrimaryActionEnabled: boolean = true;
  @observable private validationMessage: string = "";
  
  // private boundWorkflowValidationHandler: EventListener; 
  
  constructor() {
    super();
    
    // Create a bound handler that we can both add and remove
    // this.boundWorkflowValidationHandler = ((event: Event) => {
    //   console.log("Workflow validation event received", (event as any).detail);
    //   this.handleWorkflowValidation(event as CustomEvent);
    // }) as EventListener;
  }
  
  /**
   * Opens the modal dialog
   */
  public open(): void {
    this.isOpen = true;
    document.body.style.overflow = "hidden"; // Prevent body scrolling
  }
  
  /**
   * Closes the modal dialog
   */
  public close(): void {
    this.isOpen = false;
    document.body.style.overflow = ""; // Restore body scrolling
    this.$emit("close");
    this.clearWorkflow();
  }
  
  /**
   * Implementation of WorkflowHost interface
   */
  public closeWorkflow(result?: WorkflowResult): void {
    if (result) {
      this.$emit("workflowComplete", { detail: result });
    }
    this.close();
  }
  
  /**
   * Implementation of WorkflowHost interface
   */
  public updateTitle(title: string): void {
    this.title = title;
  }
  
  /**
   * Implementation of WorkflowHost interface
   */
  public updateFooter(showFooter: boolean, primaryButtonText?: string): void {
    this.showFooter = showFooter;
    if (primaryButtonText) {
      this.primaryButtonText = primaryButtonText;
    }
  }
  
  /**
   * Handles click on the primary button
   */
  public handlePrimaryAction(): void {
    if (this.activeWorkflow) {
      this.activeWorkflow.handlePrimaryAction();
    } else {
      this.$emit("action");
    }
  }
  
  /**
   * Handles click on the overlay background
   */
  public handleOverlayClick(c: any): void {
    if (this.closeOnOverlayClick) {
      this.close();
    }
  }
  
  /**
   * Sets the modal width (can be used to adjust size)
   * @param width CSS width value (e.g., "600px", "80%")
   */
  public setWidth(width: string): void {
    this.modalWidth = width;
    this.style.setProperty("--modal-width", width);
  }
  
  /**
   * Handle workflow validation events
   */
  private handleWorkflowValidation(event: Event): void {
    const customEvent = event as CustomEvent;
    const validationData = customEvent.detail as WorkflowValidationEvent;
    this.isPrimaryActionEnabled = validationData.isValid;
    this.validationMessage = validationData.message || "";
    
    console.log(`Workflow validation: ${validationData.isValid ? 'valid' : 'invalid'} - ${this.validationMessage}`);
  }
  
  /**
   * Loads a workflow into the modal
   * @param workflowId ID of the workflow to load
   * @param params Optional parameters to pass to the workflow
   */
  public async loadWorkflow(workflowId: string, params?: Record<string, any>): Promise<boolean> {
    try {
      // Clear any existing workflow
      this.clearWorkflow();
      
      // Reset validation state for new workflow - default to disabled until validation
      this.isPrimaryActionEnabled = false;
      
      // Get the modal body where we'll add the workflow
      const modalBody = this.shadowRoot?.querySelector('.modal-body');
      if (!modalBody) {
        throw new Error("Modal body not found");
      }
      
      // Create the workflow element
      const workflowElement = await workflowService.createWorkflowElement(workflowId, params);
      if (!workflowElement) {
        throw new Error(`Failed to create workflow element for ${workflowId}`);
      }
      
      // Store reference to the workflow
      this.activeWorkflow = workflowElement as WorkflowBase;
      
      // Set up event listener for validation events - use our bound handler
      // workflowElement.addEventListener('workflowValidation', this.boundWorkflowValidationHandler);
      workflowElement.addEventListener('workflowValidation', this.handleWorkflowValidation.bind(this));
      
      // Connect the workflow to this host
      this.activeWorkflow.setHost(this);
      
      // Add to DOM
      modalBody.appendChild(workflowElement);
      
      // Initialize with params
      this.activeWorkflow.initialize(params);
      
      return true;
    } catch (error) {
      console.error(`Error loading workflow ${workflowId}:`, error);
      return false;
    }
  }
  
  /**
   * Clear the current workflow
   */
  private clearWorkflow(): void {
    if (this.activeWorkflow) {
      // Remove event listeners - use our bound handler to ensure proper removal
      // this.activeWorkflow.removeEventListener('workflowValidation', this.boundWorkflowValidationHandler);
      this.activeWorkflow.removeEventListener('workflowValidation', this.handleWorkflowValidation.bind(this));
      
      // Reference the modal body
      const modalBody = this.shadowRoot?.querySelector('.modal-body');
      if (modalBody) {
        // Remove all child nodes except slots
        Array.from(modalBody.children).forEach(child => {
          if (child.tagName !== 'SLOT') {
            modalBody.removeChild(child);
          }
        });
      }
      
      // Reset validation state
      this.isPrimaryActionEnabled = true;
      this.validationMessage = "";
      this.activeWorkflow = null;
    }
  }
}
