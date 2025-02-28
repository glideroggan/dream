import { css } from '@microsoft/fast-element';

export const formStyles = css`
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  input, select, textarea {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s, background-color 0.2s;
    width: 100%;
    box-sizing: border-box;
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  /* Only show validation styles after user interaction */
  input:user-invalid, select:user-invalid, textarea:user-invalid {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.3s, opacity 0.3s, margin 0.3s;
    margin: 0;
  }
  
  .error-message:not(:empty) {
    max-height: 60px;
    opacity: 1;
    margin-top: 4px;
  }
  
  /* Button styles */
  .button {
    padding: 10px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s, opacity 0.2s;
    text-align: center;
  }
  
  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  .button.primary {
    background-color: var(--primary-color, #3498db);
    color: white;
  }
  
  .button.primary:hover:not(:disabled) {
    background-color: var(--primary-hover, #2980b9);
  }
  
  .button.secondary {
    background-color: var(--secondary-bg, #f5f5f5);
    color: var(--text-primary, #333);
  }
  
  .button.secondary:hover:not(:disabled) {
    background-color: var(--secondary-hover, #e0e0e0);
  }
  
  .button.danger {
    background-color: var(--danger-color, #e74c3c);
    color: white;
  }
  
  .button.danger:hover:not(:disabled) {
    background-color: var(--danger-hover, #c0392b);
  }
`;
