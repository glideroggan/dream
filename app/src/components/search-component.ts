import { FASTElement, customElement, html, css, observable } from '@microsoft/fast-element';

const template = html<SearchComponent>/*html*/`
  <div class="search-container">
    <input 
      type="text" 
      placeholder="Search..." 
      class="search-input" 
      @input="${(x, c) => x.handleInput(c.event)}"
      @focus="${x => x.handleFocus()}"
      @blur="${x => x.handleBlur()}"
      @keydown="${(x, c) => x.handleKeydown(c.event as KeyboardEvent)}"
    />
    <div class="search-suggestions ${x => x.showSuggestions ? 'visible' : ''}">
      ${x => x.renderSuggestions()}
    </div>
  </div>
`;

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
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    margin-left: auto;
    margin-right: auto;
  }
  
  .search-suggestions {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    background: white;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    display: none;
    z-index: 100;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .search-suggestions.visible {
    display: block;
  }
  
  .suggestion-item {
    padding: 0.5rem;
    cursor: pointer;
  }
  
  .suggestion-item:hover {
    background-color: #f0f0f0;
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
  
  // Mock suggestions - in a real app these would come from a service
  suggestions: string[] = [];
  
  handleInput(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.updateSuggestions();
  }
  
  handleFocus() {
    if (this.searchText) {
      this.showSuggestions = true;
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
      this.performSearch();
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }
  
  updateSuggestions() {
    if (this.searchText.length > 1) {
      // Mock suggestion logic - replace with actual search suggestions logic
      this.suggestions = [
        `${this.searchText} - result 1`,
        `${this.searchText} - result 2`,
        `${this.searchText} - result 3`
      ];
      this.showSuggestions = true;
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }
  
  selectSuggestion(suggestion: string) {
    this.searchText = suggestion;
    this.showSuggestions = false;
    this.performSearch();
  }
  
  renderSuggestions() {
    if (!this.suggestions.length) return '';
    
    return html<SearchComponent>`
      ${this.suggestions.map(suggestion => html<SearchComponent>`
        <div class="suggestion-item" @click="${x => x.selectSuggestion(suggestion)}">
          ${suggestion}
        </div>
      `)}
    `;
  }
  
  performSearch() {
    console.log("Search for:", this.searchText);
    // Implement search functionality
    const event = new CustomEvent('search', {
      bubbles: true,
      detail: { searchText: this.searchText }
    });
    this.dispatchEvent(event);
    this.showSuggestions = false;
  }
}
