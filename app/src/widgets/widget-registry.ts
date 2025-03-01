import { WidgetDefinition, WidgetService } from '../services/widget-service';
import { searchService, SearchResultItem } from '../services/search-service';
import { getProductService } from '../services/product-service';

// Define all available widget IDs
export const WidgetIds = {
  ACCOUNT: "account",
  WELCOME: "welcome",
  SWISH: "swish-widget",
  FAST: "fast-widget",
  SLOW: "slow-widget",
  ERROR: "error-widget",
  // Add more widget IDs here as needed
};

// Define widget size options
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

// Enhanced widget definition with size preference and search metadata
interface EnhancedWidgetDefinition extends WidgetDefinition {
  preferredSize?: WidgetSize;
  minWidth?: number; // Minimum width in pixels
  searchable?: boolean;
  keywords?: string[];
  description?: string;
  icon?: string;
  requiresProduct?: string; // Add product requirement property
  searchDisabledCondition?: () => Promise<boolean>; // Add search disabled condition
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
    minWidth: 380, // Account widget needs more space for balance details
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
    minWidth: 300, // Welcome widget can be smaller
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
    minWidth: 340, // Swish widget needs space for buttons and info
    searchable: true,
    keywords: ['payment', 'transfer', 'swish', 'money', 'send money'],
    icon: '💸',
    requiresProduct: 'swish-standard', // This widget requires the swish-standard product
    // Hide Swish widget in search if user doesn't have the Swish product
    searchDisabledCondition: async () => {
      const productService = getProductService();
      // Check if user has the required product
      const hasSwish = await productService.hasProduct("swish-standard");
      // Return true to disable if user does NOT have the product
      return !hasSwish;
    }
  },
  // Example widgets for demonstrating different loading states
  {
    id: WidgetIds.SLOW,
    name: 'Slow Loading Widget',
    description: 'A widget that takes 6 seconds to load',
    elementName: 'slow-widget',
    module: '@widgets/slow',
    preferredSize: 'sm',
    minWidth: 300,
    searchable: true,
    keywords: ['slow', 'demo', 'example', 'loading'],
    icon: '🐢'
  },
  {
    id: WidgetIds.ERROR,
    name: 'Error Widget',
    description: 'A widget that fails to initialize',
    elementName: 'error-widget',
    module: '@widgets/error',
    preferredSize: 'sm',
    minWidth: 300,
    searchable: true,
    keywords: ['error', 'demo', 'example', 'failure'],
    icon: '❌'
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
export async function registerAllWidgets(widgetService: WidgetService): Promise<void> {
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
    
    await widgetService.registerWidget(standardWidgetDef);
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
function registerWidgetWithSearch(widget: EnhancedWidgetDefinition): void {
  if (!widget.searchable || !widget.keywords) {
    return;
  }
  
  const searchItem: SearchResultItem = {
    id: `widget-${widget.id}`,
    title: widget.name,
    type: 'widget',
    keywords: widget.keywords || [],
    description: widget.description || `View ${widget.name} widget`,
    icon: widget.icon,
    // Pass through the searchDisabledCondition if it exists
    searchDisabledCondition: widget.searchDisabledCondition,
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

// Add a new function to update widget searchability
export function updateWidgetSearchability(): void {
  console.debug("Updating widget searchability...");
  
  for (const widget of widgetDefinitions) {
    if (!widget.searchable || !widget.keywords) {
      continue;
    }
    
    // Re-register with search to ensure it's present and updated
    registerWidgetWithSearch(widget);
  }
}

/**
 * Find a widget by ID
 */
export function getWidgetById(widgetId: string): EnhancedWidgetDefinition | undefined {
  return widgetDefinitions.find(w => w.id === widgetId);
}

/**
 * Gets the minimum width for a widget
 */
export function getWidgetMinWidth(widgetId: string): number {
  const widget = widgetDefinitions.find(w => w.id === widgetId);
  return widget?.minWidth || 300; // Default to 300px if not specified
}
