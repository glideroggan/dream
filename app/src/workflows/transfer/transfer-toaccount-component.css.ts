import { css } from "@microsoft/fast-element";

export const styles = css`
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  .autocomplete-wrapper {
    position: relative;
    width: 100%;
    box-sizing: border-box;
  }
  
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background-color: var(--input-bg, white);
    box-sizing: border-box;
  }
  
  input:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
  
  .has-error input {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .selected-item-display {
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    pointer-events: none;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.2s, transform 0.2s;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 3px;
    box-sizing: border-box;
  }
  
  .selected-item-display.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  
  .item-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: var(--chip-bg, #f3f4f6);
    border-radius: 16px;
    padding: 4px 8px;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .item-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  
  .item-badge.account {
    background-color: var(--account-color, #3498db);
    color: white;
  }
  
  .item-badge.contact {
    background-color: var(--contact-color, #2ecc71);
    color: white;
  }
  
  .item-label {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .clear-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-tertiary, #999);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s;
  }
  
  .clear-button:hover {
    color: var(--error-color, #e74c3c);
  }
  
  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background-color: var(--dropdown-bg, white);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    width: 100%;
    box-sizing: border-box;
  }
  
  .group-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-tertiary, #999);
    padding: 8px 12px 4px;
    background-color: var(--group-bg, #f9f9f9);
    position: sticky;
    top: 0;
  }
  
  .autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.15s, border-left 0.15s;
    position: relative;
    outline: none; /* Remove default outline */
    border-left: 3px solid transparent;
  }
  
  .autocomplete-item:focus {
    outline: none;
  }
  
  .autocomplete-item:hover {
    background-color: var(--highlight-bg, #f5f9fd);
  }
  
  .autocomplete-item.highlighted,
  .autocomplete-item:focus-visible {
    background-color: var(--highlight-bg, #f5f9fd);
    border-left: 3px solid var(--primary-color, #3498db);
  }
  
  /* Add a more distinctive visual cue for keyboard navigation */
  .keyboard-nav .autocomplete-item.highlighted {
    background-color: var(--highlight-bg-strong, #e3f2fd);
    border-left: 3px solid var(--primary-color, #3498db);
  }
  
  .autocomplete-item .item-name {
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .autocomplete-item .item-details {
    font-size: 13px;
    color: var(--text-secondary, #666);
    white-space: nowrap;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 13px;
    margin-top: 4px;
  }
  
  /* Adjust input padding when an item is selected */
  .selected-item-display.visible + input {
    color: transparent;
  }
  
  /* Animation when dropdown appears */
  .autocomplete-dropdown {
    animation: dropdown-fade 0.2s ease;
    transform-origin: top center;
  }
  
  @keyframes dropdown-fade {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .new-contact-option {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    border-top: 1px solid var(--border-color, #e0e0e0);
    background-color: var(--highlight-bg-subtle, #f7f9fc);
    color: var(--primary-color, #3498db);
    font-weight: 500;
    transition: background-color 0.15s, border-left 0.15s;
    border-left: 3px solid transparent;
    outline: none;
  }
  
  .new-contact-option:hover,
  .new-contact-option:focus-visible {
    background-color: var(--highlight-bg, #f0f7fd);
    border-left: 3px solid var(--primary-color, #3498db);
    outline: none;
  }
  
  .add-icon {
    font-size: 16px;
    font-weight: bold;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: var(--text-secondary, #666);
  }
  
  .no-results p {
    margin: 0 0 12px 0;
  }
  
  .add-new-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  
  .add-new-button:hover {
    background-color: var(--primary-color-dark, #2980b9);
  }
`;