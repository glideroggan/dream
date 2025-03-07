import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { WidgetSize } from '../widgets/widget-registry';
import { Entity } from './base-repository';
import { PaymentContact } from './models/payment-contact';
import { PageWidgetSettings, WidgetsLayout } from './models/widget-settings';
import { defaultSettings } from './mock/settings-mock';

export interface UserSettings extends Entity {
  // General preferences
  theme?: string;
  language?: string;
  enableNotifications?: boolean;
  paymentContacts: PaymentContact[]
  
  // Widget preferences by page
  widgetLayout: WidgetsLayout;
  
  // Allow for additional dynamic properties
  [key: string]: any;

  // Record of product IDs to array of page types where widgets were auto-added
  autoAddedProducts?: Record<string, string[]>; 
}

export class SettingsRepository {
  
  constructor(
    private storage: StorageService,
    private userService: UserService
  ) {}

  /**
   * Update the size of a specific widget on a page
   * @param pageKey - The unique key/identifier for the page
   * @param widgetId - The ID of the widget to update
   * @param newSize - The new size to set for the widget
   */
  async updateWidgetSize(pageKey: string, widgetId: string, newSize: WidgetSize): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    // Initialize widgetLayout if it doesn't exist
    if (!settings.widgetLayout) {
      settings.widgetLayout = {};
    }
    
    // Initialize page widgets array if it doesn't exist
    if (!settings.widgetLayout[pageKey]) {
      settings.widgetLayout[pageKey] = [];
    }
    
    // Find the widget in the page's widget settings
    const widgetIndex = settings.widgetLayout[pageKey].findIndex(widget => widget.id === widgetId);
    
    if (widgetIndex >= 0) {
      // Update existing widget settings
      settings.widgetLayout[pageKey][widgetIndex].size = newSize;
    } else {
      // Add new widget settings
      settings.widgetLayout[pageKey].push({
        id: widgetId,
        size: newSize
      });
    }
    
    // Save updated settings
    await this.updateSettings({ widgetLayout: settings.widgetLayout });
    
    console.debug(`Updated widget ${widgetId} on page ${pageKey} to size ${newSize}`);
  }

  /**
   * Get the preferred size for a widget on a specific page
   * @param pageKey - The unique key/identifier for the page
   * @param widgetId - The ID of the widget
   * @param defaultSize - Default size to return if no preference is stored
   */
  async getWidgetSize(pageKey: string, widgetId: string, defaultSize: WidgetSize = 'md'): Promise<WidgetSize> {
    const settings = await this.getCurrentSettings();
    console.debug('current settings', settings)
    
    // Check if we have widget settings for this page and widget
    if (settings.widgetLayout && 
        settings.widgetLayout[pageKey] &&
        Array.isArray(settings.widgetLayout[pageKey])) {
      
      // Find the widget in the page's widget settings
      const widgetSettings = settings.widgetLayout[pageKey].find(widget => widget.id === widgetId);
      console.debug('widget settings', widgetSettings)
      
      if (widgetSettings && widgetSettings.size) {
        return widgetSettings.size;
      }
    }
    
    return defaultSize;
  }

  /**
   * Get all widget settings for a specific page
   * @param pageKey - The unique key/identifier for the page
   */
  async getPageWidgetSettings(pageKey: string): Promise<PageWidgetSettings[]> {
    const settings = await this.getCurrentSettings();
    
    if (settings.widgetLayout && settings.widgetLayout[pageKey]) {
      return settings.widgetLayout[pageKey];
    }
    
    return [];
  }

  /**
   * Save the complete widget layout for a page
   * @param pageKey - The unique key/identifier for the page
   * @param pageWidgets - The array of widget settings
   */
  async savePageWidgetLayout(pageKey: string, pageWidgets: PageWidgetSettings[]): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    // Initialize widgetLayout if it doesn't exist
    if (!settings.widgetLayout) {
      settings.widgetLayout = {};
    }
    
    // Update the page's widget layout
    settings.widgetLayout[pageKey] = pageWidgets;
    
    // Save updated settings
    await this.updateSettings({ widgetLayout: settings.widgetLayout });
    
    console.debug(`Saved widget layout for page ${pageKey}:`, pageWidgets);
  }

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
        ...defaultSettings,
        ...storedSettings
      };
    } else {
      // No settings found, save defaults but don't call getCurrentSettings again
      // Instead, just save and return the defaults directly
      this.storage.setItem(key, defaultSettings);
      return { ...defaultSettings };
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
      currentSettings = { ...defaultSettings };
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
    this.storage.setItem(key, defaultSettings);
    
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
