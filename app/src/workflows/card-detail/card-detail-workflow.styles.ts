import { css } from "@microsoft/fast-element";

export const styles = css`
  .card-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  /* New top-section-container for side-by-side layout */
  .top-section-container {
    display: flex;
    flex-direction: row;
    gap: 20px;
    width: 100%;
    margin-bottom: 0; /* Remove margin since info-section already has margin */
  }

  /* Make card section stay at natural width */
  .card-section {
    flex: 0 0 auto;
    max-width: 350px;
  }

  /* Make details section grow to fill space */
  .details-section {
    flex: 1;
  }

  /* Keep all original styling */
  .info-section {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 15px;
  }

  .credit-card {
    width: 320px;
    height: 200px;
    border-radius: 16px;
    padding: 20px;
    position: relative;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
    letter-spacing: 0.5px;
    
    /* Default credit card background */
    background: linear-gradient(135deg, #2D3A62, #151E3F);
    color: white;
  }

  /* Different backgrounds for different card types */
  .credit-card.credit {
    background: linear-gradient(135deg, #5B2D62, #26133F);
  }

  .credit-card.debit {
    background: linear-gradient(135deg, #2D5C62, #13383F);
  }

  .credit-card.expired {
    background: linear-gradient(135deg, #696969, #404040);
  }

  .credit-card.frozen {
    background: linear-gradient(135deg, #3B6FA0, #1D4F77);
  }

  .credit-card.lost, .credit-card.stolen {
    background: linear-gradient(135deg, #A03B3B, #772525);
  }

  /* Bank logo styling */
  .bank-logo-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .bank-logo {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
  }

  .bank-name {
    font-size: 10px;
    opacity: 0.8;
  }

  /* Improved chip styling */
  .card-chip {
    width: 40px;
    height: 30px;
    background: linear-gradient(135deg, #FFD700, #B8860B);
    border-radius: 5px;
    position: relative;
    margin-bottom: 20px;
  }

  .chip-lines {
    position: absolute;
    top: 25%;
    left: 10%;
    width: 80%;
    height: 50%;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.3) 2px,
      rgba(0, 0, 0, 0.3) 3px
    );
  }

  /* Card number styling */
  .card-number {
    font-size: 18px;
    letter-spacing: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    margin-bottom: 15px;
  }

  /* Card holder and expiry info */
  .card-info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .card-holder-column, .card-expiry-column {
    display: flex;
    flex-direction: column;
  }

  .card-label {
    font-size: 9px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 2px;
  }

  .card-name, .card-expiry {
    font-size: 14px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  /* Network logo styling */
  .card-network {
    position: absolute;
    bottom: 15px;
    right: 15px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .network-logo {
    font-size: 20px;
  }

  .card-type-label {
    font-size: 10px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-top: 11px;
  }

  /* Frozen overlay improvement */
  .frozen-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    border-radius: 16px;
    letter-spacing: 3px;
    transform: rotate(-15deg);
    backdrop-filter: blur(2px);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #e9ecef;
  }

  .detail-label {
    color: #6c757d;
    font-weight: 500;
  }

  .detail-value {
    font-weight: 600;
  }

  .card-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 6px;
  }

  .status-value {
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .status-active {
    background-color: #d4edda;
    color: #155724;
  }

  .status-frozen {
    background-color: #d1ecf1;
    color: #0c5460;
  }

  .status-lost, .status-stolen {
    background-color: #f8d7da;
    color: #721c24;
  }

  .status-expired {
    background-color: #e2e3e5;
    color: #383d41;
  }

  .info-section {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 15px;
  }

  .type-specific-section {
    background-color: #e9ecef;
  }

  .actions-section {
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .action-button .icon {
    margin-right: 6px;
  }

  .freeze {
    background-color: #d1ecf1;
    color: #0c5460;
  }

  .unfreeze {
    background-color: #d4edda;
    color: #155724;
  }

  .report {
    background-color: #f8d7da;
    color: #721c24;
  }

  .pin {
    background-color: #e2e3e5;
    color: #383d41;
  }

  .replace {
    background-color: #d4edda;
    color: #155724;
    margin-top: 10px;
  }

  .replacement-message {
    margin-bottom: 10px;
    color: #6c757d;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h3, h4 {
    margin-top: 0;
    margin-bottom: 16px;
  }
`;
