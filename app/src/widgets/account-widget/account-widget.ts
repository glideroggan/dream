import { FASTElement, customElement, html, css, observable, when, attr } from "@microsoft/fast-element";
import { repositoryService } from "../../services/repository-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import { ModalComponent } from "../../components/modal-component";
import "./account-list-component";
import "./account-info-component";
import { TransactionListComponent, TransactionViewModel } from "./transaction-list-component";
import { workflowManager } from "../../services/workflow-manager-service";
import { Account } from "../../repositories/account-repository";
// import { AccountInfoComponent } from "./account-info-component";

const template = html<AccountWidget>/*html*/ `
  <div class="account-widget">
    <div class="widget-header">
      <h3>Account Balances</h3>
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
      <account-list
        :accounts="${x => x.accounts}"
        :expandedAccountId="${x => x.expandedAccountId}"
        :isLoadingTransactions="${x => x.isLoadingTransactions}"
        :accountTransactions="${x => x.accountTransactions}"
        :maxTransactionsToShow="${x => x.maxTransactionsToShow}"
        @account-toggle="${(x, c) => x.handleAccountToggle(c.event)}"
        @account-actions="${(x, c) => x.handleAccountActions(c.event)}"
        @show-more-transactions="${x => x.showAllTransactions()}">
      </account-list>
      
      <div class="widget-footer">
        <button class="primary-button" @click="${x => x.addAccount()}">Add Account</button>
      </div>
    `)}
  </div>
`;

const styles = css`
  .account-widget {
    background: var(--background-color, #ffffff);
    color: var(--text-color, #333333);
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .widget-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
  }
  
  .transfer-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .transfer-button:hover {
    background-color: var(--primary-color-hover, #2980b9);
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
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .widget-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--divider-color, #eaeaea);
    text-align: right;
  }
  
  .primary-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .primary-button:hover {
    background-color: var(--primary-color-hover, #2980b9);
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
    border-top-color: var(--primary-color, #3498db);
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
    color: var(--error-color, #e74c3c);
    text-align: center;
    margin-bottom: 16px;
  }
  
  .retry-button {
    background-color: var(--error-color, #e74c3c);
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
    background-color: var(--button-bg, #f0f0f0);
    color: var(--text-primary, #333);
    display: block;
  }
  
  .action-button.edit {
    background-color: var(--primary-light, #d6eaf8);
    color: var(--primary-color, #2980b9);
  }
  
  .action-button.deposit {
    background-color: var(--success-light, #d5f5e3);
    color: var(--success-color, #27ae60);
  }
  
  .action-button.withdraw {
    background-color: var(--warning-light, #fef9e7);
    color: var(--warning-color, #f39c12);
  }
  
  .action-button.delete {
    background-color: var(--error-light, #fadbd8);
    color: var(--error-color, #e74c3c);
  }
`;

@customElement({
  name: "account-widget",
  template,
  styles
})
export class AccountWidget extends FASTElement {
  @observable accounts: Account[] = [];
  @observable loading: boolean = true;
  @observable error: boolean = false;
  @observable errorMessage: string = '';
  
  // @observable workflowTitle: string = "Account Actions";
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
  @observable isLoading: boolean = false;
  
  // private get modal(): ModalComponent | null {
  //   return this.shadowRoot?.getElementById('accountModal') as ModalComponent | null;
  // }

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
      
      // Signal that the widget is initialized
      this.dispatchEvent(new CustomEvent('initialized', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error initializing account widget:', error);
      // Re-throw to let error handling work
      throw error;
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
      // Get the repository service
      // const repositoryService = repositoryService;
      const accountRepo = repositoryService.getAccountRepository();
      
      // Fetch accounts with a slight delay to show loading state
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
    
    // this.workflowTitle = "Transfer Money";
    this.selectedAccount = null;
    console.debug(`Opening transfer workflow with ${this.accounts.length} accounts:`, this.accounts);
    this.openWorkflow(WorkflowIds.TRANSFER, { accounts: this.accounts });
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
        
        // TODO: workflow-complete
        // Dispatch event about workflow completion
        this.dispatchEvent(new CustomEvent('workflow-complete', {
          bubbles: true,
          composed: true,
          detail: result
        }));
      }
    } catch (error) {
      console.error(`Error running workflow ${workflowId}:`, error);
      this.showWorkflow = false;
    }
  }
  
  
  handleModalClose() {
    console.debug("Modal closed");
    // If the modal was closed after a potential data change, refresh accounts
    this.fetchAccounts();
  }
  
  async addAccount() {
    // this.workflowTitle = "Create New Account";
    this.selectedAccount = null;
    
    // Use the create account workflow instead of directly creating an account
    this.openWorkflow(WorkflowIds.CREATE_ACCOUNT);
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
