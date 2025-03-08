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
import { repositoryService } from '../services/repository-service'
import { Account } from '../repositories/models/account-models'

const template = html<AccountInfoWorkflow>/*html*/ `
  ${when(
    (x) => !x.account,
    html<AccountInfoWorkflow>/*html*/ `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No Account Selected</h3>
        <p>Please select an account to view its details</p>
      </div>
    `
  )}

  ${when(
    (x) => x.account,
    html<AccountInfoWorkflow>/*html*/ `
      <div class="account-info">
        <div class="info-section">
          <div class="account-header">
            <div class="account-icon ${(x) => x.account?.type.toLowerCase() || ''}">
              ${(x) => x.account?.type.substring(0, 1) || ''}
            </div>
            <div class="account-title">
              ${when(
                (x) => x.isRenaming,
                html<AccountInfoWorkflow>/*html*/ `
                  <div class="rename-container">
                    <input 
                      type="text" 
                      ${ref('nameInput')}
                      :value="${(x) => x.account?.name || ''}" 
                      class="rename-input"
                      @keyup="${(x, c) => x.accountNameChanged(c.event)}"
                    />
                    <div class="rename-actions">
                      <button @click="${(x) => x.saveRename()}" class="rename-btn save">Save</button>
                      <button @click="${(x) => x.cancelRename()}" class="rename-btn cancel">Cancel</button>
                    </div>
                  </div>
                `
              )}
              ${when(
                (x) => !x.isRenaming,
                html<AccountInfoWorkflow>/*html*/ `
                  <h3>${(x) => x.account?.name || 'Account'}</h3>
                  <div class="account-title-actions">
                    <span class="account-type">${(x) => x.account?.type || ''}</span>
                    <button @click="${(x) => x.startRename()}" class="rename-icon" title="Rename account">✏️</button>
                  </div>
                `
              )}
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
          ${when(
            (x) => x.hasInterestRate,
            html<AccountInfoWorkflow>/*html*/ `
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value"
                  >${(x) =>
                    x.account?.interestRate
                      ? x.account.interestRate + '%'
                      : 'N/A'}</span
                >
              </div>
            `
          )}
        </div>

        ${when(
          (x) => x.account?.type === 'credit',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Credit Card Details</h4>
              <div class="credit-card-visual">
                <div class="credit-card">
                  <div class="card-chip">⬜</div>
                  <div class="card-number">${(x) => x.formatAccountNumber(x.account?.accountNumber || '')}</div>
                  <div class="card-name">${(x) => x.account?.name}</div>
                  <div class="card-expiry">Valid thru: ${(x) => x.getFutureDate(3)}</div>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Credit Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.creditLimit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Available Credit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.availableCredit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Due Date</span>
                <span class="detail-value">${(x) => x.formatDate(x.account?.paymentDueDate || '')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Minimum Payment</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.minimumPaymentDue || 0)}</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'savings',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Savings Details</h4>
              <div class="savings-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${(x) => x.calculateGoalProgress()}%"></div>
                </div>
                <div class="progress-info">
                  <span>Goal: $${(x) => x.formatCurrency(x.account?.savingsGoal || 0)}</span>
                  <span>${(x) => x.calculateGoalProgress()}%</span>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRate}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Earned YTD</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.calculateInterestEarned())}</span>
              </div>
              ${when(
                (x) => x.account?.targetDate,
                html<AccountInfoWorkflow>/*html*/ `
                  <div class="detail-row">
                    <span class="detail-label">Target Date</span>
                    <span class="detail-value">${(x) => x.formatDate(x.account?.targetDate || '')}</span>
                  </div>
                `
              )}
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'pension',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Pension Details</h4>
              <div class="chart-placeholder">
                <div class="pension-projection">
                  <h5>Projected Monthly Pension</h5>
                  <div class="projection-amount">$${(x) => x.formatCurrency(x.calculateProjectedPension())}</div>
                  <p class="projection-note">at retirement age 65</p>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Annual Contribution</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.calculateAnnualContribution())}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Return Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRate || 4}%</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'loan',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Loan Details</h4>
              <div class="detail-row">
                <span class="detail-label">Original Amount</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.originalLoanAmount || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRateLoan || x.account?.interestRate || 0}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Payment</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.nextPaymentAmount || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date</span>
                <span class="detail-value">${(x) => x.formatDate(x.account?.nextPaymentDueDate || '')}</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'mortgage',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Mortgage Details</h4>
              <div class="detail-row">
                <span class="detail-label">Original Amount</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.originalLoanAmount || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRateLoan || x.account?.interestRate || 0}%</span>
              </div>
              <div class="payment-breakdown">
                <h5>Next Payment Breakdown</h5>
                <div class="breakdown-chart">
                  <div class="chart-bar">
                    <div class="interest-portion" style="width: ${(x) => x.calculateInterestPortion()}%"></div>
                    <div class="principal-portion" style="width: ${(x) => 100 - x.calculateInterestPortion()}%"></div>
                  </div>
                  <div class="chart-legend">
                    <div class="legend-item">
                      <span class="legend-color interest"></span>
                      <span>Interest: $${(x) => x.formatCurrency(x.calculateInterestAmount())}</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color principal"></span>
                      <span>Principal: $${(x) => x.formatCurrency(x.calculatePrincipalAmount())}</span>
                    </div>
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value">${(x) => x.formatDate(x.account?.nextPaymentDueDate || '')}</span>
                </div>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'investment',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Investment Details</h4>
              <div class="detail-row">
                <span class="detail-label">Risk Level</span>
                <span class="detail-value risk-level">${(x) => x.getRiskLevel()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Performance YTD</span>
                <span class="detail-value ${(x) => (x.account?.performanceYTD || 0) >= 0 ? 'positive' : 'negative'}">
                  ${(x) => (x.account?.performanceYTD || 0) >= 0 ? '+' : ''}${(x) => x.account?.performanceYTD || 0}%
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Updated</span>
                <span class="detail-value">${(x) => x.formatDate(x.account?.lastUpdated || '')}</span>
              </div>
            </div>
          `
        )}

        <div class="actions-section">
          <slot name="actions"></slot>
        </div>
      </div>
    `
  )}
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
  
  /* Rename functionality styling */
  .account-title-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .rename-icon {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 2px;
    opacity: 0.7;
  }
  
  .rename-icon:hover {
    opacity: 1;
  }
  
  .rename-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .rename-input {
    padding: 4px 8px;
    border: 1px solid var(--divider-color, #eaeaea);
    border-radius: 4px;
    font-size: 16px;
  }
  
  .rename-actions {
    display: flex;
    gap: 8px;
  }
  
  .rename-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .rename-btn.save {
    background-color: var(--primary-color, #3498db);
    color: white;
  }
  
  .rename-btn.cancel {
    background-color: #eaeaea;
    color: #333;
  }
  
  /* Type-specific sections */
  .type-specific-section {
    margin-top: 16px;
  }
  
  /* Credit card styling */
  .credit-card-visual {
    margin: 16px 0;
  }
  
  .credit-card {
    background: linear-gradient(135deg, #2c3e50, #3498db);
    border-radius: 10px;
    padding: 20px;
    color: white;
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
    background-color: #eaeaea;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #2ecc71;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 14px;
  }
  
  /* Pension projection */
  .pension-projection {
    background-color: #f1f1f1;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    margin: 16px 0;
  }
  
  .pension-projection h5 {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  .projection-amount {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .projection-note {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary, #666);
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
    background-color: #eaeaea;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
  }
  
  .interest-portion {
    height: 100%;
    background-color: #e74c3c;
  }
  
  .principal-portion {
    height: 100%;
    background-color: #2ecc71;
  }
  
  .chart-legend {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
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
    background-color: #e74c3c;
  }
  
  .legend-color.principal {
    background-color: #2ecc71;
  }
  
  /* Investment risk level */
  .risk-level {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    background-color: #f1c40f33;
  }
  
  .detail-value.positive {
    color: #27ae60;
  }
  
  .detail-value.negative {
    color: #e74c3c;
  }
`
@customElement({
  name: 'account-info-workflow',
  template,
  styles,
})
export class AccountInfoWorkflow extends WorkflowBase {
  @observable account: Account | null = null
  @observable isRenaming: boolean = false
  nameInput: HTMLInputElement;
  // nameInput: string = ''

  @attr({ attribute: 'hide-actions', mode: 'boolean' })
  hideActions: boolean = false

  get hasInterestRate(): boolean {
    return ['savings', 'loan', 'mortgage'].includes(this.account?.type || '');
  }

  accountNameChanged(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      this.saveRename();
    } else if (keyboardEvent.key === 'Escape') {
      this.cancelRename();
    } 
  }

  async initialize(params?: Record<string, any>): Promise<void> {
    console.debug('Initializing Account-info-workflow with params:', params)

    this.updateTitle('Account Details')

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

  /**
   * Calculate progress percentage toward savings goal
   */
  calculateGoalProgress(): number {
    if (!this.account || !this.account.savingsGoal || this.account.savingsGoal <= 0) {
      return 0
    }
    const progress = (this.account.balance / this.account.savingsGoal) * 100
    return Math.min(Math.round(progress), 100)
  }

  /**
   * Calculate interest earned for savings account (simplified)
   */
  calculateInterestEarned(): number {
    if (!this.account || !this.account.interestRate) {
      return 0
    }
    // Simplified calculation - in real app would be more complex
    const avgBalance = this.account.averageBalance || this.account.balance
    return (avgBalance * (this.account.interestRate / 100)) / 2 // Half-year approximation
  }

  /**
   * Get future date for credit card expiration
   */
  getFutureDate(yearsAhead: number): string {
    const date = new Date()
    date.setFullYear(date.getFullYear() + yearsAhead)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(
      date.getFullYear()
    ).slice(-2)}`
  }

  /**
   * Calculate projected monthly pension amount
   */
  calculateProjectedPension(): number {
    if (!this.account) return 0
    // Simple projection formula - would be more complex in real application
    const currentBalance = this.account.balance
    const returnRate = this.account.interestRate || 5
    const yearsToRetirement = 30 // Simplified assumption
    
    // Future value with compound interest
    const futureValue = currentBalance * Math.pow(1 + returnRate / 100, yearsToRetirement)
    
    // Monthly pension estimation (simplified)
    return futureValue / 240 // 20 years of monthly payments
  }

  /**
   * Estimate annual contribution to pension
   */
  calculateAnnualContribution(): number {
    if (!this.account) return 0
    // Simplified calculation
    return this.account.balance * 0.05 // 5% of current balance as annual contribution
  }

  /**
   * Calculate interest portion of mortgage payment as percentage
   */
  calculateInterestPortion(): number {
    if (!this.account) return 0
    // For demo purposes, return a percentage between 30-70%
    // In a real app, would calculate based on amortization schedule
    return 65 - (this.account.balance / (this.account.originalLoanAmount || 100000)) * 30
  }

  /**
   * Calculate interest amount of next payment
   */
  calculateInterestAmount(): number {
    if (!this.account || !this.account.nextPaymentAmount) return 0
    const interestPortion = this.calculateInterestPortion() / 100
    return this.account.nextPaymentAmount * interestPortion
  }

  /**
   * Calculate principal amount of next payment
   */
  calculatePrincipalAmount(): number {
    if (!this.account || !this.account.nextPaymentAmount) return 0
    const interestAmount = this.calculateInterestAmount()
    return this.account.nextPaymentAmount - interestAmount
  }

  /**
   * Get risk level description for investment account
   */
  getRiskLevel(): string {
    if (!this.account) return 'Medium'
    
    // Could be based on actual portfolio composition in a real app
    if (this.account.performanceYTD && this.account.performanceYTD > 10) {
      return 'High'
    } else if (this.account.performanceYTD && this.account.performanceYTD < 3) {
      return 'Low'
    } else {
      return 'Medium'
    }
  }

  /**
   * Start account rename process
   */
  startRename(): void {
    this.isRenaming = true;
    // Focus the input after rendering
    setTimeout(() => {
      if (this.nameInput) {
        this.nameInput.focus();
        this.nameInput.select();
      }
    }, 0);
  }

  /**
   * Cancel account rename
   */
  cancelRename(): void {
    this.isRenaming = false;
  }

  /**
   * Save the new account name
   */
  async saveRename(): Promise<void> {
    if (!this.account || !this.nameInput) return;
    
    const newName = this.nameInput.value.trim();
    if (!newName) {
      // Don't save empty names
      return;
    }
    
    try {
      const accountRepo = repositoryService.getAccountRepository();
      await accountRepo.update(this.account.id, { ...this.account, name: newName });
      
      // Update local account object
      this.account = { ...this.account, name: newName };
      this.isRenaming = false;
    } catch (error) {
      console.error('Failed to rename account:', error);
      // Could add error notification here
    }
  }
}
