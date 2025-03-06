import { FASTElement, customElement, html, css, observable, repeat, when } from "@microsoft/fast-element";
import { Transaction } from "../../repositories/transaction-repository";
import { TransactionViewModelHelper } from "./transaction-view-model-helper";
import { repositoryService } from "../../services/repository-service";

export interface TransactionViewModel extends Transaction {
  isIncoming: boolean;
  amountClass: string;
  formattedAmount: string;
  formattedBalance?: string;
}

interface TransactionGroup {
  date: string;
  displayDate: string;
  transactions: TransactionViewModel[];
}

const template = html<TransactionListComponent>/*html*/ `
  <div class="transaction-list-container">
    ${when(x => x.isLoading, html<TransactionListComponent>/*html*/`
      <div class="transactions-loading">
        <div class="spinner-sm"></div>
        <p>Loading transactions...</p>
      </div>
    `)}
    
    ${when(x => !x.isLoading && x.hasError, html<TransactionListComponent>/*html*/`
      <div class="transactions-error">
        <p class="error-message">Failed to load transactions</p>
        <button class="retry-button" @click="${x => x.loadTransactions()}">Retry</button>
      </div>
    `)}
    
    ${when(x => !x.isLoading && !x.hasError, html<TransactionListComponent>/*html*/`
      <!-- Tab Navigation -->
      <div class="transaction-tabs">
        <button class="tab-button ${x => x.activeTab === 'completed' ? 'active' : ''}" 
                @click="${x => x.setActiveTab('completed')}">
          Completed
          <span class="tab-count">${x => x.regularTransactions.length || 0}</span>
        </button>
        <button class="tab-button ${x => x.activeTab === 'upcoming' ? 'active' : ''}" 
                @click="${x => x.setActiveTab('upcoming')}">
          Upcoming
          <span class="tab-count">${x => x.upcomingTransactions.length || 0}</span>
        </button>
      </div>
      
      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Completed Transactions Tab -->
        ${when(x => x.activeTab === 'completed', html<TransactionListComponent>/*html*/`
          ${when(x => x.regularTransactions.length === 0, html<TransactionListComponent>/*html*/`
            <div class="transactions-empty">
              <p>No completed transactions found for this account.</p>
            </div>
          `)}
          
          ${when(x => x.regularTransactions.length > 0, html<TransactionListComponent>/*html*/`
            <div class="transaction-list">
              ${repeat(x => x.visibleRegularTransactions, html<TransactionViewModel>/*html*/`
                <div class="transaction-item">
                  <div class="transaction-date">
                    <div>${x => new Date(x.createdAt).toLocaleDateString()}</div>
                    <div class="transaction-time">${x => new Date(x.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div class="transaction-details">
                    <div class="transaction-description">${x => x.description || 'Transaction'}</div>
                    <div class="transaction-type">${x => x.type}</div>
                  </div>
                  <div class="transaction-amount ${x => x.amountClass}">
                    <div>${x => x.isIncoming ? '+' : '-'} ${x => x.formattedAmount}</div>
                    ${when(x => x.formattedBalance, html<TransactionViewModel>/*html*/`
                      <div class="transaction-balance">${x => x.formattedBalance}</div>
                    `)}
                  </div>
                </div>
              `)}
            </div>
            
            ${when(x => x.hasMoreRegularTransactions, html<TransactionListComponent>/*html*/`
              <button class="view-all-button" @click="${x => x.showAllTransactions()}">
                View all transactions
              </button>
            `)}
          `)}
        `)}
        
        <!-- Upcoming Transactions Tab -->
        ${when(x => x.activeTab === 'upcoming', html<TransactionListComponent>/*html*/`
          ${when(x => x.upcomingTransactions.length === 0, html<TransactionListComponent>/*html*/`
            <div class="transactions-empty">
              <p>No upcoming transactions found for this account.</p>
            </div>
          `)}
          
          ${when(x => x.upcomingTransactions.length > 0, html<TransactionListComponent>/*html*/`
            <div class="transaction-groups">
              ${repeat(x => x.upcomingGroups, html<TransactionGroup, TransactionListComponent>/*html*/`
                <div class="transaction-group">
                  <div class="group-date-header">${x => x.displayDate}</div>
                  
                  <div class="transaction-list">
                    ${repeat(x => x.transactions, html<TransactionViewModel>/*html*/`
                      <div class="transaction-item upcoming">
                        <div class="transaction-icon">
                          <div class="scheduled-icon"></div>
                        </div>
                        <div class="transaction-details">
                          <div class="transaction-description">${x => x.description || 'Scheduled Transaction'}</div>
                          <div class="transaction-type">${x => x.type}</div>
                        </div>
                        <div class="transaction-amount ${x => x.amountClass}">
                          <div>${x => x.isIncoming ? '+' : '-'} ${x => x.formattedAmount}</div>
                        </div>
                      </div>
                    `)}
                  </div>
                </div>
              `)}
            </div>
          `)}
        `)}
      </div>
    `)}
  </div>
`;

