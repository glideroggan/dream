import { WidgetDefinition } from '../services/widget-service';
import { searchService, SearchResultItem } from '../services/search-service';

// Define all available widget IDs
export const WidgetIds = {
  ACCOUNT: "account",
  WELCOME: "welcome",
  SWISH: "swish-widget", // Add Swish widget ID
  // Add more widget IDs here as needed
};

// Define widget size options
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

// Enhanced widget definition with size preference and search metadata
interface EnhancedWidgetDefinition extends WidgetDefinition {
  preferredSize?: WidgetSize;
  searchable?: boolean;
  keywords?: string[];
  description?: string;
  icon?: string;
  requiresProduct?: string; // Add product requirement property
}

// Define all available widgets
const widgetDefinitions: EnhancedWidgetDefinition[] = [
  {
    id: WidgetIds.ACCOUNT,
    name: 'Account Balances',
    description: 'Displays user account balances and details',
    elementName: 'account-widget',
    module: '@widgets/account',
    defaultConfig: {},
    preferredSize: 'lg', // Account widget works best with more space
    searchable: true,
    keywords: ['accounts', 'checking account', 'savings account', 'bank accounts', 'money', 'balance'],
    icon: '🏦'
  },
  {
    id: WidgetIds.WELCOME,
    name: 'Welcome Widget',
    description: 'Welcome message and getting started information',
    elementName: 'welcome-widget',
    module: '@widgets/welcome',
    defaultConfig: { username: 'Guest' },
    preferredSize: 'md', // Welcome widget is medium sized
    searchable: true,
    keywords: ['welcome', 'introduction', 'guide', 'getting started', 'help'],
    icon: '👋'
  },
  // Add Swish widget definition
  {
    id: WidgetIds.SWISH,
    name: 'Swish Payment',
    description: 'Quick access to Swish transfers and payment history',
    elementName: 'swish-widget',
    module: '@widgets/swish',
    defaultConfig: {},
    preferredSize: 'md',
    searchable: true,
    keywords: ['payment', 'transfer', 'swish', 'money', 'send money'],
    icon: '💸',
    requiresProduct: 'swish-standard' // This widget requires the swish-standard product
  }
  // Add more widget definitions here
];

/**
 * Gets all available widget definitions
 */
export function getWidgetDefinitions(): EnhancedWidgetDefinition[] {
  return widgetDefinitions;
}

/**
 * Gets the preferred size for a widget
 */
export function getWidgetPreferredSize(widgetId: string): WidgetSize {
  const widget = widgetDefinitions.find(w => w.id === widgetId);
  return widget?.preferredSize || 'md'; // Default to medium if not specified
}

/**
 * Get widgets that require a specific product
 */
export function getWidgetsForProduct(productId: string): EnhancedWidgetDefinition[] {
  return widgetDefinitions.filter(widget => widget.requiresProduct === productId);
}

/**
 * Registers all widget definitions with the widget service
 */
export function registerAllWidgets(widgetService: any): void {
  console.debug('Registering all widgets...');
  
  for (const widget of widgetDefinitions) {
    // Register with widget service - preserve all original properties
    const standardWidgetDef: WidgetDefinition = {
      id: widget.id,
      name: widget.name,
      description: widget.description,
      elementName: widget.elementName,
      module: widget.module,
      defaultConfig: widget.defaultConfig,
      // Do not include search metadata or preferredSize as they aren't part of the standard widget definition
    };
    
    widgetService.registerWidget(standardWidgetDef);
    console.debug(`Registered widget: ${widget.id}`);
    
    // Register with search if searchable
    if (widget.searchable && widget.keywords) {
      registerWidgetWithSearch(widget);
    }
  }
  
  console.debug('All widgets registered');
}

/**
 * Register a widget with the search service
 */
function registerWidgetWithSearch(widget: {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  keywords?: string[];
}): void {
  const searchItem: SearchResultItem = {
    id: `widget-${widget.id}`,
    title: widget.name,
    type: 'widget',
    keywords: widget.keywords || [],
    description: widget.description || `View ${widget.name} widget`,
    icon: widget.icon,
    action: () => {
      console.debug(`Navigate or focus on widget: ${widget.id}`);
      // You would typically focus on the widget or navigate to its page
      const event = new CustomEvent('focus-widget', {
        bubbles: true, composed: true,
        detail: { widgetId: widget.id }
      });
      document.dispatchEvent(event);
    }
  };
  
  searchService.registerItem(searchItem);
  console.debug(`Registered widget with search: ${widget.id}`);
}

/**
 * Find a widget by ID
 */
export function getWidgetById(widgetId: string): EnhancedWidgetDefinition | undefined {
  return widgetDefinitions.find(w => w.id === widgetId);
}
