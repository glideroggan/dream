import { WorkflowService } from './services/workflow-service';
import { RepositoryService, getRepositoryService } from './services/repository-service';
import { storageService } from './services/storage-service';
import { userService } from './services/user-service';
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

console.debug('Main.ts started executing - before imports');
import { getSingletonManager, initSingletonManager } from './services/singleton-manager'
initSingletonManager()
import { WidgetDefinition, WidgetService } from './services/widget-service'
// import { registerAllWorkflows } from './workflows/workflow-registry';
import { registerAllWidgets } from './widgets/widget-registry';

// Import this early to ensure search service is available
import { searchService } from './services/search-service';

// Import registries early so they can register with search
import { registerAllWorkflows } from './workflows/workflow-registry';

console.debug('Main.ts initializing services...')

// Initialize storage and user services first
window.storageService = storageService;
window.userService = userService;
console.debug('Storage and user services initialized');

// Initialize the singleton manager
const widgetService = getSingletonManager().get('WidgetService') as WidgetService

// Make services globally available
window.widgetService = widgetService

// Initialize repository service
const repositoryService = getRepositoryService();
window.repositoryService = repositoryService;
console.debug('Repository service initialized');

// Register widgets with widget service and search
registerAllWidgets(widgetService);
console.debug('Widgets registered');

const workflowService = getSingletonManager().get('WorkflowService')
window.workflowService = workflowService

// Register workflows - only call once
registerAllWorkflows().then(() => {
  console.debug("Workflows registered successfully");
  }).catch(error => {
  console.error("Failed to register workflows:", error);
});

// AFTER services are registered, import components
import './components/app-component'
import './components/header-component'
import './components/sidebar-component'
import './components/content-component'
import './components/footer-component'
import './components/search-component'

// Log search service status at the end
setTimeout(() => {
  console.debug(`Search service has ${searchService.getSearchableItemsCount()} items registered`);
  searchService.logSearchableItems();
}, 1000);

// Signal that widgets are now registered
console.debug('Application initialized')
widgetService.emitWidgetsRegistered()