const styles = css`
  .transaction-list-container {
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  
  .transactions-loading, .transactions-empty {
    padding: 16px;
    text-align: center;
    color: var(--text-secondary, #666);
  }
  
  .transactions-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .spinner-sm {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Tab Navigation */
  .transaction-tabs {
    display: flex;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
    background-color: var(--background-light, #f9f9f9);
  }
  
  .tab-button {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary, #666);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .tab-button:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
  
  .tab-button.active {
    color: var(--primary-color, #3498db);
  }
  
  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--primary-color, #3498db);
  }
  
  .tab-count {
    font-size: 12px;
    background-color: rgba(0, 0, 0, 0.07);
    color: var(--text-secondary, #666);
    border-radius: 12px;
    padding: 2px 8px;
    min-width: 24px;
    text-align: center;
  }
  
  .tab-content {
    flex: 1;
    overflow-y: auto;
  }
  
  .transaction-section {
    margin-bottom: 16px;
  }
  
  .group-date-header {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary, #666);
    padding: 8px 16px 4px;
    background-color: var(--background-light, rgba(0,0,0,0.02));
  }
  
  .transaction-list {
    display: flex;
    flex-direction: column;
  }
  
  .transaction-item {
    display: flex;
    padding: 12px 16px;
    border-bottom: 1px solid var(--divider-color, #f0f0f0);
    align-items: center;
  }
  
  .transaction-item:last-child {
    border-bottom: none;
  }
  
  .transaction-item.upcoming {
    background-color: var(--upcoming-bg, rgba(247, 247, 255, 0.5));
  }
  
  .transaction-date {
    min-width: 80px;
    font-size: 13px;
  }
  
  .transaction-time {
    font-size: 12px;
    color: var(--text-tertiary, #999);
  }
  
  .transaction-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }
  
  .scheduled-icon {
    width: 12px;
    height: 12px;
    border: 2px solid var(--upcoming-color, #9b59b6);
    border-radius: 50%;
    position: relative;
  }
  
  .scheduled-icon::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    height: 6px;
    width: 2px;
    background: var(--upcoming-color, #9b59b6);
    transform: translate(-50%, -50%);
  }
  
  .scheduled-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    height: 2px;
    width: 6px;
    background: var(--upcoming-color, #9b59b6);
    transform: translate(-1px, -50%);
  }
  
  .transaction-details {
    flex: 1;
    padding: 0 16px;
    min-width: 0;
  }
  
  .transaction-description {
    font-size: 14px;
    word-break: break-word;
  }
  
  .transaction-type {
    font-size: 12px;
    color: var(--text-tertiary, #999);
  }
  
  .transaction-amount {
    text-align: right;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .transaction-amount.incoming {
    color: var(--success-color, #27ae60);
  }
  
  .transaction-amount.outgoing {
    color: var(--text-primary, #333);
  }
  
  .transaction-balance {
    font-size: 12px;
    font-weight: normal;
    color: var(--text-tertiary, #999);
    margin-top: 2px;
  }
  
  .view-all-button {
    display: block;
    width: 100%;
    padding: 8px;
    background-color: transparent;
    border: none;
    border-top: 1px solid var(--divider-color, #eaeaea);
    color: var(--primary-color, #3498db);
    font-weight: 500;
    cursor: pointer;
    text-align: center;
  }
  
  .view-all-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  }
  
  .transaction-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .transactions-error {
    padding: 16px;
    text-align: center;
    color: var(--widget-error-color, #e74c3c);
  }
  
  .error-message {
    margin-bottom: 8px;
  }
  
  .retry-button {
    background-color: var(--widget-primary-color, #3498db);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
`;

