import { customElement, html, css, observable, attr, repeat, when } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";
import { getRepositoryService } from "../../services/repository-service";

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface TransferDetails {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
}

const template = html<TransferWorkflow>/*html*/`
  <div class="transfer-workflow">
    <div class="transfer-form">
      <div class="form-group">
        <label for="fromAccount">From Account</label>
        <select id="fromAccount" @change="${(x, c) => x.handleFromAccountChange(c.event)}">
          <option value="">-- Select Account --</option>
          ${repeat(x => x.accounts, html`
            <option value="${x => x.id}" ?selected="${(x, c) => x.id === c.parent.fromAccountId}">
              ${x => x.name} (${x => x.balance.toFixed(2)} ${x => x.currency})
            </option>
          `)}
        </select>
      </div>
      
      <div class="form-group">
        <label for="toAccount">To Account</label>
        <select id="toAccount" @change="${(x, c) => x.handleToAccountChange(c.event)}">
          <option value="">-- Select Account --</option>
          ${repeat(x => x.accounts, html`
            <option value="${x => x.id}" 
                    ?selected="${(x, c) => x.id === c.parent.toAccountId}"
                    ?disabled="${(x, c) => x.id === c.parent.fromAccountId}">
              ${x => x.name} (${x => x.balance.toFixed(2)} ${x => x.currency})
            </option>
          `)}
        </select>
      </div>
      
      <div class="form-group">
        <label for="amount">Amount</label>
        <div class="amount-input-group">
          <input type="number" id="amount" placeholder="0.00" step="0.01" min="0.01"
                 value="${x => x.amount}" 
                 @input="${(x, c) => x.handleAmountChange(c.event)}" />
          <span class="currency">${x => x.currency}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="description">Description (Optional)</label>
        <input type="text" id="description" placeholder="Enter a description" 
               value="${x => x.description}"
               @input="${(x, c) => x.handleDescriptionChange(c.event)}" />
      </div>
      
      ${when(x => x.errorMessage, html`
        <div class="error-message">${x => x.errorMessage}</div>
      `)}
    </div>
  </div>
`;

const styles = css`
  .transfer-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .transfer-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  select, input {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
  }
  
  select:focus, input:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
  }
  
  /* Only show validation styles after user interaction */
  select:user-invalid, input:user-invalid {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .amount-input-group {
    position: relative;
    display: flex;
  }
  
  .amount-input-group input {
    flex: 1;
  }
  
  .amount-input-group .currency {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #666);
    font-weight: 500;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    margin-top: 4px;
  }
  
  /* Add a transition for the error message */
  .error-message {
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
    overflow: hidden;
    margin-top: 0;
  }
  
  .error-message:not(:empty) {
    max-height: 60px;
    opacity: 1;
    margin-top: 4px;
  }
  
  /* Remove the custom buttons as they're now in the modal */
  .transfer-actions {
    display: none;
  }
`;

@customElement({
  name: "transfer-workflow",
  template,
  styles
})
export class TransferWorkflow extends WorkflowBase {
  @attr({ mode: "boolean" }) autoFocus: boolean = true;
  @observable accounts: Account[] = [];
  
  @observable fromAccountId: string = "";
  @observable toAccountId: string = "";
  @observable amount: number = 0;
  @observable currency: string = "USD";
  @observable description: string = "";
  @observable errorMessage: string | undefined = "";
  
  initialize(params?: Record<string, any>): void {
    // Set any passed in accounts
    if (params?.accounts) {
      this.accounts = params.accounts;
    }
    
    // Set initial title and footer
    this.updateTitle("Transfer Between Accounts");
    this.updateFooter(true, "Transfer Money");
    
    // Default validation state is invalid until user completes form
    this.validateForm();
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // Add HTML validation attributes to inputs
    setTimeout(() => {
      const fromSelect = this.shadowRoot?.getElementById('fromAccount') as HTMLSelectElement;
      const toSelect = this.shadowRoot?.getElementById('toAccount') as HTMLSelectElement;
      const amountInput = this.shadowRoot?.getElementById('amount') as HTMLInputElement;
      
      if (fromSelect) fromSelect.required = true;
      if (toSelect) toSelect.required = true;
      if (amountInput) {
        amountInput.required = true;
        amountInput.min = "0.01"; // Ensure positive amount
      }
      
      // Focus the first field when component is loaded
      if (this.autoFocus && fromSelect) {
        fromSelect.focus();
      }
    }, 0);
  }
  
  handleFromAccountChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.fromAccountId = select.value;
    
    // Set currency based on selected account
    if (this.fromAccountId) {
      const account = this.accounts.find(acc => acc.id === this.fromAccountId);
      if (account) {
        this.currency = account.currency;
      }
    }
    
    // If from and to are the same, clear the to field
    if (this.fromAccountId === this.toAccountId) {
      this.toAccountId = "";
    }
    
    this.validateForm();
  }
  
  handleToAccountChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.toAccountId = select.value;
    this.validateForm();
  }
  
  handleAmountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.amount = parseFloat(input.value) || 0;
    this.validateForm();
  }
  
  handleDescriptionChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.description = input.value;
  }
  
  validateForm(): boolean {
    // Clear any previous error
    this.errorMessage = "";
    
    // Check various validation rules
    if (!this.fromAccountId) {
      this.errorMessage = "Please select a source account";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('fromAccount');
      return false;
    }
    
    if (!this.toAccountId) {
      this.errorMessage = "Please select a destination account";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('toAccount');
      return false;
    }
    
    if (!this.amount || this.amount <= 0) {
      this.errorMessage = "Please enter a valid amount";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('amount');
      return false;
    }
    
    if (this.fromAccountId === this.toAccountId) {
      this.errorMessage = "Cannot transfer to the same account";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('toAccount');
      return false;
    }
    
    // Check if source account has sufficient balance
    const fromAccount = this.accounts.find(acc => acc.id === this.fromAccountId);
    if (fromAccount && fromAccount.balance < this.amount) {
      this.errorMessage = "Insufficient funds in source account";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('amount');
      return false;
    }
    
    // Reset any invalid states
    this.resetInvalidStates();
    
    // If we got here, form is valid
    console.debug("Form is valid");
    this.notifyValidation(true);
    return true;
  }
  
  /**
   * Mark a form element as invalid using HTML's validity API
   */
  private markInvalid(elementId: string): void {
    const element = this.shadowRoot?.getElementById(elementId) as HTMLInputElement | HTMLSelectElement;
    if (element) {
      // This will trigger the :user-invalid CSS selector
      element.setCustomValidity(this.errorMessage!);
      element.reportValidity();
    }
  }
  
  /**
   * Reset invalid states for all inputs
   */
  private resetInvalidStates(): void {
    ['fromAccount', 'toAccount', 'amount', 'description'].forEach(id => {
      const element = this.shadowRoot?.getElementById(id) as HTMLInputElement | HTMLSelectElement;
      if (element) {
        element.setCustomValidity('');
      }
    });
  }
  
  async executeTransfer() {
    if (!this.validateForm()) return;
    
    const transferDetails: TransferDetails = {
      fromAccountId: this.fromAccountId,
      toAccountId: this.toAccountId,
      amount: this.amount,
      currency: this.currency,
      description: this.description
    };

    // Use the improved account repository transfer method
    const accountRepo = getRepositoryService().getAccountRepository();
    
    const result = await accountRepo.transfer(
      transferDetails.fromAccountId,
      transferDetails.toAccountId,
      transferDetails.amount,
      transferDetails.description
    );
    
    if (result.success) {
      // Use the workflow base methods to complete
      this.complete(true, { 
        transfer: transferDetails,
        transactionId: result.transactionId 
      }, "Transfer completed successfully");
    } else {
      this.errorMessage = result.message;
      this.notifyValidation(false, this.errorMessage);
    }
  }
  
  cancelA() {
    this.cancel("Transfer cancelled by user");
  }
  
  // Handle primary action from modal footer
  public handlePrimaryAction(): void {
    console.debug("primary action, transfer");
    this.executeTransfer();
  }
}
