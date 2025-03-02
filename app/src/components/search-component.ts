import { FASTElement, customElement, html, css, observable, repeat, when, ref } from '@microsoft/fast-element';
import { searchService, SearchResultItem, SearchServiceEvent } from '../services/search-service';
import { getProductService, ProductChangeEvent } from '../services/product-service';
import { updateWorkflowSearchability } from '../workflows/workflow-registry';
import { updateWidgetSearchability } from '../widgets/widget-registry';

const template = html<SearchComponent>/*html*/`
  <div class="search-container">
    <input 
      ${ref('inputElement')}
      :inputValue="${x => x.searchText}"
      type="text" 
      placeholder="Search for anything..." 
      class="search-input" 
      @focus="${x => x.handleFocus()}"
      @blur="${x => x.handleBlur()}"
      @input="${(x, c) => x.handleKeydown(c.event)}"
      
    />
    <div class="search-suggestions ${x => x.showSuggestions ? 'visible' : ''}">
      ${when(x => x.searchResults.length === 0 && x.showSuggestions && !x.searchText, html<SearchComponent>/*html*/`
        <div class="suggestions-header">Popular</div>
        ${repeat(x => x.popularItems, html<SearchResultItem, SearchComponent>/*html*/`
          <div class="suggestion-item" 
              @click="${(item, c) => c.parent.selectResult(item)}"
              @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event)}"
              tabindex="-1"
              data-result-index="${(item, c) => c.index}">
            <div class="suggestion-icon">${item => item.icon || getTypeIcon(item.type)}</div>
            <div class="suggestion-content">
              <div class="suggestion-title">${item => item.title}</div>
              <div class="suggestion-description">${item => item.description}</div>
            </div>
            <div class="suggestion-type ${item => item.type}">${item => item.type}</div>
          </div>
        `)}
      `)}
      
      ${when(x => x.searchResults.length > 0, html<SearchComponent>/*html*/`
        <div class="suggestions-header">Results</div>
        ${repeat(x => x.searchResults, html<SearchResultItem, SearchComponent>/*html*/`
          <div class="suggestion-item" 
               @click="${(item, c) => c.parent.handleItemClick(item, c.event)}"
               @mousedown="${(item, c) => c.parent.handleItemClick(item, c.event)}"
               @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event)}"
               tabindex="-1"
               data-result-index="${(item, c) => c.index}">
            <div class="suggestion-icon">${item => item.icon || getTypeIcon(item.type)}</div>
            <div class="suggestion-content">
              <div class="suggestion-title">${item => item.title}</div>
              <div class="suggestion-description">${item => item.description}</div>
            </div>
            <div class="suggestion-type ${item => item.type}">${item => item.type}</div>
          </div>
        `)}
      `)}
      
      ${when(x => x.searchResults.length === 0 && x.searchText && x.searchText.length >= 2, html<SearchComponent>`
        <div class="no-results">No results found for "${x => x.searchText}"</div>
      `)}
    </div>
  </div>
`;

function getTypeIcon(type: string): string {
  switch(type) {
    case 'theme': return '🔍';
    case 'widget': return '📊';
    case 'workflow': return '⚙️';
    default: return '📄';
  }
}

/**
 * Helper to determine current page from URL
 * This is a temporary solution until we implement a proper routing service
 * that can track the current page during client-side navigation
 */
function getCurrentPage(): string {
  // Extract the page name from the URL path
  // Check if the URL contains a hash for client-side routing
  const path = window.location.hash ? window.location.hash.substring(1) : window.location.pathname;
  // TODO: Implement a proper routing service to handle client-side navigation
  // const path = window.location.pathname;
  
  // Remove leading slash and trailing slash if present
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  
  // If empty path, we're on the root/dashboard
  if (!normalizedPath) {
    return 'dashboard';
  }
  
  // Get the first segment of the path
  const pathSegments = normalizedPath.split('/');
  const firstSegment = pathSegments[0].toLowerCase();

  // Map common page paths to page types
  const pageMap: Record<string, string> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'savings': 'savings',
    'investments': 'investments',
    'settings': 'settings',
    'accounts': 'accounts',
    'transactions': 'transactions'
  };

  return pageMap[firstSegment] || 'dashboard';
}

