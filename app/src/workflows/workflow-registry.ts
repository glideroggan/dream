import { workflowService } from '../services/workflow-service';
import { searchService, SearchResultItem } from '../services/search-service';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  elementName: string;
  module: string;
  icon?: string;
  searchable?: boolean;
  keywords?: string[];
}

// Define all available workflows
export const WorkflowIds = {
  TRANSFER: "transfer",
  KYC: "kyc",
  CREATE_ACCOUNT: "create-account",
};

// Define all available workflows
const workflowDefinitions: WorkflowDefinition[] = [
  {
    id: WorkflowIds.TRANSFER,
    name: "Transfer Money",
    description: "Transfer money between accounts",
    elementName: "transfer-workflow",
    module: "@workflows/transfer",
    icon: "💸",
    searchable: true,
    keywords: ['transfer', 'send money', 'payment', 'move money', 'transfer funds'],
  },
  {
    id: WorkflowIds.KYC,
    name: "Identity Verification",
    description: "Complete KYC verification process",
    elementName: "kyc-workflow",
    module: "@workflows/kyc",
    icon: "🪪",
    searchable: true,
    keywords: ['identity', 'verification', 'kyc', 'know your customer', 'verify identity'],
  },
  {
    id: WorkflowIds.CREATE_ACCOUNT,
    name: "Create New Account",
    description: "Create a new bank account",
    elementName: "create-account-workflow",
    module: "@workflows/create-account",
    icon: "➕",
    searchable: true,
    keywords: ['account', 'create account', 'open account', 'new account', 'add account'],
  }
];

/**
 * Register a workflow with the search service if it's searchable
 */
function registerWorkflowWithSearch(workflow: WorkflowDefinition): void {
  if (!workflow.searchable || !workflow.keywords || workflow.keywords.length === 0) {
    return;
  }
  
  const searchItem: SearchResultItem = {
    id: `workflow-${workflow.id}`,
    title: workflow.name,
    type: 'workflow',
    keywords: workflow.keywords,
    description: workflow.description,
    icon: workflow.icon,
    action: () => {
      console.debug(`Starting workflow from search: ${workflow.id}`);
      
      // Dispatch an event that will cross shadow DOM boundaries
      const event = new CustomEvent('start-workflow', {
        bubbles: true, 
        composed: true, // This allows the event to cross shadow DOM boundaries
        detail: { workflowId: workflow.id }
      });
      
      document.dispatchEvent(event);
      
      // For compatibility with existing code, also use the global service if available
      // if (window.workflowService) {
      //   window.workflowService.startWorkflow(workflow.id);
      // }
    }
  };
  
  searchService.registerItem(searchItem);
  console.debug(`Registered workflow with search: ${workflow.id}`);
}

/**
 * Registers all workflow definitions with the workflow service
 * and search service
 */
export async function registerAllWorkflows(): Promise<void> {
  console.debug("Registering all workflows...");
  
  for (const workflow of workflowDefinitions) {
    // Register with workflow service
    workflowService.registerWorkflow(workflow.id, {
      tagName: workflow.elementName,
      importFunc: () => import(/* @vite-ignore */ workflow.module)
    });
    console.debug(`Registered workflow: ${workflow.id}`);
    
    // Register with search service if searchable
    registerWorkflowWithSearch(workflow);
  }
  
  console.debug("All workflows registered");
}
