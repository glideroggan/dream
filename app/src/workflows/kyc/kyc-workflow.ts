import { customElement, html, css, observable, attr, when } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "../workflow-base";
import { kycService, KycLevel, KycStatus } from "../../services/kyc-service";

// Import step components
import "./step1-component";
import "./step2-component";
import "./step3-component";
import { WorkflowIds } from "../workflow-registry";

export interface PersonalInformation {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  idNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface KYCCompletionData {
  personalInfo: PersonalInformation;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  uploadedFileName?: string;
}

// Main workflow template
const template = html<KycWorkflow>/*html*/ `
  <div class="kyc-workflow">
    <div class="kyc-header">
      <div class="kyc-icon">🪪</div>
      <h2>Identity Verification Required</h2>
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
        ${when(x => x.currentStep === 1, html<KycWorkflow>/*html*/`
          <kyc-step1 
            :personalInfo="${x => x.personalInfo}"
            @field-changed="${(x, c) => x.handleFieldChanged(c.event)}">
          </kyc-step1>
        `)}
        
        <!-- Step 2: Identity Verification -->
        ${when(x => x.currentStep === 2, html<KycWorkflow>/*html*/`
          <kyc-step2
            :personalInfo="${x => x.personalInfo}"
            :uploadedFileName="${x => x.uploadedFileName}"
            @field-changed="${(x, c) => x.handleFieldChanged(c.event)}"
            @document-uploaded="${(x, c) => x.handleDocumentUploaded(c.event)}">
          </kyc-step2>
        `)}
        
        <!-- Step 3: Address Information -->
        ${when(x => x.currentStep === 3, html<KycWorkflow>/*html*/`
          <kyc-step3
            :personalInfo="${x => x.personalInfo}"
            :consentChecked="${x => x.consentChecked}"
            @field-changed="${(x, c) => x.handleFieldChanged(c.event)}"
            @consent-changed="${(x, c) => x.handleConsentChanged(c.event)}">
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
  name: "kyc-workflow",
  template,
  styles
})
export class KycWorkflow extends WorkflowBase {
  @attr({ mode: "boolean" }) autoFocus: boolean = true;

