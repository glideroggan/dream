import { css } from "@microsoft/fast-element";

export const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  /* Disable default tooltip behavior */
  :host [title] {
    position: absolute;
  }
  
  /* Only allow tooltips on interactive elements */
  :host .widget-wrapper:not(button):not([role="button"]):not(a)[title] {
    title: none;
  }
  
  .widget-wrapper {
    height: 100%;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    background: var(--background-color, #ffffff);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  /* Close button styles */
  .close-button {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--neutral-layer-4, #f0f0f0);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: var(--neutral-foreground-rest, #333);
    z-index: 10;
    opacity: 0.7;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: var(--neutral-layer-3, #e0e0e0);
  }

  /* Only show close button on hover for cleaner look */
  .close-button {
    opacity: 0;
    transform: scale(0.8);
  }

  .widget-wrapper:hover .close-button {
    opacity: 0.7;
    transform: scale(1);
  }
  
  .widget-loading, .widget-error, .widget-timeout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    text-align: center;
    color: var(--text-color, #333);
    box-sizing: border-box;
    overflow: auto;
    position: relative;
  }
  
  .widget-error {
    background-color: var(--background-color, #ffffff);
    border: 1px solid var(--error-color-light, #fadbd8);
  }
  
  .widget-import-error {
    border: 1px solid var(--warning-color-light, #fdebd0);
    background-color: var(--warning-color-bg, #fef9e7);
  }
  
  .module-path {
    display: block;
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    font-size: 0.8rem;
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    max-width: 90%;
  }
  
  .widget-error h3 {
    color: var(--error-color, #e74c3c);
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }
  
  .widget-import-error h3 {
    color: var(--warning-color, #f39c12);
  }
  
  .widget-error p {
    margin: 0.5rem 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    font-size: 0.9rem;
  }
  
  .widget-identifier {
    font-size: 0.7rem;
    color: var(--subtle-text-color, #aaa);
    margin-top: 0.5rem;
    font-style: italic;
    opacity: 0.75;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .action-buttons {
    display: flex;
    margin-top: 1rem;
  }
  
  .retry-button, .dismiss-button, .cancel-button {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  
  .retry-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
  }
  
  .retry-button:hover {
    background-color: var(--primary-color-hover, #2980b9);
  }
  
  .dismiss-button {
    background-color: transparent;
    color: var (--text-color, #333);
    border: 1px solid var(--border-color, #ddd);
    margin-left: 0.5rem;
  }
  
  .dismiss-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .cancel-button {
    background-color: transparent;
    color: var(--text-color, #333);
    border: 1px solid var(--border-color, #ddd);
    margin-top: 0.75rem;
  }
  
  .cancel-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }

  @media (max-width: 300px) {
    .widget-error, .widget-loading, .widget-timeout {
      padding: 0.75rem;
    }
    
    .widget-error h3 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .widget-error p {
      font-size: 0.8rem;
    }
    
    .retry-button, .dismiss-button, .cancel-button {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }
`;
