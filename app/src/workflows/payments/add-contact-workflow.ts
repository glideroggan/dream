import { customElement, html, css, observable, attr, when } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";
import { PaymentContact } from "../../repositories/models/payment-contact";
import { generateUniqueId } from "../../utilities/id-generator";
import { paymentContactsService } from "../../services/payment-contacts-service";

const template = html<AddContactWorkflow>/*html*/`
  <div class="add-contact-workflow">
    <form @submit="${(x, c) => x.handleSubmit(c.event)}">
      <div class="form-group">
        <label for="contactName">Contact Name</label>
        <input 
          id="contactName"
          type="text"
          value="${x => x.contactName}"
          @input="${(x, c) => x.handleNameInput(c.event)}"
          required
        />
        ${when(x => x.errors.name, html`<div class="error-message">${x => x.errors.name}</div>`)}
      </div>

      <div class="form-group">
        <label for="accountNumber">Account Number</label>
        <input 
          id="accountNumber"
          type="text"
          value="${x => x.accountNumber}"
          @input="${(x, c) => x.handleAccountNumberInput(c.event)}"
          required
        />
        ${when(x => x.errors.accountNumber, html`<div class="error-message">${x => x.errors.accountNumber}</div>`)}
      </div>

      <div class="form-group">
        <label for="bankName">Bank Name</label>
        <input 
          id="bankName"
          type="text"
          value="${x => x.bankName}"
          @input="${(x, c) => x.handleBankNameInput(c.event)}"
        />
      </div>

      <div class="form-group">
        <label for="alias">Alias (Optional)</label>
        <input 
          id="alias"
          type="text"
          value="${x => x.alias}"
          @input="${(x, c) => x.handleAliasInput(c.event)}"
          placeholder="Nickname for this contact"
        />
      </div>

      <div class="form-group">
        <label for="notes">Notes (Optional)</label>
        <textarea 
          id="notes"
          value="${x => x.notes}"
          @input="${(x, c) => x.handleNotesInput(c.event)}"
          placeholder="Any additional information"
          rows="3"
        ></textarea>
      </div>
      
      ${when(x => x.isFavorite, html`
        <div class="favorite-badge">
          <span>★</span> Saved as favorite
        </div>
      `)}
      
      <div class="form-group checkbox-group">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            ?checked="${x => x.isFavorite}"
            @change="${(x, c) => x.handleFavoriteToggle(c.event)}"
          />
          <span class="checkbox-text">Add to favorites</span>
        </label>
      </div>
    </form>
  </div>
`;

const styles = css`
  .add-contact-workflow {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0;
    width: 100%;
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  input, textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  input:focus, textarea:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 13px;
  }
  
  .checkbox-group {
    margin-top: 8px;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .checkbox-text {
    font-size: 14px;
  }
  
  .favorite-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(241, 196, 15, 0.1);
    border: 1px solid rgba(241, 196, 15, 0.3);
    border-radius: 16px;
    padding: 4px 12px;
    font-size: 14px;
    color: #f39c12;
    animation: fadeIn 0.3s ease;
    margin-bottom: 8px;
  }
  
  .favorite-badge span {
    font-size: 16px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

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
  
  // If editing an existing contact, store its ID
  @attr existingContactId: string = '';
  
  initialize(params?: Record<string, any>): void {
    console.debug("Initializing AddContactWorkflow with params:", params);
    
    this.updateTitle("Add Payment Contact");
    this.updateFooter(true, "Save Contact");
    
    // If we're editing an existing contact, populate the form
    if (params?.contactId) {
      this.existingContactId = params.contactId;
      this.loadExistingContact(params.contactId);
      this.updateTitle("Edit Payment Contact");
    }
    
    // If account number was provided, pre-fill it
    if (params?.accountNumber) {
      this.accountNumber = params.accountNumber;
    }
    
    this.validateForm();
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
    this.isFavorite = (event.target as HTMLInputElement).checked;
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
    if (this.validateForm()) {
      this.saveContact();
    }
  }
  
  private async saveContact(): Promise<void> {
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
      
      if (this.existingContactId) {
        await paymentContactsService.updateContact(contactData);
      } else {
        await paymentContactsService.addContact(contactData);
      }
      
      // Complete the workflow with success
      this.complete(true, {
        contact: contactData,
        isNew: !this.existingContactId
      });
      
    } catch (error) {
      console.error("Failed to save contact:", error);
      this.complete(false, undefined, "Failed to save contact");
    }
  }
}
