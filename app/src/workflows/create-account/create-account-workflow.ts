import { customElement, html, css, observable, attr, repeat } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "../workflow-base";
import { kycService, KycLevel } from "../../services/kyc-service";
import { repositoryService } from "../../services/repository-service";

// Define account types
export interface AccountType {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  requiresKyc?: boolean;
  kycLevel?: KycLevel;
  kycRequirementId?: string;
}

const template = html<CreateAccountWorkflow>/*html*/`
  <div class="create-account-workflow">
    <div class="account-types">
      ${repeat(x => x.accountTypes, html<AccountType, CreateAccountWorkflow>/*html*/`
        <div class="account-type-card ${(x, c) => c.parent.selectedTypeId == x.id ? 'selected' : ''}" 
             @click="${(x, c) => c.parent.selectAccountType(x.id)}">
          <div class="account-type-icon">${x => x.iconEmoji}</div>
          <div class="account-type-details">
            <h3>${x => x.name}</h3>
            <p>${x => x.description}</p>
            ${(x, c) => x.requiresKyc ? html`
              <div class="kyc-badge" title="Requires identity verification">
                🪪 Verification required
              </div>
            ` : ''}
          </div>
          <div class="account-type-indicator"></div>
        </div>
      `)}
    </div>
    
    <div class="account-form ${x => x.selectedTypeId == '' ? 'hidden' : ''}">
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
      
      ${x => {
        const selectedType = x.accountTypes.find(t => t.id === x.selectedTypeId);
        if (selectedType?.requiresKyc && 
            selectedType.kycRequirementId && 
            !kycService.meetsKycRequirements(selectedType.kycRequirementId) &&
            !x.kycCompleted) {
          return html`
            <div class="kyc-required-notice">
              <div class="kyc-icon">🪪</div>
              <div class="kyc-message">
                <h4>Identity Verification Required</h4>
                <p>To open this account type, you need to verify your identity first.</p>
                <button class="verify-button" @click="${x => x.initiateKycWorkflow()}">
                  Start Verification Process
                </button>
              </div>
            </div>
          `;
        }
        return '';
      }}
      
      ${x => x.errorMessage ? html`
        <div class="error-message">${x => x.errorMessage}</div>
      ` : ''}
    </div>
    
    ${x => x.isCreatingAccount ? html`
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Creating your account...</p>
      </div>
    ` : ''}
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

  .kyc-badge {
    display: inline-flex;
    align-items: center;
    background-color: var(--warning-bg, rgba(243, 156, 18, 0.1));
    color: var(--warning-color, #f39c12);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
    margin-top: 6px;
  }
  
  .kyc-required-notice {
    display: flex;
    background-color: var(--warning-bg, rgba(243, 156, 18, 0.05));
    border: 1px solid var(--warning-border, rgba(243, 156, 18, 0.3));
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    gap: 16px;
    align-items: center;
  }
  
  .kyc-icon {
    font-size: 24px;
  }
  
  .kyc-message h4 {
    margin: 0 0 4px 0;
  }
  
  .kyc-message p {
    margin: 0 0 12px 0;
    color: var (--text-secondary, #666);
  }
  
  .verify-button {
    background-color: var(--warning-color, #f39c12);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .verify-button:hover {
    background-color: var(--warning-color-hover, #e67e22);
  }
  
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 10px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
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
      iconEmoji: "📈",
      requiresKyc: true,
      kycLevel: KycLevel.STANDARD,
      kycRequirementId: "isk-account"
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
      iconEmoji: "🏖️",
      requiresKyc: true,
      kycLevel: KycLevel.STANDARD,
      kycRequirementId: "pension-account"
    }
  ];
  
  @observable selectedTypeId: string = "";
  @observable accountName: string = "";
  @observable currency: string = "SEK";
  @observable errorMessage: string = "";
  @observable isCreatingAccount: boolean = false;
  @observable kycCompleted: boolean = false;
  
  initialize(params?: Record<string, any>): void {
    // Set initial title and footer
    this.updateTitle("Create New Account");
    this.updateFooter(true, "Create Account");
    
    // Initial validation state is invalid until user selects account type
    this.notifyValidation(false);
    
    // Pre-select account type if specified in params
    if (params?.accountType && typeof params.accountType === 'string') {
      const accountType = this.accountTypes.find(t => t.id == params.accountType);
      if (accountType) {
        this.selectedTypeId = accountType.id;
        this.validateForm();
      }
    }
  }
  
  // Implement the resume method to handle nested workflow completion
  public resume(result?: WorkflowResult): void {
    console.debug("Account workflow resumed after nested workflow", result);
    
    // Make sure we restore the original UI state - update the modal title and button text
    this.updateTitle("Create New Account");
    this.updateFooter(true, "Create Account");
    
    // Reset the error message by default
    this.errorMessage = '';
    
    if (result?.success) {
      // If the KYC workflow completed successfully
      if (result.data?.verificationStatus === 'pending' || result.data?.verificationStatus === 'approved') {
        this.kycCompleted = true;
        
        // Re-validate form now that KYC is completed
        if (this.validateForm()) {
          // Create account now that KYC is done
          this.createAccount();
        }
      } else {
        this.errorMessage = "Identity verification process incomplete";
      }
    } else {
      // KYC was cancelled or failed - show a message but don't make it an error
      // Only set error message if there's actually a message to show
      if (result?.message && !result.message.includes("cancelled by user")) {
        this.errorMessage = result.message;
      }
    }
    
    // Validate the form to update buttons
    this.validateForm();
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
  
  selectAccountType(id: string) {
    this.selectedTypeId = id;
    
    // Generate a default name based on the account type
    if (!this.accountName) {
      const type = this.accountTypes.find(t => t.id === id)!;
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
    if (this.selectedTypeId == '') {
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
    
    // Check if selected account type requires KYC
    const selectedType = this.accountTypes.find(t => t.id === this.selectedTypeId);
    if (selectedType?.requiresKyc && !this.kycCompleted) {
      // Check if user meets KYC requirements
      if (selectedType.kycRequirementId && !kycService.meetsKycRequirements(selectedType.kycRequirementId)) {
        this.notifyValidation(false, "Identity verification required for this account type");
        // We don't set errorMessage here because we'll show verification button instead
        return false;
      }
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
  
  /**
   * Start the KYC process if needed for the selected account type
   */
  async initiateKycWorkflow(): Promise<WorkflowResult> {
    console.debug("Starting KYC process for account creation...");
    const selectedType = this.accountTypes.find(t => t.id === this.selectedTypeId);
    if (!selectedType?.requiresKyc) {
      return { success: true };
    }
    
    const kycLevel = selectedType.kycLevel || KycLevel.STANDARD;
    
    // Start the KYC workflow and wait for its result
    return await this.startNestedWorkflow('kyc', {
      kycLevel,
      reason: `Opening a ${selectedType.name} requires identity verification.`
    });
  }
  
  async createAccount() {
    // First validate the form
    if (!this.validateForm()) {
      // Check if KYC is required but not completed
      const selectedType = this.accountTypes.find(t => t.id === this.selectedTypeId);
      
      if (selectedType?.requiresKyc && 
          selectedType.kycRequirementId && 
          !kycService.meetsKycRequirements(selectedType.kycRequirementId) &&
          !this.kycCompleted) {
        
        // Start KYC workflow
        this.errorMessage = "Starting identity verification...";
        const kycResult = await this.initiateKycWorkflow();
        
        // If KYC was successful, we'll continue in the resume method
        // The workflow system will automatically call resume() with the KYC result
        if (!kycResult.success) {
          this.errorMessage = kycResult.message || "Identity verification was cancelled";
        }
        
        // Always return early here - don't try to create account yet
        return;
      }
      
      // For other validation failures, just return
      return;
    }

    // Proceed with account creation since validation passed
    this.isCreatingAccount = true;
    this.errorMessage = "";
    
    try {
      const accountRepo = repositoryService.getAccountRepository();
      
      const selectedType = this.accountTypes.find(t => t.id === this.selectedTypeId)!;
      
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
      this.isCreatingAccount = false;
    }
  }
  
  // Handle primary action from modal footer
  public handlePrimaryAction(): void {
    this.createAccount();
  }
}
