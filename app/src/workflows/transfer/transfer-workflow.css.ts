import { css } from "@microsoft/fast-element";

export const styles = css`
  .transfer-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .transfer-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  select, input {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
  }
  
  select:focus, input:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
  }
  
  /* Only show validation styles after user interaction */
  select:user-invalid, input:user-invalid {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .amount-input-group {
    position: relative;
    display: flex;
  }
  
  .amount-input-group input {
    flex: 1;
  }
  
  .amount-input-group .currency {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #666);
    font-weight: 500;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    margin-top: 4px;
  }
  
  /* Add a transition for the error message */
  .error-message {
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
    overflow: hidden;
    margin-top: 0;
  }
  
  .error-message:not(:empty) {
    max-height: 60px;
    opacity: 1;
    margin-top: 4px;
  }
  
  /* Remove the custom buttons as they're now in the modal */
  .transfer-actions {
    display: none;
  }
  
  /* Scheduling section styles */
  .schedule-section {
    margin-top: 8px;
    border-top: 1px solid var(--border-color, #e0e0e0);
    padding-top: 16px;
  }
  
  .schedule-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .schedule-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    padding: 0;
  }
  
  .schedule-toggle label {
    font-weight: 500;
    margin-bottom: 0;
    cursor: pointer;
  }
  
  .schedule-details {
    margin-top: 12px;
    animation: fadeIn 0.3s ease;
  }
  
  .schedule-inputs {
    display: flex;
    gap: 16px;
    max-width: 95%;
  }
  
  .schedule-date-input,
  .schedule-time-input {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .schedule-date-input input,
  .schedule-time-input input {
    width: 100%;
  }
  
  /* Animation for schedule details */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;