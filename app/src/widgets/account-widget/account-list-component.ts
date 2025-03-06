import { FASTElement, customElement, html, css, observable, repeat, when } from "@microsoft/fast-element";
import { TransactionViewModel } from "./transaction-list-component";
import { Account } from "../../repositories/account-repository";
import { repositoryService, TransactionStatus } from "../../services/repository-service";
import { TransactionViewModelHelper } from "./transaction-view-model-helper";
import { Transaction } from "../../repositories/transaction-repository";
import { AccountInsightsHelper, AccountInsight } from "../../helpers/account-insights-helper";

const template = html<AccountListComponent>/*html*/ `
  <div class="accounts-list">
    ${when(x => x.isLoading, html<AccountListComponent>/*html*/`
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading accounts...</p>
      </div>
    `)}
    
    ${when(x => x.hasError, html<AccountListComponent>/*html*/`
      <div class="error-state">
        <p class="error-message">${x => x.errorMessage}</p>
        <button class="retry-button" @click="${x => x.loadData()}">Retry</button>
      </div>
    `)}
    
    ${when(x => !x.isLoading && !x.hasError, html<AccountListComponent>/*html*/`
      ${repeat(x => x.accounts, html<Account, AccountListComponent>/*html*/`
        <div class="account-item ${(x, c) => x.id === c.parent.expandedAccountId ? 'expanded' : ''}" 
             id="account-${x => x.id}">
          <div class="account-header" 
            @click="${(x, c) => c.parent.handleAccountClick(x)}">
            <div class="account-info">
              <div class="account-name">${x => x.name}</div>
              <div class="account-type">${x => x.type}</div>
              
              <div class="account-insights">
                <!-- Account type-specific insights -->
                ${repeat((x, c) => c.parent.getInsightsForAccount(x), html<AccountInsight>/*html*/`
                  <div class="insight-item ${x => x.colorClass || 'neutral'}">
                    ${when(x => x.icon, html<AccountInsight>/*html*/`
                      <span class="insight-icon">${x => x.icon}</span>
                    `)}
                    <span class="insight-label">${x => x.label}:</span>
                    <span class="insight-value">${x => x.value}</span>
                  </div>
                `)}
                
                <!-- Show upcoming transactions summary if any exist -->
                ${when((x, c) => c.parent.accountHasUpcoming(x.id), html<Account, AccountListComponent>/*html*/`
                  <div class="upcoming-summary ${(x, c) => c.parent.hasInsufficientFunds(x) ? 'warning' : ''}">
                    <div class="upcoming-dot"></div>
                    ${(x, c) => c.parent.getUpcomingSummary(x.id)}
                    ${when((x, c) => c.parent.hasInsufficientFunds(x), html<Account, AccountListComponent>/*html*/`
                      <span class="warning-icon" title="Insufficient funds for upcoming transactions">⚠️</span>
                    `)}
                  </div>
                `)}
              </div>
            </div>
            <div class="account-balance">
              <div class="balance-amount">${x => x.balance.toFixed(2)}</div>
              <div class="balance-currency">${x => x.currency}</div>
            </div>
            <div class="account-actions">
              <button class="more-button" @click="${(x, c) => c.parent.handleMoreClick(x, c.event)}" title="More Options">
                ⋮
              </button>
            </div>
          </div>
          
          ${when((x, c) => x.id === c.parent.expandedAccountId, html<Account, AccountListComponent>/*html*/`
            <transaction-list
              :accountId="${x => x.id}">
            </transaction-list>
          `)}
        </div>
      `)}
    `)}
  </div>
`;

