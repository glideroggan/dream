export interface SearchResultItem {
  id: string;
  title: string; 
  type: 'theme' | 'widget' | 'workflow';
  keywords: string[];
  description?: string;
  icon?: string;
  route?: string;
  action?: () => void;
  popular?: boolean; // Added popular flag
  searchDisabledCondition?: () => Promise<boolean>; // Add support for async condition
}

class SearchService {
  private searchableItems: SearchResultItem[] = [];
  
  constructor() {
    console.debug('Search service initialized');
  }
  
  registerItems(items: SearchResultItem[]): void {
    this.searchableItems = [...this.searchableItems, ...items];
    console.debug(`Registered ${items.length} items with search service`);
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
  }
  
  unregisterItem(id: string): void {
    const initialCount = this.searchableItems.length;
    this.searchableItems = this.searchableItems.filter(item => item.id !== id);
    
    if (initialCount !== this.searchableItems.length) {
      console.debug(`Unregistered search item with id: ${id}`);
    }
  }
  
  async search(query: string): Promise<SearchResultItem[]> {
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
    // First check if we have any items explicitly marked as popular with exactly true
    const allPopularItems = this.searchableItems.filter(item => item.popular === true);
    
    // Filter out items with searchDisabledCondition that returns true
    const popularItems = await Promise.all(
      allPopularItems.map(async item => {
        if (item.searchDisabledCondition) {
          try {
            const isDisabled = await item.searchDisabledCondition();
            return { item, include: !isDisabled };
          } catch (error) {
            console.error(`Error checking popular item condition for ${item.id}:`, error);
            return { item, include: false }; // Exclude on error
          }
        }
        return { item, include: true }; // No condition means include
      })
    );
    
    const filteredPopularItems = popularItems
      .filter(result => result.include)
      .map(result => result.item);
      
    console.debug(`Found ${filteredPopularItems.length} items marked as popular after filtering:`, 
      filteredPopularItems.map(item => `${item.title} (${item.type})`).join(', '));
    
    // If we have any popular items at all, return just those (sorted by title)
    if (filteredPopularItems.length > 0) {
      return filteredPopularItems
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, limit);
    }
    
    return [];
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
