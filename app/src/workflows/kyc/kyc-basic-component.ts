import { css, customElement, FASTElement, html, observable, when } from "@microsoft/fast-element";
import { BasicPersonalInfo } from "./kyc-workflow";
import { KycLevel, kycService, KycStatus } from "../../services/kyc-service";
import '@primitives/input';
import '@primitives/button';

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
        <dream-input
          id="fullName"
          type="text"
          label="Full Name"
          :value="${x => x.personalInfo.fullName || ''}"
          ?error="${x => !!x.errors.fullName}"
          error-message="${x => x.errors.fullName || ''}"
          full-width
          @input="${(x, c) => x.handleInputChange('fullName', c.event)}"
        ></dream-input>
        
        <dream-input
          id="email"
          type="email"
          label="Email Address"
          :value="${x => x.personalInfo.email || ''}"
          ?error="${x => !!x.errors.email}"
          error-message="${x => x.errors.email || ''}"
          full-width
          @input="${(x, c) => x.handleInputChange('email', c.event)}"
        ></dream-input>
        
        <dream-input
          id="phone"
          type="tel"
          label="Phone Number"
          :value="${x => x.personalInfo.phone || ''}"
          ?error="${x => !!x.errors.phone}"
          error-message="${x => x.errors.phone || ''}"
          full-width
          @input="${(x, c) => x.handleInputChange('phone', c.event)}"
        ></dream-input>
        
        <dream-input
          id="dateOfBirth"
          type="date"
          label="Date of Birth"
          :value="${x => x.personalInfo.dateOfBirth || ''}"
          ?error="${x => !!x.errors.dateOfBirth}"
          error-message="${x => x.errors.dateOfBirth || ''}"
          full-width
          @input="${(x, c) => x.handleInputChange('dateOfBirth', c.event)}"
        ></dream-input>
        
        <div class="form-group checkbox-group ${x => x.errors.consent ? 'invalid' : ''}">
            <dream-checkbox id="consentCheckbox" ?checked="${x => x.consentChecked}"
                @change="${(x, c) => x.handleConsentChanged((c.event.target as HTMLInputElement).checked)}">
              <label for="consentCheckbox">I confirm that all provided information is accurate and I consent to the verification process</label>
            </dream-checkbox>
            ${when(x => x.errors.consent, html`<div class="error-message">${x => x.errors.consent}</div>`)}
        </div>
      </div>

      ${when(x => x.generalError, html`<div class="error-message general-error">${x => x.generalError}</div>`)}
      
      <div class="kyc-actions">
        <dream-button 
          variant="primary" 
          ?loading="${x => x.isProcessing}"
          ?disabled="${x => !x.isFormValid}"
          @click="${x => x.handleSubmit()}"
        >
          Verify Identity
        </dream-button>
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
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    margin-top: 4px;
    font-weight: 500;
  }
  
  .kyc-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }
  
  .general-error {
    padding: 10px;
    border-radius: 4px;
    background-color: var(--error-bg-color, rgba(231, 76, 60, 0.05));
    margin-top: 16px;
  }
  
  .form-group.invalid dream-checkbox {
    --checkbox-border-color: var(--error-color, #e74c3c);
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
  
  @observable errors: Record<string, string> = {};
  @observable generalError: string = '';
  @observable consentChecked: boolean = false;
  @observable isFormValid: boolean = false;
  @observable isProcessing: boolean = false;
  @observable kycRequirementId: string | undefined;
  @observable requiredReason: string = '';
  
  connectedCallback(): void {
    super.connectedCallback();
    // Immediately validate to show any initial errors
    this.validateForm();
  }
  
  handleInputChange(field: string, event: Event): void {
    const customEvent = event as CustomEvent;
    const value = customEvent.detail?.value ?? (event.target as HTMLInputElement).value;
    
    this.personalInfo = {
      ...this.personalInfo,
      [field]: value
    };
    
    // Clear specific field error when user is correcting it
    if (this.errors[field]) {
      const { [field]: _, ...remainingErrors } = this.errors;
      this.errors = remainingErrors;
    }
    
    this.validateForm();
  }
  
  handleConsentChanged(checked: boolean): void {
    this.consentChecked = checked;
    
    // Clear consent error when checked
    if (checked && this.errors.consent) {
      const { consent, ...remainingErrors } = this.errors;
      this.errors = remainingErrors;
    }
    
    this.validateForm();
  }
  
  validateForm(): void {
    const newErrors: Record<string, string> = {};
    this.generalError = '';
    
    // Validate full name
    if (!this.personalInfo.fullName || this.personalInfo.fullName.trim() === '') {
      newErrors.fullName = "Full name is required";
    } else if (this.personalInfo.fullName.length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
    }
    
    // Validate email
    if (!this.personalInfo.email || this.personalInfo.email.trim() === '') {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.personalInfo.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Validate phone
    if (!this.personalInfo.phone || this.personalInfo.phone.trim() === '') {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\+\-\(\) ]{7,15}$/.test(this.personalInfo.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    // Validate date of birth
    if (!this.personalInfo.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const birthDate = new Date(this.personalInfo.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = "Invalid date format";
      } else if (
        age < 18 || 
        (age === 18 && monthDiff < 0) || 
        (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      } else if (birthDate > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }
    
    // Validate consent
    if (!this.consentChecked) {
      newErrors.consent = "You must agree to the terms before proceeding";
    }
    
    // Update errors and form validity
    this.errors = newErrors;
    this.isFormValid = Object.keys(newErrors).length === 0;
    
    // Emit validation event to parent component
    this.dispatchEvent(new CustomEvent('workflowValidation', {
      bubbles: true,
      composed: true,
      detail: {
        isValid: this.isFormValid,
        message: Object.values(newErrors)[0] || ''
      }
    }));
  }
  
  async handleSubmit(): Promise<void> {
    console.debug('[KycBasic] handleSubmit', this.personalInfo, this.consentChecked);
    
    // Final validation before submission
    this.validateForm()
    if (!this.isFormValid || this.isProcessing) return;
    
    this.isProcessing = true;
    this.generalError = '';
    
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
      
      console.debug('KYC data saved successfully:', kycData);
      // Notify parent workflow of completion
      this.dispatchEvent(new CustomEvent('step-complete', {
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
      this.generalError = "An error occurred while submitting your verification. Please try again.";
      this.isProcessing = false;
    }
  }
}
