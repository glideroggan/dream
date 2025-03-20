import { EnhancedPersonalInfo } from '../workflows/kyc/kyc-workflow';
import { storageService, StorageService } from './storage-service';
import { userService, UserService } from './user-service';

/**
 * KYC (Know Your Customer) verification levels
 */
export enum KycLevel {
  NONE = 'none',
  BASIC = 'basic',
  STANDARD = 'standard',
  BUSINESS = 'business',
  ENHANCED = 'enhanced'
}

/**
 * KYC verification status
 */
export enum KycStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * KYC verification data interface
 */
export interface KycVerificationData {
  userId: string;
  level: KycLevel;
  status: KycStatus;
  personal?: Partial<EnhancedPersonalInfo>;
  lastVerified?: string;
  expiresAt?: string;
  requirements?: Record<string, boolean>;
}

export interface KYCCompletionData {
  personalInfo: Partial<EnhancedPersonalInfo>;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  uploadedFileName?: string;
}

/**
 * Service for managing KYC verification processes
 */
export class KycService {
  
  private static instance: KycService;
  private storage: StorageService;
  private userService: UserService;
  private storageKey = 'kyc-data';
  
  // Store KYC status for the current user
  private currentUserKycData: KycVerificationData | null = null;
  
  // Store KYC requirement status for the current user
  private kycRequirementCache: Map<string, boolean> = new Map();
  
  // Private constructor for singleton pattern
  private constructor(storage: StorageService, userService: UserService) {
    console.debug('KycService initialized');
    this.storage = storage;
    this.userService = userService;
    this.loadKycDataFromStorage();
  }
  
  /**
   * Get KycService instance (singleton)
   */
  public static getInstance(storage: StorageService, userService: UserService): KycService {
    if (!KycService.instance) {
      KycService.instance = new KycService(storage, userService);
    }
    return KycService.instance;
  }

  async getPersonal(): Promise<Partial<EnhancedPersonalInfo>> {
    const userId = this.userService.getCurrentUser()?.id;
    if (!userId) {
      console.warn('Cannot get personal info: No current user');
      return {};
    }
    
    // Load KYC data from storage
    this.loadKycDataFromStorage();
    
    // Return personal info if available
    return this.currentUserKycData?.personal || {};
  }
  
  /**
   * Load KYC data from storage for the current user
   */
  private loadKycDataFromStorage(): void {
    const userId = this.userService.getCurrentUser()?.id;
    if (!userId) {
      console.warn('Cannot load KYC data: No current user');
      return;
    }
    
    try {
      const allKycData = this.storage.getItem<Record<string, KycVerificationData>>(this.storageKey) || {};
      this.currentUserKycData = allKycData[userId] || null;
      
      if (this.currentUserKycData) {
        console.debug(`Loaded KYC data for user ${userId}:`, this.currentUserKycData);
        
        // Initialize requirement cache from stored data
        this.kycRequirementCache.clear();
        if (this.currentUserKycData.requirements) {
          for (const [req, isCompleted] of Object.entries(this.currentUserKycData.requirements)) {
            this.kycRequirementCache.set(req, isCompleted);
          }
        }
      } else {
        console.debug(`No KYC data found for user ${userId}`);
      }
    } catch (error) {
      console.error('Error loading KYC data from storage:', error);
    }
  }
  
  /**
   * Save KYC data to storage
   */
  private saveKycDataToStorage(): void {
    const userId = this.userService.getCurrentUser()?.id;
    if (!userId || !this.currentUserKycData) {
      console.warn('Cannot save KYC data: No current user or KYC data');
      return;
    }
    
    try {
      // Get all KYC data
      const allKycData = this.storage.getItem<Record<string, KycVerificationData>>(this.storageKey) || {};
      
      // Update the current user's data
      allKycData[userId] = this.currentUserKycData;
      
      // Save back to storage
      this.storage.setItem(this.storageKey, allKycData);
      console.debug(`Saved KYC data for user ${userId}`);
    } catch (error) {
      console.error('Error saving KYC data to storage:', error);
    }
  }
  
  /**
   * Get current KYC verification level for the user
   */
  public getCurrentKycLevel(): KycLevel {
    return this.currentUserKycData?.level || KycLevel.NONE;
  }
  
  /**
   * Get current KYC verification status for the user
   */
  public getCurrentKycStatus(): KycStatus {
    return this.currentUserKycData?.status || KycStatus.NONE;
  }
  
  /**
   * Check if the user meets a specific KYC requirement
   */
  public meetsKycRequirements(requirementId: string): boolean {
    // // First check from cache for performance
    // if (this.kycRequirementCache.has(requirementId)) {
    //   const result = this.kycRequirementCache.get(requirementId) || false;
    //   console.debug(`KYC requirement check (from cache) for ${requirementId}: ${result}`);
    //   return result;
    // }

    // TODO: fix this, we should either always use a service when saving/manipulating data
    // or the service _needs_ to subscribe to data changes from the store
    this.loadKycDataFromStorage(); // Ensure we have the latest data loaded
    
    // If not in cache, check from current user's KYC data
    const meetsRequirement = !!this.currentUserKycData?.requirements?.[requirementId];
    
    // Cache the result
    this.kycRequirementCache.set(requirementId, meetsRequirement);
    
    console.debug(`KYC requirement check for ${requirementId}: ${meetsRequirement}`);
    return meetsRequirement;
  }
  
