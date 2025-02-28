import { WorkflowService } from './services/workflow-service';
// Extend window interface to include our global properties
declare global {
  interface Window {
    widgetRegistry?: WidgetDefinition[]
    widgetService?: any
    workflowService?: WorkflowService | any
    registerWidget?: (widget: WidgetDefinition) => void
  }
}

console.log('Main.ts started executing - before imports');
import { getSingletonManager, initSingletonManager } from './services/singleton-manager'
initSingletonManager()
import { WidgetDefinition, WidgetService } from './services/widget-service'

console.log('Main.ts initializing services...')

// Initialize the singleton manager
const widgetService = getSingletonManager().get('WidgetService') as WidgetService

// Make widget service globally available
window.widgetService = widgetService

// Register widgets BEFORE importing any components
registerWidgets()

const workflowService = getSingletonManager().get('WorkflowService')
window.workflowService = workflowService
registerAllWorkflows()


// AFTER widgets are registered, import components
import './components/app-component'
import './components/header-component'
import './components/sidebar-component'
import './components/content-component'
import './components/footer-component'
import './components/search-component'
import { registerAllWorkflows } from './workflows/workflow-registry';


// Signal that widgets are now registered
console.log('Application initialized')
widgetService.emitWidgetsRegistered()

function registerWidgets() {
  console.log('Registering widgets...');
  
  // Account Widget
  widgetService.registerWidget({
    id: 'account',
    name: 'Account Balances',
    description: 'Displays user account balances and details',
    elementName: 'account-widget',
    module: '@widgets/account',
    defaultConfig: {},
  })

  // Welcome Widget
  widgetService.registerWidget({
    id: 'welcome',
    name: 'Welcome Widget',
    description: 'Welcome message and getting started information',
    elementName: 'welcome-widget',
    module: '@widgets/welcome',
    defaultConfig: { username: 'Guest' },
  })
  
  console.log('Widgets registered:', widgetService.getRegisteredWidgets());
}
