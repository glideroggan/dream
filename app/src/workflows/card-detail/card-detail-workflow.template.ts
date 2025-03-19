import { html, when } from "@microsoft/fast-element";
import { CardDetailWorkflow } from "./card-detail-workflow";
import { CreditCard } from "../../repositories/models/card-models";

export const template = html<CardDetailWorkflow>/*html*/ `
  ${when(
    (x) => !x.card,
    html<CardDetailWorkflow>/*html*/ `
      <div class="empty-state">
        <div class="empty-icon">💳</div>
        <h3>No Card Selected</h3>
        <p>Please select a card to view its details</p>
      </div>
    `
  )}

  ${when(
    (x) => x.card,
    html<CardDetailWorkflow>/*html*/ `
      <div class="card-info">
        <!-- Wrap the first two sections in a flex container -->
        <div class="top-section-container">
          <!-- Enhanced card visual -->
          <div class="info-section card-section">
            <div class="card-visual">
              <div class="credit-card ${(x) => x.getCardStatusClass()}">
                <!-- Bank logo and name -->
                <div class="bank-logo-area">
                  <div class="bank-logo">WALLET</div>
                  <div class="bank-name">Wallet Financial</div>
                </div>
                
                <!-- Improved chip design -->
                <div class="card-chip">
                  <div class="chip-lines"></div>
                </div>
                
                <div class="card-number">${(x) => x.formatCardNumber(x.card?.cardNumber || '')}</div>
                
                <div class="card-info-row">
                  <div class="card-holder-column">
                    <div class="card-label">Card Holder</div>
                    <div class="card-name">${(x) => x.card?.cardholderName || 'Card Holder'}</div>
                  </div>
                  <div class="card-expiry-column">
                    <div class="card-label">Expires</div>
                    <div class="card-expiry">${(x) => x.formatExpiryDate(x.card?.expiryDate || '')}</div>
                  </div>
                </div>
                
                <!-- Card network logo -->
                <div class="card-network">
                  <span class="network-logo">${(x) => x.getNetworkLogo()}</span>
                  <span class="card-type-label">${(x) => x.card?.type?.toUpperCase()}</span>
                </div>
                
                ${when(
                  (x) => x.card?.status === 'frozen',
                  html<CardDetailWorkflow>/*html*/ `
                    <div class="frozen-overlay">FROZEN</div>
                  `
                )}
              </div>
            </div>

            <div class="card-status">
              <span class="status-label">Status</span>
              <span class="status-value ${(x) => x.getStatusClass(x.card?.status || '')}">
                ${(x) => x.formatStatus(x.card?.status || '')}
              </span>
            </div>
          </div>

          <!-- Second section - Card details (right side) -->
          <div class="info-section details-section">
            <h4>Card Details</h4>
            <div class="detail-row">
              <span class="detail-label">Card Type</span>
              <span class="detail-value">${(x) => x.capitalizeFirstLetter(x.card?.type || '')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Card Number</span>
              <span class="detail-value">${(x) => x.formatCardNumber(x.card?.cardNumber || '')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expiry Date</span>
              <span class="detail-value">${(x) => x.formatExpiryDate(x.card?.expiryDate || '')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Card Holder</span>
              <span class="detail-value">${(x) => x.card?.cardholderName || 'Card Holder'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Date</span>
              <span class="detail-value">${(x) => x.formatDate(x.card?.issueDate || '')}</span>
            </div>
          </div>
        </div>

        ${when(
          (x) => x.card &&  x.isCreditCard(x.card),
          html<CardDetailWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Credit Card Details</h4>
              <div class="detail-row">
                <span class="detail-label">Credit Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(((x.card!) as CreditCard).creditLimit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Daily Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.card?.dailyLimit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Monthly Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.card?.monthlyLimit || 0)}</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.card?.type === 'debit',
          html<CardDetailWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Debit Card Details</h4>
              <div class="detail-row">
                <span class="detail-label">Linked Account</span>
                <span class="detail-value">${(x) => x.linkedAccountName || 'No account linked'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Daily Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.card?.dailyLimit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Monthly Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.card?.monthlyLimit || 0)}</span>
              </div>
            </div>
          `
        )}

        <div class="actions-section">
          ${when(
            (x) => x.card?.status === 'active' || x.card?.status === 'frozen',
            html<CardDetailWorkflow>/*html*/ `
              <div class="action-buttons">
                ${when(
                  (x) => x.card?.status === 'active',
                  html<CardDetailWorkflow>/*html*/ `
                    <button class="action-button freeze" @click="${(x) => x.freezeCard()}">
                      <span class="icon">❄️</span> Freeze Card
                    </button>
                  `
                )}
                ${when(
                  (x) => x.card?.status === 'frozen',
                  html<CardDetailWorkflow>/*html*/ `
                    <button class="action-button unfreeze" @click="${(x) => x.unfreezeCard()}">
                      <span class="icon">🔥</span> Unfreeze Card
                    </button>
                  `
                )}
                <button class="action-button report" @click="${(x) => x.reportLostCard()}">
                  <span class="icon">⚠️</span> Report Lost/Stolen
                </button>
                <button class="action-button pin" @click="${(x) => x.changePIN()}">
                  <span class="icon">🔒</span> Change PIN
                </button>
              </div>
            `
          )}
          ${when(
            (x) => x.card?.status === 'lost' || x.card?.status === 'stolen' || x.card?.status === 'expired',
            html<CardDetailWorkflow>/*html*/ `
              <div class="card-replacement">
                <p class="replacement-message">This card is no longer active. Would you like to request a replacement?</p>
                <button class="action-button replace" @click="${(x) => x.requestReplacement()}">
                  <span class="icon">🔄</span> Request Replacement
                </button>
              </div>
            `
          )}
        </div>
      </div>
    `
  )}
`