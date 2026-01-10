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
    container-type: inline-size;
    container-name: card-layout; /* Add a named container for explicit targeting */
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

  /* Container query for stacking on smaller container widths - placed early for clarity */
  @container card-layout (max-width: 600px) {
    .top-section-container {
      flex-direction: column !important; /* Use !important to ensure priority */
    }
    
    .card-section {
      flex: 0 0 auto !important;
      max-width: 100% !important; /* Allow card to use full width when stacked */
      min-width: 100% !important;
      margin-bottom: 15px !important;
    }

    .credit-card {
      width: 100% !important; /* Full width when stacked */
      max-width: 320px !important; /* But maintain reasonable size */
      margin: 0 auto !important; /* Center the card */
    }
  }

  /* Fallback for browsers that don't support container queries */
  @media (max-width: 768px) {
    .top-section-container {
      flex-direction: column;
    }
    
    .card-section {
      flex: 0 0 auto;
      max-width: 100%;
      min-width: 100%;
      margin-bottom: 15px;
    }

    .credit-card {
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
    }
  }

  /* Updated with theme variables */
  .info-section {
    padding: 15px;
    background-color: var(--background-card);
    border-radius: 8px;
    margin-bottom: 15px;
    color: var(--primary-text-color);
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
    
    /* Default credit card background with slight transparency for theme adaptability */
    background: linear-gradient(135deg, #2D3A62, #151E3F);
    color: var(--text-light);
  }

  /* Different backgrounds for different card types - keeping distinct colors but with theme awareness */
  .credit-card.credit {
    background: linear-gradient(135deg, #5B2D62, #26133F);
  }

  .credit-card.debit {
    background: linear-gradient(135deg, #2D5C62, #13383F);
  }

  .credit-card.expired {
    background: linear-gradient(135deg, #555555, #303030);
  }

  .credit-card.frozen {
    background: linear-gradient(135deg, #3B6FA0, #1D4F77);
  }

  .credit-card.lost, .credit-card.stolen {
    background: linear-gradient(135deg, var(--error-color), #772525);
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

  /* Frozen overlay improvement with theme awareness */
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
    color: var(--text-light);
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
    border-bottom: 1px solid var(--divider-color);
  }

  .detail-label {
    color: var(--secondary-text-color);
    font-weight: 500;
  }

  .detail-value {
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .card-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--background-card);
    border-radius: 6px;
  }

  .status-value {
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
  }

  /* Status indicators with theme-aware colors */
  .status-active {
    background-color: rgba(var(--success-color, #2ecc71), 0.2);
    color: var(--success-color, #2ecc71);
  }

  .status-frozen {
    background-color: rgba(var(--accent-color, #88BDF2), 0.2);
    color: var(--accent-color, #88BDF2);
  }

  .status-lost, .status-stolen {
    background-color: rgba(var(--error-color, #e74c3c), 0.2);
    color: var(--error-color, #e74c3c);
  }

  .status-expired {
    background-color: rgba(var(--inactive-color, #6A89A7), 0.2);
    color: var(--inactive-color, #6A89A7);
  }

  .type-specific-section {
    background-color: var(--background-color);
    border: 1px solid var(--divider-color);
  }

  .actions-section {
    padding: 15px;
    background-color: var(--background-card);
    border-radius: 8px;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .replacement-message {
    margin-bottom: 10px;
    color: var(--secondary-text-color);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--secondary-text-color);
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h3, h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--primary-text-color);
  }

  /* Dark mode specific overrides */
  @media (prefers-color-scheme: dark) {
    .detail-row {
      border-bottom-color: var(--divider-color);
    }
    
    /* Ensure better visibility for status backgrounds in dark mode */
    .status-active {
      background-color: rgba(46, 204, 113, 0.2);
    }
    
    .status-frozen {
      background-color: rgba(136, 189, 242, 0.2);
    }
    
    .status-lost, .status-stolen {
      background-color: rgba(231, 76, 60, 0.2);
    }
    
    .status-expired {
      background-color: rgba(106, 137, 167, 0.2);
    }
  }

  /* Container query for stacking on smaller container widths */
  @container (max-width: 600px) {
    .top-section-container {
      flex-direction: column;
    }
    
    .card-section {
      flex: 0 0 auto;
      max-width: 100%; /* Allow card to use full width when stacked */
      min-width: 100%;
      margin-bottom: 15px;
    }

    .credit-card {
      width: 100%; /* Full width when stacked */
      max-width: 320px; /* But maintain reasonable size */
      margin: 0 auto; /* Center the card */
    }
    .info-section {
      min-width: 100%; /* Allow info section to use full width when stacked */
    }
  }
`;
