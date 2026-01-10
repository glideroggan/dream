import { css } from "@microsoft/fast-element";

export const styles = css`
  .account-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 100%;
  }

  /* New container for the header sections */
  .account-header-sections {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Responsive layout for the header sections */
  @media (min-width: 1024px) {
    .account-header-sections {
      flex-direction: row;
      align-items: stretch;
    }
    
    .account-header-sections > .info-section {
      flex: 1;
      min-width: 0; /* To allow proper shrinking */
    }
    
    .account-header-sections > .info-section:first-child {
      display: flex;
      flex-direction: column;
    }
    
    .account-balance {
      margin-top: auto; /* Push the balance to the bottom */
    }
  }

  .info-section {
    background-color: var(--background-card);
    border-radius: 6px;
    padding: 16px;
  }

  .account-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .account-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    color: var(--text-light);
    margin-right: 12px;
    background-color: var(--primary-color);
  }

  .account-icon.checking {
    background-color: var(--accent-color);
  }

  .account-icon.savings {
    background-color: var(--success-color);
  }

  .account-icon.credit {
    background-color: var(--secondary-color);
  }

  .account-icon.investment {
    background-color: var(--warning-color);
  }

  .account-title {
    flex: 1;
    min-width: 0; /* Ensure text truncation works */
  }

  .account-title h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .account-type {
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  .account-balance {
    display: flex;
    flex-direction: column;
  }

  .balance-label {
    font-size: 14px;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }

  .balance-amount {
    font-size: 24px;
    font-weight: bold;
    color: var(--primary-text-color);
  }

  .balance-amount.negative {
    color: var(--error-color);
  }

  .details-section {
    display: flex;
    flex-direction: column;
  }

  .details-section h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: var(--primary-text-color);
  }

  /* Make the detail rows fill the space better */
  @media (min-width: 768px) {
    .details-section .detail-row {
      flex: 1;
      display: flex;
      align-items: center;
      min-height: 28px; /* Ensure consistent row heights */
    }
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-color);
    flex-wrap: wrap;
    gap: 8px;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  .detail-value {
    font-weight: 500;
    word-break: break-word;
  }

  /* Card display improvements for smaller screens */
  @media (max-width: 480px) {
    .credit-card {
      width: 100%;
      max-width: none;
    }
  }

  /* Responsive layout for larger screens */
  @media (min-width: 640px) {
    .type-specific-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    
    .credit-card-visual,
    .savings-progress,
    .pension-projection,
    .payment-breakdown {
      grid-column: 1 / -1;
    }
  }

  /* Enhanced layout for extra large screens */
  @media (min-width: 1200px) {
    .type-specific-section {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
  }

  .status {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status.active {
    background-color: rgba(46, 204, 113, 0.2);
    color: var(--success-color);
  }

  .status.inactive {
    background-color: rgba(231, 76, 60, 0.2);
    color: var(--error-color);
  }

  .actions-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Empty state styling */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background-color: var(--background-card);
    border-radius: 6px;
    min-height: 300px;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    margin: 0 0 8px;
    font-size: 20px;
  }

  .empty-state p {
    color: var(--secondary-text-color);
    margin: 0;
  }
  
  /* Rename functionality styling */
  .account-title-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .rename-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .rename-input {
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    width: 100%;
    background-color: var(--background-color);
    color: var(--primary-text-color);
  }
  
  .rename-actions {
    display: flex;
    gap: 8px;
  }
  
  /* Type-specific sections */
  .type-specific-section {
    margin-top: 16px;
  }
  
  /* Credit card styling */
  .credit-card-visual {
    margin: 16px 0;
    display: flex;
    justify-content: center;
  }
  
  .credit-card {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    border-radius: 10px;
    padding: 20px;
    color: var(--text-light);
    width: 100%;
    max-width: 300px;
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .card-chip {
    margin-bottom: 20px;
  }
  
  .card-number {
    font-size: 18px;
    letter-spacing: 2px;
    margin-bottom: 20px;
  }
  
  .card-name {
    font-size: 16px;
    text-transform: uppercase;
  }
  
  .card-expiry {
    font-size: 14px;
  }
  
  /* Savings progress bar */
  .savings-progress {
    margin: 16px 0;
  }
  
  .progress-bar {
    height: 12px;
    background-color: var(--inactive-color);
    border-radius: 6px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: var(--success-color);
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 14px;
  }
  
  /* Pension projection */
  .pension-projection {
    background-color: var(--hover-bg);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    margin: 16px 0;
  }
  
  .pension-projection h5 {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--secondary-text-color);
  }
  
  .projection-amount {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .projection-note {
    margin: 0;
    font-size: 12px;
    color: var(--secondary-text-color);
  }
  
  /* Mortgage payment breakdown */
  .payment-breakdown {
    margin: 16px 0;
  }
  
  .payment-breakdown h5 {
    margin: 0 0 8px;
    font-size: 14px;
  }
  
  .breakdown-chart {
    margin-bottom: 16px;
  }
  
  .chart-bar {
    height: 24px;
    background-color: var(--inactive-color);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
  }
  
  .interest-portion {
    height: 100%;
    background-color: var(--error-color);
  }
  
  .principal-portion {
    height: 100%;
    background-color: var(--success-color);
  }
  
  .chart-legend {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    font-size: 12px;
  }
  
  .legend-color {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    margin-right: 4px;
  }
  
  .legend-color.interest {
    background-color: var(--error-color);
  }
  
  .legend-color.principal {
    background-color: var(--success-color);
  }
  
  /* Investment risk level */
  .risk-level {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    background-color: var(--warning-color);
    background-opacity: 0.2;
  }
  
  .detail-value.positive {
    color: var(--success-color);
  }
  
  .detail-value.negative {
    color: var(--error-color);
  }
`