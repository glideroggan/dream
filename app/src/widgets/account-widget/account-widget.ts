import { customElement, html, css, observable } from "@microsoft/fast-element";
import { repositoryService } from "../../services/repository-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import "./account-list-component";
import "./transaction-list-component";
import { workflowManager } from "../../services/workflow-manager-service";
import { Account } from "../../repositories/account-repository";
import { BaseWidget } from "../../components/base-widget";

const template = html<AccountWidget>/*html*/ `
  <div class="account-widget">
    <div class="widget-action-bar">
      <button class="transfer-button" @click="${x => x.openTransferWorkflow()}" title="Transfer Money">
        Transfer
      </button>
    </div>
    
    <div class="content-area">
      <account-list
        @account-toggle="${(x, c) => x.handleAccountToggle(c.event)}"
        @account-actions="${(x, c) => x.handleAccountActions(c.event)}"
        @ready="${x => x.handleAccountListReady()}">
      </account-list>
    </div>
    
    <div class="widget-footer">
      <button class="primary-button" @click="${x => x.addAccount()}">Add Account</button>
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
  @observable selectedAccount: Account | null = null;
  
  async connectedCallback() {
    super.connectedCallback();
    
    try {
      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Instead of loading data here, we'll let the account-list component handle it
      
      // Still notify that we've initialized
      this.notifyInitialized();
    } catch (error) {
      console.error('Error initializing account widget:', error);
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
    // Only refresh if account data changed
    if (event.key?.includes('accounts')) {
      // Let the account list handle refreshing itself
      const accountList = this.shadowRoot?.querySelector('account-list');
      if (accountList) {
        (accountList as any).loadData();
      }
    }
  }
  
  /**
   * Handle when the account list component is ready
   */
  handleAccountListReady() {
    // Any initialization we need to do after account list is ready
    console.debug('Account list component is ready');
  }
  
  /**
   * Open transfer workflow
   */
  openTransferWorkflow() {
    // Get accounts from the repository service directly
    const accountRepo = repositoryService.getAccountRepository();
    
    accountRepo.getAll().then(accounts => {
      if (accounts.length === 0) {
        alert('You need at least one account to make transfers.');
        return;
      }
      
      this.selectedAccount = null;
      this.startWorkflow(WorkflowIds.TRANSFER, { accounts });
    });
  }
  
  /**
   * Handle account toggle event from child component
   */
  handleAccountToggle(event: Event) {
    const customEvent = event as CustomEvent;
    console.debug('Account toggled:', customEvent.detail);
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
   * Open account actions dialog
   */
  async openAccountActions(account: Account): Promise<void> {
    console.log('Opening account actions for:', account);
    this.selectedAccount = account;
    
    const result = await this.openWorkflow(WorkflowIds.ACCOUNT_INFO, { account: this.selectedAccount });
    
    // After workflow completes, refresh the account list data
    const accountList = this.shadowRoot?.querySelector('account-list');
    if (accountList && result?.success) {
      (accountList as any).loadData();
    }
  }
  
  /**
   * Opens a workflow using the workflow manager
   */
  async openWorkflow(workflowId: string, params?: Record<string, any>) {
    try {
      console.log(`Starting workflow ${workflowId} with params:`, params);
      
      // Use the workflow manager directly
      const result = await workflowManager.startWorkflow(workflowId, params);
      
      // Handle the result after workflow completes
      if (result.success) {
        // If workflow was successful, refresh data
        const accountList = this.shadowRoot?.querySelector('account-list');
        if (accountList) {
          (accountList as any).loadData();
        }
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
    const accountList = this.shadowRoot?.querySelector('account-list');
    if (accountList) {
      (accountList as any).loadData();
    }
  }
  
  async addAccount() {
    this.selectedAccount = null;
    // Use the BaseWidget method
    this.startWorkflow(WorkflowIds.CREATE_ACCOUNT);
  }
}
