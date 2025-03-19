import { css, customElement, FASTElement, html, observable } from "@microsoft/fast-element";
import { EnhancedPersonalInfo } from "./kyc-workflow";
import { KycLevel, kycService, KycStatus } from "../../services/kyc-service";
import { WorkflowIds } from "../workflow-registry";

const template = html<KycEnhanced>/*html*/ `
  <div class="kyc-enhanced-workflow">
    <div class="kyc-header">
      <div class="kyc-icon">🔐</div>
      <h2>Enhanced Identity Verification</h2>
    </div>
    
    <div class="kyc-content">
      <p>This enhanced verification is required for premium services and higher transaction limits.</p>
      <p>Please provide additional information to complete your verification.</p>
      
      <div class="kyc-form">
        <div class="form-section">
          <h3>Financial Information</h3>
          
          <div class="form-group">
            <label for="occupation">Occupation</label>
            <input type="text" id="occupation" value="${x => x.personalInfo.occupation || ''}"
                  @input="${(x, c) => x.handleInput('occupation', (c.event.target as HTMLInputElement).value)}" required>
          </div>
          
          <div class="form-group">
            <label for="sourceOfFunds">Source of Funds</label>
            <select id="sourceOfFunds" 
                    @change="${(x, c) => x.handleInput('sourceOfFunds', (c.event.target as HTMLSelectElement).value)}" required>
              <option value="" disabled ${x => !x.personalInfo.sourceOfFunds ? 'selected' : ''}>Select source of funds</option>
              <option value="employment" ${x => x.personalInfo.sourceOfFunds === 'employment' ? 'selected' : ''}>Employment Income</option>
              <option value="business" ${x => x.personalInfo.sourceOfFunds === 'business' ? 'selected' : ''}>Business Income</option>
              <option value="investment" ${x => x.personalInfo.sourceOfFunds === 'investment' ? 'selected' : ''}>Investment Returns</option>
              <option value="inheritance" ${x => x.personalInfo.sourceOfFunds === 'inheritance' ? 'selected' : ''}>Inheritance</option>
              <option value="gift" ${x => x.personalInfo.sourceOfFunds === 'gift' ? 'selected' : ''}>Gift</option>
              <option value="other" ${x => x.personalInfo.sourceOfFunds === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          
          <div class="form-group proof-upload">
            <label>Proof of Address</label>
            <div class="upload-container">
              ${x => x.proofOfAddressName ? html`
                <div class="uploaded-file">
                  <span>${x => x.proofOfAddressName}</span>
                  <button class="remove-button" @click="${x => x.handleRemoveProofOfAddress()}">✕</button>
                </div>
              ` : html`
                <label class="upload-button">
                  <span>Upload Document</span>
                  <input type="file" @change="${(x, c) => x.handleProofOfAddressUpload(c.event)}" accept=".pdf,.jpg,.jpeg,.png">
                </label>
              `}
            </div>
            <small>Please upload a utility bill, bank statement, or government document showing your address.</small>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Tax Information</h3>
          
          <div class="form-group">
            <label for="taxResidency">Tax Residency Country</label>
            <input type="text" id="taxResidency" value="${x => x.personalInfo.taxResidency || ''}"
                  @input="${(x, c) => x.handleInput('taxResidency', (c.event.target as HTMLInputElement).value)}" required>
          </div>
          
          <div class="form-group">
            <label for="taxIdNumber">Tax Identification Number</label>
            <input type="text" id="taxIdNumber" value="${x => x.personalInfo.taxIdNumber || ''}"
                  @input="${(x, c) => x.handleInput('taxIdNumber', (c.event.target as HTMLInputElement).value)}" required>
          </div>
          
          <div class="form-group checkbox-group">
            <input type="checkbox" id="taxConsent" ?checked="${x => x.taxConsentChecked}"
                  @change="${(x, c) => x.handleTaxConsentChanged((c.event.target as HTMLInputElement).checked)}">
            <label for="taxConsent">I confirm that the tax information provided is accurate and complete</label>
          </div>
          
          <div class="form-group checkbox-group">
            <input type="checkbox" id="consent" ?checked="${x => x.consentChecked}"
                  @change="${(x, c) => x.handleConsentChanged((c.event.target as HTMLInputElement).checked)}">
            <label for="consent">I agree to the enhanced verification terms and consent to data processing</label>
          </div>
        </div>
      </div>
      
      ${x => x.errorMessage ? html`
        <div class="error-message">${x => x.errorMessage}</div>
      ` : ''}
      
      <div class="kyc-actions">
        <button class="submit-button" @click="${x => x.handleSubmit()}"
                ?disabled="${x => !x.isFormValid || x.isProcessing}">
          ${x => x.isProcessing ? 'Processing...' : 'Submit Enhanced Verification'}
        </button>
      </div>
    </div>
  </div>
`;

