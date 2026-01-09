import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { Entity, LocalStorageRepository } from './base-repository';
import { PaymentContact } from './models/payment-contact';
import { PageWidgetSettings, WidgetsLayout } from './models/widget-settings';

export interface UserSettings extends Entity {
  // General preferences
  theme?: string;
  language?: string;
  enableNotifications?: boolean;
  paymentContacts: PaymentContact[];

  // Sidebar state
  sidebarClosed?: boolean;
  
  // Widget preferences by page
  widgetLayout: WidgetsLayout;
  
  // Record of product IDs to array of page types where widgets were auto-added
  autoAddedProducts?: Record<string, string[]>;
  
  // Allow for additional dynamic properties
  [key: string]: any;
}

export class SettingsRepository extends LocalStorageRepository<UserSettings> {
  
  
  constructor(
    storage: StorageService,
    userService: UserService
  ) {
    super('settings', storage, userService);
  }

  protected async initializeMockData(): Promise<void> {
    // Use the default settings as mock data
    const module = await import("@mocks/settings")
    const mockSettings = { ...module.defaultSettings };
    
    // Add mock settings
    this.createForMocks(mockSettings);
    
    // Save to storage
    this.saveToStorage();
    
    console.debug('Initialized settings with default mock data');
  }

  async removeWidgetFromLayout(pageType: string, widgetId: string): Promise<void> {
    const settings = await this.getCurrentSettings();
    const key = `${pageType}Widgets`;
    const widgets = settings[key] || [];
    const updatedWidgets = widgets.filter((id:string) => id !== widgetId);
    await this.update(settings.id, { [key]: updatedWidgets });
    console.debug(`Removed widget ${widgetId} from ${pageType}`);
  }

  /**
   * Update the grid dimensions of a specific widget on a page
   */
  async updateWidgetGridDimensions(
    pageKey: string, 
    widgetId: string, 
    colSpan: number, 
    rowSpan: number
  ): Promise<void> {
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
      settings.widgetLayout[pageKey][widgetIndex].colSpan = colSpan;
      settings.widgetLayout[pageKey][widgetIndex].rowSpan = rowSpan;
    } else {
      // Add new widget settings
      settings.widgetLayout[pageKey].push({
        id: widgetId,
        colSpan,
        rowSpan
      });
    }
    
    // Save updated settings
    await this.update(settings.id, { widgetLayout: settings.widgetLayout });
    
