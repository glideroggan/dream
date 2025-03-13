import { css } from "@microsoft/fast-element";

export const styles = css`
  :host {
    /* Map account-specific variables to global theme */
    /* Text colors from global theme */
    --tertiary-text: var(--inactive-color, #999);
    --secondary-text: var(--secondary-text-color, #666);
    
    /* Background colors */
    --background-light: var(--hover-bg, rgba(0, 0, 0, 0.02));
    
    /* Status colors - use widget/global semantic colors */
    --success-color: var(--widget-success-color, #27ae60);
    --warning-color: var(--widget-warning-color, #e67e22);
    --danger-color: var(--widget-error-color, #e74c3c);
    
    /* Light backgrounds for status indicators */
    --success-bg-light: rgba(46, 204, 113, 0.1);
    --success-border: rgba(46, 204, 113, 0.3);
    --warning-bg-light: rgba(230, 126, 34, 0.1);
    --warning-border: rgba(230, 126, 34, 0.3);
    --warning-border-color: var(--warning-border);
    --danger-bg-light: rgba(231, 76, 60, 0.1);
    --danger-border: rgba(231, 76, 60, 0.3);
    
    /* Insights specific */
    --insights-bg: rgba(247, 247, 247, 0.7);
    --insights-border: rgba(230, 230, 230, 0.5);
    
    /* Upcoming transaction colors */
    --upcoming-color: #9b59b6;
    --upcoming-bg-light: rgba(247, 247, 255, 0.5);
  }
  
  /* Dark theme overrides */
  :host-context(body.dark-theme) {
    --background-light: rgba(255, 255, 255, 0.05);
    --insights-bg: rgba(40, 40, 40, 0.5);
    --insights-border: rgba(60, 60, 60, 0.5);
    --success-bg-light: rgba(46, 204, 113, 0.15);
    --warning-bg-light: rgba(230, 126, 34, 0.15);
    --danger-bg-light: rgba(231, 76, 60, 0.15);
    --upcoming-bg-light: rgba(155, 89, 182, 0.15);
  }
  
  /* Support system theme preference */
  @media (prefers-color-scheme: dark) {
    :host-context(body:not(.light-theme-forced):not(.dark-theme)) {
      --background-light: rgba(255, 255, 255, 0.05);
      --insights-bg: rgba(40, 40, 40, 0.5);
      --insights-border: rgba(60, 60, 60, 0.5);
      --success-bg-light: rgba(46, 204, 113, 0.15);
      --warning-bg-light: rgba(230, 126, 34, 0.15);
      --danger-bg-light: rgba(231, 76, 60, 0.15);
      --upcoming-bg-light: rgba(155, 89, 182, 0.15);
    }
  }

  .accounts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    flex: 1;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--widget-primary-color, var(--accent-color));
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    flex: 1;
  }
  
  .error-message {
    color: var(--widget-error-color, var(--notification-badge-bg));
    text-align: center;
    margin-bottom: 16px;
  }
  
  .retry-button {
    background-color: var(--widget-error-color, var(--notification-badge-bg));
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .retry-button:hover {
    background-color: #c0392b;
  }
  
  .account-item {
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .account-item.expanded {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .account-header {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    background-color: var(--background-light);
    transition: background-color 0.2s;
    align-items: center;
  }
  
  .account-header:hover {
    background-color: var(--hover-bg);
  }
  
  .account-info {
    flex: 1;
  }
  
  .account-name {
    font-weight: 500;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  
  .account-type {
    font-size: 12px;
    color: var(--tertiary-text);
  }
  
  /* Account insights styling */
  .account-insights {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .insight-item {
    display: flex;
    align-items: center;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    background-color: var(--insights-bg);
    border: 1px solid var(--insights-border);
    max-width: fit-content;
  }
  
  .insight-icon {
    margin-right: 3px;
    font-size: 10px;
  }
  
  .insight-label {
    margin-right: 3px;
    color: var(--tertiary-text);
  }
  
  .insight-value {
    font-weight: 500;
  }
  
  /* Insight color classes */
  .insight-item.success {
    background-color: var(--success-bg-light);
    border-color: var(--success-border);
    color: var(--success-color);
  }
  
  .insight-item.warning {
    background-color: var(--warning-bg-light);
    border-color: var(--warning-border);
    color: var(--warning-color);
  }
  
  .insight-item.danger {
    background-color: var(--danger-bg-light);
    border-color: var(--danger-border);
    color: var(--danger-color);
  }
  
  .account-balance {
    text-align: right;
    margin: 0 16px;
  }
  
  .balance-amount {
    font-weight: 600;
    font-size: 16px;
  }
  
  .balance-currency {
    font-size: 12px;
    color: var(--tertiary-text);
  }
  
  .account-actions {
    display: flex;
  }
  
  .more-button {
    background: transparent;
    border: none;
    font-size: 18px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    color: var(--secondary-text);
  }
  
  .more-button:hover {
    background-color: var(--hover-bg);
  }
  
  .expanded .account-header {
    border-bottom: 1px solid var(--divider-color);
  }
  
  /* Upcoming transactions summary */
  .upcoming-summary {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--upcoming-color);
    background-color: var(--upcoming-bg-light);
    padding: 3px 8px;
    border-radius: 12px;
    width: fit-content;
  }
  
  .upcoming-summary.warning {
    color: var(--warning-color);
    background-color: var(--warning-bg-light);
    border: 1px solid var(--warning-border-color);
  }
  
  .upcoming-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--upcoming-color);
    margin-right: 6px;
    flex-shrink: 0;
  }
  
  .upcoming-summary.warning .upcoming-dot {
    background-color: var(--warning-color);
  }
  
  .warning-icon {
    margin-left: 6px;
    font-size: 11px;
  }

  .account-name-container {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  
  .account-card-indicator {
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    cursor: pointer;
    position: relative;
    top: -1px;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .account-card-indicator:hover {
    opacity: 1;
    background-color: var(--hover-bg);
    transform: scale(1.1);
  }
`;