import { workflowService, WorkflowDefinition } from '../services/workflow-service';

// Define all available workflows
const workflowDefinitions: WorkflowDefinition[] = [
  {
    id: "transfer",
    name: "Transfer Money",
    description: "Transfer money between accounts",
    elementName: "transfer-workflow",
    module: "@workflows/transfer"
  },
//   {
//     id: "add-account",
//     name: "Add New Account",
//     description: "Create a new account",
//     elementName: "add-account-workflow", 
//     module: "@workflows/add-account"
//   }
  // Add more workflow definitions here
];

/**
 * Registers all workflow definitions with the workflow service
 */
export async function registerAllWorkflows(): Promise<void> {
  console.log("Registering all workflows...");
  
  for (const workflow of workflowDefinitions) {
    await workflowService.registerWorkflow(workflow);
  }
  
  // Notify all observers that workflows are registered
  workflowService.emitWorkflowsRegistered();
  console.log("All workflows registered");
}

// Export the workflow IDs for easy access
export const WorkflowIds = {
  TRANSFER: "transfer",
  ADD_ACCOUNT: "add-account",
  // Add more workflow IDs here
};
