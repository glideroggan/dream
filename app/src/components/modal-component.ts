import { FASTElement, customElement, html, css, attr, observable, when } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult, WorkflowHost, WorkflowValidationEvent } from "../workflows/workflow-base";
import { workflowManager } from '../services/workflow-manager-service';

// Update the template to include the disabled state for the primary button
const template = html<ModalComponent>/*html*/`
  <div class="modal-overlay ${x => x.isOpen ? 'visible' : ''}" @click="${(x, c) => x.handleOverlayClick(c)}">
    <div class="modal-container" @click="${(x, c) => c.event.stopPropagation()}">
      <div class="modal-header">
        <h3>${x => x.modalTitle}</h3>
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

  

  /* Tooltip fix: Hide all tooltips when modal is open */
  :host([isopen]) ::slotted(*[title]),
  :host([isopen]) *[title] {
    position: relative;
  }
  
  :host([isopen]) ::slotted(*[title])::before,
  :host([isopen]) *[title]::before {
    content: "";
    display: none;
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
  @attr modalTitle: string = "Modal Title";
  @attr({ mode: "boolean" }) isOpen: boolean = false;
  @attr primaryButtonText: string = "OK";
  @attr({ mode: "boolean" }) showFooter: boolean = false;
  @attr({ mode: "boolean" }) closeOnOverlayClick: boolean = true;

  @observable private modalWidth: string = "500px";
  @observable private activeWorkflow: WorkflowBase | null = null;
  @observable isPrimaryActionEnabled: boolean = true;
  @observable private validationMessage: string = "";
  @observable private isOpeningModal: boolean = false; // Add flag to prevent duplicate opens

  private boundHandleWorkflowValidation: (event: Event) => void;

  constructor() {
    super();
    this.boundHandleWorkflowValidation = this.handleWorkflowValidation.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Register this modal with the workflow manager
    workflowManager.setModalComponent(this);

    const shadowRoot = this.shadowRoot!
    const getActive = (doc: Document= document) => {
      let activeDocument = doc.activeElement
      while (activeDocument?.shadowRoot && activeDocument.shadowRoot.activeElement) {
        activeDocument = activeDocument.shadowRoot.activeElement
      }
      return activeDocument
    }
    // setInterval(() => {
    //   console.log('[Modal] ', getActive())
    // }, 1000)
  }


  
  /**
   * Opens the modal dialog
   */
  public open(): void {
    // Prevent duplicate opens
    if (this.isOpen || this.isOpeningModal) {
      console.debug("Modal is already open or opening, ignoring duplicate open request");
      return;
    }

    this.isOpeningModal = true;
    try {
      this.isOpen = true;
      document.body.style.overflow = "hidden"; // Prevent body scrolling

      // Store and remove title attributes
      // this.disableTooltips();
    } finally {
      // Reset the flag
      setTimeout(() => {
        this.isOpeningModal = false;
      }, 300); // Wait for animation to complete
    }
  }

  /**
   * Closes the modal dialog
   * If a workflow is active, we delegate to the workflow manager to handle
   * the workflow specific cancel logic
   */
  public close(): void {
    console.debug("Modal close requested");
    if (workflowManager.hasActiveWorkflow()) {
      console.log("Active workflow detected, delegating close to workflow manager");
      // Let the workflow manager handle the cancel logic
      workflowManager.handleCancel();
    } else {
      // Standard close for non-workflow modals
      console.debug("No active workflow, performing standard close");
      this.performStandardClose();
    }
  }

  /**
   * Standard close operation without workflow handling
   */
  private performStandardClose(): void {
    console.log("[modal] standard Closing modal");
    this.isOpen = false;
    document.body.style.overflow = ""; // Restore body scrolling
    this.$emit("close");
    this.clearWorkflow();

    // Restore title attributes
    // this.enableTooltips();

    // Reset the button text to default when closing
    this.primaryButtonText = "OK";
  }

  /**
   * Implementation of WorkflowHost interface
   */
  public closeWorkflow(result?: WorkflowResult): void {
    console.log("[modal] closeWorkflow called with result:", result);
    if (result) {
      // Emit event for workflow completion
      console.log("[modal] Emitting workflowComplete event with result:", result);
      this.$emit("workflowComplete", { detail: result });
    } else {
      console.warn("No result provided when closing workflow");
    }

    // DO NOT call this.close() here as it creates the loop
    // Instead, let the workflow manager handle the close logic
  }

  /**
   * Implementation of WorkflowHost interface
   */
  public updateTitle(title: string): void {
    this.modalTitle = title;
  }

  /**
   * Implementation of WorkflowHost interface
   * Update the footer state of the modal
   */
  public updateFooter(showFooter: boolean, primaryButtonText?: string): void {
    this.showFooter = showFooter;
    if (primaryButtonText) {
      this.primaryButtonText = primaryButtonText;
    }

    // Force a render
    this.$fastController.notify("showFooter");
    this.$fastController.notify("primaryButtonText");
  }

  /**
   * Handles click on the primary button
   */
  public handlePrimaryAction(): void {
    if (this.activeWorkflow) {
      console.debug("Handling primary action in workflow");
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

    console.debug(`Workflow validation: ${validationData.isValid ? 'valid' : 'invalid'} - ${this.validationMessage}`);
  }

  /**
   * Loads a workflow into the modal
   * This version DELEGATES to the workflow manager to ensure proper tracking
   * @param workflowIdOrElement Either a workflow ID string or a pre-created workflow element
   * @param params Optional parameters to pass to the workflow
   */
  public async loadWorkflow(workflowIdOrElement: string | HTMLElement, params?: Record<string, any>): Promise<boolean> {
    // Prevent loading if already loading or opening
    console.log("Loading workflow:", workflowIdOrElement);
    if (this.isOpeningModal || this.activeWorkflow) {
      console.debug("Modal is busy, cannot load workflow now");
      return false;
    }

    try {
      // If workflowIdOrElement is a string (workflowId), use the workflow manager
      if (typeof workflowIdOrElement === 'string') {
        // Use workflow manager which will handle everything properly
        workflowManager.startWorkflow(workflowIdOrElement, params);
        return true;
      } else {
        // Handle pre-created elements (this path should be used mainly by the workflow manager)
        return this.loadWorkflowElement(workflowIdOrElement);
      }
    } catch (error) {
      console.error(`Error loading workflow:`, error);
      return false;
    }
  }

  /**
   * Private method to load workflow elements
   * This should only be called by the workflow manager
   */
  private loadWorkflowElement(workflowElement: HTMLElement): boolean {
    try {
      console.log('[modal] Loading workflow element:', workflowElement);

      workflowElement.focus()

      // Clear any existing workflow
      this.clearWorkflow(this.activeWorkflow !== null);

      // Reset validation state for new workflow - default to disabled until validation
      this.isPrimaryActionEnabled = false;

      // Get the modal body where we'll add the workflow
      // const modalBody = this.shadowRoot?.querySelector('.modal-body');
      // if (!modalBody) {
      //   throw new Error("Modal body not found");
      // }

      // Store reference to the workflow
      this.activeWorkflow = workflowElement as WorkflowBase;

      // Set up event listener for validation events
      workflowElement.addEventListener('workflowValidation', this.boundHandleWorkflowValidation);

      // Connect the workflow to this host
      if (typeof (this.activeWorkflow as any).setHost === 'function') {
        (this.activeWorkflow as any).setHost(this);
      }

      // Add to DOM
      this.appendChild(workflowElement);

      // Reset modal state
      this.showFooter = true;

      // Now initialize the workflow if needed (this will set the correct footer state)
      if (typeof (this.activeWorkflow as any).initialize === 'function') {
        (this.activeWorkflow as any).initialize();
      }

      return true;
    } catch (error) {
      console.error(`Error loading workflow element:`, error);
      return false;
    }
  }


  /**
   * Clear the current workflow
   */
  private clearWorkflow(startingNew: boolean = false): void {
    if (this.activeWorkflow) {
      console.log("Clearing active workflow");
      // Remove event listeners
      this.activeWorkflow.removeEventListener('workflowValidation', this.boundHandleWorkflowValidation);

      if (!startingNew) {
        // Add fadeout animation
        this.activeWorkflow.style.transition = 'opacity 0.1s ease';
        this.activeWorkflow.style.opacity = '0';
        // Wait for animation to complete before removing
        setTimeout(() => {
          if (this.activeWorkflow && this.contains(this.activeWorkflow)) {
            this.removeChild(this.activeWorkflow);
          }
          this.activeWorkflow = null;
        }, 500); // Match the transition duration
      } else {
        // Remove workflow from modal
        if (this.activeWorkflow && this.contains(this.activeWorkflow)) {
          this.removeChild(this.activeWorkflow);
        }
        this.activeWorkflow = null;
      }

      // Reset validation state
      this.isPrimaryActionEnabled = true;
      this.validationMessage = "";
    }
  }
  /**
   * Public method to force close the modal
   * Only called by workflow manager when closing
   */
  public forceClose(): void {
    console.debug("Force close requested by workflow manager");
    this.performStandardClose();
  }

  /**
   * Disable tooltips by finding elements with title attributes in the document
   * and temporarily storing them in a data attribute
   */
  // private disableTooltips(): void {
  //   // Handle title attributes in the document that might show tooltips through the modal
  //   document.querySelectorAll('[title]').forEach(el => {
  //     const titleValue = el.getAttribute('title');
  //     if (titleValue) {
  //       el.setAttribute('data-original-title', titleValue);
  //       el.removeAttribute('title');
  //     }
  //   });
  // }

  /**
   * Re-enable tooltips by restoring title attributes from data attributes
   */
  // private enableTooltips(): void {
  //   document.querySelectorAll('[data-original-title]').forEach(el => {
  //     const titleValue = el.getAttribute('data-original-title');
  //     if (titleValue) {
  //       el.setAttribute('modalTitle', titleValue);
  //       el.removeAttribute('data-original-title');
  //     }
  //   });
  // }
}
