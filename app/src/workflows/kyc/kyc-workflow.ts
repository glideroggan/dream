import { customElement, html, css, observable, when } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "../workflow-base";
import { kycService, KycLevel } from "../../services/kyc-service";

// Import components for different KYC levels
import "./kyc-basic-component";
import "./kyc-standard-component";
import "./kyc-enhanced-component";

export interface BasicPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface PersonalInformation extends BasicPersonalInfo {
  nationality: string;
  idType: string;
  idNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface EnhancedPersonalInfo extends PersonalInformation {
  occupation: string;
  sourceOfFunds: string;
  taxResidency: string;
  taxIdNumber: string;
}

const template = html<KycWorkflow>/*html*/ `
  <div class="kyc-router">
    ${when(x => x.isLoading, html<KycWorkflow>/*html*/`
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading verification workflow...</p>
      </div>
    `)}

    <!-- Show appropriate component based on required KYC level -->
    ${when(x => !x.isLoading && x.isNeeded(KycLevel.BASIC), html<KycWorkflow>/*html*/`
      <kyc-basic 
        id="kyc-component" 
        :kycRequirementId="${x => x.kycRequirementId}" 
        :requiredReason="${x => x.requiredReason}">
      </kyc-basic>
    `)}

    ${when(x => !x.isLoading && x.isNeeded(KycLevel.STANDARD), html<KycWorkflow>/*html*/`
      <kyc-standard 
        id="kyc-component" 
        :kycRequirementId="${x => x.kycRequirementId}" 
        :requiredReason="${x => x.requiredReason}">
      </kyc-standard>
    `)}

    ${when(x => !x.isLoading && x.isNeeded(KycLevel.ENHANCED), html<KycWorkflow>/*html*/`
      <kyc-enhanced 
        id="kyc-component" 
        :kycRequirementId="${x => x.kycRequirementId}" 
        :requiredReason="${x => x.requiredReason}">
      </kyc-enhanced>
    `)}
  </div>
`;

const styles = css`
  .kyc-router {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: var(--primary-color);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

@customElement({
  name: "kyc-workflow",
  template,
  styles
})
export class KycWorkflow extends WorkflowBase {
  
  @observable isLoading: boolean = true;
  @observable requiredLevel: KycLevel = KycLevel.STANDARD;
  @observable kycRequirementId: string | undefined = undefined;
  @observable requiredReason: string = "";
  @observable currentKycLevel: KycLevel = KycLevel.NONE;

  initialize(params?: Record<string, any>): void {
    // Common workflow initialization
    this.updateTitle("Identity Verification");
    this.updateFooter(true, "Cancel");
    
    // Get parameters
    if (params?.kycLevel) {
      this.requiredLevel = params.kycLevel;
    }

    if (params?.reason) {
      this.requiredReason = params.reason;
    }

    if (params?.kycRequirementId) {
      this.kycRequirementId = params.kycRequirementId;
    }

    // Start the process
    this.determineKycLevel();
  }

  isNeeded(compLevel: KycLevel): boolean {
    const currentLevel = kycService.getCurrentKycLevel();
    const levelValue = (level: KycLevel): number => {
      switch (level) {
        case KycLevel.NONE: return 0;
        case KycLevel.BASIC: return 1;
        case KycLevel.STANDARD: return 2;
        case KycLevel.ENHANCED: return 3;
        case KycLevel.BUSINESS: return 4;
        default: return 0;
      }
    };
    
    // First, check if this component's level is the next level needed
    // We need this level if:
    // 1. It's less than or equal to the required level (can't skip levels)
    // 2. It's greater than our current level (we need to upgrade)
    // 3. It's the next level up from our current level (no skipping)
    const isNextRequired = 
      levelValue(compLevel) <= levelValue(this.requiredLevel) && 
      levelValue(compLevel) > levelValue(currentLevel) &&
      levelValue(compLevel) === levelValue(currentLevel) + 1;

    // Return true only if this is the exact next level needed

    return isNextRequired

  }

  async determineKycLevel(): Promise<void> {
    try {
      // Get current KYC level
      this.currentKycLevel = kycService.getCurrentKycLevel();
      console.log(`Current KYC level: ${this.currentKycLevel}, Required: ${this.requiredLevel}`);
      
      // Check if user already meets the required level
      if (this.isKycLevelSufficient(this.currentKycLevel)) {
        // Auto-complete the workflow if the user already has sufficient verification
        this.complete(true, {
          level: this.currentKycLevel,
          verificationStatus: 'approved',
          kycRequirementId: this.kycRequirementId
        }, `Already verified at ${this.currentKycLevel} level`);
        return;
      }
      
      // Setup event listeners for completion events from components
      // this.setupEventListeners();
      
    } catch (error) {
      console.error("Error initializing KYC workflow:", error);
    } finally {
      this.isLoading = false;
    }
  }

  isKycLevelSufficient(currentLevel: KycLevel): boolean {
    const levelValue = (level: KycLevel): number => {
      switch (level) {
        case KycLevel.NONE: return 0;
        case KycLevel.BASIC: return 1;
        case KycLevel.STANDARD: return 2;
        case KycLevel.ENHANCED: return 3;
        case KycLevel.BUSINESS: return 4;
        default: return 0;
      }
    };
    
    return levelValue(currentLevel) >= levelValue(this.requiredLevel);
  }

  setupEventListeners(): void {
    // Use setTimeout to ensure component is rendered
    setTimeout(() => {
      const kycComponent = this.shadowRoot?.getElementById('kyc-component');
      if (kycComponent) {
        kycComponent.addEventListener('kyc-complete', this.handleKycComplete.bind(this));
        kycComponent.addEventListener('kyc-cancel', this.handleKycCancel.bind(this));
      }
    }, 0);
  }

  handleKycComplete(event: Event): void {
    const detail = (event as CustomEvent).detail;
    // Complete the workflow with the data from the component
    this.complete(true, detail, detail.message || "Identity verification completed");
  }

  handleKycCancel(event: Event): void {
    const detail = (event as CustomEvent).detail;
    // Cancel the workflow
    this.cancel(detail?.message || "Identity verification cancelled");
  }

  public handlePrimaryAction(): void {
    // Cancel the workflow when user clicks the footer cancel button
    this.cancel("Identity verification cancelled by user");
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up any event listeners if needed
  }
}
