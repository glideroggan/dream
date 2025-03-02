import { getSingletonManager } from './singleton-manager';
import { PersonalInformation, KYCCompletionData } from '../workflows/kyc/kyc-workflow';
import { getRepositoryService } from './repository-service';

// KYC verification levels
export enum KycLevel {
  NONE = 'none',           // No KYC completed
  BASIC = 'basic',         // Email verification only
  STANDARD = 'standard',   // ID verification
  ENHANCED = 'enhanced'    // ID + address + additional checks
}

// KYC verification status
export enum KycStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Interface for KYC data in user settings
export interface KycData {
  level: KycLevel;
  status: KycStatus;
  lastUpdated: string;
  personalInfo?: PersonalInformation;
  documents?: {
    idDocumentName?: string;
    addressDocumentName?: string;
  }
}

export interface KycRequirement {
  id: string;
  name: string;
  requiredLevel: KycLevel;
  description: string;
}

class KycService {
  private settingsRepo = getRepositoryService().getSettingsRepository();
  private currentKycLevel: KycLevel = KycLevel.NONE;
  private kycStatus: KycStatus = KycStatus.NOT_STARTED;
  
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
      requiredLevel: KycLevel.ENHANCED,
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
    this.kycStatus = KycStatus.APPROVED;
    
    // Load KYC data from repository on initialization
    this.loadKycData();
  }

  /**
   * Load KYC data from settings repository
   */
  private async loadKycData(): Promise<void> {
    try {
      const kycData = await this.getKycData();
      if (kycData) {
        this.currentKycLevel = kycData.level;
        this.kycStatus = kycData.status;
        console.debug('KYC data loaded from repository:', kycData);
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    }
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
    
    return this.getLevelValue(this.currentKycLevel) >= this.getLevelValue(requirement.requiredLevel);
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
   * Get the current KYC status
   */
  public getCurrentKycStatus(): KycStatus {
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
   * Get the current KYC data for the user from repository
   */
  public async getKycData(): Promise<KycData> {
    const settings = await this.settingsRepo.getCurrentSettings();
    
    // If no KYC data exists, return default values
    if (!settings.kycData) {
      return {
        level: KycLevel.NONE,
        status: KycStatus.NOT_STARTED,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return settings.kycData;
  }
  
  /**
   * Update the KYC status in the repository
   */
  public async updateKycStatus(status: KycStatus, level: KycLevel): Promise<void> {
    // Update in-memory state
    this.kycStatus = status;
    this.currentKycLevel = level;
    
    // Get current settings
    const currentSettings = await this.settingsRepo.getCurrentSettings();
    const currentKycData = currentSettings.kycData || {
      level: KycLevel.NONE,
      status: KycStatus.NOT_STARTED,
      lastUpdated: new Date().toISOString()
    };
    
    // Update the KYC data
    const updatedKycData: KycData = {
      ...currentKycData,
      status,
      level,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to settings repository
    await this.settingsRepo.updateSettings({
      kycData: updatedKycData
    });
    
    console.debug('KYC status updated:', updatedKycData);
    
    // Dispatch event for KYC status change
    document.dispatchEvent(new CustomEvent('kyc-status-changed', {
      bubbles: true,
      composed: true,
      detail: { status, level }
    }));
  }
  
  /**
   * Save the full KYC verification data
   */
  public async saveKycVerificationData(data: KYCCompletionData, level: KycLevel): Promise<void> {
    // Get current settings
    const currentSettings = await this.settingsRepo.getCurrentSettings();
    const currentKycData = currentSettings.kycData || {
      level: KycLevel.NONE,
      status: KycStatus.NOT_STARTED,
      lastUpdated: new Date().toISOString()
    };
    
    // Create updated KYC data with personal information
    const updatedKycData: KycData = {
      ...currentKycData,
      level,
      status: data.verificationStatus as unknown as KycStatus,
      lastUpdated: new Date().toISOString(),
      personalInfo: data.personalInfo,
      documents: {
        idDocumentName: data.uploadedFileName
      }
    };
    
    // Update in-memory state
    this.kycStatus = updatedKycData.status;
    this.currentKycLevel = updatedKycData.level;
    
    // Save to settings repository
    await this.settingsRepo.updateSettings({
      kycData: updatedKycData
    });
    
    console.debug('KYC verification data saved:', updatedKycData);
  }
  
  /**
   * Check if the user needs to complete KYC for a specific level
   */
  public async isKycRequired(requiredLevel: KycLevel): Promise<boolean> {
    const kycData = await this.getKycData();
    
    // If current level is below required or current status isn't approved
    if (
      this.getLevelValue(kycData.level) < this.getLevelValue(requiredLevel) ||
      (kycData.status !== KycStatus.APPROVED && kycData.level !== KycLevel.NONE)
    ) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a numeric value for KYC level for comparison
   */
  private getLevelValue(level: KycLevel): number {
    const levels = {
      [KycLevel.NONE]: 0,
      [KycLevel.BASIC]: 1,
      [KycLevel.STANDARD]: 2,
      [KycLevel.ENHANCED]: 3
    };
    
    return levels[level] || 0;
  }
}

// Create singleton instance
export const kycService = KycService.getInstance();
 
