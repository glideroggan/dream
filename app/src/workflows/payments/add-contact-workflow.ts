import { customElement, observable, attr, Observable, FASTElement } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";
import "@primitives/button";
import { PaymentContact } from "../../repositories/models/payment-contact";
import { generateUniqueId } from "../../utilities/id-generator";
import { paymentContactsService } from "../../services/payment-contacts-service";
import { template } from "./add-contact-workflow.template";
import { styles } from "./add-contact-workflow.css";

@customElement({
  name: "add-contact-workflow",
  template,
  styles
})
export class AddContactWorkflow extends WorkflowBase {
  @observable contactName: string = '';
  @observable accountNumber: string = '';
  @observable bankName: string = '';
  @observable alias: string = '';
  @observable notes: string = '';
  @observable isFavorite: boolean = false;
  @observable errors: Record<string, string> = {};

  // Form input references
  inputNameElement!: HTMLInputElement;
  inputAccountElement!: HTMLInputElement;
  inputBankElement!: HTMLInputElement;
  inputAliasElement!: HTMLInputElement;
  textareaNotesElement!: HTMLTextAreaElement;
  
  // If editing an existing contact, store its ID
  @attr existingContactId: string = '';

  // New properties for tabbed interface
  @observable activeTab: 'add' | 'manage' | 'remove' = 'add';
  @observable contacts: PaymentContact[] = [];
  @observable isLoading: boolean = false;
  
  // Delete confirmation
  @observable showConfirmDialog: boolean = false;
  @observable contactToDelete: PaymentContact | null = null;
  
  // Success message properties
  @observable showSuccessMessage: boolean = false;
  @observable successMessage: string = '';
  private successMessageTimeout: number | null = null;
  private unsubscribe?: () => void;
  
  async initialize(params?: Record<string, any>): Promise<void> {
    console.debug("Initializing AddContactWorkflow with params:", params);
    
    this.updateTitle("Payment Contacts");
    this.updateFooter(true, "Save Contact");

    // Set initial tab from params or default to 'add'
    this.activeTab = (params?.startTab as 'add' | 'manage' | 'remove') || 'add';
    
    // If we're editing an existing contact, populate the form and switch to add tab
    if (params?.contactId) {
      this.existingContactId = params.contactId;
      this.loadExistingContact(params.contactId);
      this.activeTab = 'add';
      this.updateTitle("Edit Payment Contact");
    }
    
    // If account number was provided, pre-fill it
    if (params?.accountNumber) {
      this.accountNumber = params.accountNumber;
    }
    
    // If we're on manage or remove tab, load contacts
    // if (this.activeTab === 'manage' || this.activeTab === 'remove') {
    //   this.loadContacts();
    // }

    await this.loadContacts();
    
    
    this.validateForm();
    this.updateButtonsVisibility();
  }

  connectedCallback(): void {
    super.connectedCallback();
    // subscribe to updates from the contact service
    this.unsubscribe = paymentContactsService.subscribe(this.contactChanged.bind(this));
  }

  // Clean up any timers when the component is disconnected
  disconnectedCallback(): void {
    if (this.successMessageTimeout !== null) {
      window.clearTimeout(this.successMessageTimeout);
      this.successMessageTimeout = null;
    }
    this.unsubscribe?.();
    
    super.disconnectedCallback?.();
  }

  private async contactChanged(): Promise<void> {
    console.debug('Payment contact changed, reloading contacts...');
    await this.loadContacts();
  }
  
  setActiveTab(tab: 'add' | 'manage' | 'remove'): void {
    this.activeTab = tab;
    
    // Update the workflow title based on the active tab
    switch(tab) {
      case 'add':
        this.updateTitle(this.existingContactId ? "Edit Payment Contact" : "Add Payment Contact");
        this.updateFooter(true, this.existingContactId ? "Update Contact" : "Save Contact");
        break;
      case 'manage':
        this.updateTitle("Manage Contacts");
        this.updateFooter(false);
        this.loadContacts();
        break;
      case 'remove':
        this.updateTitle("Remove Contacts");
        this.updateFooter(false);
        this.loadContacts();
        break;
    }
    
    this.updateButtonsVisibility();
  }
  
