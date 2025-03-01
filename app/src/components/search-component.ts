import { FASTElement, customElement, html, css, observable, repeat, when, ref } from '@microsoft/fast-element';
import { searchService, SearchResultItem } from '../services/search-service';

const template = html<SearchComponent>/*html*/`
  <div class="search-container">
    <input 
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
          <div class="suggestion-item" @click="${(item, c) => c.parent.selectResult(item)}">
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
    padding: 0.5rem 0;
    background-color: #2c3e50;
    position: relative;
  }
  
  .search-input {
    width: 300px;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    margin-left: auto;
    margin-right: auto;
    background-color: rgba(255, 255, 255, 0.15);
    color: white;
    transition: background-color 0.2s ease;
  }
  
  .search-input:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.25);
  }
  
  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .search-suggestions {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 350px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: none;
    z-index: 100;
    max-height: 400px;
    overflow-y: auto;
    margin-top: 8px;
    padding: 8px 0;
    color: #333;
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
  }
  
  .suggestion-item:hover {
    background-color: #f5f8fa;
  }
  
  .suggestion-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 6px;
    margin-right: 12px;
    font-size: 16px;
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
  
  connectedCallback(): void {
    super.connectedCallback();
    this.popularItems = searchService.getPopularItems();
  }
  
  handleInput(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.updateResults();
  }
  
  handleFocus() {
    this.showSuggestions = true;
    if (this.searchText) {
      this.updateResults();
    }
  }
  
  handleBlur() {
    // Small delay to allow click on suggestions
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }
  
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.searchResults.length > 0) {
        this.selectResult(this.searchResults[0]);
      } else {
        this.performSearch();
      }
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }
  
  updateResults() {
    this.searchResults = searchService.search(this.searchText);
  }
  
  selectResult(result: SearchResultItem) {
    console.log("Selected result:", result);
    this.showSuggestions = false;
    this.searchText = result.title;
    
    // Update input field value to match the selected result
    if (this.inputElement) {
      this.inputElement.value = result.title;
    }
    
    // Handle the result based on its type
    console.log("Selected result:", result);
    if (result.action) {
      result.action();
    } else if (result.route) {
      window.location.href = result.route;
    }
    
    // Emit an event for the selected result
    const event = new CustomEvent('search-result-selected', {
      bubbles: true,
      detail: { result }
    });
    this.dispatchEvent(event);
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