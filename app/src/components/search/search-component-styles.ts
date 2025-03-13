import { css } from '@microsoft/fast-element';

export const styles = css`
  :host {
    display: block;
    width: 100%;
    
    /* Search-specific overlay and interactive colors */
    --search-bg: color-mix(in srgb, var(--text-light) 15%, transparent);
    --search-bg-focused: color-mix(in srgb, var(--text-light) 25%, transparent);
    --search-text: var(--text-light);
    --search-placeholder: color-mix(in srgb, var(--text-light) 70%, transparent);
    --search-icon: color-mix(in srgb, var(--text-light) 80%, transparent);
    --search-shadow: color-mix(in srgb, var(--text-light) 20%, transparent);
    --search-dropdown-shadow: color-mix(in srgb, var(--primary-color) 20%, transparent);
    --search-dropdown-border: color-mix(in srgb, var(--primary-color) 5%, transparent);
    
    /* Suggestions dropdown colors derived from theme */
    --suggestion-icon-bg: var(--background-color);
    --suggestion-icon-hover: color-mix(in srgb, var(--background-color) 80%, var(--primary-color));
  }
  
  /* Dark theme specific adjustments */
  :host-context(body.dark-theme) {
    --suggestion-icon-bg: var(--background-color);
    --suggestion-icon-hover: color-mix(in srgb, var(--background-color) 70%, var(--accent-color));
  }
  
  /* Support system theme preference */
  @media (prefers-color-scheme: dark) {
    :host-context(body:not(.light-theme-forced):not(.dark-theme)) {
      --suggestion-icon-bg: var(--background-color);
      --suggestion-icon-hover: color-mix(in srgb, var(--background-color) 70%, var(--accent-color));
    }
  }
  
  .search-container {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    background-color: var(--search-bg);
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .search-input-wrapper:focus-within {
    background-color: var(--search-bg-focused);
    box-shadow: 0 0 0 2px var(--search-shadow);
  }
  
  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem 0 0.75rem;
    font-size: 0.9rem;
    color: var(--search-icon);
  }
  
  .search-input {
    flex: 1;
    padding: 0.6rem 0.5rem 0.6rem 0;
    border: none;
    font-size: 0.9rem;
    background-color: transparent;
    color: var(--search-text);
    width: 100%;
  }
  
  .search-input:focus {
    outline: none;
  }
  
  .search-input::placeholder {
    color: var(--search-placeholder);
  }
  
  .search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.75rem;
    font-size: 1.1rem;
    color: var(--search-placeholder);
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .search-clear:hover {
    color: var(--search-text);
  }
  
  .search-loader {
    width: 16px;
    height: 16px;
    margin-right: 0.75rem;
    border: 2px solid color-mix(in srgb, var(--text-light) 30%, transparent);
    border-top: 2px solid var(--search-icon);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .search-suggestions {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    width: 350px;
    background: var(--background-card);
    border-radius: 8px;
    box-shadow: 0 6px 16px var(--search-dropdown-shadow), 
                0 0 0 1px var(--search-dropdown-border);
    display: none;
    z-index: 100;
    max-height: 450px;
    overflow-y: auto;
    padding: 8px 0;
    color: var(--primary-text-color);
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
    color: var(--secondary-text-color);
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
    background-color: var(--hover-bg);
    outline: none;
  }
  
  .suggestion-item:focus-visible {
    box-shadow: 0 0 0 2px var(--accent-color);
    outline: none;
  }
  
  .suggestion-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--suggestion-icon-bg);
    border-radius: 8px;
    margin-right: 12px;
    font-size: 18px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, background-color 0.2s ease;
  }
  
  .suggestion-item:hover .suggestion-icon {
    transform: scale(1.05);
    background-color: var(--suggestion-icon-hover);
  }
  
  .suggestion-content {
    flex: 1;
    overflow: hidden;
  }
  
  .suggestion-title {
    font-weight: 500;
    margin-bottom: 2px;
    color: var(--primary-text-color);
  }
  
  .suggestion-description {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
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
    transition: all 0.2s ease;
  }
  
  .suggestion-item:hover .suggestion-type {
    transform: scale(1.05);
  }
  
  /* Badge styling using global theme variables */
  .suggestion-type.theme {
    background-color: var(--theme-bg);
    color: var(--theme-color);
    font-weight: 500;
  }
  
  .suggestion-type.widget {
    background-color: var(--widget-bg);
    color: var(--widget-color);
    font-weight: 500;
  }
  
  .suggestion-type.workflow {
    background-color: var(--workflow-bg);
    color: var(--workflow-color);
    font-weight: 500;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }
`;
