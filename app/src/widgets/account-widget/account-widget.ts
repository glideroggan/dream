import { customElement, html, css, observable, when, attr } from "@microsoft/fast-element";
import { repositoryService } from "../../services/repository-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import "./account-list-component";
import { TransactionListComponent, TransactionViewModel } from "./transaction-list-component";
import { workflowManager } from "../../services/workflow-manager-service";
import { Account } from "../../repositories/account-repository";
import { BaseWidget } from "../../components/base-widget";
// import { AccountInfoComponent } from "./account-info-component";

const template = html<AccountWidget>/*html*/ `
  <div class="account-widget">
    <div class="widget-action-bar">
      <button class="transfer-button" @click="${x => x.openTransferWorkflow()}" title="Transfer Money">
        Transfer
      </button>
    </div>
    
    ${when(x => x.loading, html<AccountWidget>/*html*/`
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading accounts...</p>
      </div>
    `)}
    
    ${when(x => x.error, html<AccountWidget>/*html*/`
      <div class="error-state">
        <p class="error-message">${x => x.errorMessage}</p>
        <button class="retry-button" @click="${x => x.fetchAccounts()}">Retry</button>
      </div>
    `)}
    
    ${when(x => !x.loading && !x.error, html<AccountWidget>/*html*/`
      <div class="content-area">
        <account-list
          :accounts="${x => x.accounts}"
          :expandedAccountId="${x => x.expandedAccountId}"
          :isLoadingTransactions="${x => x.isLoadingTransactions}"
          :accountTransactions="${x => x.accountTransactions}"
          :maxTransactionsToShow="${x => x.maxTransactionsToShow}"
          @account-toggle="${(x, c) => x.handleAccountToggle(c.event)}"
          @account-actions="${(x, c) => x.handleAccountActions(c.event)}">
        </account-list>
      </div>
      
      <div class="widget-footer">
        <button class="primary-button" @click="${x => x.addAccount()}">Add Account</button>
      </div>
    `)}
  </div>
`;

const styles = css`
  .account-widget {
    background: var(--widget-background, #ffffff);
    color: var(--widget-text-color, #333333);
    border-radius: inherit;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .widget-action-bar {
    padding: 12px 16px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-bottom: 1px solid var(--widget-divider-color, #eaeaea);
  }
  
  .content-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .transfer-button {
    background-color: var(--widget-primary-color, #3498db);
    color: var(--widget-primary-text, white);
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .transfer-button:hover {
    background-color: var(--widget-primary-hover, #2980b9);
  }
  
  .action-button {
    background: transparent;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .action-button:hover {
    background-color: var(--widget-secondary-hover, rgba(0, 0, 0, 0.05));
  }
  
  .widget-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--widget-divider-color, #eaeaea);
    text-align: right;
    margin-top: auto;
    flex-shrink: 0;
    background-color: var(--widget-background, #ffffff);
  }
  
  .primary-button {
    background-color: var(--widget-primary-color, #3498db);
    color: var(--widget-primary-text, white);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .primary-button:hover {
    background-color: var(--widget-primary-hover, #2980b9);
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
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
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
  
  /* Account action button styles */
  .account-action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 8px;
    margin-top: 16px;
  }
  
  .account-action-buttons .action-button {
    width: 100%;
    height: auto;
    border-radius: 4px;
    padding: 10px;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
    background-color: var(--widget-secondary-color, #f0f0f0);
    color: var(--widget-text-color, #333);
    display: block;
  }
  
  .action-button.edit {
    background-color: var(--widget-success-light, #d6eaf8);
    color: var(--widget-primary-color, #2980b9);
  }
  
  .action-button.deposit {
    background-color: var (--widget-success-light, #d5f5e3);
    color: var(--widget-success-color, #27ae60);
  }
  
  .action-button.withdraw {
    background-color: var(--widget-warning-light, #fef9e7);
    color: var(--widget-warning-color, #f39c12);
  }
  
  .action-button.delete {
    background-color: var(--widget-error-light, #fadbd8);
    color: var(--widget-error-color, #e74c3c);
  }
  
  /* Add scrolling to the account list area */
  account-list {
    flex: 1;
  }
  
  /* Improve button spacing in smaller viewports */
  @media (max-width: 400px) {
    .widget-action-bar {
      padding: 8px 12px;
    }
    
    .widget-footer {
      padding: 8px 12px;
    }
    
    .transfer-button, .primary-button {
      padding: 6px 10px;
      font-size: 13px;
    }
  }
`;

