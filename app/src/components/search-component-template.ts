import { html } from '@microsoft/fast-element';
import { SearchComponent } from './search-component';
import { SearchResultItem } from '../services/search-service';
import { ref, repeat, when } from '@microsoft/fast-element';
import { getTypeIcon } from './search-component-utils';

export const template = html<SearchComponent>/*html*/`
  <div class="search-container">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input 
        tabindex="1"
        ${ref('inputElement')}
        :inputValue="${x => x.searchText}"
        type="text" 
        placeholder="Search for anything..." 
        class="search-input" 
        @focus="${x => x.handleFocus()}"
        @blur="${x => x.handleBlur()}"
        @input="${(x, c) => x.handleKeydown(c.event)}"
      />
      ${when(x => x.isLoading, html<SearchComponent>`
        <span class="search-loader"></span>
      `)}
      ${when(x => x.searchText && !x.isLoading, html<SearchComponent>`
        <span class="search-clear" @click="${x => x.clearSearchAndFocus()}">&times;</span>
      `)}
    </div>
    <div 
      class="search-suggestions ${x => x.showSuggestions ? 'visible' : ''}"
      tabindex="2"
      @focus="${x => x.handleSearchFocus()}" >
      ${when(x => x.searchResults.length === 0 && x.showSuggestions && !x.searchText, html<SearchComponent>/*html*/`
        <div class="suggestions-header">Popular</div>
        ${repeat((x, c) => x.popularItems, html<SearchResultItem, SearchComponent>/*html*/`
          <div class="suggestion-item" 
              @click="${(item, c) => c.parent.selectResult(item)}"
              @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event)}">
            <div class="suggestion-icon">${item => item.icon || getTypeIcon(item.type)}</div>
            <div class="suggestion-content">
              <div class="suggestion-title">${item => item.title}</div>
              <div class="suggestion-description">${item => item.description}</div>
            </div>
            <div class="suggestion-type ${item => item.type}">${item => item.type}</div>
          </div>
        `, {positioning: true})}
      `)}
      
      ${when(x => x.searchResults.length > 0, html<SearchComponent>/*html*/`
        <div class="suggestions-header">Results</div>
        ${repeat(x => x.searchResults, html<SearchResultItem, SearchComponent>/*html*/`
          <div class="suggestion-item" 
               @click="${(item, c) => c.parent.handleItemClick(item, c.event)}"
               @mousedown="${(item, c) => c.parent.handleItemClick(item, c.event)}"
               @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event)}"
               tabindex="${(_, c) => c.index + 2}"
               data-result-index="${(item, c) => c.index + 2}">
            <div class="suggestion-icon">${item => item.icon || getTypeIcon(item.type)}</div>
            <div class="suggestion-content">
              <div class="suggestion-title">${item => item.title}</div>
              <div class="suggestion-description">${item => item.description}</div>
            </div>
            <div class="suggestion-type ${item => item.type}">${item => item.type}</div>
          </div>
        `,{positioning: true})}
      `)}
      
      ${when(x => x.searchResults.length === 0 && x.searchText && x.searchText.length >= 2, html<SearchComponent>`
        <div class="no-results">No results found for "${x => x.searchText}"</div>
      `)}
    </div>
  </div>
`;



