// import { css } from "@microsoft/fast-element";

// export const styles = css`
//   .card-info {
//     display: flex;
//     flex-direction: column;
//     gap: 16px;
//   }

//   .info-section {
//     background-color: var(--section-bg, #f9f9f9);
//     border-radius: 6px;
//     padding: 16px;
//   }

//   .card-visual {
//     margin-bottom: 20px;
//     perspective: 1000px;
//   }

//   .credit-card {
//     position: relative;
//     width: 100%;
//     max-width: 340px;
//     height: 200px;
//     margin: 0 auto;
//     padding: 20px;
//     border-radius: 12px;
//     background: linear-gradient(135deg, #2c3e50, #3498db);
//     color: white;
//     display: flex;
//     flex-direction: column;
//     justify-content: space-between;
//     box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//     transition: transform 0.3s, box-shadow 0.3s;
//   }

//   .credit-card:hover {
//     transform: rotateY(5deg);
//     box-shadow: 0 12px 20px rgba(0,0,0,0.2);
//   }

//   .credit-card.credit {
//     background: linear-gradient(135deg, #4a2a6a, #8e44ad);
//   }

//   .credit-card.debit {
//     background: linear-gradient(135deg, #1a5276, #3498db);
//   }

//   .credit-card.frozen {
//     background: linear-gradient(135deg, #7f8c8d, #bdc3c7);
//     opacity: 0.8;
//   }

//   .credit-card.expired, .credit-card.lost, .credit-card.stolen, .credit-card.cancelled {
//     background: linear-gradient(135deg, #636e72, #b2bec3);
//     opacity: 0.7;
//   }

//   .card-chip {
//     font-size: 20px;
//     margin-bottom: 10px;
//   }

//   .card-type {
//     position: absolute;
//     top: 20px;
//     right: 20px;
//     font-size: 14px;
//     font-weight: bold;
//     letter-spacing: 1px;
//   }

//   .card-number {
//     font-size: 19px;
//     letter-spacing: 2px;
//     margin-bottom: 20px;
//     font-family: monospace;
//   }

//   .card-name {
//     text-transform: uppercase;
//     font-size: 14px;
//     letter-spacing: 1px;
//     margin-bottom: 10px;
//   }

//   .card-expiry {
//     font-size: 14px;
//   }

//   .frozen-overlay {
//     position: absolute;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     background-color: rgba(0,0,0,0.4);
//     border-radius: 12px;
//     color: white;
//     font-size: 32px;
//     letter-spacing: 4px;
//     font-weight: bold;
//     transform: rotate(-15deg);
//   }

//   .card-status {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     margin-top: 16px;
//   }

//   .status-label {
//     font-size: 14px;
//     color: var(--text-secondary, #666);
//     margin-bottom: 4px;
//   }

//   .status-value {
//     padding: 4px 12px;
//     border-radius: 20px;
//     font-size: 14px;
//     font-weight: 500;
//   }

//   .status-value.active {
//     background-color: rgba(46, 204, 113, 0.2);
//     color: #27ae60;
//   }

//   .status-value.pending {
//     background-color: rgba(241, 196, 15, 0.2);
//     color: #f39c12;
//   }

//   .status-value.frozen {
//     background-color: rgba(52, 152, 219, 0.2);
//     color: #2980b9;
//   }

//   .status-value.expired, .status-value.lost, .status-value.stolen, .status-value.cancelled {
//     background-color: rgba(231, 76, 60, 0.2);
//     color: #c0392b;
//   }

//   .details-section h4 {
//     margin: 0 0 12px 0;
//     font-size: 16px;
//     color: var(--text-primary, #333);
//   }

//   .detail-row {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     padding: 8px 0;
//     border-bottom: 1px solid var(--divider-color, #eaeaea);
//   }

//   .detail-row:last-child {
//     border-bottom: none;
//   }

//   .detail-label {
//     color: var(--text-secondary, #666);
//     font-size: 14px;
//   }

//   .detail-value {
//     font-weight: 500;
//   }

//   .type-specific-section {
//     margin-top: 16px;
//   }

//   .action-buttons {
//     display: grid;
//     grid-template-columns: 1fr 1fr;
//     gap: 12px;
//     margin-top: 8px;
//   }

//   .action-button {
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 8px;
//     padding: 12px;
//     border: none;
//     border-radius: 6px;
//     font-weight: 500;
//     cursor: pointer;
//     transition: background-color 0.2s, transform 0.1s;
//     color: white;
//   }

//   .action-button:hover {
//     transform: translateY(-2px);
//   }

//   .action-button:active {
//     transform: translateY(0);
//   }

//   .action-button.freeze {
//     background-color: #3498db;
//   }

//   .action-button.unfreeze {
//     background-color: #2ecc71;
//   }

//   .action-button.report {
//     background-color: #e74c3c;
//   }

//   .action-button.pin {
//     background-color: #f39c12;
//   }

//   .action-button.replace {
//     background-color: #9b59b6;
//     width: 100%;
//   }

//   .icon {
//     font-size: 16px;
//   }

//   /* Card replacement section */
//   .card-replacement {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 12px;
//     padding: 16px;
//     background-color: rgba(155, 89, 182, 0.1);
//     border-radius: 6px;
//     margin-top: 8px;
//   }

//   .replacement-message {
//     text-align: center;
//     margin: 0;
//     color: var(--text-secondary, #666);
//   }

//   /* Empty state styling */
//   .empty-state {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     padding: 40px 20px;
//     text-align: center;
//     background-color: var(--section-bg, #f9f9f9);
//     border-radius: 6px;
//     min-height: 300px;
//   }

//   .empty-icon {
//     font-size: 48px;
//     margin-bottom: 16px;
//   }

//   .empty-state h3 {
//     margin: 0 0 8px;
//     font-size: 20px;
//   }

//   .empty-state p {
//     color: var(--text-secondary, #666);
//     margin: 0;
//   }
// `