const styles = css`
  :host {
    display: block;
    width: 100%;
  }
  
  .search-container {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
  }
  
  .search-input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    background-color: rgba(255, 255, 255, 0.15);
    color: white;
    transition: all 0.2s ease;
    box-shadow: 0 0 0 transparent;
  }
  
  .search-input:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  
  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .search-suggestions {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    width: 350px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    display: none;
    z-index: 100;
    max-height: 450px;
    overflow-y: auto;
    padding: 8px 0;
    color: #333;
    animation: slideDown 0.2s ease-out;
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  .search-suggestions.visible {
    display: block;
  }
  
  .suggestions-header {
    padding: 8px 16px;
    font-size: 0.8rem;
    font-weight: bold;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .suggestion-item {
    padding: 10px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s ease;
    position: relative;
    z-index: 10;
    border-radius: 4px;
    margin: 0 4px;
  }
  
  .suggestion-item:hover,
  .suggestion-item:focus,
  .suggestion-item.focused {
    background-color: #f0f4f8;
    outline: none;
  }
  
  .suggestion-item:focus-visible {
    box-shadow: 0 0 0 2px #1976d2;
    outline: none;
  }
  
  .suggestion-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 8px;
    margin-right: 12px;
    font-size: 18px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  
  .suggestion-content {
    flex: 1;
    overflow: hidden;
  }
  
  .suggestion-title {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .suggestion-description {
    font-size: 0.8rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .suggestion-type {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .suggestion-type.theme {
    background-color: #e3f2fd;
    color: #1976d2;
  }
  
  .suggestion-type.widget {
    background-color: #e8f5e9;
    color: #388e3c;
  }
  
  .suggestion-type.workflow {
    background-color: #fff3e0;
    color: #f57c00;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
`;

@customElement({
  name: 'dream-search',
  template,
  styles
})
export class SearchComponent extends FASTElement {
  @observable searchText = '';
  @observable showSuggestions = false;
  @observable searchResults: SearchResultItem[] = [];
  @observable popularItems: SearchResultItem[] = [];
  @observable isLoading = false;
  @observable currentFocusedIndex = -1;
  
  // Reference to the input element
  inputElement!: HTMLInputElement;
  
  // Flag to track if a result was just selected
  private resultJustSelected = false;
  
  // Store unsubscribe function for cleanup
  private searchServiceUnsubscribe?: () => void;
  
  // Store all result elements for keyboard navigation
  private resultElements: HTMLElement[] = [];
  
  connectedCallback(): void {
    super.connectedCallback();
    
    console.debug('Search component connected, loading popular items...');
    
    // Subscribe to search service events
    this.searchServiceUnsubscribe = searchService.subscribe(this.handleSearchServiceEvent.bind(this));
    console.debug('Search component subscribed to search service events');
    
    // Initial load of popular items
    this.refreshPopularItems();
  }
  
  /**
   * Handle search service events
   */
  private handleSearchServiceEvent(event: SearchServiceEvent): void {
    console.debug(`Search component received search service event: ${event.type}`);
    
    this.refreshPopularItems();
    
    // If we're currently showing search results and items changed, refresh results
    if (event.type === 'itemsChanged' && this.searchText && this.showSuggestions) {
      this.updateResults();
    }
  }
  
