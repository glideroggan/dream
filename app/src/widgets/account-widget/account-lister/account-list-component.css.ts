import { css } from "@microsoft/fast-element";

export const styles = css`
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
    border-top-color: var(--widget-primary-color, #3498db);
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
    color: var(--widget-error-color, #e74c3c);
    text-align: center;
    margin-bottom: 16px;
  }
  
  .retry-button {
    background-color: var(--widget-error-color, #e74c3c);
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
    border: 1px solid var(--divider-color, #eaeaea);
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
    background-color: var(--background-light, #f9f9f9);
    transition: background-color 0.2s;
    align-items: center;
  }
  
  .account-header:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
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
    color: var(--tertiary-text, #999);
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
    background-color: var(--insights-bg, rgba(247, 247, 247, 0.7));
    border: 1px solid var(--insights-border, rgba(230, 230, 230, 0.5));
    max-width: fit-content;
  }
  
  .insight-icon {
    margin-right: 3px;
    font-size: 10px;
  }
  
  .insight-label {
    margin-right: 3px;
    color: var(--tertiary-text, #999);
  }
  
  .insight-value {
    font-weight: 500;
  }
  
  /* Insight color classes */
  .insight-item.success {
    background-color: var(--success-bg-light, rgba(240, 255, 240, 0.7));
    border-color: var(--success-border, rgba(46, 204, 113, 0.3));
    color: var(--success-color, #27ae60);
  }
  
  .insight-item.warning {
    background-color: var(--warning-bg-light, rgba(255, 248, 240, 0.7));
    border-color: var(--warning-border, rgba(230, 126, 34, 0.3));
    color: var(--warning-color, #e67e22);
  }
  
  .insight-item.danger {
    background-color: var(--danger-bg-light, rgba(255, 235, 235, 0.7));
    border-color: var(--danger-border, rgba(231, 76, 60, 0.3));
    color: var(--danger-color, #e74c3c);
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
    color: var(--tertiary-text, #999);
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
    color: var(--secondary-text, #666);
  }
  
  .more-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .expanded .account-header {
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  /* Upcoming transactions summary */
  .upcoming-summary {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--upcoming-color, #9b59b6);
    background-color: var(--upcoming-bg-light, rgba(247, 247, 255, 0.5));
    padding: 3px 8px;
    border-radius: 12px;
    width: fit-content;
  }
  
  .upcoming-summary.warning {
    color: var(--warning-color, #e67e22);
    background-color: var(--warning-bg-light, rgba(255, 248, 240, 0.7));
    border: 1px solid var(--warning-border-color, rgba(230, 126, 34, 0.2));
  }
  
  .upcoming-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--upcoming-color, #9b59b6);
    margin-right: 6px;
    flex-shrink: 0;
  }
  
  .upcoming-summary.warning .upcoming-dot {
    background-color: var(--warning-color, #e67e22);
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
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
    transform: scale(1.1);
  }
`;