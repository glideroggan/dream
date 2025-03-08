import { WorkflowBase } from '../workflows/workflow-base';

// Registry of available workflows
interface WorkflowRegistry {
  [key: string]: {
    tagName: string;
    importFunc?: () => Promise<any>;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  elementName: string; // Custom element tag name
  module: string; // Path to the module containing the workflow component
  defaultParams?: Record<string, unknown>; // Default parameters for this workflow
}

export class WorkflowService {
  private static instance: WorkflowService;
  private workflows: WorkflowRegistry = {};

  // Private constructor for singleton pattern
  private constructor() {
    console.debug("WorkflowService instance created");
    this.registerBuiltInWorkflows();
  }

  // Singleton accessor
  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  /**
   * Register a workflow with the service
   */
  public registerWorkflow(
    id: string,
    config: { tagName: string, importFunc?: () => Promise<any> }
  ): void {
    this.workflows[id] = config;
    console.debug(`Registered workflow: ${id} with tag ${config.tagName}`);
  }

  /**
   * Create a workflow element by ID
   */
  public async createWorkflowElement(
    workflowId: string,
    params?: Record<string, any>
  ): Promise<HTMLElement | null> {
    const workflow = this.workflows[workflowId];

    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return null;
    }

    // If there's a dynamic import function, call it first
    if (workflow.importFunc) {
      try {
        await workflow.importFunc();
      } catch (error) {
        console.error(`Failed to import workflow ${workflowId}:`, error);
        return null;
      }
    }

    // Create the element
    const element = document.createElement(workflow.tagName) as WorkflowBase
    element.initialize(params);

    return element;
  }

  /**
   * Get list of available workflow IDs
   */
  public getAvailableWorkflows(): string[] {
    return Object.keys(this.workflows);
  }

  /**
   * Register the built-in workflows
   */
  private registerBuiltInWorkflows(): void {
    // Register standard workflows
    this.registerWorkflow('transfer', { tagName: 'transfer-workflow' });
    this.registerWorkflow('kyc', { tagName: 'kyc-workflow' });
    this.registerWorkflow('swish', { tagName: 'swish-workflow' });
    this.registerWorkflow('add-contact', { tagName: 'add-contact-workflow' });
    this.registerWorkflow('card', { tagName: 'card-workflow' });
  }

}

export const workflowService = WorkflowService.getInstance();
