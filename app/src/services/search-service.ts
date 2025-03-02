import { getAllSearchableWorkflows } from '../workflows/workflow-registry';
import { getAllSearchableWidgets } from '../widgets/widget-registry';

export interface SearchResultItem {
  id: string;
  title: string; 
  type: 'theme' | 'widget' | 'workflow';
  keywords: string[];
  description?: string;
  icon?: string;
  route?: string;
  action?: (currentPage:string) => void;
  popular?: boolean; // Added popular flag
  searchDisabledCondition?: () => Promise<boolean>; // Add support for async condition
}

// Define our event types for subscribers
export type SearchServiceEventType = 'itemsChanged' | 'popularItemsChanged';

// Define the event interface
export interface SearchServiceEvent {
  type: SearchServiceEventType;
  source?: string;
}

// Define subscriber callback type
export type SearchServiceSubscriber = (event: SearchServiceEvent) => void;

class SearchService {
  private searchableItems: SearchResultItem[] = [];
  private initialized = false;
  
  // Add a subscribers collection to track listeners
  private subscribers: SearchServiceSubscriber[] = [];
  
  constructor() {
    console.debug('Search service initialized');
    
    // Delay initialization to ensure all registries are loaded
    setTimeout(() => {
      this.refreshAllSearchableItems();
      this.initialized = true;
    }, 100);
  }

