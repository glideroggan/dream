import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { Entity } from './base-repository';
import { PaymentContact } from './models/payment-contact';

export interface UserSettings extends Entity {
  // General preferences
  theme?: string;
  language?: string;
  enableNotifications?: boolean;
  paymentContacts: PaymentContact[]
  
  // Allow for additional dynamic properties
  [key: string]: any;

  // Record of product IDs to array of page types where widgets were auto-added
  autoAddedProducts?: Record<string, string[]>; 
}

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
    kycData: undefined,
    paymentContacts: [],
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

  /**
   * Add a new payment contact
   */
  async addPaymentContact(contact: PaymentContact): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    // Generate an ID if not provided
    if (!contact.id) {
      contact.id = `contact-${Date.now()}`;
    }
    
    // Add the new contact
    const updatedContacts = [...settings.paymentContacts, contact];
    
    await this.updateSettings({
      paymentContacts: updatedContacts
    });
    
    console.debug('Payment contact added:', contact);
  }

  /**
   * Update an existing payment contact
   */
  async updatePaymentContact(contactId: string, updates: Partial<PaymentContact>): Promise<void> {
    const settings = await this.getCurrentSettings();
    const contactIndex = settings.paymentContacts.findIndex(c => c.id === contactId);
    
    if (contactIndex === -1) {
      throw new Error(`Payment contact with ID ${contactId} not found`);
    }
    
    // Update the contact
    const updatedContacts = [...settings.paymentContacts];
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      ...updates
    };
    
    await this.updateSettings({
      paymentContacts: updatedContacts
    });
    
    console.debug('Payment contact updated:', contactId, updates);
  }

  /**
   * Delete a payment contact
   */
  async deletePaymentContact(contactId: string): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    const updatedContacts = settings.paymentContacts.filter(c => c.id !== contactId);
    
    // If the same number of contacts, the contact wasn't found
    if (updatedContacts.length === settings.paymentContacts.length) {
      throw new Error(`Payment contact with ID ${contactId} not found`);
    }
    
    await this.updateSettings({
      paymentContacts: updatedContacts
    });
    
    console.debug('Payment contact deleted:', contactId);
  }

  /**
   * Get all payment contacts
   */
  async getPaymentContacts(): Promise<PaymentContact[]> {
    const settings = await this.getCurrentSettings();
    return settings.paymentContacts;
  }

  /**
   * Mark a contact as favorite or unfavorite
   */
  async toggleFavoriteContact(contactId: string, isFavorite: boolean): Promise<void> {
    await this.updatePaymentContact(contactId, { isFavorite });
  }

  /**
   * Update contact's last used timestamp
   */
  async updateContactLastUsed(contactId: string): Promise<void> {
    await this.updatePaymentContact(contactId, { lastUsed: new Date() });
  }
}

// export const settingsRepository = repositoryService.getSettingsRepository();