import { getSingletonManager } from './singleton-manager';
import { workflowService } from './workflow-service';
import { WorkflowResult } from '../workflows/workflow-base';
import { ModalComponent } from '../components/modal-component';

interface WorkflowState {
  id: string;
  element: HTMLElement;
  params?: Record<string, any>;
  paused: boolean;
  resumeCallback?: (result?: WorkflowResult) => void;
}

export class WorkflowManagerService {
  private workflowStack: WorkflowState[] = [];
  private modalComponent: ModalComponent | null = null;
  private isStartingWorkflow: boolean = false; // Add flag to prevent duplicate starts
  
  // Private constructor for singleton pattern
  private constructor() {
    console.debug("WorkflowManagerService instance created");
  }

  // Singleton accessor
  public static getInstance(): WorkflowManagerService {
    const singletonManager = getSingletonManager();
    const instance = singletonManager.getOrCreate<WorkflowManagerService>('WorkflowManagerService', () => new WorkflowManagerService());
    console.debug('WorkflowManagerService instance retrieved:', instance);
    return instance;
  }

  /**
   * Set the modal component that will be used to display workflows
   */
  public setModalComponent(modal: ModalComponent): void {
    this.modalComponent = modal;
    
    // Listen for workflow completion events from the modal
    modal.addEventListener('workflowComplete', ((event: CustomEvent) => {
      console.debug('[workflowManager] workflowComplete event received:', event.detail);
      const result = event.detail as WorkflowResult;
      this.workflowComplete(result);
    }) as EventListener);
  }

  /**
   * Start a new workflow
   * @param workflowId The ID of the workflow to start
   * @param params Parameters to pass to the workflow
   * @param pauseCurrentWorkflow Whether to pause the current workflow or close it
   * @returns A promise that resolves when the workflow completes
   */
  public async startWorkflow(
    workflowId: string, 
    params?: Record<string, any>, 
    pauseCurrentWorkflow: boolean = false
  ): Promise<WorkflowResult> {
    console.debug(`Starting workflow: ${workflowId} (pauseCurrent: ${pauseCurrentWorkflow})`, params);

    // Prevent multiple simultaneous workflow starts
    if (this.isStartingWorkflow) {
      console.warn("Already starting a workflow, preventing duplicate");
      return { success: false, message: "Workflow start in progress" };
    }

    if (!this.modalComponent) {
      console.error("Modal component not set, cannot start workflow");
      return { success: false, message: "Modal component not set" };
    }

    // Set flag to prevent multiple starts
    this.isStartingWorkflow = true;

    // TODO: is it a good idea to set an event listener in the modal here for dismissal of the workflow?
    // this.modalComponent.addEventListener('keydown', (event: KeyboardEvent) => {
    //   console.debug('keydown event', event);
    //   event.preventDefault();
    //   event.stopPropagation();
    // })

    // Dispatch transition start event (no one is listening)
    // document.dispatchEvent(new CustomEvent('workflow-transition-start', {
    //   bubbles: true,
    //   composed: true,
    //   detail: { 
    //     workflowId,
    //     message: `Loading ${workflowId} workflow...`
    //   }
    // }));

    try {
      // Check if we already have an active workflow with the same ID
      const hasActiveWithSameId = this.workflowStack.some(w => w.id === workflowId && !w.paused);
      if (hasActiveWithSameId) {
        console.warn(`Workflow ${workflowId} is already active, preventing duplicate`);
        
        // End transition since we're not proceeding
        document.dispatchEvent(new CustomEvent('workflow-transition-end', {
          bubbles: true,
          composed: true
        }));
        
        return { success: false, message: "Workflow already active" };
      }

      // Create the workflow element
      const workflowElement = await workflowService.createWorkflowElement(workflowId, params);
      if (!workflowElement) {
        return { success: false, message: `Failed to create workflow: ${workflowId}` };
      }

      // Handle current workflow if there is one
      if (this.hasActiveWorkflow()) {
        if (pauseCurrentWorkflow) {
          await this.pauseCurrentWorkflow();
        } else {
          await this.closeCurrentWorkflow();
        }
      }

      // Add new workflow to stack
      const workflowState: WorkflowState = {
        id: workflowId,
        element: workflowElement,
        params,
        paused: false
      };
      this.workflowStack.push(workflowState);
      console.debug(`workflowStack:`, this.workflowStack.map(w => w.id));

      // Return promise that resolves when workflow completes
      return new Promise<WorkflowResult>((resolve) => {
        // Store the resolve function to call when the workflow completes
        const currentIndex = this.workflowStack.length - 1;
        console.debug('decreasing workflowStack length by 1', currentIndex);
        this.workflowStack[currentIndex].resumeCallback = (result?: WorkflowResult) => {
          resolve(result || { success: false });
        };
        
        // Display the workflow
        this.displayWorkflow(workflowElement, params);
        
        // End the transition after the workflow is displayed
        document.dispatchEvent(new CustomEvent('workflow-transition-end', {
          bubbles: true,
          composed: true
        }));
      });
    } catch (error:any) {
      // End transition on error too
      document.dispatchEvent(new CustomEvent('workflow-transition-end', {
        bubbles: true,
        composed: true
      }));
      
      console.error(`Error starting workflow ${workflowId}:`, error);
      return { success: false, message: `Error starting workflow: ${error.message}` };
    } finally {
      // Reset the flag when done
      this.isStartingWorkflow = false;
    }
  }

