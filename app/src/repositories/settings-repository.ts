import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { UserSettings } from '../services/repository-service';
import { KycData } from '../services/kyc-service';

export class SettingsRepository {
  // Default settings used when no settings exist for a user
  private defaultSettings: UserSettings = {
    id: 'user-settings',
    theme: 'system',
    language: 'en',
    enableNotifications: true,
    // TODO: make these more dynamic, I might add more pages later, and I don't want to update this every time
    dashboardLayout: [],
    savingsWidgets: [],
    investmentsWidgets: [],
    // Initialize with empty KYC data
    kycData: undefined
  };

  constructor(
    private storage: StorageService,
    private userService: UserService
  ) {}

  /**
   * Get current user settings
   */
  async getCurrentSettings(): Promise<UserSettings> {
    const userId = this.userService.getCurrentUserId();
    const key = `${userId}:settings`;
    const storedSettings = this.storage.getItem<UserSettings>(key);

    if (storedSettings) {
      // Return stored settings with defaults for any missing properties
      return {
        ...this.defaultSettings,
        ...storedSettings
      };
    } else {
      // No settings found, save defaults but don't call getCurrentSettings again
      // Instead, just save and return the defaults directly
      this.storage.setItem(key, this.defaultSettings);
      return { ...this.defaultSettings };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const userId = this.userService.getCurrentUserId();
    const key = `${userId}:settings`;
    
    // Directly get stored settings without recursively calling getCurrentSettings
    let currentSettings = this.storage.getItem<UserSettings>(key);
    
    // If no settings exist yet, use defaults
    if (!currentSettings) {
      currentSettings = { ...this.defaultSettings };
    }
    
    // Merge updated settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Save to storage
    this.storage.setItem(key, updatedSettings);
    
    console.debug('Settings updated:', settings);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    const userId = this.userService.getCurrentUserId();
    const key = `${userId}:settings`;
    
    // Save default settings
    this.storage.setItem(key, this.defaultSettings);
    
    console.debug('Settings reset to defaults');
  }
}
