import { WorkflowService } from './services/workflow-service';
import { getSingletonManager, initSingletonManager } from './services/singleton-manager'
initSingletonManager()
import { repositoryService, RepositoryService } from './services/repository-service';
// Initialize repository service
window.repositoryService = repositoryService;
console.debug('Repository service initialized');
// Import workflow components
import './services/product-service';
import './workflows/swish-workflow';

// Extend window interface to include our global properties
declare global {
  interface Window {
    widgetRegistry?: WidgetDefinition[]
    widgetService?: any
    workflowService?: WorkflowService | any
    repositoryService?: RepositoryService
    userService?: any
    storageService?: any
    registerWidget?: (widget: WidgetDefinition) => void
  }
}

// Import and initialize services in the right order

// Import this early to ensure singleton manager is available
console.debug('Main.ts started executing - before imports');


// Import base services first
import { WidgetDefinition, widgetService } from './services/widget-service'
import { storageService } from './services/storage-service';
import { userService } from './services/user-service';

// Initialize storage and user services early
window.storageService = storageService;
window.userService = userService;
console.debug('Storage and user services initialized');

// Initialize widget service after storage services
window.widgetService = widgetService
console.debug('Widget service initialized', widgetService);



// Import registries that register with search service
import { registerAllWidgets } from './widgets/widget-registry';
import { registerAllWorkflows } from './workflows/workflow-registry';

// Now import search service after registries are imported
// import { searchService } from './services/search-service';

// Register widgets with widget service
await registerAllWidgets(widgetService);
console.debug('Widgets registered');

// Initialize workflow service
const workflowService = getSingletonManager().get('WorkflowService')
window.workflowService = workflowService
console.debug('Workflow service initialized');

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
import './components/search-component'
import { getSearchService } from './services/search-service';

// Signal that widgets are now registered
console.debug('Application initialized')
widgetService.emitWidgetsRegistered()