@customElement({
  name: "account-widget",
  template,
  styles
})
export class AccountWidget extends BaseWidget {
  @observable accounts: Account[] = [];
  @observable loading: boolean = true;
  @observable error: boolean = false;
  @observable errorMessage: string = '';
  
  @observable selectedAccount: Account | null = null;
  @observable showWorkflow: boolean = false;
  @observable showWorkflowActions: boolean = true;
  
  // Properties for transaction display
  @observable expandedAccountId: string | null = null;
  @observable accountTransactions: TransactionViewModel[] = [];
  @observable isLoadingTransactions: boolean = false;
  @observable maxTransactionsToShow: number = 3;

  @attr accountId: string;
  @observable transactions: TransactionViewModel[] = [];

  async connectedCallback() {
    super.connectedCallback();
    
    try {
      // First load data
      await this.fetchAccounts();
      
      if (this.accountId) {
        await this.loadTransactions();
      }

      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Use the BaseWidget method instead of directly dispatching event
      this.notifyInitialized();
    } catch (error) {
      console.error('Error initializing account widget:', error);
      // Use the BaseWidget error handling method
      this.handleError(error instanceof Error ? error : String(error));
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
  }
  
  /**
   * Handle storage changes from other tabs
   */
  handleStorageChange(event: StorageEvent) {
    // If accounts data changed, refresh
    if (event.key?.includes('accounts')) {
      this.fetchAccounts();
    }
  }
  
  /**
   * Fetch accounts from the repository service
   */
  async fetchAccounts() {
    this.loading = true;
    this.error = false;
    this.errorMessage = '';
    
    try {
      const accountRepo = repositoryService.getAccountRepository();
      
      // Fetch accounts
      const accounts = await accountRepo.getAll();
      
      // Update the accounts property
      this.accounts = accounts;
      this.loading = false;
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      this.error = true;
      this.errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load accounts. Please try again.';
      this.loading = false;
    }
  }
  
  openTransferWorkflow() {
    if (this.accounts.length === 0) {
      alert('You need at least one account to make transfers.');
      return;
    }
    
    this.selectedAccount = null;
    console.debug(`Opening transfer workflow with ${this.accounts.length} accounts:`, this.accounts);
    // Use the BaseWidget method
    this.startWorkflow(WorkflowIds.TRANSFER, { accounts: this.accounts });
  }
  
  /**
   * Handle account toggle event from child component
   */
  async handleAccountToggle(event: Event) {
    const customEvent = event as CustomEvent;
    const accountId = customEvent.detail.accountId;
    
    // If clicking the same account that's already expanded, collapse it
    if (this.expandedAccountId === accountId) {
      this.expandedAccountId = null;
      this.accountTransactions = [];
      return;
    }
    
    // Otherwise expand the clicked account
    this.expandedAccountId = accountId;
    this.fetchAccountTransactions(accountId);
  }
  
  /**
   * Handle account actions button click
   */
  async handleAccountActions(event: Event) {
    const customEvent = event as CustomEvent;
    const account = customEvent.detail.account;
    await this.openAccountActions(account);
  }
  
  /**
   * Fetch transactions for a specific account
   */
  async fetchAccountTransactions(accountId: string) {
    this.isLoadingTransactions = true;
    this.accountTransactions = [];
    
    try {
      // const repositoryService = getRepositoryService();
      const transactionRepo = repositoryService.getTransactionRepository();
      
      // Remove the artificial delay
      const transactions = await transactionRepo.getByAccountId(accountId);
      
      // Sort transactions by date (newest first)
      transactions.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      // Use the transaction list component's processTransactionsForDisplay method
      const transactionList = new TransactionListComponent();
      this.accountTransactions = transactionList.processTransactionsForDisplay(transactions, accountId);
      
      this.isLoadingTransactions = false;
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      this.isLoadingTransactions = false;
    }
  }
  
  /**
   * Handle "Show more" button click
   */
  showAllTransactions() {
    this.maxTransactionsToShow = this.accountTransactions.length;
  }
  
  async openAccountActions(account: Account): Promise<void> {
    console.log('Opening account actions for:', account);
    // this.workflowTitle = `${account.name}`;
    this.selectedAccount = account;
    this.showWorkflow = false;
    this.showWorkflowActions = false; // Hide footer with buttons - we have custom ones
    // this.openModal();
    // TODO: find the main modal
    
    // add accountInfo as our content
    // const accountInfoEl = document.createElement('account-info') as AccountInfoComponent
    // accountInfoEl.account = account;

    // await workflowManager.startInfoflow(accountInfoEl)
    console.log(`Opening account-info workflow with account`, this.selectedAccount);
    const result = await this.openWorkflow(WorkflowIds.ACCOUNT_INFO, { account: this.selectedAccount });
  }
  
  /**
   * Opens a workflow using the workflow manager
   */
  async openWorkflow(workflowId: string, params?: Record<string, any>) {
    try {
      console.log(`Starting workflow ${workflowId} with params:`, params);
      // Show workflow state
      this.showWorkflow = true;
      this.showWorkflowActions = true;
      
      // Use the workflow manager directly
      const result = await workflowManager.startWorkflow(workflowId, params);
      
      // Reset state
      this.showWorkflow = false;
      
      // Handle the result after workflow completes
      if (result.success) {
        // If workflow was successful, refresh data
        this.fetchAccounts();
        
        // Dispatch event about workflow completion
        this.dispatchEvent(new CustomEvent('workflow-complete', {
          bubbles: true,
          composed: true,
          detail: result
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Error running workflow ${workflowId}:`, error);
      this.showWorkflow = false;
      throw error;
    }
  }
  
  handleModalClose() {
    console.debug("Modal closed");
    // If the modal was closed after a potential data change, refresh accounts
    this.fetchAccounts();
  }
  
  async addAccount() {
    this.selectedAccount = null;
    // Use the BaseWidget method
    this.startWorkflow(WorkflowIds.CREATE_ACCOUNT);
  }
  
  /**
   * Handle workflow completion
   */
  handleWorkflowComplete(event: CustomEvent) {
    const result = event.detail;
    console.debug("Workflow completed:", result);
    
    // Handle transfer workflow result
    if (result.success && result.data?.transfer) {
      // Refresh accounts after transfer
      this.fetchAccounts();
    }
  }
  
  /**
   * Update an account
   */
  async updateAccount(account: Account, updates: Partial<Account>): Promise<void> {
    try {
      // const repositoryService = getRepositoryService();
      const accountRepo = repositoryService.getAccountRepository();
      
      await accountRepo.update(account.id, updates);
      this.fetchAccounts(); // Refresh accounts after update
    } catch (err) {
      console.error('Failed to update account:', err);
      alert('Failed to update account. Please try again.');
    }
  }
  
  /**
   * Delete an account
   */
  async deleteAccount(accountId: string): Promise<void> {
    try {
      // const repositoryService = getRepositoryService();
      const accountRepo = repositoryService.getAccountRepository();
      
      const success = await accountRepo.delete(accountId);
      if (success) {
        this.fetchAccounts(); // Refresh accounts after deletion
      } else {
        alert('Could not delete account.');
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please try again.');
    }
  }

  async loadTransactions() {
    if (!this.accountId) return;
    
    this.isLoading = true;
    
    try {
      const transactionRepo = repositoryService.getTransactionRepository();
      const rawTransactions = await transactionRepo.getByAccountId(this.accountId);
      
      // Sort transactions by date (newest first)
      rawTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Process transactions for display with balance information
      const transactionList = new TransactionListComponent();
      this.transactions = transactionList.processTransactionsForDisplay(rawTransactions, this.accountId);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      this.isLoading = false;
    }
  }
  
  // New methods for account actions
  editAccount() {
    if (!this.selectedAccount) return;
    
    // this.workflowTitle = `Edit ${this.selectedAccount.name}`;
    this.showWorkflow = true;
    // this.openWorkflow(WorkflowIds.EDIT_ACCOUNT, { account: this.selectedAccount });
  }
  
  handleDepositToAccount() {
    if (!this.selectedAccount) return;
    
    // this.workflowTitle = `Deposit to ${this.selectedAccount.name}`;
    this.showWorkflow = true;
    // this.openWorkflow(WorkflowIds.DEPOSIT, { account: this.selectedAccount });
  }
  
  handleWithdrawFromAccount() {
    if (!this.selectedAccount) return;
    
    // this.workflowTitle = `Withdraw from ${this.selectedAccount.name}`;
    this.showWorkflow = true;
    // this.openWorkflow(WorkflowIds.WITHDRAW, { account: this.selectedAccount });
  }
  
  confirmDeleteAccount() {
    if (!this.selectedAccount) return;
    
    // if (confirm(`Are you sure you want to delete the account "${this.selectedAccount.name}"? This action cannot be undone.`)) {
    //   this.deleteAccount(this.selectedAccount.id);
    //   if (this.modal) {
    //     this.modal.close();
    //   }
    // }
  }
}
