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
  
  .schedule-inputs dream-input {
    flex: 1;
  }
  
  /* Animation for schedule details */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;