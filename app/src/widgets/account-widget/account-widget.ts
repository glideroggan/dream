import { FASTElement, customElement, html, css, observable, when, attr } from "@microsoft/fast-element";
import "../../components/modal-component";
import { workflowService } from "../../services/workflow-service";
import { Account, Transaction, TransactionType, getRepositoryService } from "../../services/repository-service";
import { StorageService, storageService } from "../../services/storage-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import { ModalComponent } from "../../components/modal-component";
import "./account-list-component";
import "./transaction-list-component";
import { TransactionListComponent, TransactionViewModel } from "./transaction-list-component";

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
    
    <!-- Use the reusable modal component -->
    <dream-modal 
      id="accountModal"
      title="${x => x.workflowTitle}" 
      @close="${x => x.handleModalClose()}">
      <!-- Empty modal content for now, will be replaced with workflow components -->
    </dream-modal>
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
  
  @observable workflowTitle: string = "Account Actions";
  @observable selectedAccount: Account | null = null;
  
  // Properties for transaction display
  @observable expandedAccountId: string | null = null;
  @observable accountTransactions: TransactionViewModel[] = [];
  @observable isLoadingTransactions: boolean = false;
  @observable maxTransactionsToShow: number = 3;

  @attr accountId: string;
  @observable transactions: TransactionViewModel[] = [];
  @observable isLoading: boolean = false;
  
  private get modal(): ModalComponent | null {
    return this.shadowRoot?.getElementById('accountModal') as ModalComponent | null;
  }

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
      const repositoryService = getRepositoryService();
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
    
    this.workflowTitle = "Transfer Money";
    this.selectedAccount = null;
    this.openWorkflow("transfer", { accounts: this.accounts });
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
  handleAccountActions(event: Event) {
    const customEvent = event as CustomEvent;
    const account = customEvent.detail.account;
    this.openAccountActions(account);
  }
  
  /**
   * Fetch transactions for a specific account
   */
  async fetchAccountTransactions(accountId: string) {
    this.isLoadingTransactions = true;
    this.accountTransactions = [];
    
    try {
      const repositoryService = getRepositoryService();
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
  
  openAccountActions(account: Account) {
    this.workflowTitle = `${account.name} Actions`;
    this.selectedAccount = account;
    this.openModal();
  }
  
  async openWorkflow(workflowId: string, params?: Record<string, any>) {
    if (this.modal) {
      // First open the modal
      this.modal.open();
      
      // Then load the workflow
      const success = await this.modal.loadWorkflow(workflowId, params);
      if (!success) {
        console.error(`Failed to load workflow: ${workflowId}`);
      }
    }
  }
  
  openModal() {
    // Use the modal component's API
    if (this.modal) {
      this.modal.open();
    }
  }
  
  handleModalClose() {
    console.debug("Modal closed");
    // If the modal was closed after a potential data change, refresh accounts
    this.fetchAccounts();
  }
  
  async addAccount() {
    this.workflowTitle = "Create New Account";
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
      const repositoryService = getRepositoryService();
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
      const repositoryService = getRepositoryService();
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
      const transactionRepo = getRepositoryService().getTransactionRepository();
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
}
