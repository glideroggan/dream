import { css } from "@microsoft/fast-element";

export const styles = css`
  .card-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 0;
    max-width: 600px;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 16px;
  }
  
  .spinner {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--accent-color, #3498db);
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .card-selection-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .card-options {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .card-option {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color, #ccc);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .card-option:hover {
    border-color: var(--accent-color, #3498db);
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  .card-option.selected {
    border-color: var(--accent-color, #3498db);
    background-color: rgba(52, 152, 219, 0.08);
    box-shadow: 0 2px 6px rgba(52, 152, 219, 0.15);
  }
  
  .card-option-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 50%;
    margin-right: 16px;
    font-size: 24px;
  }
  
  .card-option-details {
    flex: 1;
  }
  
  .card-option-details h4 {
    margin: 0 0 4px 0;
    font-size: 18px;
  }
  
  .card-option-details p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  /* Product info styling */
  .product-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .product-image-placeholder {
    width: 100%;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 8px;
    font-size: 24px;
    color: #666;
    font-weight: bold;
  }
  
  .product-name {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
  
  .product-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--accent-color, #3498db);
  }
  
  .product-description {
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-color, #333);
    margin: 0;
  }
  
  .product-features {
    margin: 0;
  }
  
  .product-features h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
  }
  
  .product-features ul {
    margin: 0;
    padding-left: 20px;
  }
  
  .product-features li {
    margin-bottom: 6px;
  }
  
  .product-requirements {
    margin: 0;
  }
  
  .product-requirements h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
  }
  
  .product-requirements ul {
    margin: 0;
    padding-left: 20px;
    list-style-type: none;
  }
  
  .product-requirements li {
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
  }
  
  .product-requirements li.met {
    color: #27ae60;
  }
  
  .product-requirements li.unmet {
    color: #e74c3c;
  }
  
  .check-mark {
    color: #27ae60;
    font-weight: bold;
  }
  
  .x-mark {
    color: #e74c3c;
    font-weight: bold;
  }
  
  .account-selection {
    margin-top: 16px;
  }
  
  .account-selection h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
  }
  
  .select-wrapper {
    position: relative;
  }
  
  .select-wrapper select {
    width: 100%;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid var(--border-color, #ccc);
    background-color: #fff;
    appearance: none;
    font-size: 16px;
  }
  
  .select-wrapper::after {
    content: "⌵";
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 16px;
    pointer-events: none;
  }
  
  .no-accounts-message {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }
  
  .no-accounts-message p {
    margin: 0 0 12px 0;
    color: #666;
  }
  
  .secondary-button {
    background-color: transparent;
    color: var(--accent-color, #3498db);
    border: 1px solid var(--accent-color, #3498db);
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .secondary-button:hover {
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  .success-message {
    background-color: #e8f7ee;
    color: #2ecc71;
    padding: 12px;
    border-radius: 4px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .agreement-container {
    margin-top: 12px;
    padding: 8px 0;
  }
  
  .agreement-checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .agreement-checkbox-wrapper:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .agreement-checkbox-wrapper.checked {
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  /* Custom checkbox design */
  .custom-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color, #ccc);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    transition: all 0.2s;
  }
  
  .agreement-checkbox-wrapper:hover .custom-checkbox {
    border-color: var(--accent-color, #3498db);
  }
  
  .agreement-checkbox-wrapper.checked .custom-checkbox {
    background-color: var(--accent-color, #3498db);
    border-color: var(--accent-color, #3498db);
  }
  
  .checkmark {
    width: 16px;
    height: 16px;
    fill: white;
    animation: scale 0.2s ease-in-out;
  }
  
  @keyframes scale {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .checkbox-label {
    font-size: 14px;
    color: var(--text-secondary, #666);
    line-height: 1.4;
    flex: 1;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    margin-top: 6px;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .already-active-message {
    background-color: var(--background-color-light, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    border: 1px solid var(--border-color-light, #eaeaea);
  }
  
  .active-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #2ecc71;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  
  .active-text h4 {
    margin: 0 0 8px 0;
    color: #2ecc71;
  }
  
  .active-text p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  .requirements-not-met {
    background-color: #fef2f2;
    color: #e74c3c;
    border: 1px solid #fde8e8;
    border-radius: 8px;
    padding: 16px;
    margin-top: 8px;
  }
  
  .requirements-not-met h4 {
    margin: 0 0 8px 0;
    color: #e74c3c;
  }
  
  .requirements-not-met p {
    margin: 0;
    font-size: 14px;
  }
`;
