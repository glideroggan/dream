import { customElement, html, css, observable, when } from "@microsoft/fast-element";
import "@primitives/button/button.js";
import { repositoryService } from "../../services/repository-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import "./account-lister/account-list-component";
import "./transaction-list-component";
import { workflowManager } from "../../services/workflow-manager-service";
import { BaseWidget } from "../../components/base-widget";
import { Account } from "../../repositories/models/account-models";

const template = html<AccountWidget>/*html*/ `
  <div class="account-widget">
    <div class="widget-action-bar">
      ${when(x => x.accountsLoaded && x.accounts.length > 0, html<AccountWidget>/*html*/`
      <dream-button variant="primary" size="sm" 
        @click="${x => x.openTransferWorkflow()}" 
        title="Transfer Money"
        ?disabled="${x => x.accountsLoaded && x.accounts.length === 0}">
        Transfer
      </dream-button>
      `)}
    </div>
    
    <div class="content-area">
      ${when(x => x.isLoading, html<AccountWidget>/*html*/`
        <div class="loading-state">
          <div class="spinner"></div>
          <div>Loading accounts...</div>
        </div>
      `)}
      
      ${when(x => !x.isLoading && x.accountsLoaded && x.accounts.length === 0, html<AccountWidget>/*html*/`
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h3>No Accounts Yet</h3>
          <p>You don't have any accounts set up. Create your first account to get started.</p>
          <dream-button variant="primary" @click="${x => x.addAccount()}">Create Your First Account</dream-button>
          
          <div class="quick-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">Click the button to create your first account</div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">Choose the account type that suits your needs</div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">Start managing your finances with ease</div>
            </div>
          </div>
        </div>
      `)}
      
      ${when(x => !x.isLoading && !(x.accountsLoaded && x.accounts.length === 0), html<AccountWidget>/*html*/`
        <account-list
          @account-actions="${(x, c) => x.handleAccountActions(c.event)}"
          @ready="${x => x.handleAccountListReady()}">
        </account-list>
      `)}
    </div>
    
    <div class="widget-footer">
      <dream-button variant="primary" @click="${x => x.addAccount()}">
        ${x => x.accounts.length === 0 ? 'Create First Account' : 'Add Account'}
      </dream-button>
    </div>
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
    padding: 6px 16px;
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
  }
  
  /* Empty state styling */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    text-align: center;
    flex: 1;
    color: var(--widget-text-secondary, #777777);
  }
  
  .empty-state-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 16px;
    opacity: 0.7;
  }
  
  .empty-state-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .empty-state h3 {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 8px;
    color: var(--widget-text-color, #333333);
  }
  
  .empty-state p {
    margin: 0 0 24px;
    line-height: 1.5;
    font-size: 14px;
  }
  
  /* Step styling */
  .quick-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 300px;
    margin-top: 16px;
    text-align: left;
  }
  
  .step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: var(--widget-primary-color, #3498db);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
  }
  
  .step-content {
    font-size: 14px;
  }
`;

@customElement({
  name: "account-widget",
  template,
  styles
})
export class AccountWidget extends BaseWidget {
  @observable selectedAccount: Account | null = null;
  @observable accounts: Account[] = [];
  @observable accountsLoaded: boolean = false;
  @observable isLoading: boolean = false;
  
  // Store unsubscribe function
  private unsubscribe?: () => void;

  
  async connectedCallback() {
    super.connectedCallback();
    
    try {
      this.isLoading = true;
      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Load accounts data
      await this.loadAccounts();

      // Subscribe to account repository changes
      const accountRepo = repositoryService.getAccountRepository();
      this.unsubscribe = accountRepo.subscribe((event) => {
        // Update accounts when repository changes
        console.debug('Account repository event:', event.type, event.entity || event.entityId);
        this.loadAccounts();
      });
      
      // Notify that we've initialized
      this.notifyInitialized();
    } catch (error) {
      console.error('Error initializing account widget:', error);
      this.handleError(error instanceof Error ? error : String(error));
    } finally {
      this.isLoading = false;
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
  
  /**
   * Load accounts data
   * After loading accounts data, notify about potential content changes
   */
  async loadAccounts() {
    const accountRepo = repositoryService.getAccountRepository();
    this.accounts = await accountRepo.getAll();
    this.accountsLoaded = true;
    console.debug('Loaded accounts:', this.accounts.length);
    
    // Notify base widget that content may have changed
    setTimeout(() => this.notifyContentChanged(), 50);
  }
  
  /**
   * Handle storage changes from other tabs
   */
  handleStorageChange(event: StorageEvent) {
    // Only refresh if account data changed
    if (event.key?.includes('accounts')) {
      this.loadAccounts();
    }
  }
  
  /**
   * Handle when the account list component is ready
   */
  handleAccountListReady() {
    // We'll use this event to update our accounts array
    const accountList = this.shadowRoot?.querySelector('account-list');
    if (accountList) {
      // Get accounts from the component
      this.accounts = (accountList as any).accounts || [];
    }
    console.debug('Account list component is ready');
  }
  
  /**
   * Open transfer workflow
   */
  openTransferWorkflow() {
    if (this.accounts.length === 0) {
      alert('You need at least one account to make transfers.');
      return;
    }
    
    this.selectedAccount = null;
    this.startWorkflow(WorkflowIds.TRANSFER, { accounts: this.accounts });
  }
  
  // /**
  //  * Handle account toggle event from child component
  //  * Enhanced to notify base widget of content changes
  //  */
  // handleAccountToggle(event: Event) {
  //   const customEvent = event as CustomEvent;
  //   console.debug('Account toggled:', customEvent.detail);
    
  //   // Use the new helper method to trigger size recalculation
  //   // setTimeout(() => this.notifyContentChanged(), 50);
  // }
  
  /**
   * Handle account actions button click
   */
  async handleAccountActions(event: Event) {
    const customEvent = event as CustomEvent;
    const account = customEvent.detail.account;
    await this.openAccountActions(account);
  }
  
  /**
   * Open account actions dialog
   */
  async openAccountActions(account: Account): Promise<void> {
    console.debug('Opening account actions for:', account);
    this.selectedAccount = account;
    
    const result = await this.openWorkflow(WorkflowIds.ACCOUNT_INFO, { account: this.selectedAccount });
    
    // After workflow completes, refresh the account list data
    if (result?.success) {
      await this.loadAccounts();
    }
  }
  
  /**
   * Opens a workflow using the workflow manager
   */
  async openWorkflow(workflowId: string, params?: Record<string, any>) {
    try {
      console.debug(`Starting workflow ${workflowId} with params:`, params);
      
      // Use the workflow manager directly
      const result = await workflowManager.startWorkflow(workflowId, params);
      
      // Handle the result after workflow completes
      if (result.success) {
        // If workflow was successful, refresh data
        await this.loadAccounts();
      }
      
      return result;
    } catch (error) {
      console.error(`Error running workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  handleModalClose() {
    console.debug("Modal closed");
    // If the modal was closed after a potential data change, refresh accounts
    this.loadAccounts();
  }
  
  /**
   * Open the account creation workflow
   */
  async addAccount() {
    this.selectedAccount = null;
    
    try {
      // Use the direct workflow manager to get the result
      const result = await workflowManager.startWorkflow(WorkflowIds.CREATE_ACCOUNT);
      console.debug('Account creation workflow completed:', result);
      
      // The account changes will be picked up by the subscription we set up in connectedCallback
    } catch (error) {
      console.error('Error starting account creation workflow:', error);
    }
  }
}
