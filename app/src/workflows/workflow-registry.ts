import { workflowService } from '../services/workflow-service';
import { searchService, SearchResultItem } from '../services/search-service';
import { getProductService, ProductChangeEvent } from '../services/product-service';

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
  searchDisabledCondition?: () => Promise<boolean>;
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
    popular: true, 
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
    // Improved condition with additional debugging
    searchDisabledCondition: async () => {
      console.debug(`Checking if Swish workflow should be hidden (timestamp=${Date.now()})`);
      
      try {
        const productService = getProductService();
        
        // Force a full refresh before checking
        await productService.refreshProducts();
        
        // Check for the product
        const hasSwish = await productService.hasProduct("swish-standard");
        console.log(`Swish workflow searchability check result: hasSwish=${hasSwish}, timestamp=${Date.now()}`);
        
        // If user has Swish, the workflow should be disabled (return true)
        return hasSwish;
      } catch (error) {
        console.error("Error checking Swish product:", error);
        return false; // Default to showing the workflow if there's an error
      }
    }
  }
];

/**
 * Register a workflow with the search service if it's searchable
 */
async function registerWorkflowWithSearch(workflow: WorkflowDefinition): Promise<void> {
  // Check if the workflow should be searchable
  if (!workflow.searchable || !workflow.keywords || workflow.keywords.length === 0) {
    return;
  }
  
  // Check any condition that might disable search for this workflow
  if (workflow.searchDisabledCondition) {
    try {
      const disabled = await workflow.searchDisabledCondition();
      if (disabled) {
        console.debug(`Workflow ${workflow.id} has searchDisabledCondition that returned true, not registering with search`);
        return;
      }
    } catch (error) {
      console.error(`Error evaluating search condition for workflow ${workflow.id}:`, error);
      return; // Skip registration on error
    }
  }
  
  const searchItem: SearchResultItem = {
    id: `workflow-${workflow.id}`,
    title: workflow.name,
    type: 'workflow',
    keywords: workflow.keywords,
    description: workflow.description,
    icon: workflow.icon,
    popular: workflow.popular, // Include popular flag in search item
    searchDisabledCondition: workflow.searchDisabledCondition, // Pass through the condition
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
 * Get all searchable workflows as search items
 * This method is called by the search service to refresh its data
 */
export function getAllSearchableWorkflows(): SearchResultItem[] {
  if (!workflowDefinitions || !Array.isArray(workflowDefinitions) || workflowDefinitions.length === 0) {
    console.warn("Workflow definitions not available or not an array");
    return [];
  }
  
  const searchItems: SearchResultItem[] = [];
  
  try {
    for (const workflow of workflowDefinitions) {
      // Skip non-searchable workflows
      if (!workflow.searchable || !workflow.keywords) continue;
      
      // Create search item
      searchItems.push({
        id: `workflow-${workflow.id}`,
        title: workflow.name,
        type: 'workflow',
        keywords: workflow.keywords || [],
        description: workflow.description,
        icon: workflow.icon,
        popular: workflow.popular,
        searchDisabledCondition: workflow.searchDisabledCondition,
        action: () => {
          console.debug(`Starting workflow from search: ${workflow.id}`);
          
          const event = new CustomEvent('start-workflow', {
            bubbles: true, 
            composed: true,
            detail: { workflowId: workflow.id }
          });
          
          document.dispatchEvent(event);
        }
      });
    }
  } catch (error) {
    console.error("Error creating workflow search items:", error);
  }
  
  return searchItems;
}

// DEPRECATED: This will be removed in favor of the search service pulling data
export function updateWorkflowSearchability(): void {
  console.debug("Workflow searchability update method called - this is deprecated");
  // This function is now just a stub that does nothing
  // The search service will pull fresh data when needed
}

/**
 * Handle product changes by updating workflow searchability
 */
function handleProductChange(event: ProductChangeEvent): void {
  console.debug(`Product ${event.type} detected for ${event.productId}, updating workflow searchability`);
  updateWorkflowSearchability();
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
  
  // Subscribe to product changes using the product service API
  const productService = getProductService();
  const unsubscribe = productService.subscribe(handleProductChange);
  
  // Store the unsubscribe function somewhere if needed for cleanup
  // For now, we'll assume these subscriptions live for the lifetime of the application
  
  console.debug("All workflows registered and subscribed to product changes");
}
