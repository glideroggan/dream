import { FASTElement, customElement, html, css, observable, repeat, when, ref } from '@microsoft/fast-element';
import { searchService, SearchResultItem } from '../services/search-service';
import { getProductService, ProductChangeEvent } from '../services/product-service';
import { updateWorkflowSearchability } from '../workflows/workflow-registry';

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
      @input="${(x, c) => x.handleInput(c.event)}"
    />
    <div class="search-suggestions ${x => x.showSuggestions ? 'visible' : ''}">
      ${when(x => x.searchResults.length === 0 && x.showSuggestions && !x.searchText, html<SearchComponent>/*html*/`
        <div class="suggestions-header">Popular</div>
        ${repeat(x => x.popularItems, html<SearchResultItem, SearchComponent>/*html*/`
          <div class="suggestion-item" 
              @click="${(item, c) => c.parent.selectResult(item)}">
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
               @mousedown="${(item, c) => c.parent.handleItemClick(item, c.event)}">
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
  
  .suggestion-item:hover {
    background-color: #f0f4f8;
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
  
  // Reference to the input element
  inputElement!: HTMLInputElement;
  
  // Flag to track if a result was just selected
  private resultJustSelected = false;
  
  // Store unsubscribe function for cleanup
  private unsubscribe?: () => void;
  
  connectedCallback(): void {
    super.connectedCallback();
    
    console.debug('Search component connected, loading popular items...');
    
    // Add a slight delay to ensure all items are registered first
    setTimeout(() => {
      this.refreshPopularItems();
    }, 300);
    
    // Subscribe to product changes using the subscription API
    const productService = getProductService();
    this.unsubscribe = productService.subscribe(this.handleProductChange.bind(this));
    console.log('Search component subscribed to product changes');
  }
  
  // Add method to refresh popular items
  refreshPopularItems(): void {
    console.debug('Refreshing popular items in search component...');
    
    // Get and log popular items
    this.popularItems = searchService.getPopularItems();

    console.log('Popular items loaded:', 
      this.popularItems.map(i => `${i.title} (${i.type}): popular=${i.popular === true}`).join(', '));
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    // Clean up subscription when component is disconnected
    if (this.unsubscribe) {
      this.unsubscribe();
      console.debug('Search component unsubscribed from product changes');
    }
  }
  
  // Handle product changes via subscription
  handleProductChange(event: ProductChangeEvent): void {
    console.log(`Product ${event.type} event received for ${event.productId}, updating search results`);

    // might be better to clear out the lists
    this.searchResults = [];
    this.popularItems = [];
    
    updateWorkflowSearchability()

    // Refresh popular items
    this.refreshPopularItems();
    this.popularItems.forEach(item => {
      if (!this.searchResults.includes(item)) {
        searchService.unregisterItem(item.id);
      }
    });

    
    
    // If we're currently showing search results, update them as well
    if (this.searchText) {
      this.updateResults();
    }
  }

  handleInput(event: Event) {
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
      }
      // Reset the flag after a short delay
      setTimeout(() => {
        this.resultJustSelected = false;
      }, 100);
    }, 300);
  }
  
  handleKeydown(event: Event) {
    console.debug("Keydown event:", event);
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      if (this.searchResults.length > 0) {
        this.selectResult(this.searchResults[0]);
      } else {
        this.performSearch();
      }
    } else if (keyboardEvent.key === 'Escape') {
      this.showSuggestions = false;
      // Remove focus from the input field
      this.inputElement.blur();
    }
  }
  
  updateResults() {
    // Get fresh search results that reflect current state
    this.searchResults = searchService.search(this.searchText);
    console.debug(`Updated search results for "${this.searchText}":`, this.searchResults.length);
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
    this.searchText = result.title;
    
    // Update input field value to match the selected result
    if (this.inputElement) {
      this.inputElement.value = result.title;
      
      // Remove focus from the input after selection
      // This helps prevent the confusing UI state
      this.inputElement.blur();
    }
    
    // Handle the result based on its type
    if (result.action) {
      console.debug("Executing action for:", result.title);
      result.action();
    } else if (result.route) {
      console.debug("Navigating to:", result.route);
      window.location.href = result.route;
    }
    
    // Emit an event for the selected result
    const event = new CustomEvent('search-result-selected', {
      bubbles: true,
      detail: { result }
    });
    this.dispatchEvent(event);
    
    // Keep the resultJustSelected flag true for a short time
    setTimeout(() => {
      this.resultJustSelected = false;
    }, 500);
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