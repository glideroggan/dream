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
    color: var(--secondary-text-color);
  }
  
  .autocomplete-wrapper {
    position: relative;
    width: 100%;
    box-sizing: border-box;
  }
  
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background-color: var(--background-card);
    color: var(--primary-text-color);
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }
  
  input:focus {
    border-color: var(--accent-color);
    outline: none;
    box-shadow: 0 0 0 3px rgba(136, 189, 242, 0.2);
  }
  
  .has-error input {
    border-color: var(--error-color);
    background-color: rgba(231, 76, 60, 0.05);
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
    z-index: 2; /* Add z-index to ensure it's above the input */
    background-color: var(--background-card); /* Match input background */
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
    background-color: var(--hover-bg);
    border-radius: 16px;
    padding: 4px 8px;
    max-width: 100%;
    box-sizing: border-box;
    /* Make sure the chip is opaque */
    box-shadow: 0 0 0 1px var(--hover-bg);
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
    background-color: var(--accent-color);
    color: var(--text-light);
  }
  
  .item-badge.contact {
    background-color: var(--success-color);
    color: var(--text-light);
  }
  
  .item-label {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--primary-text-color);
  }
  
  .clear-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--inactive-color);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s;
  }
  
  .clear-button:hover {
    color: var(--error-color);
  }
  
  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background-color: var(--background-card);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    width: 100%;
    box-sizing: border-box;
  }
  
  .group-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--secondary-text-color);
    padding: 8px 12px 4px;
    background-color: var(--background-color);
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
    background-color: var(--hover-bg);
  }
  
  .autocomplete-item.highlighted,
  .autocomplete-item:focus-visible {
    background-color: var(--hover-bg);
    border-left: 3px solid var(--accent-color);
  }
  
  /* Add a more distinctive visual cue for keyboard navigation */
  .keyboard-nav .autocomplete-item.highlighted {
    background-color: var(--hover-bg);
    border-left: 3px solid var(--primary-color);
  }
  
  .autocomplete-item .item-name {
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary-text-color);
  }
  
  .autocomplete-item .item-details {
    font-size: 13px;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }
  
  .error-message {
    color: var(--error-color);
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
    border-top: 1px solid var(--border-color);
    background-color: var(--background-color);
    color: var(--accent-color);
    font-weight: 500;
    transition: background-color 0.15s, border-left 0.15s;
    border-left: 3px solid transparent;
    outline: none;
  }
  
  .new-contact-option:hover,
  .new-contact-option:focus-visible {
    background-color: var(--hover-bg);
    border-left: 3px solid var(--accent-color);
    outline: none;
  }
  
  .add-icon {
    font-size: 16px;
    font-weight: bold;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: var(--secondary-text-color);
  }
  
  .no-results p {
    margin: 0 0 12px 0;
  }
  
  .add-new-button {
    background-color: var(--accent-color);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  
  .add-new-button:hover {
    background-color: var(--primary-color-dark);
  }
  
  /* Fix the selector to properly target the input when selected item is visible */
  .autocomplete-wrapper .selected-item-display.visible ~ input {
    color: transparent !important;
    caret-color: transparent !important; /* Hide the caret too */
    /* Backup approach in case color:transparent doesn't work fully */
    text-indent: -9999px;
    text-shadow: 0 0 0 transparent;
  }
  
  /* Make sure clear button is clickable */
  .item-chip .clear-button {
    z-index: 3;
    pointer-events: auto;
  }
`;