    console.debug(`Updated widget ${widgetId} on page ${pageKey} to dimensions ${colSpan}x${rowSpan}`);
  }

  /**
   * Ensure a widget exists in the layout
   */
  async ensureWidgetInLayout(pageKey: string, widgetId: string): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    // Initialize widgetLayout if it doesn't exist
    if (!settings.widgetLayout) {
      settings.widgetLayout = {};
    }
    
    // Initialize page widgets array if it doesn't exist
    if (!settings.widgetLayout[pageKey]) {
      settings.widgetLayout[pageKey] = [];
    }
    
    // Check if widget already exists in layout
    const widgetExists = settings.widgetLayout[pageKey].some(widget => widget.id === widgetId);
    
    // If not, add it with default dimensions
    if (!widgetExists) {
      settings.widgetLayout[pageKey].push({
        id: widgetId,
        colSpan: 8,  // Default to half-width
        rowSpan: 2   // Default to 2 rows
      });
      
      // Save updated settings
      await this.update(settings.id, { widgetLayout: settings.widgetLayout });
      
      console.debug(`Added widget ${widgetId} to layout for page ${pageKey} with default dimensions`);
    }
  }

  /**
   * Get the grid dimensions for a widget on a specific page
   */
  async getWidgetGridDimensions(
    pageKey: string, 
    widgetId: string, 
    defaultColSpan: number = 8,
    defaultRowSpan: number = 1
  ): Promise<{colSpan: number, rowSpan: number}> {
    const settings = await this.getCurrentSettings();
    
    // Check if we have widget settings for this page and widget
    if (settings.widgetLayout && 
        settings.widgetLayout[pageKey] &&
        Array.isArray(settings.widgetLayout[pageKey])) {
      
      // Find the widget in the page's widget settings
      const widgetSettings = settings.widgetLayout[pageKey].find(widget => widget.id === widgetId);
      
      if (widgetSettings) {
        // Use stored grid dimensions if available
        const colSpan = widgetSettings.colSpan ?? defaultColSpan;
        const rowSpan = widgetSettings.rowSpan ?? defaultRowSpan;
        
        return { colSpan, rowSpan };
      }
    }
    
    // Return defaults if no settings found
    return { colSpan: defaultColSpan, rowSpan: defaultRowSpan };
  }

  /**
   * Get all widget settings for a specific page
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
    await this.update(settings.id, { widgetLayout: settings.widgetLayout });
    
    console.debug(`Saved widget layout for page ${pageKey}:`, pageWidgets);
  }

  /**
   * Update widget order for a page based on current DOM order
   */
  async updateWidgetOrder(pageKey: string, widgetIds: string[]): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    // Initialize widgetLayout if it doesn't exist
    if (!settings.widgetLayout) {
      settings.widgetLayout = {};
    }
    
    // Initialize page widgets array if it doesn't exist
    if (!settings.widgetLayout[pageKey]) {
      settings.widgetLayout[pageKey] = [];
    }
    
    // Update order property for each widget based on position in array
    widgetIds.forEach((widgetId, index) => {
      const widgetIndex = settings.widgetLayout[pageKey].findIndex(w => w.id === widgetId);
      
      if (widgetIndex >= 0) {
        settings.widgetLayout[pageKey][widgetIndex].order = index;
      } else {
        // Widget not in layout yet - add it with order
        settings.widgetLayout[pageKey].push({
          id: widgetId,
          colSpan: 8,
          rowSpan: 2,
          order: index
        });
      }
    });
    
    // Save updated settings
    await this.update(settings.id, { widgetLayout: settings.widgetLayout });
    
    console.debug(`Updated widget order for page ${pageKey}:`, widgetIds);
  }

  /**
   * Update widget grid position (V2 - explicit positioning)
   */
  async updateWidgetGridPosition(
    pageKey: string,
    widgetId: string,
    gridCol: number,
    gridRow: number,
    colSpan: number,
    rowSpan: number
  ): Promise<void> {
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
      settings.widgetLayout[pageKey][widgetIndex].gridCol = gridCol;
      settings.widgetLayout[pageKey][widgetIndex].gridRow = gridRow;
      settings.widgetLayout[pageKey][widgetIndex].colSpan = colSpan;
      settings.widgetLayout[pageKey][widgetIndex].rowSpan = rowSpan;
    } else {
      // Add new widget settings
      settings.widgetLayout[pageKey].push({
        id: widgetId,
        gridCol,
        gridRow,
        colSpan,
        rowSpan
      });
    }
    
    // Save updated settings
    await this.update(settings.id, { widgetLayout: settings.widgetLayout });
    
    console.debug(`Updated widget ${widgetId} on page ${pageKey} to position (${gridCol},${gridRow}) size ${colSpan}x${rowSpan}`);
  }

  /**
   * Update all widget positions for a page (V2 - bulk update after drag/resize)
   */
  async updateAllWidgetPositions(
    pageKey: string,
    positions: Array<{ id: string; col: number; row: number; colSpan: number; rowSpan: number }>
  ): Promise<void> {
    const settings = await this.getCurrentSettings();
    
    // Initialize widgetLayout if it doesn't exist
    if (!settings.widgetLayout) {
      settings.widgetLayout = {};
    }
    
    // Initialize page widgets array if it doesn't exist
    if (!settings.widgetLayout[pageKey]) {
      settings.widgetLayout[pageKey] = [];
    }
    
    // Update each position
    for (const pos of positions) {
      const widgetIndex = settings.widgetLayout[pageKey].findIndex(widget => widget.id === pos.id);
      
      if (widgetIndex >= 0) {
        settings.widgetLayout[pageKey][widgetIndex].gridCol = pos.col;
        settings.widgetLayout[pageKey][widgetIndex].gridRow = pos.row;
        settings.widgetLayout[pageKey][widgetIndex].colSpan = pos.colSpan;
        settings.widgetLayout[pageKey][widgetIndex].rowSpan = pos.rowSpan;
      } else {
        settings.widgetLayout[pageKey].push({
          id: pos.id,
          gridCol: pos.col,
          gridRow: pos.row,
          colSpan: pos.colSpan,
          rowSpan: pos.rowSpan
        });
      }
    }
    
    // Save updated settings
    await this.update(settings.id, { widgetLayout: settings.widgetLayout });
    
    console.debug(`Updated ${positions.length} widget positions for page ${pageKey}`);
  }

  /**
   * Get widget position (V2)
   */
  async getWidgetGridPosition(
    pageKey: string,
    widgetId: string
  ): Promise<{ gridCol?: number; gridRow?: number; colSpan: number; rowSpan: number } | null> {
    const settings = await this.getCurrentSettings();
    
    if (settings.widgetLayout && settings.widgetLayout[pageKey]) {
      const widgetSettings = settings.widgetLayout[pageKey].find(widget => widget.id === widgetId);
      
      if (widgetSettings) {
        return {
          gridCol: widgetSettings.gridCol,
          gridRow: widgetSettings.gridRow,
          colSpan: widgetSettings.colSpan ?? 8,
          rowSpan: widgetSettings.rowSpan ?? 4
        };
      }
    }
    
    return null;
  }

  /**
   * Get current user settings
   */
  async getCurrentSettings(): Promise<UserSettings> {
    const settings = await this.getAll();
    
    // There should only be one settings entry per user
    if (settings.length > 0) {
      return settings[0];
    } else {
      // Create a new settings entry with default values
      // TODO: in two places, we should fix a general function to cache things and import
      const module = await import("@mocks/settings")
      return this.create({ ...module.defaultSettings });
    }
  }

  /**
   * 
   */
  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    let settings = await this.getCurrentSettings();
    settings = { ...settings, ...updates };
    await this.update(settings.id, updates);
  }

  /**
   * Add a new payment contact
   */
  async addPaymentContact(contact: PaymentContact): Promise<void> {
    const settings = await this.getCurrentSettings();
    console.debug('contacts:', settings.paymentContacts)
    
    // Generate an ID if not provided
    if (!contact.id) {
      contact.id = `contact-${Date.now()}`;
    }
    
    // Add the new contact
    const updatedContacts = [...settings.paymentContacts, contact];
    console.debug('updatedContacts:', updatedContacts)
    
    await this.update(settings.id, {
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
    
    await this.update(settings.id, {
      paymentContacts: updatedContacts
    });
    
    console.debug('Payment contact updated:', contactId, updates);
  }

  /**
   * Delete a payment contact
   */
  async deletePaymentContact(contactId: string): Promise<void> {
    const settings = await this.getCurrentSettings();
    console.debug('before delete:', settings.paymentContacts)
    
    const updatedContacts = settings.paymentContacts.filter(c => c.id !== contactId);
    console.debug('after delete:', updatedContacts)
    
    // If the same number of contacts, the contact wasn't found
    if (updatedContacts.length === settings.paymentContacts.length) {
      throw new Error(`Payment contact with ID ${contactId} not found`);
    }
    
    await this.update(settings.id, {
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