@customElement({
  name: "transaction-list",
  template,
  styles
})
export class TransactionListComponent extends FASTElement {
  @observable accountId: string = '';
  @observable isLoading: boolean = false;
  @observable hasError: boolean = false;
  @observable transactions: TransactionViewModel[] = [];
  @observable maxToShow: number = 3;
  @observable activeTab: 'completed' | 'upcoming' = 'completed';
  
  @observable regularTransactions: TransactionViewModel[] = [];
  @observable upcomingTransactions: TransactionViewModel[] = [];
  @observable upcomingGroups: TransactionGroup[] = [];
  @observable visibleRegularTransactions: TransactionViewModel[] = [];
  
  constructor() {
    super();
  }
  
  accountIdChanged() {
    if (this.accountId) {
      this.loadTransactions();
    }
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    
    if (this.accountId) {
      await this.loadTransactions();
    }
  }
  
  /**
   * Set the active tab
   */
  setActiveTab(tab: 'completed' | 'upcoming'): void {
    this.activeTab = tab;
  }
  
  /**
   * Load transactions for the current account
   */
  async loadTransactions(): Promise<void> {
    if (!this.accountId) return;
    
    this.isLoading = true;
    this.hasError = false;
    
    try {
      const transactionRepo = repositoryService.getTransactionRepository();
      const transactions = await transactionRepo.getByAccountId(this.accountId);
      
      // Process transactions into view models
      this.transactions = transactions.map(t => 
        TransactionViewModelHelper.processTransaction(t, this.accountId)
      );
      
      // Split transactions into regular and upcoming
      this.processTransactions();
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading transactions:', error);
      this.hasError = true;
      this.isLoading = false;
    }
  }
  
  /**
   * Process transactions into regular and upcoming categories
   */
  private processTransactions(): void {
    // Split transactions
    this.regularTransactions = this.transactions.filter(t => 
      !t.scheduledDate || t.completedDate
    );
    
    this.upcomingTransactions = this.transactions.filter(t => 
      t.scheduledDate && !t.completedDate
    );
    
    // Sort regular transactions by date (newest first)
    this.regularTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Update visible transactions based on maxToShow
    this.updateVisibleTransactions();
    
    // Group upcoming transactions by date
    this.upcomingGroups = this.groupUpcomingByDate(this.upcomingTransactions);
    
    // Set initial active tab based on data availability
    if (this.regularTransactions.length === 0 && this.upcomingTransactions.length > 0) {
      this.activeTab = 'upcoming';
    }
  }
  
  /**
   * Update which regular transactions are visible based on maxToShow
   */
  private updateVisibleTransactions(): void {
    this.visibleRegularTransactions = this.regularTransactions.slice(0, this.maxToShow);
  }

  /**
   * Group upcoming transactions by date
   */
  private groupUpcomingByDate(transactions: TransactionViewModel[]): TransactionGroup[] {
    const groups = new Map<string, TransactionViewModel[]>();
    
    // Sort transactions by scheduled date
    const sortedTransactions = [...transactions].sort((a, b) => {
      return new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime();
    });
    
    // Group by date
    sortedTransactions.forEach(transaction => {
      if (!transaction.scheduledDate) return;
      
      const date = new Date(transaction.scheduledDate);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      
      groups.get(dateKey)!.push(transaction);
    });
    
    // Convert map to array of groups with display dates
    return Array.from(groups.entries()).map(([dateKey, txns]) => {
      const date = new Date(dateKey);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Format the date for display
      let displayDate = '';
      
      if (dateKey === today.toISOString().split('T')[0]) {
        displayDate = 'Today';
      } else if (dateKey === tomorrow.toISOString().split('T')[0]) {
        displayDate = 'Tomorrow';
      } else {
        displayDate = date.toLocaleDateString(undefined, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric'
        });
      }
      
      return {
        date: dateKey,
        displayDate,
        transactions: txns
      };
    });
  }
  
  /**
   * Check if there are any regular transactions
   */
  get hasRegularTransactions(): boolean {
    return this.regularTransactions.length > 0;
  }
  
  /**
   * Check if there are any upcoming transactions
   */
  get hasUpcomingTransactions(): boolean {
    return this.upcomingTransactions.length > 0;
  }
  
  /**
   * Check if there are more transactions than currently shown
   */
  get hasMoreRegularTransactions(): boolean {
    return this.regularTransactions.length > this.maxToShow;
  }

  /**
   * Show all transactions
   */
  showAllTransactions(): void {
    this.maxToShow = this.regularTransactions.length;
    this.updateVisibleTransactions();
  }
}
