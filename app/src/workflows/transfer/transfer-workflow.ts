import { customElement, html, css, observable, attr, repeat, when } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";
import { repositoryService } from "../../services/repository-service";
import { PaymentContact } from "../../repositories/models/payment-contact";
import './transfer-toaccount-component';
import { paymentContactsService } from "../../services/payment-contacts-service";

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  accountNumber: string;
}

export interface TransferDetails {
  fromAccountId: string;
  toAccountId: string;
  toContactId?: string;
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
      
      <to-account-field
        :accounts="${x => x.accounts}"
        :paymentContacts="${x => x.paymentContacts}"
        :fromAccountId="${x => x.fromAccountId}"
        :toAccountId="${x => x.toAccountId}"
        required="true"
        @valueChanged="${(x, c) => x.handleToAccountValueChanged(c.event)}"
        @validationError="${(x, c) => x.handleToAccountValidationError(c.event)}"
      ></to-account-field>
      
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
  @observable paymentContacts: PaymentContact[] = [];

  @observable fromAccountId: string = "";
  @observable toAccountId: string = "";
  @observable toContactId: string | undefined = undefined;
  @observable amount: number = 0;
  @observable currency: string = "USD";
  @observable description: string = "";
  @observable errorMessage: string | undefined = "";

  async initialize(params?: Record<string, any>): Promise<void> {
    console.debug("Initializing TransferWorkflow with params:", params);
    
    this.updateTitle("Transfer Money");
    this.updateFooter(true, "Continue");
    
    // Load accounts
    await this.loadAccounts();
    
    // Load payment contacts
    await this.loadPaymentContacts();
    
    // Set default 'from' account if one wasn't provided
    if (!this.fromAccountId && this.accounts.length > 0) {
      this.fromAccountId = this.accounts[0].id;
    }
    
    // Handle any prefilled fields from params
    if (params) {
      if (params.fromAccountId) {
        this.fromAccountId = params.fromAccountId;
      }
      if (params.toAccountId) {
        this.toAccountId = params.toAccountId;
      }
      if (params.amount) {
        this.amount = params.amount;
      }
      if (params.reference) {
        // TODO: Handle reference field
        // this.reference = params.reference;
      }
    }
    
    this.notifyValidation(this.validateForm());
    
    // Listen for contact created events
    this.addEventListener('contactCreated', this.handleContactCreated.bind(this));
  }

  /**
   * Load accounts from repository if they weren't passed in
   */
  private async loadAccounts(): Promise<void> {
    try {
      const accountRepo = repositoryService.getAccountRepository();
      this.accounts = await accountRepo.getAll();
      console.debug(`Loaded ${this.accounts.length} accounts from repository`);
      this.$fastController.notify('accounts');
    } catch (error) {
      console.error("Failed to load accounts:", error);
      this.errorMessage = "Failed to load accounts. Please try again.";
    }
  }

  /**
   * Load payment contacts from settings repository
   */
  private async loadPaymentContacts(): Promise<void> {
    try {
      console.debug("Loading payment contacts...");
      
      // Force a refresh to ensure we have the latest contacts
      await paymentContactsService.refreshContacts();
      const contacts = await paymentContactsService.getAllContacts();
      
      this.paymentContacts = contacts;
      console.debug(`Loaded ${contacts.length} payment contacts`);
    } catch (error) {
      console.error("Failed to load payment contacts:", error);
      this.paymentContacts = [];
    }
  }

  connectedCallback() {
    super.connectedCallback();

    // Add HTML validation attributes to inputs
    setTimeout(() => {
      const fromSelect = this.shadowRoot?.getElementById('fromAccount') as HTMLSelectElement;
      const amountInput = this.shadowRoot?.getElementById('amount') as HTMLInputElement;

      if (fromSelect) fromSelect.required = true;
      if (amountInput) {
        amountInput.required = true;
        amountInput.min = "0.01"; // Ensure positive amount
      }
    }, 0);
    
    // Add event listener for new contact creation
    this.addEventListener('contactCreated', this.handleContactCreated.bind(this));
  }
  