  // Update method to refresh popular items
  async refreshPopularItems(): Promise<void> {
    console.debug('Refreshing popular items in search component...');
    
    try {
      // Get and log popular items
      this.popularItems = await searchService.getPopularItems();
      
      // Log more detailed information about each popular item
      if (this.popularItems.length > 0) {
        console.debug(`Popular items loaded (${this.popularItems.length}):`);
        this.popularItems.forEach(item => {
          console.debug(`- ${item.title} (${item.type}) - ID: ${item.id}`);
        });
      } else {
        console.debug('No popular items found');
      }
    } catch (error) {
      console.error('Error loading popular items:', error);
      this.popularItems = [];
    }
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    // Clean up subscription when component is disconnected
    if (this.searchServiceUnsubscribe) {
      this.searchServiceUnsubscribe();
      console.debug('Search component unsubscribed from search service events');
    }
  }
  
  private handleSearch(event: Event) {
    console.debug("Input event:", event);
    this.searchText = (event.target as HTMLInputElement).value;
    
    // Always show suggestions when typing, even after selecting a result
    if (!this.showSuggestions) {
      this.showSuggestions = true;
    }
    
    this.updateResults();
    
    // Reset the flag since user is typing again
    this.resultJustSelected = false;
  }
  handleKeydown(event: Event) {
    console.debug("Keydown event:", event);
    const keyboardEvent = event as KeyboardEvent;

    this.handleSearch(event);
    console.debug('after handleSearch', event);
    
    
    if (keyboardEvent.key === 'Tab' && !keyboardEvent.shiftKey && this.showSuggestions) {
      console.debug("Tab key pressed");
      // Prevent default tab behavior
      keyboardEvent.preventDefault();
      
      // Get available result items
      const items = this.getResultElements();
      
      if (items.length > 0) {
        // Focus the first result
        this.focusResult(0);
        return;
      }
    } else if (keyboardEvent.key === 'Enter') {
      if (this.searchResults.length > 0) {
        this.selectResult(this.searchResults[0]);
      } else {
        this.performSearch();
      }
    } else if (keyboardEvent.key === 'Escape') {
      this.showSuggestions = false;
      // Remove focus from the input field
      this.inputElement.blur();
    } else if (keyboardEvent.key === 'ArrowDown' && this.showSuggestions) {
      // Prevent default to avoid scrolling
      keyboardEvent.preventDefault();
      
      // Get available result items
      const items = this.getResultElements();
      
      if (items.length > 0) {
        // Focus the first result
        this.focusResult(0);
      }
    }
  }
  
  handleResultKeydown(item: SearchResultItem, event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    const currentIndex = this.getCurrentFocusedIndex();
    
    switch (keyboardEvent.key) {
      case 'ArrowDown':
        keyboardEvent.preventDefault();
        this.focusResult(currentIndex + 1);
        break;
        
      case 'ArrowUp':
        keyboardEvent.preventDefault();
        if (currentIndex <= 0) {
          // Return focus to the search input
          this.inputElement.focus();
        } else {
          this.focusResult(currentIndex - 1);
        }
        break;
        
      case 'Enter':
        keyboardEvent.preventDefault();
        this.selectResult(item);
        break;
        
      case 'Escape':
        keyboardEvent.preventDefault();
        this.showSuggestions = false;
        this.inputElement.focus();
        break;
        
      case 'Tab':
        // Allow natural tab navigation after the first item
        if (keyboardEvent.shiftKey) {
          if (currentIndex === 0) {
            keyboardEvent.preventDefault();
            this.inputElement.focus();
          }
        }
        break;
    }
    
  }
  
  handleFocus() {
    // Only show suggestions if we didn't just select a result
    // This prevents the dropdown from immediately reopening after selection
    if (!this.resultJustSelected) {
      this.showSuggestions = true;
      if (this.searchText) {
        this.updateResults();
      }
    }
  }
  
  handleBlur() {
    // Increased delay to ensure click events have time to process
    setTimeout(() => {
      // Only hide suggestions if we're not in the middle of selecting a result
      if (!this.resultJustSelected) {
        this.showSuggestions = false;
        
        // Clear the search text after user leaves the field
        // Use a longer timeout to ensure any selection actions complete first
        setTimeout(() => {
          this.clearSearch();
        }, 300);
      }
      // Reset the flag after a short delay
      setTimeout(() => {
        this.resultJustSelected = false;
      }, 100);
    }, 300);
  }
  
  
  
