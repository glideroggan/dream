import { getSingletonManager } from './singleton-manager';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  elementName: string; // Custom element tag name
  module: string; // Path to the module containing the workflow component
  defaultParams?: Record<string, unknown>; // Default parameters for this workflow
}

type WorkflowsRegisteredCallback = () => void;

export class WorkflowService {
  private registeredWorkflows: Map<string, WorkflowDefinition> = new Map();
  private loadedWorkflows: Set<string> = new Set();
  private moduleLoadPromises: Map<string, Promise<unknown>> = new Map();
  private observers: WorkflowsRegisteredCallback[] = [];
  private areWorkflowsRegistered = false;

  // Private constructor for singleton pattern
  private constructor() {
    console.log("WorkflowService instance created");
  }

  // Singleton accessor
  public static getInstance(): WorkflowService {
    const singletonManager = getSingletonManager();
    return singletonManager.getOrCreate<WorkflowService>('WorkflowService', () => new WorkflowService());
  }

  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    console.log(`Registering workflow: ${workflow.id} (${workflow.name})`);
    this.registeredWorkflows.set(workflow.id, workflow);
  }

  getAvailableWorkflows(): WorkflowDefinition[] {
    const workflows = Array.from(this.registeredWorkflows.values());
    console.log(`Available workflows: ${workflows.length}`);
    return workflows;
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    const workflow = this.registeredWorkflows.get(id);
    if (!workflow) {
      console.warn(`Workflow "${id}" not found in registry`);
    }
    return workflow;
  }

  async loadWorkflow(id: string): Promise<WorkflowDefinition | undefined> {
    console.log(`Attempting to load workflow: ${id}`);
    const workflow = this.getWorkflow(id);
    
    if (!workflow) {
      console.warn(`Workflow with id "${id}" not found`);
      return undefined;
    }

    if (!this.loadedWorkflows.has(id)) {
      if (!this.moduleLoadPromises.has(id)) {
        console.log(`Importing module for workflow ${id}: ${workflow.module}`);
        
        // Create a promise to track this module load
        const loadPromise = (async () => {
          try {
            // Small delay to avoid blocking the main thread
            await new Promise(resolve => setTimeout(resolve, 10)); 
            await import(/* @vite-ignore */ workflow.module);
            console.log(`Successfully loaded workflow module: ${id}`);
            this.loadedWorkflows.add(id);
          } catch (error) {
            console.error(`Failed to load workflow ${id}:`, error);
            // Remove the promise to allow retries
            this.moduleLoadPromises.delete(id);
            throw error;
          }
        })();
        
        this.moduleLoadPromises.set(id, loadPromise);
      }
      
      // Wait for the module to load
      try {
        await this.moduleLoadPromises.get(id);
      } catch (error) {
        return undefined;
      }
    } else {
      console.log(`Workflow ${id} already loaded, skipping import`);
    }

    return workflow;
  }

  // Observer pattern methods
  onWorkflowsRegistered(callback: WorkflowsRegisteredCallback): void {
    if (this.areWorkflowsRegistered) {
      // If workflows are already registered, call the callback immediately
      setTimeout(() => callback(), 0);
    } else {
      // Otherwise, add to observers list
      this.observers.push(callback);
    }
  }

  emitWorkflowsRegistered(): void {
    this.areWorkflowsRegistered = true;
    console.log(`Notifying ${this.observers.length} observers that workflows are registered`);
    this.observers.forEach(callback => callback());
    this.observers = []; // Clear the observers list after notifying them
  }

  areAllWorkflowsRegistered(): boolean {
    return this.areWorkflowsRegistered;
  }
  
  // Create an instance of a workflow component and return the HTMLElement
  async createWorkflowElement(id: string, params?: Record<string, unknown>): Promise<HTMLElement | undefined> {
    const workflow = await this.loadWorkflow(id);
    
    if (!workflow) {
      console.error(`Cannot create element for workflow ${id} - not found or failed to load`);
      return undefined;
    }
    
    try {
      // Create the element
      const element = document.createElement(workflow.elementName) as HTMLElement;
      
      // Apply parameters
      const combinedParams = { ...workflow.defaultParams, ...params };
      if (Object.keys(combinedParams).length > 0) {
        Object.entries(combinedParams).forEach(([key, value]) => {
          // Try to set it as a property first
          try {
            (element as any)[key] = value;
          } catch (e) {
            // Fallback to attribute for primitive values
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              element.setAttribute(key, String(value));
            }
          }
        });
      }
      
      return element;
    } catch (error) {
      console.error(`Error creating workflow element ${workflow.elementName}:`, error);
      return undefined;
    }
  }
}

export const workflowService = WorkflowService.getInstance();
console.log("WorkflowService loaded");
