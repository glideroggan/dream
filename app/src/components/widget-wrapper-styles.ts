import { css } from "@microsoft/fast-element";

export const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    
    /* Define color palette that widgets can inherit */
    --widget-background: #ffffff;
    --widget-text-color: #333333;
    --widget-header-background: #fafafa;
    --widget-header-text-color: #666666;
    --widget-border-color: rgba(0,0,0,0.08);
    --widget-border-radius: 8px;
    
    /* Primary actions */
    --widget-primary-color: #3498db;
    --widget-primary-hover: #2980b9;
    --widget-primary-text: #ffffff;
    
    /* Secondary actions */
    --widget-secondary-color: #f0f0f0;
    --widget-secondary-hover: #e0e0e0;
    --widget-secondary-text: #333333;
    
    /* Accent colors for different brand features */
    --widget-accent-color: var(--widget-primary-color);
    --widget-accent-hover: var(--widget-primary-hover);
    --widget-accent-text: var(--widget-primary-text);
    
    /* Status colors */
    --widget-success-color: #27ae60;
    --widget-warning-color: #f39c12;
    --widget-error-color: #e74c3c;
    
    /* Light versions for backgrounds */
    --widget-success-light: #d5f5e3;
    --widget-warning-light: #fef9e7;
    --widget-error-light: #fadbd8;
    
    /* Dividers and subtle elements */
    --widget-divider-color: #eaeaea;
    --widget-subtle-text: #999999;
    
    /* Spacing */
    --widget-padding: 16px;
    --widget-header-padding: 0.3rem 0.75rem;
    --widget-content-padding: 1rem;
  }
  
  /* Only allow tooltips on interactive elements */
  :host .widget-wrapper:not(button):not([role="button"]):not(a)[title] {
    title: none;
  }
  
  .widget-wrapper {
    height: 100%;
    width: 100%;
    border-radius: var(--widget-border-radius);
    overflow: hidden;
    position: relative;
    background: var(--widget-background);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  .widget-header {
    position: relative;
    padding: var(--widget-header-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--widget-border-color);
    background-color: var(--widget-header-background);
    height: 40px;
  }

  .widget-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--widget-header-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  /* Close button styles */
  .close-button {
    position: relative;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: var(--widget-header-text-color);
    z-index: 10;
    opacity: 0.6;
    margin-left: 8px;
    padding: 0;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: var(--neutral-layer-3, rgba(0,0,0,0.05));
  }

  /* Only show close button on hover for cleaner look */
  .close-button {
    opacity: 0.6;
    transform: scale(0.8);
    transition: opacity 0.2s, transform 0.2s;
  }

  .widget-wrapper:hover .close-button {
    opacity: 0.8;
    transform: scale(1);
  }
  
  /* Add X to close button */
  .close-button::before,
  .close-button::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 12px;
    background-color: currentColor;
    top: 6px;
  }
  
  .close-button::before {
    transform: rotate(45deg);
  }
  
  .close-button::after {
    transform: rotate(-45deg);
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
    color: var(--widget-text-color);
    box-sizing: border-box;
    overflow: auto;
    position: relative;
  }
  
  .widget-error {
    background-color: var(--widget-background);
    border: 1px solid var(--widget-error-light);
  }
  
  .widget-import-error {
    border: 1px solid var(--widget-warning-light, #fdebd0);
    background-color: var(--widget-warning-light);
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
    color: var(--widget-error-color);
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }
  
  .widget-import-error h3 {
    color: var(--widget-warning-color);
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
    color: var(--widget-subtle-text);
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
    border-top-color: var(--widget-primary-color);
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
    background-color: var(--widget-primary-color);
    color: var(--widget-primary-text);
    border: none;
  }
  
  .retry-button:hover {
    background-color: var(--widget-primary-hover);
  }
  
  .dismiss-button {
    background-color: transparent;
    color: var(--widget-text-color);
    border: 1px solid var(--widget-border-color);
    margin-left: 0.5rem;
  }
  
  .dismiss-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .cancel-button {
    background-color: transparent;
    color: var(--widget-text-color);
    border: 1px solid var(--widget-border-color);
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