  /**
   * Get all result elements in the DOM
   */
  private getResultElements(): HTMLElement[] {
    // Query all result elements inside the component
    const container = this.shadowRoot?.querySelector('.search-suggestions');
    if (!container) return [];
    
    return Array.from(container.querySelectorAll('.suggestion-item')) as HTMLElement[];
  }
  
  /**
   * Focus a specific result by index
   */
  private focusResult(index: number): void {
    const items = this.getResultElements();
    
    // If there are no items or invalid index, do nothing
    if (items.length === 0 || index < 0) return;
    
    // Wrap around to the beginning if we go past the end
    const targetIndex = index >= items.length ? 0 : index;
    
    // Remove focused class from all items
    items.forEach(item => item.classList.remove('focused'));
    
    // Set tabindex on the target item
    const targetItem = items[targetIndex];
    targetItem.tabIndex = 0;
    
    // Set tabindex on all other items to -1
    items.forEach((item, i) => {
      if (i !== targetIndex) {
        item.tabIndex = -1;
      }
    });
    
    // Focus the target item
    targetItem.focus();
    targetItem.classList.add('focused');
    
    // Track the current focused index
    this.currentFocusedIndex = targetIndex;
  }
  
  /**
   * Get the current focused index
   */
  private getCurrentFocusedIndex(): number {
    const items = this.getResultElements();
    
    // Find the index of the focused item
    for (let i = 0; i < items.length; i++) {
      if (items[i] === document.activeElement) {
        return i;
      }
    }
    
    return -1;
  }
  
  async updateResults() {
    this.isLoading = true;
    try {
      // Get fresh search results that reflect current state
      this.searchResults = await searchService.search(this.searchText);
      console.debug(`Updated search results for "${this.searchText}":`, this.searchResults.length);
    } catch (error) {
      console.error("Error during search:", error);
      this.searchResults = [];
    } finally {
      this.isLoading = false;
    }
  }
  
  handleItemClick(result: SearchResultItem, event: Event) {
    // Prevent default to avoid issues with focus/blur sequence
    event.preventDefault();
    
    // Set flag to indicate we're selecting a result
    this.resultJustSelected = true;
    
    this.selectResult(result);
  }
  
  selectResult(result: SearchResultItem) {
    console.debug("selectResult called with:", result);
    this.showSuggestions = false;
    
    // Update input field value to match the selected result temporarily
    if (this.inputElement) {
      this.inputElement.value = result.title;
      this.inputElement.blur();
    }
    
    // Handle the result based on its type
    if (result.action) {
      // Get the current page in a more robust way
      const currentPage = getCurrentPage();
      console.debug(`Current page detected as: ${currentPage}`);
      result.action(currentPage);
    } else if (result.route) {
      console.debug("Navigating to:", result.route);
      window.location.href = result.route;
    }
    
    // Clear the search after a short delay to allow the action to complete
    setTimeout(() => {
      this.clearSearch();
    }, 200);
    
    // Keep the resultJustSelected flag true for a short time
    setTimeout(() => {
      this.resultJustSelected = false;
    }, 500);
  }
  
  // New method to clear the search field
  clearSearch() {
    this.searchText = '';
    if (this.inputElement) {
      this.inputElement.value = '';
    }
    this.searchResults = [];
  }
  
  performSearch() {
    console.debug("Performing search for:", this.searchText);
    
    // Emit an event for the search action
    const event = new CustomEvent('search', {
      bubbles: true,
      detail: { searchText: this.searchText, results: this.searchResults }
    });
    this.dispatchEvent(event);
    
    // If we have results, select the first one
    if (this.searchResults.length > 0) {
      this.selectResult(this.searchResults[0]);
    }
    
    this.showSuggestions = false;
  }
}