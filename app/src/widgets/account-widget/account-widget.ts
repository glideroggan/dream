import { FASTElement, customElement, html, css, observable, repeat } from "@microsoft/fast-element";
import "../../components/modal-component";
import { workflowService } from "../../services/workflow-service";
import { Account } from "../../workflows/transfer/transfer-workflow";

const template = html<AccountWidget>/*html*/ `
  <div class="account-widget">
    <div class="widget-header">
      <h3>Account Balances</h3>
      <button class="action-button" @click="${x => x.openTransferWorkflow()}" title="Transfer Money">
        <span class="action-icon">↔️</span>
      </button>
    </div>
    
    <div class="accounts-list">
      ${repeat(x => x.accounts, html<Account, AccountWidget>/*html*/`
        <div class="account-item">
          <div class="account-info">
            <div class="account-name">${x => x.name}</div>
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
    </div>
    
    <div class="widget-footer">
      <button class="primary-button" @click="${x => x.addAccount()}">Add Account</button>
    </div>
    
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
  
  .workflow-placeholder {
    padding: 20px;
    text-align: center;
    color: #666;
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
  @observable accounts: Account[] = [
    { id: "acc1", name: "Checking Account", balance: 2543.67, currency: "USD" },
    { id: "acc2", name: "Savings Account", balance: 12750.42, currency: "USD" },
    { id: "acc3", name: "Investment Account", balance: 35621.19, currency: "USD" }
  ];
  
  @observable workflowTitle: string = "Account Actions";
  @observable selectedAccount: Account | null = null;
  
  private get modal(): any {
    return this.shadowRoot?.getElementById('accountModal');
  }

  connectedCallback() {
    super.connectedCallback();
    // this.registerWorkflows();
  }
  
  openTransferWorkflow() {
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
  }
  
  addAccount() {
    this.workflowTitle = "Add New Account";
    this.selectedAccount = null;
    this.openModal();
  }
  
  /**
   * Handle workflow completion
   */
  handleWorkflowComplete(event: CustomEvent) {
    const result = event.detail;
    console.log("Workflow completed:", result);
    
    // Handle transfer workflow result
    if (result.success && result.data?.transfer) {
      const transfer = result.data.transfer;
      console.log(`Transfer completed: ${transfer.amount} ${transfer.currency} from ${transfer.fromAccountId} to ${transfer.toAccountId}`);
      
      // Update account balances
      this.updateAccountBalances(
        transfer.fromAccountId,
        transfer.toAccountId,
        transfer.amount
      );
    }
  }
  
  /**
   * Update account balances after a transfer
   */
  private updateAccountBalances(fromId: string, toId: string, amount: number): void {
    // Create a new array to trigger change detection
    const updatedAccounts = this.accounts.map(account => {
      if (account.id === fromId) {
        return { ...account, balance: account.balance - amount };
      } else if (account.id === toId) {
        return { ...account, balance: account.balance + amount };
      }
      return account;
    });
    
    this.accounts = updatedAccounts;
  }
}
