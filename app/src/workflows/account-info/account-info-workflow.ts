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
import { WorkflowBase } from '../workflow-base'
import { repositoryService } from '../../services/repository-service'
import { Account } from '../../repositories/models/account-models'
import { template } from './account-info-workflow.template'
import { styles } from './account-info-workflow.css'

@customElement({
  name: 'account-info-workflow',
  template,
  styles,
})
export class AccountInfoWorkflow extends WorkflowBase {
  @observable account: Account | null = null
  @observable isRenaming: boolean = false
  nameInput: HTMLInputElement;
  

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

    // this.updateModalWidth();
    this.updateTitle('Account Details')

    if (params?.account) {
      this.account = params.account
    }
  }

  /**
   * Clean up event listeners when component is disconnected
   */
  disconnectedCallback(): void {
    super.disconnectedCallback?.();
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
