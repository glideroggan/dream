import { FASTElement, customElement, html, css, observable, repeat, when } from "@microsoft/fast-element";
import "../../components/modal-component";
import { workflowService } from "../../services/workflow-service";
import { Account, getRepositoryService } from "../../services/repository-service";
import { StorageService, storageService } from "../../services/storage-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import { ModalComponent } from "../../components/modal-component";

const template = html<AccountWidget>/*html*/ `
  <div class="account-widget">
    <div class="widget-header">
      <h3>Account Balances</h3>
      <button class="action-button" @click="${x => x.openTransferWorkflow()}" title="Transfer Money">
        <span class="action-icon">↔️</span>
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
      <div class="accounts-list">
        ${repeat(x => x.accounts, html<Account, AccountWidget>/*html*/`
          <div class="account-item">
            <div class="account-info">
              <div class="account-name">${x => x.name}</div>
              <div class="account-type">${x => x.type}</div>
              <div class="account-id">ID: ${x => x.id}</div>
            </div>
            <div class="account-balance">
              <span class="balance-amount">${x => x.balance.toFixed(2)}</span>
              <span class="balance-currency">${x => x.currency}</span>
              <button class="workflow-button" @click="${(x, c) => c.parent.openAccountActions(x)}" title="Account Actions">
                <span>•••</span>
              </button>
            </div>
          </div>
        `)}
        
        ${when(x => x.accounts.length === 0, html<AccountWidget>/*html*/`
          <div class="no-accounts">
            <p>You don't have any accounts yet.</p>
          </div>
        `)}
      </div>
      
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
  
  .accounts-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px 0;
    overflow-y: auto;
  }
  
  .account-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
    transition: background-color 0.2s;
  }
  
  .account-item:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  }
  
  .account-item:last-child {
    border-bottom: none;
  }
  
  .account-info {
    display: flex;
    flex-direction: column;
  }
  
  .account-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .account-type {
    font-size: 13px;
    color: var(--secondary-text, #666);
    margin-bottom: 2px;
  }
  
  .account-id {
    font-size: 12px;
    color: var(--secondary-text, #666);
  }
  
  .account-balance {
    display: flex;
    align-items: center;
  }
  
  .balance-amount {
    font-weight: 700;
    margin-right: 4px;
  }
  
  .balance-currency {
    color: var(--secondary-text, #666);
  }
  
  .workflow-button {
    background: transparent;
    border: none;
    width: 24px;
    height: 24px;
    cursor: pointer;
    margin-left: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .workflow-button:hover {
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
  
  .no-accounts {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--secondary-text, #666);
    font-style: italic;
  }
  
  /* Additional styles for transfer workflow */
  .temp-transfer-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .form-group label {
    font-weight: 500;
    font-size: 14px;
  }
  
  .form-group select,
  .form-group input {
    padding: 8px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
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
  
  private get modal(): ModalComponent | null {
    return this.shadowRoot?.getElementById('accountModal') as ModalComponent | null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchAccounts();
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageChange.bind(this));
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
    console.log("Modal closed");
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
    console.log("Workflow completed:", result);
    
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
}
