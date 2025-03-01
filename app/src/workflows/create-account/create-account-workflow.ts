import { customElement, html, css, observable, attr, repeat } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";
import { getRepositoryService } from "../../services/repository-service";

// Define account types
export interface AccountType {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
}

const template = html<CreateAccountWorkflow>/*html*/`
  <div class="create-account-workflow">
    <div class="account-types">
      ${repeat(x => x.accountTypes, html<AccountType, CreateAccountWorkflow>`
        <div class="account-type-card ${(_, c) => c.index === c.parent.selectedTypeIndex ? 'selected' : ''}" 
             @click="${(_, c) => c.parent.selectAccountType(c.index)}">
          <div class="account-type-icon">${x => x.iconEmoji}</div>
          <div class="account-type-details">
            <h3>${x => x.name}</h3>
            <p>${x => x.description}</p>
          </div>
          <div class="account-type-indicator"></div>
        </div>
      `)}
    </div>
    
    <div class="account-form ${x => x.selectedTypeIndex === -1 ? 'hidden' : ''}">
      <div class="form-group">
        <label for="accountName">Account Name</label>
        <input type="text" id="accountName" 
               placeholder="Enter a name for your account" 
               value="${x => x.accountName}"
               @input="${(x, c) => x.handleNameChange(c.event)}"/>
      </div>
      
      <div class="form-group">
        <label for="currency">Currency</label>
        <select id="currency" 
                @change="${(x, c) => x.handleCurrencyChange(c.event)}">
          <option value="SEK" selected>Swedish Krona (SEK)</option>
          <option value="USD">US Dollar (USD)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="GBP">British Pound (GBP)</option>
        </select>
      </div>
      
      ${x => x.errorMessage ? html`
        <div class="error-message">${x => x.errorMessage}</div>
      ` : ''}
    </div>
  </div>
`;

const styles = css`
  .create-account-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .account-types {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .account-type-card {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .account-type-card:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  }
  
  .account-type-card.selected {
    border-color: var(--primary-color, #3498db);
    background-color: var(--primary-bg-light, rgba(52, 152, 219, 0.05));
  }
  
  .account-type-icon {
    font-size: 24px;
    margin-right: 16px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-color, #f8f8f8);
    border-radius: 50%;
  }
  
  .account-type-details {
    flex: 1;
  }
  
  .account-type-details h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
  }
  
  .account-type-details p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  .account-type-indicator {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 50%;
    margin-left: 12px;
    transition: all 0.2s ease;
  }
  
  .account-type-card.selected .account-type-indicator {
    background-color: var(--primary-color, #3498db);
    border-color: var(--primary-color, #3498db);
  }
  
  .account-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: opacity 0.3s ease;
  }
  
  .account-form.hidden {
    opacity: 0.5;
    pointer-events: none;
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
  
  select:user-invalid, input:user-invalid {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    padding: 8px 12px;
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
    border-radius: 4px;
    border-left: 4px solid var(--error-color, #e74c3c);
  }
`;

@customElement({
  name: "create-account-workflow",
  template,
  styles
})
export class CreateAccountWorkflow extends WorkflowBase {
  @attr({ mode: "boolean" }) autoFocus: boolean = true;
  
  @observable accountTypes: AccountType[] = [
    {
      id: "isk",
      name: "ISK Account",
      description: "Investment Savings Account with tax benefits",
      iconEmoji: "📈"
    },
    {
      id: "savings",
      name: "Savings Account",
      description: "Regular savings account with interest",
      iconEmoji: "💰"
    },
    {
      id: "pension",
      name: "Pension Account",
      description: "Long-term retirement savings",
      iconEmoji: "🏖️"
    }
  ];
  
  @observable selectedTypeIndex: number = -1;
  @observable accountName: string = "";
  @observable currency: string = "SEK";
  @observable errorMessage: string = "";
  
  initialize(params?: Record<string, any>): void {
    // Set initial title and footer
    this.updateTitle("Create New Account");
    this.updateFooter(true, "Create Account");
    
    // Initial validation state is invalid until user selects account type
    this.notifyValidation(false);
    
    // Pre-select account type if specified in params
    if (params?.accountType && typeof params.accountType === 'string') {
      const typeIndex = this.accountTypes.findIndex(t => t.id === params.accountType);
      if (typeIndex >= 0) {
        this.selectedTypeIndex = typeIndex;
        this.validateForm();
      }
    }
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // Add HTML validation attributes
    setTimeout(() => {
      const nameInput = this.shadowRoot?.getElementById('accountName') as HTMLInputElement;
      
      if (nameInput) {
        nameInput.required = true;
        nameInput.minLength = 3;
        nameInput.maxLength = 30;
      }
    }, 0);
  }
  
  selectAccountType(index: number) {
    this.selectedTypeIndex = index;
    
    // Generate a default name based on the account type
    if (!this.accountName) {
      const type = this.accountTypes[index];
      this.accountName = `My ${type.name.replace(' Account', '')}`;
    }
    
    this.validateForm();
  }
  
  handleNameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.accountName = input.value;
    this.validateForm();
  }
  
  handleCurrencyChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.currency = select.value;
  }
  
  validateForm(): boolean {
    this.errorMessage = "";
    
    // Check if an account type is selected
    if (this.selectedTypeIndex === -1) {
      this.errorMessage = "Please select an account type";
      this.notifyValidation(false, this.errorMessage);
      return false;
    }
    
    // Check if account name is provided
    if (!this.accountName || this.accountName.trim().length < 3) {
      this.errorMessage = "Please enter an account name (minimum 3 characters)";
      this.notifyValidation(false, this.errorMessage);
      this.markInvalid('accountName');
      return false;
    }
    
    // Reset invalid states
    this.resetInvalidStates();
    
    // If we got here, form is valid
    this.notifyValidation(true);
    return true;
  }
  
  private markInvalid(elementId: string): void {
    const element = this.shadowRoot?.getElementById(elementId) as HTMLInputElement | HTMLSelectElement;
    if (element) {
      element.setCustomValidity(this.errorMessage);
      element.reportValidity();
    }
  }
  
  private resetInvalidStates(): void {
    ['accountName', 'currency'].forEach(id => {
      const element = this.shadowRoot?.getElementById(id) as HTMLInputElement | HTMLSelectElement;
      if (element) {
        element.setCustomValidity('');
      }
    });
  }
  
  async createAccount() {
    if (!this.validateForm()) return;
    
    try {
      const repositoryService = getRepositoryService();
      const accountRepo = repositoryService.getAccountRepository();
      
      const selectedType = this.accountTypes[this.selectedTypeIndex];
      
      // Create the account (with zero balance by default)
      const newAccount = await accountRepo.create({
        name: this.accountName.trim(),
        balance: 0,
        currency: this.currency,
        type: selectedType.id
      });
      
      // Complete the workflow with success
      this.complete(true, { 
        account: newAccount, 
        created: true 
      }, `${selectedType.name} created successfully`);
      
    } catch (error) {
      console.error('Failed to create account:', error);
      this.errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create account. Please try again.';
    }
  }
  
  // Handle primary action from modal footer
  public handlePrimaryAction(): void {
    this.createAccount();
  }
}