  /**
   * Override focusFirstElement to specifically focus the fromAccount dropdown
   */
  public focusFirstElement(): void {
    console.log('[transfer-workflow] focusFirstElement called');
    
    // Try to focus the fromAccount dropdown
    setTimeout(() => {
      const fromSelect = this.shadowRoot?.getElementById('fromAccount') as HTMLSelectElement;
      if (fromSelect) {
        console.log('[transfer-workflow] focusing fromAccount select');
        fromSelect.focus();
      } else {
        // Fall back to base class behavior
        console.log('[transfer-workflow] fromAccount not found, using default focus behavior');
        super.focusFirstElement();
      }
    }, 50);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up event listener
    this.removeEventListener('contactCreated', this.handleContactCreated.bind(this));
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

  handleToAccountValueChanged(event: Event) {
    const customEvent = event as CustomEvent;
    const { value } = customEvent.detail;
    this.toAccountId = value;
    
    // Check if this is a payment contact
    if (this.toAccountId && this.toAccountId.startsWith('contact:')) {
      const contactId = this.toAccountId.substring(8); // Remove 'contact:' prefix
      this.toContactId = contactId;
      
      // Update last used timestamp for the selected contact
      // this.updateContactLastUsed(contactId);
      repositoryService.getSettingsRepository().updateContactLastUsed(contactId);
    } else {
      this.toContactId = undefined;
    }
    
    this.validateForm();
  }
  
  /**
   * Handle validation errors from the to account component
   */
  handleToAccountValidationError(event: Event) {
    const customEvent = event as CustomEvent;
    const { error } = customEvent.detail;
    this.errorMessage = error;
    this.notifyValidation(false, error);
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
      this.errorMessage = "Please select a destination account or contact";
      this.notifyValidation(false, this.errorMessage);
      // No need to mark invalid, the component handles its own validation
      return false;
    }

    if (!this.amount || this.amount <= 0) {
      this.errorMessage = "Please enter a valid amount";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('amount');
      return false;
    }

    // Only check for same account if we're transferring between our own accounts
    if (!this.toAccountId.startsWith('contact:') && this.fromAccountId === this.toAccountId) {
      this.errorMessage = "Cannot transfer to the same account";
      this.notifyValidation(false, this.errorMessage);
      // Component handles its own validation display
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
      toContactId: this.toContactId,
      amount: this.amount,
      currency: this.currency,
      description: this.description
    };

    // Determine if this is an external transfer (to a contact) or internal transfer
    if (this.toContactId) {
      // This is an external transfer to a contact
      const accountRepo = repositoryService.getAccountRepository();

      const result = await accountRepo.externalTransfer({
        fromAccountId: transferDetails.fromAccountId,
        toContactId: this.toContactId!,
        amount: transferDetails.amount,
        description: transferDetails.description
      });

      if (result.success) {
          this.complete(true, {
          transfer: transferDetails,
          transactionId: result.transactionId
        }, "External transfer initiated successfully");
      } else {
        this.errorMessage = result.message;
        this.notifyValidation(false, this.errorMessage);
      }
    } else {
      // This is an internal transfer between accounts
      const accountRepo = repositoryService.getAccountRepository();

      const result = await accountRepo.transfer(
        transferDetails.fromAccountId,
        transferDetails.toAccountId,
        transferDetails.amount,
        transferDetails.description
      );

      if (result.success) {
        this.complete(true, {
          transfer: transferDetails,
          transactionId: result.transactionId
        }, "Transfer completed successfully");
      } else {
        this.errorMessage = result.message;
        this.notifyValidation(false, this.errorMessage);
      }
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
  
  /**
   * Handle contact created event from the to-account field
   */
  private async handleContactCreated(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const newContact = customEvent.detail.contact;
    
    if (!newContact) return;
    
    try {
      // Refresh contacts by fetching them again from the service
      const allContacts = await paymentContactsService.getAllContacts();
      this.paymentContacts = allContacts;
      
      // Set the newly created contact as the selected to-account
      setTimeout(() => {
        this.toAccountId = `contact:${newContact.id}`;
      }, 100);
    } catch (error) {
      console.error("Error handling new contact:", error);
    }
  }
}
