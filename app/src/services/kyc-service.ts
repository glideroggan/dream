import { getSingletonManager } from './singleton-manager';

export enum KycStatus {
  NONE = "none",
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected"
}

export enum KycLevel {
  NONE = 0,
  BASIC = 1,
  STANDARD = 2,
  ADVANCED = 3
}

export interface KycRequirement {
  id: string;
  name: string;
  requiredLevel: KycLevel;
  description: string;
}

export class KycService {
  private currentKycLevel: KycLevel = KycLevel.NONE;
  private kycStatus: KycStatus = KycStatus.NONE;
  
  // Track which workflows and actions require KYC
  private kycRequirements: KycRequirement[] = [
    {
      id: "isk-account",
      name: "ISK Account",
      requiredLevel: KycLevel.STANDARD,
      description: "Opening an ISK account requires identity verification"
    },
    {
      id: "large-transfer",
      name: "Large Transfer",
      requiredLevel: KycLevel.ADVANCED,
      description: "Transfers over 50,000 require enhanced verification"
    },
    {
      id: "pension-account",
      name: "Pension Account",
      requiredLevel: KycLevel.STANDARD,
      description: "Opening a pension account requires identity verification"
    }
  ];
  
  // Private constructor for singleton pattern
  private constructor() {
    // In a real app, we would load the user's KYC status from API
    console.debug("KycService instance created");
    
    // Mock data: Set the user's KYC status
    this.currentKycLevel = KycLevel.BASIC;
    this.kycStatus = KycStatus.COMPLETED;
  }

  // Singleton accessor
  public static getInstance(): KycService {
    const singletonManager = getSingletonManager();
    return singletonManager.getOrCreate<KycService>('KycService', () => new KycService());
  }

  /**
   * Check if the user meets the KYC requirements for a specific action
   * @returns true if the user meets the requirements, false otherwise
   */
  public meetsKycRequirements(requirementId: string): boolean {
    const requirement = this.kycRequirements.find(r => r.id === requirementId);
    if (!requirement) return true; // No requirement found, assume it's allowed
    
    return this.currentKycLevel >= requirement.requiredLevel;
  }

  /**
   * Get the KYC requirement for a specific action
   */
  public getKycRequirement(requirementId: string): KycRequirement | null {
    return this.kycRequirements.find(r => r.id === requirementId) || null;
  }

  /**
   * Get the user's current KYC level
   */
  public getCurrentKycLevel(): KycLevel {
    return this.currentKycLevel;
  }

  /**
   * Get the user's current KYC status
   */
  public getKycStatus(): KycStatus {
    return this.kycStatus;
  }

  /**
   * Start the KYC process
   */
  public async startKycProcess(targetLevel: KycLevel): Promise<boolean> {
    // In a real app, this would launch the appropriate KYC flow
    // For now, we'll just simulate it
    console.log(`Starting KYC process for level ${targetLevel}...`);
    
    // Return true to indicate the process has started
    return true;
  }

  /**
   * Update the user's KYC status (would be called after a successful KYC process)
   */
  public updateKycStatus(status: KycStatus, level: KycLevel): void {
    this.kycStatus = status;
    this.currentKycLevel = level;
    
    // Dispatch event for KYC status change
    document.dispatchEvent(new CustomEvent('kyc-status-changed', {
      bubbles: true,
      composed: true,
      detail: { status, level }
    }));
  }
}

export const kycService = KycService.getInstance();
