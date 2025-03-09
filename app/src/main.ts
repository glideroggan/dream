import { WorkflowService } from './services/workflow-service';
import "./services/user-service"
// Initialize repository service
// Import workflow components
import './services/product-service';
import './workflows/swish-workflow';

// Extend window interface to include our global properties
declare global {
  interface Window {
    widgetRegistry?: WidgetDefinition[]
    widgetService?: any
    workflowService?: WorkflowService | any
    userService?: any
    storageService?: any
    registerWidget?: (widget: WidgetDefinition) => void
    addMoney?: (amount: number) => void
  }
}

// Import and initialize services in the right order

// Import this early to ensure singleton manager is available
console.debug('Main.ts started executing - before imports');


// Import base services first
import { WidgetDefinition, widgetService } from './services/widget-service'
import { storageService } from './services/storage-service';
import { userService } from './services/user-service';
import { repositoryService } from './services/repository-service';

// Initialize storage and user services early
window.storageService = storageService;
window.userService = userService;

// Check if this is the first time running the app (no currentUserId in storage)
if (!storageService.getItem('currentUserId')) {
  console.debug('First-time run detected, setting initial user to new-user');
  // Default to new-user for first-time users
  storageService.setItem('currentUserId', 'new-user');
}

console.debug('Storage and user services initialized');

// Initialize widget service after storage services
window.widgetService = widgetService
console.debug('Widget service initialized', widgetService);

// Add the money function to window that actually adds money to the first account
window.addMoney = async (amount: number) => {
  try {
    // Get account repository
    const accountRepo = repositoryService.getAccountRepository();
    
    // Get user's accounts
    const accounts = await accountRepo.getAll();
    
    if (accounts.length === 0) {
      console.error("No accounts found to add money to");
      return false;
    }
    
    // Find a checking account, or use the first account
    const targetAccount = accounts.find(acc => acc.type === 'checking') || accounts[0];
    
    // Update the balance
    const updatedAccount = {
      ...targetAccount,
      balance: targetAccount.balance + amount
    };
    
    // Save the updated account
    await accountRepo.update(targetAccount.id, updatedAccount);
    
    console.log(`Added $${amount} to account ${targetAccount.name}. New balance: $${updatedAccount.balance}`);
    return true;
  } catch (error) {
    console.error("Failed to add money:", error);
    return false;
  }
};

// Import registries that register with search service
import { registerAllWidgets } from './widgets/widget-registry';
import { registerAllWorkflows } from './workflows/workflow-registry';

// Now import search service after registries are imported
// import { searchService } from './services/search-service';

// Register widgets with widget service
await registerAllWidgets(widgetService);
console.debug('Widgets registered');

// Initialize workflow service

// Register workflows - only call once
registerAllWorkflows().then(() => {
  console.debug("Workflows registered successfully");
  
  // Ensure search service gets updated after everything is registered
  setTimeout(() => {
    getSearchService().refreshAllSearchableItems();
    console.debug(`Search service initialized with ${getSearchService().getSearchableItemsCount()} items`);
  }, 300);
  
}).catch(error => {
  console.error("Failed to register workflows:", error);
});

// AFTER services are registered, import components
import './components/app-component'
import './components/header-component'
import './components/sidebar-component'
import './components/footer-component'
import './components/search/search-component'
import { getSearchService } from './services/search-service';

// Signal that widgets are now registered
console.debug('Application initialized')
widgetService.emitWidgetsRegistered()
