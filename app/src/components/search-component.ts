import { FASTElement, customElement, observable } from '@microsoft/fast-element';
import { getSearchService, SearchResultItem, SearchService, SearchServiceEvent } from '../services/search-service';
import { template } from './search-component-template';
import { styles } from './search-component-styles';
import { getCurrentPage } from './search-component-utils';

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
  
  private searchService: SearchService;

  // Reference to the input element
  inputElement!: HTMLInputElement;
  
  // Flag to track if a result was just selected
  private resultJustSelected = false;
  
  // Store unsubscribe function for cleanup
  private searchServiceUnsubscribe?: () => void;
  
  constructor() {
    super()
    this.searchService = getSearchService()
  }
  
  connectedCallback(): void {
    super.connectedCallback();
    
    console.debug('Search component connected, loading popular items...');
    
    // Subscribe to search service events
    this.searchServiceUnsubscribe = this.searchService.subscribe(this.handleSearchServiceEvent.bind(this));
    
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
      this.popularItems = await this.searchService.getPopularItems();
      
      if (this.popularItems.length > 0) {
        console.debug(`Popular items loaded (${this.popularItems.length})`);
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
    this.searchText = (event.target as HTMLInputElement).value;
    
    // Always show suggestions when typing
    if (!this.showSuggestions) {
      this.showSuggestions = true;
    }
    
    this.updateResults();
    
    // Reset the flag since user is typing again
    this.resultJustSelected = false;
  }

  handleKeydown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;

    this.handleSearch(event);
  }
  
  handleResultKeydown(item: SearchResultItem, event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    const currentIndex = event.target ? parseInt((event.target as HTMLElement).getAttribute('data-result-index') || '-1', 10) - 2 : -1;

    console.debug('Key pressed:', keyboardEvent.key, currentIndex);
    
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

  handleSearchFocus() {
    this.resultJustSelected = this.showSuggestions
    console.debug('Search focused', this.resultJustSelected, this.showSuggestions)
  }
  
  handleFocus() {
    if (!this.resultJustSelected) {
      this.showSuggestions = true;
      if (this.searchText) {
        this.updateResults();
      }
    }
  }
  
  handleBlur() {
    setTimeout(() => {
      if (!this.resultJustSelected) {
        this.showSuggestions = false;
        
        setTimeout(() => {
          this.clearSearch();
        }, 300);
      }
      setTimeout(() => {
        this.resultJustSelected = false;
      }, 100);
    }, 300);
  }
  
  private getResultElements(): HTMLElement[] {
    const container = this.shadowRoot?.querySelector('.search-suggestions');
    if (!container) return [];
    
    return Array.from(container.querySelectorAll('.suggestion-item')) as HTMLElement[];
  }
  
  private focusResult(index: number): void {
    const items = this.getResultElements();
    console.debug('Focus result:', index, items.length);
    
    if (items.length === 0 || index < 0) return;
    
    const targetIndex = index >= items.length ? 0 : index;
    
    items.forEach(item => item.classList.remove('focused'));
    
    const targetItem = items[targetIndex];
    targetItem.tabIndex = 0;
    
    items.forEach((item, i) => {
      if (i !== targetIndex) {
        item.tabIndex = -1;
      }
    });
    
    targetItem.focus();
    targetItem.classList.add('focused');
    
    this.currentFocusedIndex = targetIndex;
  }
  
  private getCurrentFocusedIndex(): number {
    const items = this.getResultElements();
    console.debug('Current focused index:', this.currentFocusedIndex, items.length);
    
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
      this.searchResults = await this.searchService.search(this.searchText);
      console.debug(`Updated search results for "${this.searchText}":`, this.searchResults.length);
    } catch (error) {
      console.error("Error during search:", error);
      this.searchResults = [];
    } finally {
      this.isLoading = false;
    }
  }
  
  handleItemClick(result: SearchResultItem, event: Event) {
    event.preventDefault();
    this.resultJustSelected = true;
    this.selectResult(result);
  }
  
  selectResult(result: SearchResultItem) {
    this.showSuggestions = false;
    
    if (this.inputElement) {
      this.inputElement.value = result.title;
      this.inputElement.blur();
    }
    
    if (result.action) {
      const currentPage = getCurrentPage();
      result.action(currentPage);
    } else if (result.route) {
      console.debug("Navigating to:", result.route);
      window.location.href = result.route;
    }
    
    setTimeout(() => {
      this.clearSearch();
    }, 200);
    
    setTimeout(() => {
      this.resultJustSelected = false;
    }, 500);
  }
  
  /**
   * Clears the search and focuses the input field
   */
  clearSearchAndFocus() {
    this.clearSearch();
    // Reset just selected flag to ensure suggestions can show after clearing
    this.resultJustSelected = false;
    // Focus the input element after clearing
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }
  
  clearSearch() {
    this.searchText = '';
    if (this.inputElement) {
      this.inputElement.value = '';
    }
    this.searchResults = [];
  }
  
  performSearch() {
    console.debug("Performing search for:", this.searchText);
    
    const event = new CustomEvent('search', {
      bubbles: true,
      detail: { searchText: this.searchText, results: this.searchResults }
    });
    this.dispatchEvent(event);
    
    if (this.searchResults.length > 0) {
      this.selectResult(this.searchResults[0]);
    }
    
    this.showSuggestions = false;
  }
}