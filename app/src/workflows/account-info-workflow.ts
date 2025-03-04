import {
  FASTElement,
  customElement,
  html,
  css,
  observable,
  attr,
} from '@microsoft/fast-element'
import { Account } from '../repositories/account-repository'
import { WorkflowBase } from './workflow-base'

const template = html<AccountInfoWorkflow>/*html*/ `
  <div class="account-info">
    <div class="info-section">
      <div class="account-header">
        <div class="account-icon ${(x) => x.account?.type.toLowerCase() || ''}">
          ${(x) => x.account?.type.substring(0, 1) || ''}
        </div>
        <div class="account-title">
          <h3>${(x) => x.account?.name || 'Account'}</h3>
          <span class="account-type">${(x) => x.account?.type || ''}</span>
        </div>
      </div>

      <div class="account-balance">
        <span class="balance-label">Current Balance</span>
        <span
          class="balance-amount ${(x) =>
            (x.account?.balance || 0) < 0 ? 'negative' : ''}"
        >
          $${(x) => x.formatCurrency(x.account?.balance || 0)}
        </span>
      </div>
    </div>

    <div class="info-section details-section">
      <h4>Account Details</h4>
      <div class="detail-row">
        <span class="detail-label">Account Number</span>
        <span class="detail-value"
          >${(x) => x.formatAccountNumber(x.account?.accountNumber || '')}</span
        >
      </div>
      <div class="detail-row">
        <span class="detail-label">Created</span>
        <span class="detail-value"
          >${(x) => x.formatDate(x.account?.createdAt || '')}</span
        >
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span
          class="detail-value status ${(x) =>
            x.account?.isActive ? 'active' : 'inactive'}"
        >
          ${(x) => (x.account?.isActive ? 'Active' : 'Inactive')}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Interest Rate</span>
        <span class="detail-value"
          >${(x) =>
            x.account?.interestRate
              ? x.account.interestRate + '%'
              : 'N/A'}</span
        >
      </div>
    </div>

    <div class="actions-section">
      <slot name="actions"></slot>
    </div>
  </div>
`

const styles = css`
  .account-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-section {
    background-color: var(--section-bg, #f9f9f9);
    border-radius: 6px;
    padding: 16px;
  }

  .account-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
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
    color: white;
    margin-right: 12px;
    background-color: var(--primary-color, #3498db);
  }

  .account-icon.checking {
    background-color: #3498db;
  }

  .account-icon.savings {
    background-color: #2ecc71;
  }

  .account-icon.credit {
    background-color: #9b59b6;
  }

  .account-icon.investment {
    background-color: #f1c40f;
  }

  .account-title h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
  }

  .account-type {
    font-size: 14px;
    color: var(--text-secondary, #666);
  }

  .account-balance {
    display: flex;
    flex-direction: column;
  }

  .balance-label {
    font-size: 14px;
    color: var(--text-secondary, #666);
    margin-bottom: 4px;
  }

  .balance-amount {
    font-size: 24px;
    font-weight: bold;
    color: var(--text-primary, #333);
  }

  .balance-amount.negative {
    color: var(--error-color, #e74c3c);
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

  .status {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status.active {
    background-color: rgba(46, 204, 113, 0.2);
    color: #27ae60;
  }

  .status.inactive {
    background-color: rgba(231, 76, 60, 0.2);
    color: #c0392b;
  }

  .actions-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`
@customElement({
  name: 'account-info-workflow',
  template,
  styles,
})
export class AccountInfoWorkflow extends WorkflowBase {
  @observable account: Account | null = null

  @attr({ attribute: 'hide-actions', mode: 'boolean' })
  hideActions: boolean = false

  async initialize(params?: Record<string, any>): Promise<void> {
    console.log('Initializing Account-info-workflow with params:', params)

    if (params?.account) {
      this.account = params.account
    }
  }

  /**
   * Format currency with commas and two decimal places
   */
  formatCurrency(amount: number): string {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  /**
   * Format account number with masking for privacy
   */
  formatAccountNumber(accountNumber: string): string {
    if (!accountNumber) return ''
    // Show only last 4 digits
    return '••••' + accountNumber.slice(-4)
  }

  /**
   * Format date in a readable format
   */
  formatDate(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}