  private async loadContacts(): Promise<void> {
    // this.isLoading = true;
    
    try {
      this.contacts = await paymentContactsService.getAllContacts();
      Observable.notify(this, 'contacts');
      console.debug("Loaded contacts:", this.contacts.length);

    } catch (error) {
      console.error("Failed to load contacts:", error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private async loadExistingContact(contactId: string): Promise<void> {
    try {
      const contact = await paymentContactsService.getContactById(contactId);
      if (contact) {
        this.contactName = contact.name;
        this.accountNumber = contact.accountNumber;
        this.bankName = contact.bankName || '';
        this.alias = contact.alias || '';
        this.notes = contact.notes || '';
        this.isFavorite = contact.isFavorite || false;
      }
    } catch (error) {
      console.error("Failed to load contact:", error);
    }
  }
  
  editContact(contact: PaymentContact): void {
    this.existingContactId = contact.id;
    this.contactName = contact.name;
    this.accountNumber = contact.accountNumber;
    this.bankName = contact.bankName || '';
    this.alias = contact.alias || '';
    this.notes = contact.notes || '';
    this.isFavorite = contact.isFavorite || false;
    
    // Switch to add tab in edit mode
    this.activeTab = 'add';
    this.updateTitle("Edit Payment Contact");
    this.updateFooter(true, "Update Contact");
    this.updateButtonsVisibility();
  }
  
  confirmDeleteContact(contact: PaymentContact): void {
    this.contactToDelete = contact;
    this.showConfirmDialog = true;
  }
  
  cancelDelete(): void {
    this.showConfirmDialog = false;
    this.contactToDelete = null;
  }
  
  async deleteContact(): Promise<void> {
    if (!this.contactToDelete) return;
    
    try {
      const contactName = this.contactToDelete.name;
      await paymentContactsService.deleteContact(this.contactToDelete.id);
      
      // Dispatch a custom event for the contact deletion
      // const contactDeletedEvent = new CustomEvent('contactDeleted', {
      //   bubbles: true,
      //   composed: true,
      //   detail: { contactId: this.contactToDelete.id }
      // });
      // this.dispatchEvent(contactDeletedEvent);
      
      // Hide the confirmation dialog
      this.showConfirmDialog = false;
      this.contactToDelete = null;
      
      // Show success message
      this.showSuccessMessage = true;
      this.successMessage = `Contact "${contactName}" was removed successfully!`;
      
      // Clear any existing timeout
      if (this.successMessageTimeout !== null) {
        window.clearTimeout(this.successMessageTimeout);
      }
      
      // Hide success message after a delay
      this.successMessageTimeout = window.setTimeout(() => {
        this.showSuccessMessage = false;
        this.successMessageTimeout = null;
      }, 4000); // 4 seconds
      
      // Reload the contacts list
      // this.loadContacts();
      
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  }
  
  updateButtonsVisibility(): void {
    const isAddTab = this.activeTab === 'add';
    this.updateFooter(isAddTab, isAddTab ? (this.existingContactId ? "Update Contact" : "Save Contact") : "");
    
    // Update the workflow validation state
    if (isAddTab) {
      this.validateForm();
    } else {
      this.notifyValidation(true);
    }
  }
  
  handleNameInput(event: Event): void {
    this.contactName = (event.target as HTMLInputElement).value;
    this.validateForm();
  }
  
  handleAccountNumberInput(event: Event): void {
    this.accountNumber = (event.target as HTMLInputElement).value;
    this.validateForm();
  }
  
  handleBankNameInput(event: Event): void {
    this.bankName = (event.target as HTMLInputElement).value;
  }
  
  handleAliasInput(event: Event): void {
    this.alias = (event.target as HTMLInputElement).value;
  }
  
  handleNotesInput(event: Event): void {
    this.notes = (event.target as HTMLTextAreaElement).value;
  }
  
  handleFavoriteToggle(event: Event): void {
    const customEvent = event as CustomEvent;
    this.isFavorite = customEvent.detail.checked;
  }
  
  handleSubmit(event: Event): void {
    event.preventDefault();
    this.saveContact();
  }
  
  validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!this.contactName.trim()) {
      errors.name = "Contact name is required";
    }
    
    if (!this.accountNumber.trim()) {
      errors.accountNumber = "Account number is required";
    } else if (!/^[a-zA-Z0-9\-\s]+$/.test(this.accountNumber)) {
      errors.accountNumber = "Account number should only contain letters, numbers, spaces and hyphens";
    }
    
    this.errors = errors;
    const isValid = Object.keys(errors).length === 0;
    
    // Notify the workflow container about validation state
    this.notifyValidation(isValid);
    
    return isValid;
  }
  
  handlePrimaryAction(): void {
    if (this.activeTab === 'add' && this.validateForm()) {
      this.saveContact();
    }
  }
  
  private async saveContact(): Promise<void> {
    console.debug("Saving contact...");
    try {
      const contactData: PaymentContact = {
        id: this.existingContactId || generateUniqueId(),
        name: this.contactName.trim(),
        accountNumber: this.accountNumber.trim(),
        bankName: this.bankName.trim() || undefined,
        alias: this.alias.trim() || undefined,
        notes: this.notes.trim() || undefined,
        lastUsed: new Date(),
        isFavorite: this.isFavorite
      };
      
      const isUpdate = !!this.existingContactId;
      
      if (isUpdate) {
        console.debug("Updating existing contact:", contactData);
        await paymentContactsService.updateContact(contactData);
      } else {
        console.debug("Adding new contact:", contactData);
        await paymentContactsService.addContact(contactData);
      }
      
      // Dispatch a custom event before completing the workflow
      // const eventName = isUpdate ? 'contactUpdated' : 'contactCreated';
      // const contactEvent = new CustomEvent(eventName, {
      //   bubbles: true,
      //   composed: true,
      //   detail: { contact: contactData }
      // });
      // this.dispatchEvent(contactEvent);
      
      // Show success message
      this.showSuccessMessage = true;
      this.successMessage = isUpdate 
        ? `Contact "${contactData.name}" was updated successfully!`
        : `Contact "${contactData.name}" was added successfully!`;
      
      // Clear any existing timeout
      if (this.successMessageTimeout !== null) {
        window.clearTimeout(this.successMessageTimeout);
      }
      
      // Hide success message after a delay
      this.successMessageTimeout = window.setTimeout(() => {
        this.showSuccessMessage = false;
        this.successMessageTimeout = null;
      }, 4000); // 4 seconds
      
      // Clear the form if adding a new contact
      if (!isUpdate) {
        console.debug("Clearing form after adding new contact");
        this.resetForm();
      } else {
        // If updating, switch back to manage tab
        this.existingContactId = '';
        this.setActiveTab('manage');
      }
      
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  }
  
  resetForm(): void {
    // Clear all form inputs directly using refs
    this.inputNameElement.value = '';
    this.inputAccountElement.value = '';
    this.inputBankElement.value = '';
    this.inputAliasElement.value = '';
    this.textareaNotesElement.value = '';
    
    // Reset observable values to ensure data binding is updated
    this.contactName = '';
    this.accountNumber = '';
    this.bankName = '';
    this.alias = '';
    this.notes = '';
    this.isFavorite = false;
    
    // Reset other state
    this.existingContactId = '';
    this.errors = {};
    
    // Update title back to Add Payment Contact
    if (this.activeTab === 'add') {
      this.updateTitle("Add Payment Contact");
      this.updateFooter(true, "Save Contact");
    }
    
    // Validate to ensure Save button is disabled
    this.validateForm();
    
    // Focus the first input field after reset
    setTimeout(() => {
      if (this.inputNameElement) {
        this.inputNameElement.focus();
      }
    }, 0);
  }
  
  
}
