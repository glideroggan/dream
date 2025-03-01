import { UserSettings } from '../services/repository-service';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { LocalStorageRepository } from './base-repository';

// Settings repository implementation
export class SettingsRepository extends LocalStorageRepository<UserSettings> {
  constructor(storage: StorageService, userService: UserService) {
    super('settings', storage, userService);
  }
  
  protected initializeMockData(): void {
    const defaultSettings: UserSettings = {
      id: 'default-settings',
      theme: 'light',
      enableNotifications: true,
      dashboardLayout: ['welcome', 'account'],
      preferredWidgets: ['account', 'welcome']
    };
    
    this.entities.set(defaultSettings.id, defaultSettings);
    this.saveToStorage();
  }
  
  /**
   * Get current user settings or create if not exists
   */
  async getCurrentSettings(): Promise<UserSettings> {
    const settings = await this.getAll();
    
    if (settings.length === 0) {
      // Create default settings if none exist
      return this.create({
        theme: 'light',
        enableNotifications: true,
        dashboardLayout: ['welcome', 'account'],
        preferredWidgets: ['account', 'welcome']
      });
    }
    
    return settings[0];
  }
  
  /**
   * Update current user settings
   */
  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getCurrentSettings();
    return this.update(current.id, updates) as Promise<UserSettings>;
  }
}
