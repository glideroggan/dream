import { css, customElement, FASTElement, html, observable } from "@microsoft/fast-element";
import { BasicPersonalInfo } from "./kyc-workflow";
import { KycLevel, kycService, KycStatus } from "../../services/kyc-service";

const template = html<KycBasic>/*html*/ `
  <div class="kyc-basic-workflow">
    <div class="kyc-header">
      <div class="kyc-icon">📱</div>
      <h2>Basic Identity Verification</h2>
    </div>
    
    <div class="kyc-content">
      <p>Please provide your basic information to verify your identity.</p>
      <p>This is a simplified verification for basic account access.</p>
      
      <div class="kyc-form">
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input type="text" id="fullName" value="${x => x.personalInfo.fullName}"
                 @input="${(x, c) => x.handleInput('fullName', (c.event.target as HTMLInputElement).value)}" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" value="${x => x.personalInfo.email}"
                 @input="${(x, c) => x.handleInput('email', (c.event.target as HTMLInputElement).value)}" required>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" value="${x => x.personalInfo.phone}"
                 @input="${(x, c) => x.handleInput('phone', (c.event.target as HTMLInputElement).value)}" required>
        </div>
        
        <div class="form-group">
          <label for="dateOfBirth">Date of Birth</label>
          <input type="date" id="dateOfBirth" value="${x => x.personalInfo.dateOfBirth}"
                 @input="${(x, c) => x.handleInput('dateOfBirth', (c.event.target as HTMLInputElement).value)}" required>
        </div>
        
        <div class="form-group checkbox-group">
            <dream-checkbox id="consentCheckbox" ?checked="${x => x.consentChecked}"
                @change="${(x, c) => x.handleConsentChanged((c.event.target as HTMLInputElement).checked)}">
              <label for="consentCheckbox">I confirm that all provided information is accurate and I consent to the verification process</label>
            </dream-checkbox>
        </div>
      </div>
      
      ${x => x.errorMessage ? html`
        <div class="error-message">${x => x.errorMessage}</div>
      ` : ''}
      
      <div class="kyc-actions">
        <button class="submit-button" @click="${x => x.handleSubmit()}"
                ?disabled="${x => !x.isFormValid || x.isProcessing}">
          Verify Identity
        </button>
      </div>
    </div>
  </div>
`;

const styles = css`
  .kyc-basic-workflow {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 600px;
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
    gap: 16px;
    margin-top: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .checkbox-group {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  
  label {
    font-weight: 500;
  }
  
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  input[type="date"] {
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
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
    padding: 10px 20px;
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
  name: "kyc-basic",
  template,
  styles
})
export class KycBasic extends FASTElement {
  @observable personalInfo: BasicPersonalInfo = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  }
  
  @observable errorMessage: string = '';
  @observable consentChecked: boolean = false;
  @observable isFormValid: boolean = false;
  @observable isProcessing: boolean = false;
  @observable kycRequirementId: string | undefined;
  @observable requiredReason: string = '';
  
  connectedCallback(): void {
    super.connectedCallback();
    this.validateForm();
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
  
  validateForm(): void {
    this.errorMessage = '';
    this.isFormValid = false;
    
    // Check required fields
    if (!this.personalInfo.fullName) {
      this.errorMessage = "Please enter your full name";
      return;
    }
    // TODO: needs more validation
    
    this.isFormValid = true;
  }
  
  async handleSubmit(): Promise<void> {
    if (!this.isFormValid || this.isProcessing) return;
    
    this.isProcessing = true;
    this.errorMessage = '';
    
    try {
      // Create completion data
      const kycData = {
        personalInfo: this.personalInfo,
        verificationStatus: 'pending' as const
      };
      
      // Save to KYC service
      await kycService.saveKycVerificationData(kycData, KycLevel.BASIC);
      
      // Update KYC status
      await kycService.updateKycStatus(KycStatus.PENDING, KycLevel.BASIC);
      
      // Notify parent workflow of completion
      this.dispatchEvent(new CustomEvent('kyc-complete', {
        bubbles: true,
        composed: true,
        detail: {
          level: KycLevel.BASIC,
          verificationStatus: 'pending',
          kycRequirementId: this.kycRequirementId,
          personalInfo: this.personalInfo,
          message: "Basic identity verification submitted successfully"
        }
      }));
      
    } catch (error) {
      console.error("Error submitting basic KYC verification:", error);
      this.errorMessage = "An error occurred while submitting your verification.";
      this.isProcessing = false;
    }
  }
}