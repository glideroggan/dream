import { css } from "@microsoft/fast-element";

export const styles = css`
  .loan-workflow {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .loan-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
  }

  .loan-icon {
    font-size: 24px;
    margin-right: 12px;
  }

  h2 {
    margin: 0;
    font-weight: 500;
  }

  .loan-content {
    flex: 1;
    overflow-y: auto;
  }

  .loan-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin: 20px 0;
  }

  .loan-option {
    display: flex;
    padding: 16px;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: var(--background-card);
  }

  .loan-option:hover {
    border-color: var(--accent-color);
    background-color: var(--hover-bg);
  }

  .loan-option.selected {
    border-color: var(--accent-color);
    background-color: var(--hover-bg);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .loan-option-icon {
    font-size: 24px;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loan-option-content {
    flex: 1;
  }

  .loan-option-content h3 {
    margin: 0 0 8px 0;
  }

  .loan-option-content p {
    margin: 0 0 8px 0;
    font-size: 14px;
  }

  .loan-option-details {
    font-size: 14px;
    color: var(--secondary-text-color);
    font-weight: 500;
  }

  .loan-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
  }

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-container, .success-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
  }

  .error-icon, .success-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-icon {
    color: var(--notification-badge-bg);
  }

  .success-icon {
    color: var(--widget-color);
  }

  .error-message {
    color: var(--notification-badge-bg);
    margin-top: 8px;
    padding: 8px;
    background-color: rgba(231, 76, 60, 0.1);
    border-radius: 4px;
  }

  .loan-amount-section, .loan-term-section {
    margin: 20px 0;
  }

  .loan-amount-container {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .currency-symbol {
    padding: 8px 12px;
    background-color: var(--hover-bg);
    font-weight: bold;
  }

  input[type="number"] {
    flex: 1;
    border: none;
    padding: 10px;
    font-size: 16px;
    width: 100%;
    outline: none;
    background-color: var(--background-card);
    color: var(--primary-text-color);
  }

  input[type="number"]:focus {
    background-color: var(--hover-bg);
  }

  .range-limits {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .term-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .term-option {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--background-card);
  }

  .term-option:hover {
    border-color: var(--accent-color);
    background-color: var(--hover-bg);
  }

  .term-option.selected {
    border-color: var(--accent-color);
    background-color: var(--hover-bg);
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .loan-summary {
    background-color: var(--background-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .summary-row:last-child {
    border-bottom: none;
  }

  .summary-row.highlight {
    font-weight: 600;
    color: var(--accent-color);
  }

  .summary-label {
    color: var(--secondary-text-color);
  }

  .loan-purpose-section, .account-select-section {
    margin: 1.2rem 0;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    background-color: var(--background-card);
    color: var(--primary-text-color);
    outline: none;
  }

  select:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--hover-bg);
  }

  .terms-container {
    background-color: var(--background-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .terms-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 0.8rem;
    border: 1px solid var(--border-color);
    background-color: var(--background-card);
    border-radius: 4px;
    margin-bottom: 1rem;
    scrollbar-width: thin;
    color: var(--primary-text-color);
  }

  .terms-content p, .terms-content ul {
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .consent-section {
    margin: 1.5rem 0 0.5rem;
  }

  /* Custom checkbox implementation */
  .checkbox-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 10px 0;
    position: relative;
  }

  /* Hide the native checkbox but keep it accessible */
  // .checkbox-container input[type="checkbox"] {
  //   position: relative;
  //   opacity: 1;
  //   cursor: pointer;
  //   height: 25;
  //   width: 25;
  // }

  /* Create a custom checkbox */
  .checkbox-container input[type="checkbox"]{
    position: relative;
    display: inline-block;
    width: 18px;
    height: 18px;
    background-color: var(--background-card);
    border: 2px solid var(--border-color);
    border-radius: 3px;
    margin-right: 10px;
    z-index: 20;
    cursor: pointer;
    vertical-align: middle;
    transition: all 0.2s ease;
  }

  /* Style the checkmark */
  .custom-checkbox::after {
    content: "";
    position: absolute;
    display: none;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid var(--accent-color);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  /* Show the checkmark when checked */
  .checkbox-container input:checked ~ .custom-checkbox::after {
    display: block;
  }

  /* Style on hover */
  .checkbox-container:hover .custom-checkbox {
    border-color: var(--accent-color);
    background-color: var(--hover-bg);
  }

  /* Style when focused */
  .checkbox-container input:focus ~ .custom-checkbox {
    box-shadow: 0 0 0 2px var(--hover-bg);
  }

  .checkbox-label {
    font-size: 0.9rem;
    cursor: pointer;
    user-select: none; /* Prevent text selection when clicking */
    color: var(--primary-text-color);
  }

  /* Make sure scrollbars match the theme */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  // ::-webkit-scrollbar-track {
  //   background: var(--background-color);
  // }

  // ::-webkit-scrollbar-thumb {
  //   background: var(--border-color);
  //   border-radius: 5px;
  // }

  // ::-webkit-scrollbar-thumb:hover {
  //   background: var(--secondary-color);
  // }

  .next-steps {
    text-align: left;
    margin-top: 1.5rem;
    background-color: var(--background-color);
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .next-steps h4 {
    margin: 0 0 0.5rem 0;
    color: var(--accent-color);
  }

  .next-steps ol {
    margin: 0;
    padding-left: 1.25rem;
    line-height: 1.5;
  }

  @media (max-width: 600px) {
    .loan-options {
      grid-template-columns: 1fr;
    }

    .term-options {
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .term-option {
      flex: 0 0 calc(33.33% - 8px);
      text-align: center;
      margin-bottom: 8px;
    }
  }

  /* Two-column layout styles */
  .columns-container {
    display: flex;
    gap: 32px;
    margin: 20px 0;
  }

  .column {
    flex: 1;
  }

  .summary-column {
    flex: 0 0 40%;
  }

  .live-summary {
    background-color: var(--background-color, #f8f9fa);
    border-radius: 8px;
    padding: 1rem;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 16px;
  }

  .summary-card {
    background-color: var(--background-card);
    padding: 16px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
  }

  .summary-row.total {
    font-weight: 600;
    font-size: 1.1em;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 2px solid var(--border-color);
  }

  .note {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .field-hint {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  @media (max-width: 768px) {
    .columns-container {
      flex-direction: column;
    }
    
    .summary-column {
      flex: 1;
    }
  }

  @media (min-width: 600px) and (max-width: 800px) {
    .loan-options {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (min-width: 800px) {
    .loan-options {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Updated two-column layout styles */
  .eligibility-result {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    height: 100%;
  }
  
  .approval-header {
    grid-row: 1;
    grid-column: 1;
    background-color: var(--background-color, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .approval-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .approval-content h3 {
    margin: 8px 0;
    color: var(--accent-foreground-rest, #0078d4);
    font-size: 20px;
  }
  
  .loan-form-container {
    grid-column: 1 / span 2;
    grid-row: 2;
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
    flex: 1;
    min-height: 0;  /* Important for proper flexbox behavior */
  }
  
  .loan-form {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .loan-summary-container {
    grid-column: 2;
    grid-row: 1 / span 2;
    position: relative;
  }
  
  .live-summary {
    background-color: var(--background-color, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    position: sticky;
    top: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    max-height: 100%;
    overflow-y: auto;
  }
  
  .live-summary h3 {
    margin-top: 0;
    color: var (--accent-foreground-rest, #0078d4);
  }
  
  .loan-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: auto;  /* Push to bottom of container */
    padding-top: 16px;
    border-top: 1px solid var(--border-color, #eee);
  }

  @media (max-width: 768px) {
    .loan-form-container {
      flex-direction: column;
    }
    
    .loan-summary-container {
      width: 100%;
    }
  }

  /* Updated layout styles for step 2 */
  .eligibility-result {
    display: grid;
    grid-template-columns: 3fr 2fr; /* Left side larger than right */
    grid-template-rows: auto 1fr;
    gap: 20px;
    height: 100%;
  }
  
  .approval-header {
    grid-column: 1;
    grid-row: 1;
    background-color: var(--widget-bg);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .loan-summary-container {
    grid-column: 2;
    grid-row: 1 / 3; /* Span from top to bottom */
    position: relative;
    height: 100%;
  }
  
  .loan-form {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .live-summary {
    position: sticky;
    top: 0;
    height: 100%;
    background-color: var(--background-color, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow-y: auto;
  }

  .loan-navigation {
    grid-column: 1 / 3; /* Span across both columns */
    grid-row: 3;
    margin-top: 20px; 
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--border-color, #eee);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .eligibility-result {
      grid-template-columns: 1fr; /* Stack vertically on small screens */
      grid-template-rows: auto auto auto auto;
    }
    
    .approval-header {
      grid-column: 1;
      grid-row: 1;
    }
    
    .loan-summary-container {
      grid-column: 1;
      grid-row: 3;
      height: auto;
    }
    
    .loan-form {
      grid-column: 1;
      grid-row: 2;
    }
    
    .loan-navigation {
      grid-column: 1;
      grid-row: 4;
    }
  }
`;