const styles = css`
  .kyc-enhanced-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 700px;
    margin: 0 auto;
  }
  
  .kyc-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .kyc-icon {
    font-size: 24px;
  }
  
  .kyc-content p {
    margin-bottom: 8px;
  }
  
  .kyc-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-top: 20px;
  }
  
  .form-section {
    background-color: var(--background-card, #f8f9fa);
    border-radius: 8px;
    padding: 20px;
    border: 1px solid var(--border-color, #e0e0e0);
  }
  
  .form-section h3 {
    margin-top: 0;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
    color: var(--primary-text-color);
    font-weight: 600;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }
  
  .form-group:last-child {
    margin-bottom: 0;
  }
  
  .checkbox-group {
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
  }
  
  .checkbox-group input {
    margin-top: 3px;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
  }
  
  small {
    color: var(--secondary-text-color);
    font-size: 12px;
  }
  
  input[type="text"],
  select {
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    background-color: var(--background-color, white);
    transition: border-color 0.2s;
  }
  
  input[type="text"]:focus,
  select:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
  }
  
  .upload-container {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }
  
  .upload-button {
    display: inline-block;
    padding: 8px 16px;
    background-color: var(--background-card);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .upload-button:hover {
    background-color: var(--hover-bg);
  }
  
  .upload-button input[type="file"] {
    display: none;
  }
  
  .uploaded-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: var(--background-card);
    border: 1px solid var(--primary-color);
    border-radius: 4px;
    width: 100%;
  }
  
  .remove-button {
    background: none;
    border: none;
    color: var(--notification-badge-bg);
    cursor: pointer;
    font-weight: bold;
    padding: 0 8px;
  }
  
  .error-message {
    color: var(--notification-badge-bg, #e74c3c);
    font-size: 14px;
    padding: 10px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--notification-badge-bg, #e74c3c) 10%, transparent);
    margin-top: 8px;
  }
  
  .kyc-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }
  
  .submit-button {
    padding: 10px 24px;
    border-radius: 4px;
    border: none;
    background-color: var(--primary-color, #3498db);
    color: var(--text-light, white);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .submit-button:hover:not(:disabled) {
    background-color: var(--accent-color, #2980b9);
    filter: brightness(1.1);
  }
  
  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

@customElement({
  name: "kyc-enhanced",
  template,
  styles
})
export class KycEnhanced extends FASTElement {
  @observable personalInfo: EnhancedPersonalInfo = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    idType: '',
    idNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: '',
    occupation: '',
    sourceOfFunds: '',
    taxResidency: '',
    taxIdNumber: ''
  };

  @observable errorMessage: string = '';
  @observable consentChecked: boolean = false;
  @observable taxConsentChecked: boolean = false;
  @observable proofOfAddressName: string = '';
  @observable isFormValid: boolean = false;
  @observable isProcessing: boolean = false;
  @observable kycRequirementId: string | undefined;
  @observable requiredReason: string = '';
  
  connectedCallback(): void {
    super.connectedCallback();
    
    // Load existing user data from KYC service
    this.loadExistingUserData();
  }
  
  async loadExistingUserData(): Promise<void> {
    try {
      // TODO: Get existing personal info from KYC service
      // For now, just validate the form with empty data
      this.validateForm();
    } catch (error) {
      console.error("Error loading existing user data:", error);
      this.errorMessage = "Failed to load your existing verification data";
    }
  }
  
  handleInput(field: string, value: string): void {
    this.personalInfo = {
      ...this.personalInfo,
      [field]: value
    };
    this.validateForm();
  }
  
  handleConsentChanged(checked: boolean): void {
    this.consentChecked = checked;
    this.validateForm();
  }
  
  handleTaxConsentChanged(checked: boolean): void {
    this.taxConsentChecked = checked;
    this.validateForm();
  }
  
  handleProofOfAddressUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.proofOfAddressName = input.files[0].name;
      this.validateForm();
    }
  }
  
  handleRemoveProofOfAddress(): void {
    this.proofOfAddressName = '';
    this.validateForm();
  }
  
  validateForm(): void {
    this.errorMessage = '';
    this.isFormValid = false;
    
    // Check required fields for enhanced verification only
    if (!this.personalInfo.occupation) {
      this.errorMessage = "Please enter your occupation";
      return;
    }
    
    if (!this.personalInfo.sourceOfFunds) {
      this.errorMessage = "Please select your source of funds";
      return;
    }
    
    if (!this.proofOfAddressName) {
      this.errorMessage = "Please upload a proof of address document";
      return;
    }
    
    if (!this.personalInfo.taxResidency) {
      this.errorMessage = "Please enter your tax residency country";
      return;
    }
    
    if (!this.personalInfo.taxIdNumber) {
      this.errorMessage = "Please enter your tax identification number";
      return;
    }
    
    if (!this.taxConsentChecked) {
      this.errorMessage = "Please confirm your tax information accuracy";
      return;
    }
    
    if (!this.consentChecked) {
      this.errorMessage = "You must agree to the enhanced verification terms";
      return;
    }
    
    this.isFormValid = true;
  }
  
  async handleSubmit(): Promise<void> {
    if (!this.isFormValid || this.isProcessing) return;
    
    this.isProcessing = true;
    this.errorMessage = '';
    
    try {
      // Create completion data - only include fields specific to enhanced verification
      const completionData = {
        personalInfo: {
          occupation: this.personalInfo.occupation,
          sourceOfFunds: this.personalInfo.sourceOfFunds,
          taxResidency: this.personalInfo.taxResidency,
          taxIdNumber: this.personalInfo.taxIdNumber
        },
        verificationStatus: 'pending' as const,
        proofOfAddressName: this.proofOfAddressName
      };
      
      // Save to KYC service
      await kycService.saveKycVerificationData(completionData, KycLevel.ENHANCED);
      await kycService.updateKycStatus(KycStatus.PENDING, KycLevel.ENHANCED);
      
      // Notify parent workflow of completion
      this.dispatchEvent(new CustomEvent('kyc-complete', {
        bubbles: true,
        composed: true,
        detail: {
          level: KycLevel.ENHANCED,
          verificationStatus: 'pending',
          kycRequirementId: this.kycRequirementId,
          personalInfo: this.personalInfo,
          message: "Enhanced identity verification submitted successfully"
        }
      }));
      
    } catch (error) {
      console.error("Error completing enhanced KYC verification:", error);
      this.errorMessage = "An error occurred while submitting your verification.";
      this.isProcessing = false;
    }
  }
}