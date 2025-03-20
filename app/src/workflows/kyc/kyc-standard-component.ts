import { css, customElement, FASTElement, html, observable, when } from "@microsoft/fast-element";

// Import step components
import "./step1-component";
import "./step2-component";
import "./step3-component";
import { PersonalInformation } from "./kyc-workflow";
import { KycLevel, kycService, KycStatus } from "../../services/kyc-service";

// Main workflow template
const template = html<KycStandard>/*html*/ `
  <div class="kyc-workflow">
    <div class="kyc-header">
      <div class="kyc-icon">🪪</div>
      <h2>Standard Identity Verification</h2>
    </div>
    
    <div class="kyc-content">
      <p>We need to verify your identity to proceed with this action.</p>
      <p>This is required for your security and to comply with financial regulations.</p>
      
      <div class="kyc-steps">
        <div class="kyc-step ${x => x.currentStep >= 1 ? 'active' : ''}">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Personal Information</h3>
            <p>Verify your personal details</p>
          </div>
        </div>
        
        <div class="kyc-step ${x => x.currentStep >= 2 ? 'active' : ''}">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>ID Verification</h3>
            <p>Upload identification documents</p>
          </div>
        </div>
        
        <div class="kyc-step ${x => x.currentStep >= 3 ? 'active' : ''}">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Address Verification</h3>
            <p>Confirm your residential address</p>
          </div>
        </div>
      </div>

      <div class="kyc-form">
        <!-- Step 1: Personal Information -->
        ${when(x => x.currentStep === 1, html<KycStandard>/*html*/`
          <kyc-step1 
            :personalInfo="${x => x.personalInfo}"
            @field-changed="${(x, c) => x.handleFieldChanged(c.event)}"
            @validation-changed="${(x, c) => x.validateCurrentStep(c.event as CustomEvent)}">
          </kyc-step1>
        `)}
        
        <!-- Step 2: Identity Verification -->
        ${when(x => x.currentStep === 2, html<KycStandard>/*html*/`
          <kyc-step2
            :personalInfo="${x => x.personalInfo}"
            :uploadedFileName="${x => x.uploadedFileName}"
            @field-changed="${(x, c) => x.handleFieldChanged(c.event)}"
            @document-uploaded="${(x, c) => x.handleDocumentUploaded(c.event)}"
            @validation-changed="${(x, c) => x.validateCurrentStep(c.event as CustomEvent)}">
          </kyc-step2>
        `)}
        
        <!-- Step 3: Address Information -->
        ${when(x => x.currentStep === 3, html<KycStandard>/*html*/`
          <kyc-step3
            :personalInfo="${x => x.personalInfo}"
            :consentChecked="${x => x.consentChecked}"
            @field-changed="${(x, c) => x.handleFieldChanged(c.event)}"
            @consent-changed="${(x, c) => x.handleConsentChanged(c.event)}"
            @validation-changed="${(x, c) => x.validateCurrentStep(c.event as CustomEvent)}">
          </kyc-step3>
        `)}
      </div>
      
      ${x => x.errorMessage ? html`
        <div class="error-message">${x => x.errorMessage}</div>
      ` : ''}
      
      <div class="kyc-navigation">
        ${x => x.currentStep > 1 ? html`
          <button class="back-button" @click="${x => x.handleBack()}" 
                  ?disabled="${x => x.isProcessing}">
            Back
          </button>
        ` : html`
          <div></div> <!-- Placeholder to maintain flex layout -->
        `}
        
        <button class="next-button" @click="${x => x.handleNext()}"
                ?disabled="${x => !x.isCurrentStepValid || x.isProcessing}">
          ${x => x.currentStep < 3 ? 'Next' : 'Sign & Submit'}
        </button>
      </div>
    </div>
  </div>
`;