  /**
   * Pause the current workflow to allow a nested workflow to run
   */
  private async pauseCurrentWorkflow(): Promise<void> {
    if (!this.hasActiveWorkflow()) return;

    const currentWorkflow = this.workflowStack[this.workflowStack.length - 1];
    currentWorkflow.paused = true;
    
    // The current workflow is now paused but still in our stack
    console.debug(`Workflow ${currentWorkflow.id} paused`);
  }

  /**
   * Resume a paused workflow
   */
  public async resumeWorkflow(result?: WorkflowResult): Promise<void> {
    // Dispatch transition start event
    document.dispatchEvent(new CustomEvent('workflow-transition-start', {
      bubbles: true,
      composed: true,
      detail: { message: 'Resuming workflow...' }
    }));

    try {
      // Find the last paused workflow
      const pausedIndex = [...this.workflowStack].reverse()
        .findIndex(w => w.paused);
      
      if (pausedIndex < 0) {
        document.dispatchEvent(new CustomEvent('workflow-transition-end', {
          bubbles: true,
          composed: true
        }));
        return;
      }

      // Convert reverse index to actual index
      const actualIndex = this.workflowStack.length - 1 - pausedIndex;
      const workflowToResume = this.workflowStack[actualIndex];
      
      // Close any workflows above this one
      while (this.workflowStack.length > actualIndex + 1) {
        this.workflowStack.pop();
      }

      // Resume the workflow
      workflowToResume.paused = false;
      console.debug(`Resuming workflow ${workflowToResume.id}`);
      
      // Display the workflow
      this.displayWorkflow(workflowToResume.element, workflowToResume.params);
      
      // Get the workflow instance and call its resume method if available
      if (workflowToResume.element && typeof (workflowToResume.element as any).resume === 'function') {
        // Important: Call resume AFTER the workflow has been displayed
        // This ensures the UI is ready before processing resume actions
        setTimeout(() => {
          (workflowToResume.element as any).resume(result);
        }, 0);
      }

      // End the transition after the workflow is resumed
      document.dispatchEvent(new CustomEvent('workflow-transition-end', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      // End transition on error too
      document.dispatchEvent(new CustomEvent('workflow-transition-end', {
        bubbles: true,
        composed: true
      }));
      
      console.error(`Error resuming workflow:`, error);
    }
  }

  /**
   * Handle cancel button click from the modal
   * For nested workflows, this will close only the current workflow
   */
  public handleCancel(): void {
    console.debug("Workflow manager handling cancel", this.workflowStack);
    if (!this.hasActiveWorkflow()) {
      console.debug("No active workflow to cancel");
      return;
    }

    const currentWorkflow = this.workflowStack[this.workflowStack.length - 1];
    
    // Create a cancellation result
    const result: WorkflowResult = {
      success: false,
      message: "Workflow cancelled" 
    };
    
    console.debug('handleCancel', currentWorkflow.id, this.workflowStack.length);
    
    // If there is a paused parent workflow, don't close the modal
    const hasParentWorkflow = this.workflowStack.length > 1 && 
                             this.workflowStack[this.workflowStack.length - 2].paused;
    
    // Get a reference to the callback before popping
    const callback = currentWorkflow.resumeCallback;
    
    // Remove the current workflow from the stack
    this.workflowStack.pop();
    
    // Call the callback if it exists (to resolve the promise)
    if (callback) {
      callback(result);
    }
    
    // Dispatch workflow-completed event
    document.dispatchEvent(new CustomEvent('workflow-completed', {
      bubbles: true,
      composed: true,
      detail: {
        workflowId: currentWorkflow.id,
        result
      }
    }));
    
    if (hasParentWorkflow) {
      // Resume the parent workflow with the cancellation result
      console.debug("Resuming parent workflow after cancel");
      this.resumeWorkflow(result);
    } else {
      // No parent workflow, close the modal
      console.debug("No parent workflow, closing modal");
      if (this.modalComponent) {
        // Use forceClose to avoid the loop
        console.debug('[workflowManager] - calling forceClose');
        this.modalComponent.forceClose();
        // (this.modalComponent as any).forceClose();
      }
    }
  }

  /**
   * Display a workflow in the modal
   */
  private displayWorkflow(workflowElement: HTMLElement, params?: Record<string, any>): void {
    if (!this.modalComponent) {
      console.error("Modal component not set, cannot display workflow");
      return;
    }

    // Access the private method directly using type assertion
    // This is safe since we're in control of both implementations
    const success = (this.modalComponent as any).loadWorkflowElement(workflowElement);
    
    if (!success) {
      console.error("Failed to load workflow element into modal");
      return;
    }
    
    // Show the modal if not already visible
    if (!this.modalComponent.isOpen) {
      this.modalComponent.open();
    }
  }

  /**
   * Handle workflow completion
   */
  private workflowComplete(result: WorkflowResult): void {
    console.debug("Workflow completion handler called with result:", result);
    
    if (!this.hasActiveWorkflow()) {
      console.warn("workflowComplete called but no active workflow");
      return;
    }

    // Get the completed workflow
    const completedWorkflow = this.workflowStack.pop();
    if (!completedWorkflow) return;
    
    console.debug(`Workflow ${completedWorkflow.id} completed with result:`, result);
    
    // Reset any flags
    this.isStartingWorkflow = false;
    
    // Call the resume callback if it exists
    if (completedWorkflow.resumeCallback) {
      completedWorkflow.resumeCallback(result);
    }
    
    // See if there's another workflow to resume
    if (this.hasActiveWorkflow() && 
        this.workflowStack[this.workflowStack.length - 1].paused) {
      // Resume the parent workflow
      console.debug("Resuming parent workflow after completion");
      this.resumeWorkflow(result);
    } else {
      // No parent workflow, close the modal
      console.debug("No parent workflow, closing modal");
      if (this.modalComponent) {
        // Use forceClose to avoid the loop
        this.modalComponent.forceClose();
      }
    }
    
    // Dispatch workflow-completed event
    document.dispatchEvent(new CustomEvent('workflow-completed', {
      bubbles: true,
      composed: true,
      detail: {
        workflowId: completedWorkflow.id,
        result
      }
    }));
  }

  /**
   * Close the current workflow
   */
  public async closeCurrentWorkflow(result?: WorkflowResult): Promise<void> {
    if (!this.hasActiveWorkflow()) return;
    
    this.workflowComplete(result || { success: false });
  }

  /**
   * Check if there's an active workflow
   */
  public hasActiveWorkflow(): boolean {
    return this.workflowStack.length > 0;
  }
  
  /**
   * Get the current active workflow ID
   */
  public getCurrentWorkflowId(): string | null {
    if (!this.hasActiveWorkflow()) return null;
    return this.workflowStack[this.workflowStack.length - 1].id;
  }
}

export const workflowManager = WorkflowManagerService.getInstance();