  @observable personalInfo: PersonalInformation = {
    fullName: '',
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
  @observable uploadedFile: File | null = null;
  @observable uploadedFileName: string = '';
  @observable currentStep: number = 1;
  @observable isCurrentStepValid: boolean = false;
  @observable isProcessing: boolean = false;
  @observable requiredKycLevel: KycLevel = KycLevel.STANDARD;
  @observable requiredReason: string = "";
  @observable kycRequirementId: string | undefined = undefined;

  initialize(params?: Record<string, any>): void {
    // Set initial title but now change the cancel button text to "Back"
    this.updateTitle("Identity Verification");
    this.updateFooter(true, "Back to Account");

    // Set the modal's primary button to disabled so they use our buttons instead
    this.notifyValidation(false);

    if (params?.kycLevel) {
      this.requiredKycLevel = params.kycLevel;
    }

    if (params?.reason) {
      this.requiredReason = params.reason;
    }

    if (params?.kycRequirementId) {
      this.kycRequirementId = params.kycRequirementId;
      console.debug(`KYC workflow initialized with requirement ID: ${this.kycRequirementId}`);
    }

    // Validate the first step
    this.validateCurrentStep();
  }

  connectedCallback() {
    super.connectedCallback();

    // Initialize with empty strings to avoid undefined
    this.personalInfo = {
      fullName: '',
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

    // Add required attributes to form fields
    setTimeout(() => {
      const requiredFields = [
        'fullName', 'dateOfBirth', 'nationality',
        'idType', 'idNumber', 'addressLine1',
        'city', 'postalCode', 'country'
      ];

      requiredFields.forEach(fieldId => {
        const field = this.shadowRoot?.querySelector(`[id="${fieldId}"]`) as HTMLInputElement | HTMLSelectElement;
        if (field) field.required = true;
      });
    }, 0);
  }

  /**
   * Handle field changes from step components
   */
  handleFieldChanged(event: Event): void {
    const detail = (event as CustomEvent).detail;

    if (detail.field && detail.value !== undefined) {
      // Update the specific field
      this.personalInfo = {
        ...this.personalInfo,
        [detail.field]: detail.value
      };

      // Validate the current step
      this.validateCurrentStep();
    }
  }

  /**
   * Handle document upload event from step 2
   */
  handleDocumentUploaded(event: Event): void {
    const detail = (event as CustomEvent).detail;

    if (detail.fileName) {
      this.uploadedFileName = detail.fileName;
      this.uploadedFile = {} as File; // Fake file object

      // Validate the current step
      this.validateCurrentStep();
    }
  }

  /**
   * Handle consent checkbox change from step 3
   */
  handleConsentChanged(event: Event): void {
    const detail = (event as CustomEvent).detail;

    if (detail.checked !== undefined) {
      this.consentChecked = detail.checked;

      // Validate the current step
      this.validateCurrentStep();
    }
  }

  /**
   * Validate the current step
   */
  validateCurrentStep(): void {
    this.errorMessage = "";
    this.isCurrentStepValid = false;

    switch (this.currentStep) {
      case 1:
        // Check personal information
        if (!this.personalInfo.fullName) {
          this.errorMessage = "Please enter your full name";
          return;
        }

        if (!this.personalInfo.dateOfBirth) {
          this.errorMessage = "Please enter your date of birth";
          return;
        }

        // Validate age (must be at least 18)
        const birthDate = new Date(this.personalInfo.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
          this.errorMessage = "You must be at least 18 years old";
          return;
        }

        if (!this.personalInfo.nationality) {
          this.errorMessage = "Please select your nationality";
          return;
        }

        this.isCurrentStepValid = true;
        break;

      case 2:
        // Check ID information
        if (!this.personalInfo.idType) {
          this.errorMessage = "Please select an ID type";
          return;
        }

        if (!this.personalInfo.idNumber) {
          this.errorMessage = "Please enter your ID number";
          return;
        }

        // Simpler validation for the fake document upload
        if (!this.uploadedFileName) {
          this.errorMessage = "Please upload your ID document";
          return;
        }

        this.isCurrentStepValid = true;
        break;

      case 3:
        // Check address information
        if (!this.personalInfo.addressLine1) {
          this.errorMessage = "Please enter your address";
          return;
        }

        if (!this.personalInfo.city) {
          this.errorMessage = "Please enter your city";
          return;
        }

        if (!this.personalInfo.postalCode) {
          this.errorMessage = "Please enter your postal code";
          return;
        }

        if (!this.personalInfo.country) {
          this.errorMessage = "Please select your country";
          return;
        }

        if (!this.consentChecked) {
          this.errorMessage = "You must agree to the terms";
          return;
        }

        this.isCurrentStepValid = true;
        break;

      default:
        this.isCurrentStepValid = false;
    }
  }

  /**
   * Handle going back to the previous step
   */
  handleBack(): void {
    if (this.currentStep > 1 && !this.isProcessing) {
      this.currentStep--;
      this.validateCurrentStep();
    }
  }

  // handles the signing nested workflow
  public resume(result?: WorkflowResult): void {

    console.debug('KYC workflow resumed after nested workflow', result)

    // Make sure we restore the original UI state - update the modal title and button text
    this.updateTitle("Identity Verification");
    this.updateFooter(true, "Back to Account");

    // Reset the error message by default
    this.errorMessage = ''

    if (result?.success) {
      // The nested workflow was successful, so we can complete this one
      this.completeKyc();
    }
  }

  /**
   * Handle clicking the next button
   */
  async handleNext(): Promise<void> {
    if (!this.isCurrentStepValid || this.isProcessing) return;

    if (this.currentStep < 3) {
      // Move to the next step
      this.currentStep++;
      this.validateCurrentStep();
    } else {
      // on the last step, start the signing workflow
      const eventResults = await this.startNestedWorkflow(WorkflowIds.SIGNING, {
        message: "Please sign to confirm your identity",
        documentName: "KYC Verification",
        primaryButtonText: "Done"
      })
      const results = (eventResults as any).detail as WorkflowResult;
      console.debug("Signing workflow results:", results);
      if (results?.success) {
        this.completeKyc();
      }
    }
  }

  /**
   * Handle the primary button click from the modal
   * For KYC workflow, the modal's primary button is actually a "Back" button
   * that returns to the parent workflow
   */
  public handlePrimaryAction(): void {
    // Just cancel this workflow, which will return to parent
    // Use a more specific message that won't show up in the parent workflow
    this.cancel("Identity verification cancelled by user");
  }

  completeKyc(): void {
    console.debug("KYC verification completed successfully");
    this.isProcessing = true;
    this.errorMessage = "";

    // Compile the completion data
    const completionData: KYCCompletionData = {
      personalInfo: this.personalInfo,
      verificationStatus: 'pending', // Initially always pending until "verified" by backend
      uploadedFileName: this.uploadedFileName
    };

    // Save to the KYC service
    kycService.saveKycVerificationData(completionData, this.requiredKycLevel)
      .then(() => {
        // Also update the KYC status
        return kycService.updateKycStatus(
          KycStatus.PENDING,
          this.requiredKycLevel
        );
      })
      .then(() => {
        // Complete the workflow with success, including the requirement ID if we have it
        console.debug("KYC data saved successfully:", completionData);
        this.complete(true, {
          verificationStatus: 'pending',
          level: this.requiredKycLevel,
          kycRequirementId: this.kycRequirementId
        }, "Identity verification submitted successfully");
      })
      .catch(error => {
        console.error("Error saving KYC data:", error);
        this.errorMessage = "An error occurred while submitting your verification.";
      })
      .finally(() => {
        this.isProcessing = false;
      });

  }

}
