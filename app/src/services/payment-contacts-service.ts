import { getSingletonManager } from "./singleton-manager";
import { PaymentContact } from "../repositories/models/payment-contact";
import { repositoryService } from "./repository-service";

/**
 * Service for managing payment contacts
 */
export class PaymentContactsService {
  private contacts: PaymentContact[] = [];
  private initialized: boolean = false;
  
  // Event handlers for contact changes
  private contactAddedHandlers: Array<(contact: PaymentContact) => void> = [];
  private contactUpdatedHandlers: Array<(contact: PaymentContact) => void> = [];
  private contactDeletedHandlers: Array<(contactId: string) => void> = [];
  
  // Private constructor for singleton pattern
  private constructor() {
    console.debug("PaymentContactsService instance created");
  }

  // Singleton accessor
  public static getInstance(): PaymentContactsService {
    const singletonManager = getSingletonManager();
    return singletonManager.getOrCreate<PaymentContactsService>(
      'PaymentContactsService', 
      () => new PaymentContactsService()
    );
  }
  
  /**
   * Initialize the service by loading contacts from storage
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.loadContacts();
    this.initialized = true;
    
    console.debug("PaymentContactsService initialized with contacts:", this.contacts.length);
  }
  
  /**
   * Get all contacts
   */
  public async getAllContacts(): Promise<PaymentContact[]> {
    await this.ensureInitialized();
    return [...this.contacts]; // Return a copy to prevent direct modification
  }
  
  /**
   * Get a contact by ID
   */
  public async getContactById(id: string): Promise<PaymentContact | undefined> {
    await this.ensureInitialized();
    return this.contacts.find(contact => contact.id === id);
  }
  
  /**
   * Add a new contact
   */
  public async addContact(contact: PaymentContact): Promise<void> {
    await this.ensureInitialized();
    
    // Don't allow duplicate IDs
    if (this.contacts.some(c => c.id === contact.id)) {
      throw new Error(`Contact with ID ${contact.id} already exists`);
    }
    
    // Add to in-memory cache
    this.contacts.push(contact);
    
    // Save to settings repository
    await repositoryService.getSettingsRepository().addPaymentContact(contact);
    
    // Notify listeners
    this.contactAddedHandlers.forEach(handler => handler(contact));
    
    console.debug("Contact added:", contact.id, contact.name);
  }
  
  /**
   * Update an existing contact
   */
  public async updateContact(contact: PaymentContact): Promise<void> {
    await this.ensureInitialized();
    
    const index = this.contacts.findIndex(c => c.id === contact.id);
    if (index === -1) {
      throw new Error(`Contact with ID ${contact.id} not found`);
    }
    
    // Update in-memory cache
    this.contacts[index] = contact;
    
    // Save to settings repository
    await repositoryService.getSettingsRepository().updatePaymentContact(contact.id, contact);
    
    // Notify listeners
    this.contactUpdatedHandlers.forEach(handler => handler(contact));
    
    console.debug("Contact updated:", contact.id);
  }
  
  /**
   * Delete a contact by ID
   */
  public async deleteContact(id: string): Promise<void> {
    await this.ensureInitialized();
    
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Contact with ID ${id} not found`);
    }
    
    // Remove from in-memory cache
    this.contacts.splice(index, 1);
    
    // Remove from settings repository
    await repositoryService.getSettingsRepository().deletePaymentContact(id);
    
    // Notify listeners
    this.contactDeletedHandlers.forEach(handler => handler(id));
    
    console.debug("Contact deleted:", id);
  }
  
  /**
   * Search contacts by name, account number, or alias
   */
  public async searchContacts(query: string): Promise<PaymentContact[]> {
    await this.ensureInitialized();
    
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [...this.contacts];
    
    return this.contacts.filter(contact => {
      return (
        contact.name.toLowerCase().includes(normalizedQuery) ||
        contact.accountNumber.toLowerCase().includes(normalizedQuery) ||
        (contact.alias?.toLowerCase().includes(normalizedQuery) || false) ||
        (contact.bankName?.toLowerCase().includes(normalizedQuery) || false)
      );
    });
  }
  
  /**
   * Add event handler for when a contact is added
   */
  public onContactAdded(handler: (contact: PaymentContact) => void): () => void {
    this.contactAddedHandlers.push(handler);
    return () => {
      this.contactAddedHandlers = this.contactAddedHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Add event handler for when a contact is updated
   */
  public onContactUpdated(handler: (contact: PaymentContact) => void): () => void {
    this.contactUpdatedHandlers.push(handler);
    return () => {
      this.contactUpdatedHandlers = this.contactUpdatedHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Add event handler for when a contact is deleted
   */
  public onContactDeleted(handler: (contactId: string) => void): () => void {
    this.contactDeletedHandlers.push(handler);
    return () => {
      this.contactDeletedHandlers = this.contactDeletedHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Force reload contacts from storage
   */
  public async refreshContacts(): Promise<void> {
    await this.loadContacts();
  }
  
  /**
   * Load contacts from settings repository
   */
  private async loadContacts(): Promise<void> {
    try {
      const contacts = await repositoryService.getSettingsRepository().getPaymentContacts();
      console.debug('PaymentContactService contacts', contacts);
      
      // Update in-memory cache
      this.contacts = contacts || [];
      
      // Fix dates if needed
      this.contacts.forEach(contact => {
        if (contact.lastUsed && typeof contact.lastUsed === 'string') {
          contact.lastUsed = new Date(contact.lastUsed);
        }
      });
      
      console.debug(`Loaded ${this.contacts.length} contacts from settings repository`);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      this.contacts = [];
    }
  }
}

export const paymentContactsService = PaymentContactsService.getInstance();
