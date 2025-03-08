import {
  FASTElement,
  customElement,
  html,
  css,
  observable,
  attr,
  when,
  ref,
} from '@microsoft/fast-element'
import { WorkflowBase } from './workflow-base'
import { Card } from '../repositories/card-repository'
import { cardService } from '../services/card-service'
import { repositoryService } from '../services/repository-service'

const template = html<CardDetailWorkflow>/*html*/ `
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
        <div class="info-section">
          <div class="card-visual">
            <div class="credit-card ${(x) => x.getCardStatusClass()}">
              <div class="card-chip">⬜</div>
              <div class="card-type">${(x) => x.card?.type?.toUpperCase()}</div>
              <div class="card-number">${(x) => x.formatCardNumber(x.card?.cardNumber || '')}</div>
              <div class="card-name">${(x) => x.card?.cardholderName || 'Card Holder'}</div>
              <div class="card-expiry">Valid thru: ${(x) => x.formatExpiryDate(x.card?.expiryDate || '')}</div>
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

        ${when(
          (x) => x.card?.type === 'credit',
          html<CardDetailWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Credit Card Details</h4>
              <div class="detail-row">
                <span class="detail-label">Credit Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.card?.creditLimit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cash Advance Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.card?.cashAdvanceLimit || 0)}</span>
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

const styles = css`
  .card-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-section {
    background-color: var(--section-bg, #f9f9f9);
    border-radius: 6px;
    padding: 16px;
  }

  .card-visual {
    margin-bottom: 20px;
    perspective: 1000px;
  }

  .credit-card {
    position: relative;
    width: 100%;
    max-width: 340px;
    height: 200px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2c3e50, #3498db);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.3s, box-shadow 0.3s;
  }

  .credit-card:hover {
    transform: rotateY(5deg);
    box-shadow: 0 12px 20px rgba(0,0,0,0.2);
  }

  .credit-card.credit {
    background: linear-gradient(135deg, #4a2a6a, #8e44ad);
  }

  .credit-card.debit {
    background: linear-gradient(135deg, #1a5276, #3498db);
  }

  .credit-card.frozen {
    background: linear-gradient(135deg, #7f8c8d, #bdc3c7);
    opacity: 0.8;
  }

  .credit-card.expired, .credit-card.lost, .credit-card.stolen, .credit-card.cancelled {
    background: linear-gradient(135deg, #636e72, #b2bec3);
    opacity: 0.7;
  }

  .card-chip {
    font-size: 20px;
    margin-bottom: 10px;
  }

  .card-type {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .card-number {
    font-size: 19px;
    letter-spacing: 2px;
    margin-bottom: 20px;
    font-family: monospace;
  }

  .card-name {
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .card-expiry {
    font-size: 14px;
  }

  .frozen-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0,0,0,0.4);
    border-radius: 12px;
    color: white;
    font-size: 32px;
    letter-spacing: 4px;
    font-weight: bold;
    transform: rotate(-15deg);
  }

  .card-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 16px;
  }

  .status-label {
    font-size: 14px;
    color: var(--text-secondary, #666);
    margin-bottom: 4px;
  }

  .status-value {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .status-value.active {
    background-color: rgba(46, 204, 113, 0.2);
    color: #27ae60;
  }

  .status-value.pending {
    background-color: rgba(241, 196, 15, 0.2);
    color: #f39c12;
  }

  .status-value.frozen {
    background-color: rgba(52, 152, 219, 0.2);
    color: #2980b9;
  }

  .status-value.expired, .status-value.lost, .status-value.stolen, .status-value.cancelled {
    background-color: rgba(231, 76, 60, 0.2);
    color: #c0392b;
  }

  .details-section h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: var(--text-primary, #333);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: var(--text-secondary, #666);
    font-size: 14px;
  }

  .detail-value {
    font-weight: 500;
  }

  .type-specific-section {
    margin-top: 16px;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 8px;
  }

  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    color: white;
  }

  .action-button:hover {
    transform: translateY(-2px);
  }

  .action-button:active {
    transform: translateY(0);
  }

  .action-button.freeze {
    background-color: #3498db;
  }

  .action-button.unfreeze {
    background-color: #2ecc71;
  }

  .action-button.report {
    background-color: #e74c3c;
  }

  .action-button.pin {
    background-color: #f39c12;
  }

  .action-button.replace {
    background-color: #9b59b6;
    width: 100%;
  }

  .icon {
    font-size: 16px;
  }

  /* Card replacement section */
  .card-replacement {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: rgba(155, 89, 182, 0.1);
    border-radius: 6px;
    margin-top: 8px;
  }

  .replacement-message {
    text-align: center;
    margin: 0;
    color: var(--text-secondary, #666);
  }

  /* Empty state styling */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background-color: var(--section-bg, #f9f9f9);
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
    color: var(--text-secondary, #666);
    margin: 0;
  }
`

@customElement({
  name: 'card-detail-workflow',
  template,
  styles,
})
export class CardDetailWorkflow extends WorkflowBase {
  @observable card: Card | null = null;
  @observable linkedAccountName: string = '';
  private cardRepo = repositoryService.getCardRepository();
  private accountRepo = repositoryService.getAccountRepository();

  @attr({ attribute: 'hide-actions', mode: 'boolean' })
  hideActions: boolean = false;

  async initialize(params?: Record<string, any>): Promise<void> {
    console.log('Initializing Card-detail-workflow with params:', params);
    this.setModalWidth('800px');
    this.updateTitle('Card Details');
    
    if (params?.card) {
      this.card = params.card;
      await this.loadLinkedAccountName();
    } else if (params?.cardId) {
      try {
        const loadedCard = await cardService.getCardById(params.cardId);
        if (loadedCard) {
          this.card = loadedCard;
          await this.loadLinkedAccountName();
        }
      } catch (error) {
        console.error('Error loading card:', error);
      }
    }
  }
  
  async loadLinkedAccountName(): Promise<void> {
    if (!this.card || !this.card.accountId) return;
    
    try {
      const account = await this.accountRepo.getById(this.card.accountId);
      this.linkedAccountName = account?.name || 'Unknown Account';
    } catch (error) {
      console.error('Error loading linked account:', error);
      this.linkedAccountName = 'Account Unavailable';
    }
  }
  
  formatCurrency(amount: number): string {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  formatCardNumber(cardNumber: string): string {
    if (!cardNumber) return '•••• •••• •••• ••••';
    // Return formatted with last 4 digits visible
    return '•••• •••• •••• ' + cardNumber.slice(-4);
  }
  
  formatExpiryDate(date: string): string {
    if (!date) return 'MM/YY';
    const expiryDate = new Date(date);
    return `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getFullYear()).slice(-2)}`;
  }
  
  formatDate(date: string): string {
    if (!date) return '';
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  formatStatus(status: string): string {
    if (!status) return 'Unknown';
    // Capitalize first letter and handle special cases
    return status === 'frozen' ? 'Frozen' : this.capitalizeFirstLetter(status);
  }
  
  getStatusClass(status: string): string {
    return status || 'unknown';
  }
  
  getCardStatusClass(): string {
    return this.card?.type?.toLowerCase() + ' ' + (this.card?.status?.toLowerCase() || '');
  }
  
  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  async freezeCard(): Promise<void> {
    if (!this.card) return;
    
    try {
      // Update card status in repository
      await this.cardRepo.update(this.card.id, {
        ...this.card,
        status: 'frozen'
      });
      
      // Update local card object
      this.card = {
        ...this.card,
        status: 'frozen'
      };
      
      // Show success message
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Card frozen successfully', 
          type: 'success' 
        }
      }));
    } catch (error) {
      console.error('Error freezing card:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Failed to freeze card', 
          type: 'error' 
        }
      }));
    }
  }
  
  async unfreezeCard(): Promise<void> {
    if (!this.card) return;
    
    try {
      // Update card status in repository
      await this.cardRepo.update(this.card.id, {
        ...this.card,
        status: 'active'
      });
      
      // Update local card object
      this.card = {
        ...this.card,
        status: 'active'
      };
      
      // Show success message
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Card unfrozen successfully', 
          type: 'success' 
        }
      }));
    } catch (error) {
      console.error('Error unfreezing card:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Failed to unfreeze card', 
          type: 'error' 
        }
      }));
    }
  }
  
  async reportLostCard(): Promise<void> {
    if (!this.card) return;
    
    const result = await this.startNestedWorkflow('confirm-dialog', {
      title: 'Report Lost or Stolen Card',
      message: 'Are you sure you want to report this card as lost or stolen? This will permanently block the card and you will need to request a replacement.',
      confirmLabel: 'Report Card',
      cancelLabel: 'Cancel',
      isDestructive: true
    });
    
    if (result.success) {
      try {
        // Update card status in repository
        await this.cardRepo.update(this.card.id, {
          ...this.card,
          status: 'lost'
        });
        
        // Update local card object
        this.card = {
          ...this.card,
          status: 'lost'
        };
        
        // Show success message
        this.dispatchEvent(new CustomEvent('notification', {
          bubbles: true,
          composed: true,
          detail: { 
            message: 'Card reported lost successfully', 
            type: 'success' 
          }
        }));
      } catch (error) {
        console.error('Error reporting card as lost:', error);
        this.dispatchEvent(new CustomEvent('notification', {
          bubbles: true,
          composed: true,
          detail: { 
            message: 'Failed to report card', 
            type: 'error' 
          }
        }));
      }
    }
  }
  
  async changePIN(): Promise<void> {
    const result = await this.startNestedWorkflow('pin-change', {
      cardId: this.card?.id
    });
    
    if (result.success) {
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'PIN changed successfully', 
          type: 'success' 
        }
      }));
    }
  }
  
  async requestReplacement(): Promise<void> {
    if (!this.card) return;
    
    const result = await this.startNestedWorkflow('card', {
      action: 'replace',
      originalCardId: this.card.id,
      cardType: this.card.type,
      accountId: this.card.accountId
    });
    
    if (result.success) {
      this.complete(true, { cardReplaced: true });
    }
  }
}
