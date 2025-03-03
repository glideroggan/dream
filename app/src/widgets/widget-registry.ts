import { WidgetDefinition, WidgetService } from '../services/widget-service';
import { getSearchService, SearchResultItem } from '../services/search-service';
import { getProductService } from '../services/product-service';

// Define all available widget IDs
export const WidgetIds = {
  ACCOUNT: "account",
  WELCOME: "welcome",
  SWISH: "swish-widget",
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
    preferredSize: 'sm', 
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
    searchDisabledCondition: widget.searchDisabledCondition,
    // FIXED: Let search component determine targetPage dynamically at runtime
    // instead of hardcoding it here
    action: (currentPage:string) => {
      console.debug(`Search requesting focus on widget: ${widget.id}`);
      
      // The focus-widget event will be processed by the event handler in base-page.ts
      // and the current page will be determined by the search component
      const event = new CustomEvent('focus-widget', {
        bubbles: true, 
        composed: true,
        detail: { 
          widgetId: widget.id,
          // targetPage will be added by search component
          targetPage: currentPage
        }
      });
      document.dispatchEvent(event);
    }
  };
  
  getSearchService().registerItem(searchItem);
  console.debug(`Registered widget with search: ${widget.id}`);
}

/**
 * Get all searchable widgets as search items
 * This method is called by the search service to refresh its data
 */
export function getAllSearchableWidgets(): SearchResultItem[] {
  if (!widgetDefinitions || !Array.isArray(widgetDefinitions) || widgetDefinitions.length === 0) {
    console.warn("Widget definitions not available or not an array");
    return [];
  }
  
  const searchItems: SearchResultItem[] = [];
  
  try {
    for (const widget of widgetDefinitions) {
      if (!widget.searchable || !widget.keywords) continue;
      
      // Create a search item for each searchable widget
      searchItems.push({
        id: `widget-${widget.id}`,
        title: widget.name,
        type: 'widget',
        keywords: widget.keywords || [],
        description: widget.description || `View ${widget.name} widget`,
        icon: widget.icon,
        searchDisabledCondition: widget.searchDisabledCondition,
        action: (currentPage:string) => {
          console.debug(`Search requesting focus on widget: ${widget.id}`);
          
          const event = new CustomEvent('focus-widget', {
            bubbles: true, 
            composed: true,
            detail: { 
              widgetId: widget.id,
              targetPage: currentPage
            }
          });
          
          document.dispatchEvent(event);
        }
      });
    }
  } catch (error) {
    console.error("Error creating widget search items:", error);
  }
  
  return searchItems;
}

// DEPRECATED: This will be removed in favor of the search service pulling data
export function updateWidgetSearchability(): void {
  console.debug("Widget searchability updated method called - this is deprecated");
  // This function is now just a stub that does nothing
  // The search service will pull fresh data when needed
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

/**
 * Gets widgets that should be automatically added when a product is activated
 * These widgets will only be automatically added once, then their presence
 * will be managed by user preferences saved in settings.
 * 
 * @param productId The product ID to check
 * @returns Array of widgets that should be automatically added for this product
 */
export function getAutoWidgetsForProduct(productId: string): EnhancedWidgetDefinition[] {
  // Get all widgets that require this product
  return widgetDefinitions.filter(widget => widget.requiresProduct === productId);
}

/**
 * Check if a widget is available for the current user based on product requirements
 * 
 * @param widgetId The widget ID to check
 * @returns boolean indicating if the widget is available (has required products)
 */
export async function isWidgetAvailableForUser(widgetId: string): Promise<boolean> {
  const widget = widgetDefinitions.find(w => w.id === widgetId);
  if (!widget) return false;
  
  // If the widget doesn't require a product, it's always available
  if (!widget.requiresProduct) return true;
  
  // Check if the user has the required product
  const productService = getProductService();
  return await productService.hasProduct(widget.requiresProduct);
}

/**
 * Get all widgets that are available to the user based on their products
 */
export async function getAllAvailableWidgets(): Promise<EnhancedWidgetDefinition[]> {
  const productService = getProductService();
  const userProducts = await productService.getProducts();
  const userProductIds = userProducts.map(p => p.id);
  
  return widgetDefinitions.filter(widget => {
    // Widget is available if it doesn't require a product
    // or if the user has the required product
    return !widget.requiresProduct || 
      userProductIds.includes(widget.requiresProduct);
  });
}