  /**
   * Subscribe to search service events
   * Returns an unsubscribe function
   */
  public subscribe(callback: SearchServiceSubscriber): () => void {
    // Add the subscriber
    this.subscribers.push(callback);
    console.debug(`New search service subscriber added. Total subscribers: ${this.subscribers.length}`);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
      console.debug(`Search service subscriber removed. Remaining subscribers: ${this.subscribers.length}`);
    };
  }
  
  /**
   * Notify all subscribers about a change
   */
  private notifySubscribers(event: SearchServiceEvent): void {
    console.debug(`Notifying ${this.subscribers.length} search service subscribers about: ${event.type}`);
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in search service subscriber callback:', error);
      }
    });
  }

  // NEW: Central method to refresh all searchable content
  public refreshAllSearchableItems(): void {
    console.log('Refreshing all searchable items');
    
    // Clear existing items
    this.searchableItems = [];
    
    try {
      // Get all current widgets from the registry
      // Wrap in try/catch to handle case where registry isn't ready yet
      let widgetItems: SearchResultItem[] = [];
      try {
        if (typeof getAllSearchableWidgets === 'function') {
          widgetItems = getAllSearchableWidgets();
        }
      } catch (error) {
        console.warn('Failed to get searchable widgets:', error);
      }
      
      this.searchableItems.push(...widgetItems);
      
      // Get all current workflows from the registry
      let workflowItems: SearchResultItem[] = [];
      try {
        if (typeof getAllSearchableWorkflows === 'function') {
          workflowItems = getAllSearchableWorkflows();
        }
      } catch (error) {
        console.warn('Failed to get searchable workflows:', error);
      }
      
      this.searchableItems.push(...workflowItems);
      
      // Notify subscribers about the change
      this.notifySubscribers({ type: 'itemsChanged', source: 'refreshAllSearchableItems' });
      // Also notify about popular items changing since they're derived from searchable items
      this.notifySubscribers({ type: 'popularItemsChanged', source: 'refreshAllSearchableItems' });
      
      console.log(`Search service refreshed with ${this.searchableItems.length} total items`);
    } catch (error) {
      console.error('Error refreshing search items:', error);
    }
  }
  
  // DEPRECATED: These direct registration methods should eventually be removed 
  // in favor of the central refresh approach
  registerItems(items: SearchResultItem[]): void {
    this.searchableItems = [...this.searchableItems, ...items];
    console.debug(`Registered ${items.length} items with search service`);
    
    // Notify subscribers
    this.notifySubscribers({ type: 'itemsChanged', source: 'registerItems' });
    
    // Check if any added items are popular
    if (items.some(item => item.popular === true)) {
      this.notifySubscribers({ type: 'popularItemsChanged', source: 'registerItems' });
    }
  }
  
  registerItem(item: SearchResultItem): void {
    // Check if item already exists
    const existingIndex = this.searchableItems.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      // Replace existing item
      this.searchableItems[existingIndex] = item;
      console.debug(`Updated existing search item: ${item.title} (${item.type})`);
    } else {
      // Add new item
      this.searchableItems.push(item);
      console.debug(`Registered new search item: ${item.title} (${item.type})`);
    }
    
    // Notify subscribers about changes
    this.notifySubscribers({ type: 'itemsChanged', source: 'registerItem' });
    
    // If the item is popular, also notify about popular items changes
    if (item.popular === true) {
      this.notifySubscribers({ type: 'popularItemsChanged', source: 'registerItem' });
    }
  }
  
  unregisterItem(id: string): void {
    // Check if the item was popular before removing
    const wasPopular = this.searchableItems.find(item => item.id === id)?.popular === true;
    
    const initialCount = this.searchableItems.length;
    this.searchableItems = this.searchableItems.filter(item => item.id !== id);
    
    if (initialCount !== this.searchableItems.length) {
      console.debug(`Unregistered search item with id: ${id}`);
      
      // Notify subscribers
      this.notifySubscribers({ type: 'itemsChanged', source: 'unregisterItem' });
      
      // If the removed item was popular, also notify about popular items changes
      if (wasPopular) {
        this.notifySubscribers({ type: 'popularItemsChanged', source: 'unregisterItem' });
      }
    }
  }
  
  async search(query: string): Promise<SearchResultItem[]> {
    // If not initialized yet, try to refresh
    if (!this.initialized) {
      try {
        this.refreshAllSearchableItems();
        this.initialized = true;
      } catch (error) {
        console.warn('Failed to initialize search during query', error);
      }
    }
    
    if (!query || query.length < 2) {
      return [];
    }
    
    console.debug(`Searching for: "${query}" among ${this.searchableItems.length} items`);
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // First filter based on text matching
    const matchedItems = this.searchableItems
      .filter(item => {
        // Check if query matches title
        if (item.title.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Check if query matches any keywords
        return item.keywords.some(keyword => 
          keyword.toLowerCase().includes(normalizedQuery)
        );
      });
    
    // Now check all conditional filters (which may be async)
    const filteredResults = await Promise.all(
      matchedItems.map(async item => {
        // If there's a condition to check, evaluate it
        if (item.searchDisabledCondition) {
          try {
            const isDisabled = await item.searchDisabledCondition();
            // Only include items where the condition is false (i.e., not disabled)
            return { item, include: !isDisabled };
          } catch (error) {
            console.error(`Error evaluating search condition for ${item.id}:`, error);
            return { item, include: false }; // Exclude on error
          }
        }
        // No condition means always include
        return { item, include: true };
      })
    );
    
    // Extract only the items we want to include
    const results = filteredResults
      .filter(result => result.include)
      .map(result => result.item)
      .sort((a, b) => {
        // Prioritize title matches
        const aInTitle = a.title.toLowerCase().includes(normalizedQuery);
        const bInTitle = b.title.toLowerCase().includes(normalizedQuery);
        
        if (aInTitle && !bInTitle) return -1;
        if (!aInTitle && bInTitle) return 1;
        
        // Then prioritize exact keyword matches
        const aExactKeyword = a.keywords.some(k => k.toLowerCase() === normalizedQuery);
        const bExactKeyword = b.keywords.some(k => k.toLowerCase() === normalizedQuery);
        
        if (aExactKeyword && !bExactKeyword) return -1;
        if (!aExactKeyword && bExactKeyword) return 1;
        
        // Default sort by title
        return a.title.localeCompare(b.title);
      });
      
    return results;
  }
  
  async getPopularItems(limit = 5): Promise<SearchResultItem[]> {
    console.debug("Getting popular items...");
    
    // First get all items marked as popular
    const allPopularItems = this.searchableItems.filter(item => item.popular === true);
    console.debug(`Found ${allPopularItems.length} items initially marked as popular`);
    
    // For each popular item, check if it should be hidden based on its condition
    const results = await Promise.all(
      allPopularItems.map(async item => {
        // If there's a search disabled condition, evaluate it
        if (item.searchDisabledCondition) {
          try {
            const isDisabled = await item.searchDisabledCondition();
            console.debug(`Popular item "${item.title}" condition check: disabled=${isDisabled}`);
            return { item, include: !isDisabled };
          } catch (error) {
            console.error(`Error checking condition for popular item "${item.title}":`, error);
            return { item, include: false };
          }
        }
        // No condition means always include
        return { item, include: true };
      })
    );
    
    // Filter to include only items that aren't disabled
    const filteredItems = results
      .filter(result => result.include)
      .map(result => result.item);
    
    console.debug(`After filtering, ${filteredItems.length} popular items remain:`, 
      filteredItems.map(item => `"${item.title}" (${item.type})`));
    
    // Return items sorted by title, limited to requested count
    return filteredItems
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, limit);
  }
  
  // Helper methods for debugging
  getSearchableItemsCount(): number {
    return this.searchableItems.length;
  }
  
  getSearchableItems(): SearchResultItem[] {
    return [...this.searchableItems];
  }
  
  // logSearchableItems(): void {
  //   console.debug('All searchable items:');
  //   this.searchableItems.forEach(item => {
  //     console.debug(`- ${item.title} (${item.type}): keywords=${item.keywords.join(', ')}`);
  //   });
  // }
}

export const searchService = new SearchService();

// Export a function to access the singleton
export function getSearchService(): SearchService {
  return searchService;
}
