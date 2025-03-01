export interface SearchResultItem {
  id: string;
  title: string; 
  type: 'theme' | 'widget' | 'workflow';
  keywords: string[];
  description?: string;
  icon?: string;
  route?: string;
  action?: () => void;
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
  
  search(query: string): SearchResultItem[] {
    if (!query || query.length < 2) {
      return [];
    }
    
    console.debug(`Searching for: "${query}" among ${this.searchableItems.length} items`);
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return this.searchableItems
      .filter(item => {
        // Check if query matches title
        if (item.title.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Check if query matches any keywords
        return item.keywords.some(keyword => 
          keyword.toLowerCase().includes(normalizedQuery)
        );
      })
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
  }
  
  getPopularItems(limit = 5): SearchResultItem[] {
    // In a real app, this would return items based on usage analytics
    return this.searchableItems.slice(0, limit);
  }
  
  // Helper methods for debugging
  getSearchableItemsCount(): number {
    return this.searchableItems.length;
  }
  
  getSearchableItems(): SearchResultItem[] {
    return [...this.searchableItems];
  }
  
  logSearchableItems(): void {
    console.debug('All searchable items:');
    this.searchableItems.forEach(item => {
      console.debug(`- ${item.title} (${item.type}): keywords=${item.keywords.join(', ')}`);
    });
  }
}

export const searchService = new SearchService();

// Export a function to access the singleton
export function getSearchService(): SearchService {
  return searchService;
}
