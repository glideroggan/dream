import { css } from "@microsoft/fast-element";

export const styles = css`
  .loan-workflow {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    font-family: var(--body-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
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
    border: 2px solid var(--neutral-stroke-rest, #ccc);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: var(--neutral-fill-rest, #f5f5f5);
  }

  .loan-option:hover {
    border-color: var(--accent-fill-hover, #0078d4);
    background-color: var(--neutral-fill-hover, #e8e8e8);
  }

  .loan-option.selected {
    border-color: var(--accent-fill-rest, #0078d4);
    background-color: var(--accent-fill-subtle, rgba(0, 120, 212, 0.1));
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
    color: var(--neutral-foreground-hint, #767676);
    font-weight: 500;
  }

  .loan-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
  }

  .primary-button {
    background-color: var(--accent-fill-rest, #0078d4);
    color: var(--accent-foreground-rest, white);
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    min-width: 100px;
    transition: background-color 0.2s ease;
    font-weight: 500;
  }

  .primary-button:hover {
    background-color: var(--accent-fill-hover, #106ebe);
  }

  .primary-button:disabled {
    background-color: var(--neutral-fill-rest, #e0e0e0);
    color: var(--neutral-foreground-rest, #999);
    cursor: not-allowed;
  }

  .secondary-button {
    background-color: transparent;
    color: var(--accent-fill-rest, #0078d4);
    border: 1px solid var(--accent-fill-rest, #0078d4);
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    min-width: 100px;
    transition: all 0.2s ease;
  }

  .secondary-button:hover {
    background-color: var(--accent-fill-subtle, rgba(0, 120, 212, 0.1));
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
    border: 4px solid var(--neutral-fill-rest, #e0e0e0);
    border-top: 4px solid var(--accent-fill-rest, #0078d4);
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
    color: var(--error-color, #e74c3c);
  }

  .success-icon {
    color: var(--success-color, #2ecc71);
  }

  .error-message {
    color: var(--error-color, #e74c3c);
    margin-top: 8px;
    padding: 8px;
    background-color: var(--error-subtle, rgba(231, 76, 60, 0.1));
    border-radius: 4px;
  }

  .loan-amount-section, .loan-term-section {
    margin: 20px 0;
  }

  .loan-amount-container {
    display: flex;
    align-items: center;
    border: 1px solid var(--neutral-stroke-rest, #ccc);
    border-radius: 4px;
    overflow: hidden;
  }

  .currency-symbol {
    padding: 8px 12px;
    background-color: var(--neutral-fill-rest, #e0e0e0);
    font-weight: bold;
  }

  input[type="number"] {
    flex: 1;
    border: none;
    padding: 10px;
    font-size: 16px;
    width: 100%;
    outline: none;
  }

  input[type="number"]:focus {
    background-color: var(--accent-fill-subtle, rgba(0, 120, 212, 0.05));
  }

  .range-limits {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--neutral-foreground-hint, #767676);
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
    border: 1px solid var(--neutral-stroke-rest, #ccc);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--neutral-fill-rest, #f5f5f5);
  }

  .term-option:hover {
    border-color: var(--accent-fill-hover, #106ebe);
    background-color: var(--neutral-fill-hover, #e8e8e8);
  }

  .term-option.selected {
    border-color: var(--accent-fill-rest, #0078d4);
    background-color: var(--accent-fill-subtle, rgba(0, 120, 212, 0.1));
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .loan-summary {
    background-color: var(--neutral-layer-1, #f8f9fa);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--neutral-stroke-subtle, #eee);
  }

  .summary-row:last-child {
    border-bottom: none;
  }

  .summary-row.highlight {
    font-weight: 600;
    color: var(--accent-foreground-rest, #0078d4);
  }

  .summary-label {
    color: var(--neutral-foreground-hint, #767676);
  }

  .loan-purpose-section, .account-select-section {
    margin: 1.2rem 0;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--neutral-stroke-rest, #ccc);
    border-radius: 4px;
    font-size: 16px;
    background-color: #fff;
    outline: none;
  }

  select:focus {
    border-color: var(--accent-fill-rest, #0078d4);
    box-shadow: 0 0 0 2px var(--accent-fill-subtle, rgba(0, 120, 212, 0.2));
  }

  .terms-container {
    background-color: var(--neutral-layer-1, #f8f9fa);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .terms-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 0.8rem;
    border: 1px solid var(--neutral-stroke-subtle, #eee);
    background-color: #fff;
    border-radius: 4px;
    margin-bottom: 1rem;
    scrollbar-width: thin;
  }

  .terms-content p, .terms-content ul {
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .consent-section {
    margin: 1.5rem 0 0.5rem;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent-fill-rest, #0078d4);
    cursor: pointer;
  }

  .checkbox-label {
    margin-left: 0.5rem;
    font-size: 0.9rem;
  }

  .next-steps {
    text-align: left;
    margin-top: 1.5rem;
    background-color: var(--neutral-layer-1, #f8f9fa);
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .next-steps h4 {
    margin: 0 0 0.5rem 0;
    color: var(--accent-foreground-rest, #0078d4);
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
    background-color: var(--neutral-layer-1, #f8f9fa);
    border-radius: 8px;
    padding: 1rem;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 16px;
  }

  .summary-card {
    background-color: white;
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
    border-top: 2px solid var(--neutral-stroke-subtle, #eee);
  }

  .note {
    font-size: 0.8rem;
    color: var(--neutral-foreground-hint, #767676);
    font-style: italic;
  }

  .field-hint {
    font-size: 0.8rem;
    color: var(--neutral-foreground-hint, #767676);
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
    background-color: var(--neutral-layer-1, #f8f9fa);
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
    background-color: var(--neutral-layer-1, #f8f9fa);
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
    border-top: 1px solid var(--neutral-stroke-subtle, #eee);
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
    background-color: var(--neutral-layer-1, #f8f9fa);
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
    background-color: var(--neutral-layer-1, #f8f9fa);
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
    border-top: 1px solid var(--neutral-stroke-subtle, #eee);
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