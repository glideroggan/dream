import { css } from "@microsoft/fast-element";

export const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%; /* Ensure host fills grid cell */
    font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
    background-color: var(--widget-bg-color, #fff);
    border-radius: var(--widget-border-radius, 8px);
    box-shadow: var(--widget-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
    overflow: hidden;
    box-sizing: border-box;
    
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

  .widget-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden; /* Prevent content overflow */
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

  .widget-size-controls {
    display: flex;
    gap: 4px;
    margin-right: 12px;
  }

  .size-button {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: var(--size-button-bg, #f0f0f0);
    border: 1px solid var(--size-button-border, #ddd);
    color: var(--size-button-color, #666);
    font-size: 12px;
    font-weight: bold;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .size-button:hover {
    background-color: var(--size-button-hover-bg, #e0e0e0);
    border-color: var(--size-button-hover-border, #ccc);
  }

  .size-button-active {
    background-color: var(--size-button-active-bg, #0078d4);
    border-color: var(--size-button-active-border, #0078d4);
    color: var(--size-button-active-color, white);
  }

  .widget-title {
    flex: 1;
    font-size: var(--widget-title-size, 1rem);
    font-weight: var(--widget-title-weight, 600);
    text-align: left;
    color: var(--widget-title-color, #333);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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
    background: none;
    cursor: pointer;
    color: var(--widget-close-color, #777);
    font-size: var(--widget-close-size, 1.2rem);
    line-height: 1;
    padding: 0 0 0 8px;
    margin-left: auto;
  }
  
  .close-button:hover {
    opacity: 1;
    background-color: var(--neutral-layer-3, rgba(0,0,0,0.05));
    color: var(--widget-close-hover-color, #333);
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

  .widget-content {
    flex: 1;
    padding: var(--widget-content-padding, 1rem);
    overflow: auto;
    position: relative; /* For proper sizing of content */
    min-height: 0; /* Important: allows content to determine sizing */
  }

  .widget-content.seamless {
    padding: 0;
  }

  .loading-container,
  .error-container,
  .timeout-warning-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 150px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba(0, 120, 212, 0.2);
    border-top-color: #0078d4;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    color: #666;
  }

  .timeout-warning-message {
    color: #856404;
    margin-bottom: 1rem;
  }

  .timeout-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .timeout-button {
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    background-color: #fff;
    cursor: pointer;
  }

  .timeout-button-wait {
    background-color: #0078d4;
    border-color: #0078d4;
    color: white;
  }

  .timeout-button-wait:hover {
    background-color: #bbdefb;
  }

  .error-container {
    color: #721c24;
  }

  .error-icon {
    font-size: 2rem;
    font-weight: bold;
    color: #dc3545;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #dc3545;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .error-message {
    margin-bottom: 1rem;
    max-width: 100%;
    word-break: break-word;
  }

  /* State-based styling */
  .widget-container[state="error"] .widget-header,
  .widget-container[state="import-error"] .widget-header {
    background-color: var(--widget-error-header-bg, rgba(220, 53, 69, 0.1));
    border-bottom-color: var(--widget-error-header-border, rgba(220, 53, 69, 0.2));
  }

  .widget-container[state="timeout-warning"] .widget-header {
    background-color: var(--widget-warning-header-bg, rgba(255, 193, 7, 0.1));
    border-bottom-color: var(--widget-warning-header-border, rgba(255, 193, 7, 0.2));
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

  .span-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .span-control-group {
    display: flex;
    align-items: center;
    background-color: #f0f0f0;
    border-radius: 4px;
    padding: 0 2px;
  }

  .span-label {
    font-size: 10px;
    color: #555;
    padding: 0 2px;
  }

  .span-value {
    font-size: 12px;
    width: 18px;
    text-align: center;
    font-weight: 600;
  }

  .span-button {
    border: none;
    background: transparent;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    padding: 0;
    margin: 0;
    border-radius: 3px;
  }

  .span-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;