const styles = css`
  .accounts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    flex: 1;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--widget-primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    flex: 1;
  }
  
  .error-message {
    color: var(--widget-error-color, #e74c3c);
    text-align: center;
    margin-bottom: 16px;
  }
  
  .retry-button {
    background-color: var(--widget-error-color, #e74c3c);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .retry-button:hover {
    background-color: #c0392b;
  }
  
  .account-item {
    border: 1px solid var(--divider-color, #eaeaea);
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .account-item.expanded {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .account-header {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    background-color: var(--background-light, #f9f9f9);
    transition: background-color 0.2s;
    align-items: center;
  }
  
  .account-header:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  }
  
  .account-info {
    flex: 1;
  }
  
  .account-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .account-type {
    font-size: 12px;
    color: var(--tertiary-text, #999);
  }
  
  /* Account insights styling */
  .account-insights {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .insight-item {
    display: flex;
    align-items: center;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    background-color: var(--insights-bg, rgba(247, 247, 247, 0.7));
    border: 1px solid var(--insights-border, rgba(230, 230, 230, 0.5));
    max-width: fit-content;
  }
  
  .insight-icon {
    margin-right: 3px;
    font-size: 10px;
  }
  
  .insight-label {
    margin-right: 3px;
    color: var(--tertiary-text, #999);
  }
  
  .insight-value {
    font-weight: 500;
  }
  
  /* Insight color classes */
  .insight-item.success {
    background-color: var(--success-bg-light, rgba(240, 255, 240, 0.7));
    border-color: var(--success-border, rgba(46, 204, 113, 0.3));
    color: var(--success-color, #27ae60);
  }
  
  .insight-item.warning {
    background-color: var(--warning-bg-light, rgba(255, 248, 240, 0.7));
    border-color: var(--warning-border, rgba(230, 126, 34, 0.3));
    color: var(--warning-color, #e67e22);
  }
  
  .insight-item.danger {
    background-color: var(--danger-bg-light, rgba(255, 235, 235, 0.7));
    border-color: var(--danger-border, rgba(231, 76, 60, 0.3));
    color: var(--danger-color, #e74c3c);
  }
  
  .account-balance {
    text-align: right;
    margin: 0 16px;
  }
  
  .balance-amount {
    font-weight: 600;
    font-size: 16px;
  }
  
  .balance-currency {
    font-size: 12px;
    color: var(--tertiary-text, #999);
  }
  
  .account-actions {
    display: flex;
  }
  
  .more-button {
    background: transparent;
    border: none;
    font-size: 18px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    color: var(--secondary-text, #666);
  }
  
  .more-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .expanded .account-header {
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  /* Upcoming transactions summary */
  .upcoming-summary {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--upcoming-color, #9b59b6);
    background-color: var(--upcoming-bg-light, rgba(247, 247, 255, 0.5));
    padding: 3px 8px;
    border-radius: 12px;
    width: fit-content;
  }
  
  .upcoming-summary.warning {
    color: var(--warning-color, #e67e22);
    background-color: var(--warning-bg-light, rgba(255, 248, 240, 0.7));
    border: 1px solid var(--warning-border-color, rgba(230, 126, 34, 0.2));
  }
  
  .upcoming-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--upcoming-color, #9b59b6);
    margin-right: 6px;
    flex-shrink: 0;
  }
  
  .upcoming-summary.warning .upcoming-dot {
    background-color: var(--warning-color, #e67e22);
  }
  
  .warning-icon {
    margin-left: 6px;
    font-size: 11px;
  }
`;

@customElement({
  name: "account-list",
  template,
  styles
})
export class AccountListComponent extends FASTElement {
  @observable accounts: Account[] = [];
  @observable expandedAccountId: string | null = null;
  @observable isLoading: boolean = true;
  @observable hasError: boolean = false;
  @observable errorMessage: string = '';
  
  // Maps for caching transaction data
  private upcomingTransactionsByAccount: Map<string, TransactionViewModel[]> = new Map();
  private upcomingSummaryCache: Map<string, string> = new Map();
  private outgoingTotalsByAccount: Map<string, number> = new Map();
  
  // Cache for account insights
  private accountInsightsCache: Map<string, AccountInsight[]> = new Map();