  /**
   * Update KYC verification status (e.g. from a verification workflow)
   */
  public async updateKycStatus(status: KycStatus, level: KycLevel): Promise<void> {
    const userId = this.userService.getCurrentUser()?.id;
    if (!userId) {
      console.warn('Cannot update KYC status: No current user');
      return;
    }
    
    console.debug(`Updating KYC status to ${status} at level ${level}`);
    
    // Initialize KYC data if it doesn't exist
    if (!this.currentUserKycData) {
      this.currentUserKycData = {
        userId,
        level: KycLevel.NONE,
        status: KycStatus.NONE,
        requirements: {}
      };
    }
    
    // Update status and level
    this.currentUserKycData.status = status;
    
    // Only upgrade the level, never downgrade
    if (this.getLevelValue(level) > this.getLevelValue(this.currentUserKycData.level)) {
      this.currentUserKycData.level = level;
    }
    
    // Set last verification date
    this.currentUserKycData.lastVerified = new Date().toISOString();
    
    // Set expiration date (e.g. 1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    this.currentUserKycData.expiresAt = expiryDate.toISOString();
    
    // Save updated data
    this.saveKycDataToStorage();
  }
  
  /**
   * Convert KYC level enum to numeric value for comparison
   */
  private getLevelValue(level: KycLevel): number {
    switch (level) {
      case KycLevel.NONE: return 0;
      case KycLevel.BASIC: return 1;
      case KycLevel.STANDARD: return 2;
      case KycLevel.ENHANCED: return 3;
      default: return 0;
    }
  }
  
  /**
   * Save KYC verification data 
   * This should be called after a successful verification process
   */
  public async saveKycVerificationData(data: KYCCompletionData, level: KycLevel): Promise<void> {
    console.debug('Saving KYC verification data:', data, level);
    const userId = this.userService.getCurrentUser()?.id;
    if (!userId) {
      console.warn('Cannot save KYC verification data: No current user');
      return;
    }
    
    console.debug(`Saving KYC verification data at level ${level}:`, data);
    
    // Initialize KYC data if it doesn't exist
    if (!this.currentUserKycData) {
      this.currentUserKycData = {
        userId,
        level: KycLevel.NONE,
        status: KycStatus.NONE,
        personal: data.personalInfo,
        requirements: {}
      };
    }
    
    // Initialize requirements object if needed
    if (!this.currentUserKycData.requirements) {
      this.currentUserKycData.requirements = {};
    }
    
    // Set appropriate requirements as met based on the level
    if (level === KycLevel.BASIC || level === KycLevel.STANDARD || level === KycLevel.ENHANCED) {
      this.currentUserKycData.requirements['basic'] = true;
      this.kycRequirementCache.set('basic', true);
    }
    
    if (level === KycLevel.STANDARD || level === KycLevel.ENHANCED) {
      // Add specific product KYC requirements (typical ones)
      this.currentUserKycData.requirements['standard'] = true;
      this.currentUserKycData.requirements['isk-account'] = true;
      this.currentUserKycData.requirements['pension-account'] = true;
      this.currentUserKycData.requirements['loan-applicant'] = true;
      
      // Update cache
      this.kycRequirementCache.set('standard', true);
      this.kycRequirementCache.set('isk-account', true);
      this.kycRequirementCache.set('pension-account', true);
      this.kycRequirementCache.set('loan-applicant', true);
      
      console.debug('Set standard KYC requirements as met');
    }
    
    if (level === KycLevel.ENHANCED) {
      this.currentUserKycData.requirements['enhanced'] = true;
      this.currentUserKycData.requirements['mortgage-applicant'] = true;
      
      // Update cache
      this.kycRequirementCache.set('enhanced', true);
      this.kycRequirementCache.set('mortgage-applicant', true);
      
      console.debug('Set enhanced KYC requirements as met');
    }
    
    // Save updated data
    this.saveKycDataToStorage();
  }
  
  /**
   * Check if a user needs to complete KYC to use a specific product
   */
  public needsKycForProduct(product: { requiresKyc?: boolean, kycRequirementId?: string }): boolean {
    if (!product.requiresKyc || !product.kycRequirementId) {
      return false;
    }
    
    return !this.meetsKycRequirements(product.kycRequirementId);
  }
  
  /**
   * Reset KYC status (for testing/development)
   */
  public resetKycStatus(): void {
    const userId = this.userService.getCurrentUser()?.id;
    if (!userId) {
      console.warn('Cannot reset KYC status: No current user');
      return;
    }
    
    this.currentUserKycData = {
      userId,
      level: KycLevel.NONE,
      status: KycStatus.NONE,
      requirements: {}
    };
    
    this.kycRequirementCache.clear();
    this.saveKycDataToStorage();
    console.debug('KYC status reset for current user');
  }
}

// Create and export a singleton KycService instance
export const kycService = KycService.getInstance(storageService, userService);

