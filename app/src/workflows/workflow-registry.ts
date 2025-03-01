import { workflowService } from '../services/workflow-service';
import { searchService, SearchResultItem } from '../services/search-service';
import { getProductService } from '../services/product-service';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  elementName: string;
  module: string;
  icon?: string;
  searchable?: boolean;
  keywords?: string[];
  popular?: boolean; // Added popular flag
  // Function that returns true if this workflow should NOT appear in search results
  searchDisabledCondition?: () => boolean;
}

// Define all available workflows
export const WorkflowIds = {
  TRANSFER: "transfer",
  KYC: "kyc",
  CREATE_ACCOUNT: "create-account",
  SWISH: "swish",
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
  },
  {
    id: WorkflowIds.SWISH,
    name: "Add Swish",
    description: "Add Swish payment solution to your account",
    elementName: "swish-workflow",
    module: "@workflows/swish-workflow",
    icon: "💳",
    searchable: true,
    popular: true, // Mark Swish as popular
    keywords: ['swish', 'payment', 'add swish', 'payment solution', 'instant transfer'],
    // Don't show "Add Swish" in search results if user already has Swish
    searchDisabledCondition: () => {
      const productService = getProductService();
      const hasSwish = productService.hasProduct("swish-standard");
      return hasSwish;
    }
  }
];

/**
 * Register a workflow with the search service if it's searchable
 */
function registerWorkflowWithSearch(workflow: WorkflowDefinition): void {
  // Check if the workflow should be searchable
  if (!workflow.searchable || !workflow.keywords || workflow.keywords.length === 0) {
    return;
  }
  
  // Check any condition that might disable search for this workflow
  if (workflow.searchDisabledCondition && workflow.searchDisabledCondition()) {
    console.log(`Workflow ${workflow.id} has searchDisabledCondition that returned true, not registering with search`);
    return;
  }
  
  const searchItem: SearchResultItem = {
    id: `workflow-${workflow.id}`,
    title: workflow.name,
    type: 'workflow',
    keywords: workflow.keywords,
    description: workflow.description,
    icon: workflow.icon,
    popular: workflow.popular, // Include popular flag in search item
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
  console.log(`Registered workflow with search: ${workflow.id}`);
}

/**
 * Registers all workflow definitions with the workflow service
 * and search service
 */
export async function registerAllWorkflows(): Promise<void> {
  console.log("Registering all workflows...");
  
  for (const workflow of workflowDefinitions) {
    // Register with workflow service
    workflowService.registerWorkflow(workflow.id, {
      tagName: workflow.elementName,
      importFunc: () => import(/* @vite-ignore */ workflow.module)
    });
    console.log(`Registered workflow: ${workflow.id}`);
    
    // Register with search service if searchable
    registerWorkflowWithSearch(workflow);
  }
  
  console.debug("All workflows registered");
}
