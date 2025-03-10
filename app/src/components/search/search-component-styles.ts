import { css } from '@microsoft/fast-element';

export const styles = css`
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
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    background-color: color-mix(in srgb, var(--text-light) 15%, transparent);
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .search-input-wrapper:focus-within {
    background-color: color-mix(in srgb, var(--text-light) 25%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-light) 20%, transparent);
  }
  
  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem 0 0.75rem;
    font-size: 0.9rem;
    color: color-mix(in srgb, var(--text-light) 80%, transparent);
  }
  
  .search-input {
    flex: 1;
    padding: 0.6rem 0.5rem 0.6rem 0;
    border: none;
    font-size: 0.9rem;
    background-color: transparent;
    color: var(--text-light);
    width: 100%;
  }
  
  .search-input:focus {
    outline: none;
  }
  
  .search-input::placeholder {
    color: color-mix(in srgb, var(--text-light) 70%, transparent);
  }
  
  .search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.75rem;
    font-size: 1.1rem;
    color: color-mix(in srgb, var(--text-light) 70%, transparent);
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .search-clear:hover {
    color: var(--text-light);
  }
  
  .search-loader {
    width: 16px;
    height: 16px;
    margin-right: 0.75rem;
    border: 2px solid color-mix(in srgb, var(--text-light) 30%, transparent);
    border-top: 2px solid color-mix(in srgb, var(--text-light) 80%, transparent);
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
    background: var(--text-light);
    border-radius: 8px;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--primary-color) 20%, transparent), 
                0 0 0 1px color-mix(in srgb, var(--primary-color) 5%, transparent);
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
    background-color: var(--background-color);
    border-radius: 8px;
    margin-right: 12px;
    font-size: 18px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, background-color 0.2s ease;
  }
  
  .suggestion-item:hover .suggestion-icon {
    transform: scale(1.05);
    background-color: color-mix(in srgb, var(--background-color) 80%, var(--primary-color));
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
  
  .suggestion-type.theme {
    background-color: var(--theme-bg, #e3f2fd);
    color: var(--theme-color, #0d47a1);
    font-weight: 500;
  }
  
  .suggestion-type.widget {
    background-color: var(--widget-bg, #e8f5e9);
    color: var(--widget-color, #388e3c);
    font-weight: 500;
  }
  
  .suggestion-type.workflow {
    background-color: var(--workflow-bg, #fff1e6);
    color: var(--workflow-color, #8f4700);
    font-weight: 500;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }
`;
