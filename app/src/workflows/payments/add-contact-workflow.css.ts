import { css } from "@microsoft/fast-element";

export const styles = css`
  .contact-workflow {
    display: flex;
    flex-direction: column;
  }
  
  /* Tabs styling */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    margin-bottom: 16px;
  }
  
  .tab {
    padding: 10px 16px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--secondary-text-color, #666);
    transition: all 0.2s ease;
  }
  
  .tab:hover {
    background-color: var(--hover-bg);
  }
  
  .tab.active {
    color: var(--accent-color, #3498db);
    border-bottom-color: var(--accent-color, #3498db);
  }
  
  .tab-content {
    padding: 8px 0;
  }
  
  /* Existing form styling */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--secondary-text-color, #666);
  }
  
  input, textarea {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    background-color: var(--background-color);
    color: var(--primary-text-color);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  input:focus, textarea:focus {
    border-color: var(--accent-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 13px;
  }
  
  .checkbox-group {
    margin-top: 8px;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .checkbox-text {
    font-size: 14px;
  }
  
  .favorite-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(241, 196, 15, 0.1);
    border: 1px solid rgba(241, 196, 15, 0.3);
    border-radius: 16px;
    padding: 4px 12px;
    font-size: 14px;
    color: #f39c12;
    animation: fadeIn 0.3s ease;
    margin-bottom: 8px;
  }
  
  .favorite-badge span {
    font-size: 16px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Success message styling */
  .success-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: rgba(46, 204, 113, 0.1);
    border: 1px solid rgba(46, 204, 113, 0.3);
    border-radius: 4px;
    color: var(--success-color);
    margin-bottom: 16px;
    animation: slideDown 0.3s ease;
  }
  
  .success-icon {
    font-size: 18px;
    font-weight: bold;
  }
  
  @keyframes slideDown {
    from { 
      opacity: 0;
      transform: translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Contacts list styling */
  .contacts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .contact-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    transition: box-shadow 0.2s ease;
  }
  
  .contact-item:hover {
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  .contact-item-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .contact-name {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .favorite-star {
    color: #f39c12;
    font-size: 16px;
  }
  
  .contact-info {
    font-size: 14px;
    color: var(--secondary-text-color, #666);
  }
  

  
  /* Empty state and loading */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0;
    gap: 16px;
  }
  
  .loading-indicator {
    padding: 24px 0;
    text-align: center;
    color: var(--secondary-text-color, #666);
  }
  
  /* Confirmation dialog */
  .confirm-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
  
  .confirm-dialog-content {
    background-color: var(--background-card);
    border-radius: 8px;
    padding: 24px;
    width: 80%;
    max-width: 350px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .confirm-dialog-content h4 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
  }
  
  .confirm-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
  

`;