// Main CSS (now lighter since step-specific styles moved to components)
const styles = css`
  .kyc-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .kyc-content p {
    margin-bottom: 8px;
  }
  
  .kyc-steps {
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
    position: relative;
  }
  
  .kyc-steps::after {
    content: '';
    position: absolute;
    top: 24px;
    left: 50px;
    right: 50px;
    height: 2px;
    background-color: var(--divider-color, #e0e0e0);
    z-index: 0;
  }
  
  .kyc-step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    z-index: 1;
  }
  
  .step-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid var(--border-color, #e0e0e0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 8px;
    transition: all 0.3s ease;
  }
  
  .kyc-step.active .step-number {
    background-color: var(--primary-color, #3498db);
    border-color: var(--primary-color, #3498db);
    color: white;
  }
  
  .step-content {
    text-align: center;
    max-width: 120px;
  }
  
  .step-content h3 {
    font-size: 14px;
    margin: 0 0 4px 0;
  }
  
  .step-content p {
    font-size: 12px;
    color: var(--secondary-text-color, #666);
    margin: 0;
  }
  
  .kyc-form {
    margin-top: 20px;
  }
  
  .error-message {
    color: var(--notification-badge-bg, #e74c3c);
    font-size: 14px;
    padding: 10px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--notification-badge-bg, #e74c3c) 10%, transparent);
    margin-top: 8px;
  }
  
  .kyc-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color, #e0e0e0);
  }
  
  .back-button {
    padding: 10px 20px;
    border-radius: 4px;
    border: none;
    background-color: var(--background-card, #f5f5f5);
    color: var(--primary-text-color, #333);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-button:hover:not(:disabled) {
    background-color: var(--hover-bg, #e0e0e0);
  }
  
  .next-button {
    padding: 10px 20px;
    border-radius: 4px;
    border: none;
    background-color: var(--primary-color, #3498db);
    color: var(--text-light, white);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .next-button:hover:not(:disabled) {
    background-color: var(--accent-color, #2980b9);
    filter: brightness(1.1);
  }
  
  .next-button:disabled, .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

@customElement({
  name: "kyc-standard",
  template,
  styles
})
export class KycStandard extends FASTElement {
  @observable personalInfo: PersonalInformation = {
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
    country: ''
  };

  @observable errorMessage: string = '';
  @observable consentChecked: boolean = false;
  @observable uploadedFileName: string = '';
  @observable currentStep: number = 1;
  @observable isCurrentStepValid: boolean = false;
  @observable isProcessing: boolean = false;
  @observable kycRequirementId: string | undefined;
  @observable requiredReason: string = '';
  
  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    // load current KYC
    await this.loadKycData();
    // this.validateCurrentStep();
  }
  async loadKycData() {
    const savedInfo = await kycService.getPersonal()
    // merge data from savedInfo and what we already have
    this.personalInfo = { ...this.personalInfo, ...savedInfo };
  }
  
  handleFieldChanged(event: Event): void {
    // populate personalInfo based on event details
    const customEvent = event as CustomEvent;
    this.personalInfo = {
      ...this.personalInfo,
      [customEvent.detail.field]: customEvent.detail.value
    }


    // this.validateCurrentStep();
  }
  
  handleDocumentUploaded(event: Event): void {
    // this.validateCurrentStep();
  }
  
  handleConsentChanged(event: Event): void {
    // this.validateCurrentStep();
  }
  
  validateCurrentStep(event:CustomEvent): void {
    this.isCurrentStepValid = event.detail.isValid;   
  }
  
  handleBack(): void {
    if (this.currentStep > 1 && !this.isProcessing) {
      this.currentStep--;
      // this.validateCurrentStep();
    }
  }
  
  async handleNext(): Promise<void> {
    if (!this.isCurrentStepValid || this.isProcessing) return;

    if (this.currentStep < 3) {
      // Move to the next step
      this.currentStep++;
      // this.validateCurrentStep();
      this.isCurrentStepValid = false
    } else {
      // On the final step, get signing and complete
      await this.completeVerification();
    }
  }

  async completeVerification(): Promise<void> {
    this.isProcessing = true;
    
    try {
      // Start signing workflow if needed (imported from parent workflow)
      const signingEvent = new CustomEvent('request-signing-workflow', {
        bubbles: true,
        composed: true,
        detail: {
          message: "Please sign to confirm your identity verification",
          documentName: "Standard KYC Verification",
          data: this.personalInfo
        }
      });
      
      this.dispatchEvent(signingEvent);
      
    } catch (error) {
      console.error("Error completing standard KYC verification:", error);
      this.errorMessage = "An error occurred while submitting your verification.";
      this.isProcessing = false;
    }
  }
}