  constructor() {
    super();
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadData();
    
    // Listen for storage events to refresh data when needed
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }
  
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
  }
  
  /**
   * Handle storage changes from other tabs/windows
   */
  private handleStorageChange(event: StorageEvent): void {
    // If accounts or transactions data changed, refresh
    if (event.key?.includes('accounts') || event.key?.includes('transactions')) {
      this.loadData();
    }
  }

  /**
   * Load all required data for this component
   */
  async loadData(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    
    try {
      // Get repositories
      const accountRepo = repositoryService.getAccountRepository();
      const transactionRepo = repositoryService.getTransactionRepository();
      
      // Load accounts
      this.accounts = await accountRepo.getAll();
      
      // Clear caches
      this.upcomingTransactionsByAccount.clear();
      this.upcomingSummaryCache.clear();
      this.accountInsightsCache.clear();
      
      // Pre-calculate insights for each account
      this.accounts.forEach(account => {
        this.accountInsightsCache.set(account.id, AccountInsightsHelper.getAccountInsights(account));
      });
      
      // Load upcoming transactions
      const upcomingTransactions = await transactionRepo.getUpcoming();
      
      // Process and cache upcoming transactions by account
      for (const transaction of upcomingTransactions) {
        // Handle both incoming and outgoing transactions
        if (transaction.fromAccountId) {
          this.addTransactionToAccount(transaction, transaction.fromAccountId);
        }
        
        if (transaction.toAccountId) {
          this.addTransactionToAccount(transaction, transaction.toAccountId);
        }
      }
      
      // Pre-calculate summaries for better performance
      this.preCalculateSummaries();
      
      this.isLoading = false;
      
      // Let parent know we're ready
      this.dispatchEvent(new CustomEvent('ready'));
    } catch (error) {
      console.error('Error loading account data:', error);
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Failed to load account data';
      this.isLoading = false;
    }
  }
  
  /**
   * Add a transaction to the account's cache
   */
  private addTransactionToAccount(transaction: Transaction, accountId: string): void {
    // Skip accounts we don't know about
    if (!this.accounts.some(a => a.id === accountId)) return;
    
    if (!this.upcomingTransactionsByAccount.has(accountId)) {
      this.upcomingTransactionsByAccount.set(accountId, []);
    }
    
    const viewModel = TransactionViewModelHelper.processTransaction(transaction, accountId);
    this.upcomingTransactionsByAccount.get(accountId)!.push(viewModel);
  }
  
  /**
   * Pre-calculate all account summaries for better performance
   */
  private preCalculateSummaries(): void {
    this.outgoingTotalsByAccount.clear();
    
    for (const accountId of this.upcomingTransactionsByAccount.keys()) {
      const transactions = this.upcomingTransactionsByAccount.get(accountId)!;
      if (transactions.length > 0) {
        this.upcomingSummaryCache.set(accountId, this.calculateUpcomingSummary(transactions));
        
        // Calculate and store total outgoing amount
        const outgoing = transactions.filter(t => !t.isIncoming);
        const outgoingTotal = outgoing.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        this.outgoingTotalsByAccount.set(accountId, outgoingTotal);
      }
    }
  }

  /**
   * Check if an account has upcoming transactions
   */
  accountHasUpcoming(accountId: string): boolean {
    return this.upcomingTransactionsByAccount.has(accountId) && 
           this.upcomingTransactionsByAccount.get(accountId)!.length > 0;
  }

  /**
   * Get the formatted summary of upcoming transactions
   */
  getUpcomingSummary(accountId: string): string {
    return this.upcomingSummaryCache.get(accountId) || '';
  }
  
  /**
   * Calculate a human-readable summary of upcoming transactions
   */
  private calculateUpcomingSummary(transactions: TransactionViewModel[]): string {
    // Calculate total incoming and outgoing amounts
    const incoming = transactions.filter(t => t.isIncoming);
    const outgoing = transactions.filter(t => !t.isIncoming);
    
    const incomingTotal = incoming.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const outgoingTotal = outgoing.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Create a summary message
    const parts = [];
    
    if (outgoing.length > 0) {
      const closest = this.getClosestTransaction(outgoing);
      const timeframe = this.getTimeframeText(closest.scheduledDate!);
      parts.push(`${outgoing.length} out (-${outgoingTotal.toFixed(0)}) ${timeframe}`);
    }
    
    if (incoming.length > 0) {
      const closest = this.getClosestTransaction(incoming);
      const timeframe = this.getTimeframeText(closest.scheduledDate!);
      parts.push(`${incoming.length} in (+${incomingTotal.toFixed(0)}) ${timeframe}`);
    }
    
    return parts.join(' · ');
  }
  
  /**
   * Get the closest (soonest) transaction from a list
   */
  private getClosestTransaction(transactions: TransactionViewModel[]): TransactionViewModel {
    return transactions.reduce((closest, current) => {
      if (!closest.scheduledDate) return current;
      if (!current.scheduledDate) return closest;
      
      const closestDate = new Date(closest.scheduledDate).getTime();
      const currentDate = new Date(current.scheduledDate).getTime();
      
      return currentDate < closestDate ? current : closest;
    });
  }
  
  /**
   * Get a human-readable timeframe description
   */
  private getTimeframeText(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    } else if (daysDiff < 7) {
      return `in ${daysDiff} days`;
    } else if (daysDiff < 30) {
      const weeks = Math.floor(daysDiff / 7);
      return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    } else {
      return 'soon';
    }
  }

  /**
   * Check if the account has insufficient funds for upcoming payments
   */
  hasInsufficientFunds(account: Account): boolean {
    const outgoingTotal = this.outgoingTotalsByAccount.get(account.id) || 0;
    return outgoingTotal > account.balance;
  }

  /**
   * Get insights for a specific account
   */
  getInsightsForAccount(account: Account): AccountInsight[] {
    // First check the cache
    const cachedInsights = this.accountInsightsCache.get(account.id);
    if (cachedInsights) {
      return cachedInsights;
    }
    
    // If not cached (shouldn't happen), generate on the fly
    const insights = AccountInsightsHelper.getAccountInsights(account);
    this.accountInsightsCache.set(account.id, insights);
    return insights;
  }

  /**
   * Handle account click to expand/collapse
   */
  handleAccountClick(account: Account) {
    console.log('Account clicked:', account);
    
    // Toggle expanded state
    this.expandedAccountId = this.expandedAccountId === account.id ? null : account.id;
    
    // this.dispatchEvent(new CustomEvent('account-toggle', {
    //   detail: { accountId: account.id, expanded: this.expandedAccountId === account.id }
    // }));
  }
  
  /**
   * Handle more/options button click
   */
  handleMoreClick(account: Account, event: Event) {
    event.stopPropagation();
    
    this.dispatchEvent(new CustomEvent('account-actions', {
      detail: { account }
    }));
  }
}
