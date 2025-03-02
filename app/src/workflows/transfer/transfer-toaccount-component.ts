import { css, customElement, FASTElement, html, observable, attr, repeat, when } from "@microsoft/fast-element";
import { PaymentContact } from "../../repositories/models/payment-contact";
import { Account } from "./transfer-workflow";
import { workflowManager } from "../../services/workflow-manager-service";

interface AutocompleteItem {
  id: string;
  displayName: string;
  type: 'account' | 'contact';
  originalItem: Account | PaymentContact;
}

const template = html<ToAccountField>/*html*/`
<div class="${x => x.formGroupClasses}">
  <label for="toAccountInput">To Account</label>
  <div class="autocomplete-wrapper">
    <input 
      id="toAccountInput"
      type="text" 
      autocomplete="off"
      placeholder="Enter account name, contact name, or account number"
      value="${x => x.inputValue}"
      @input="${(x, c) => x.handleInput(c.event)}"
      @focus="${(x, c) => x.handleFocus(c.event)}"
      @blur="${(x, c) => x.handleBlur(c.event)}"
      ?required="${x => x.required}"
    />
    <div class="${x => x.itemDisplayClasses}">
      ${when(x => x.selectedItem, html`
        <div class="item-chip">
          <span class="${x => x.getItemBadgeClasses()}">
            ${x => x.selectedItem?.type === 'account' ? 'Account' : 'Contact'}
          </span>
          <span class="item-label">${x => x.selectedItem?.displayName}</span>
          <button type="button" class="clear-button" @click="${x => x.clearSelection()}">×</button>
        </div>
      `)}
    </div>
    
    ${when(x => x.showDropdown, html`
      <div class="autocomplete-dropdown">
        ${when(x => x.filteredAccounts.length > 0, html`
          <div class="group-label">My Accounts</div>
          ${repeat(x => x.filteredAccounts, html`
            <div class="${(item, c) => c.parent.getItemClasses(item)}" 
                data-id="${item => item.id}" 
                data-type="account"
                @click="${(item, c) => c.parent.selectItem(item)}">
              <span class="item-badge account">Account</span>
              <span class="item-name">${item => item.displayName}</span>
              ${when(item => (item.originalItem as Account).balance !== undefined, html`
                <span class="item-details">${item => (item.originalItem as Account).balance.toFixed(2)} ${item => (item.originalItem as Account).currency}</span>
              `)}
            </div>
          `)}
        `)}
        
        ${when(x => x.filteredContacts.length > 0, html`
          <div class="group-label">Payment Contacts</div>
          ${repeat(x => x.filteredContacts, html`
            <div class="${(item, c) => c.parent.getItemClasses(item)}" 
                data-id="${item => item.id}" 
                data-type="contact"
                @click="${(item, c) => c.parent.selectItem(item)}">
              <span class="item-badge contact">Contact</span>
              <span class="item-name">${item => item.displayName}</span>
              ${when(item => (item.originalItem as PaymentContact).accountNumber !== undefined, html`
                <span class="item-details">${item => (item.originalItem as PaymentContact).accountNumber}</span>
              `)}
            </div>
          `)}
        `)}
        
        ${when(x => x.showNewContactOption, html`
          <div class="new-contact-option" @click="${x => x.createNewContact()}">
            <span class="add-icon">+</span>
            <span>Add New Contact</span>
          </div>
        `)}
        
        ${when(x => x.filteredItems.length === 0 && !x.showNewContactOption, html`
          <div class="no-results">
            <p>No matches found</p>
            <button type="button" @click="${x => x.createNewContact()}" class="add-new-button">
              Create New Contact
            </button>
          </div>
        `)}
      </div>
    `)}
  </div>
  ${when(x => x.errorMessage, html`
    <div class="error-message">${x => x.errorMessage}</div>
  `)}
</div>
`;

const styles = css`
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  .autocomplete-wrapper {
    position: relative;
  }
  
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background-color: var(--input-bg, white);
  }
  
  input:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
  
  .has-error input {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .selected-item-display {
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    pointer-events: none;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.2s, transform 0.2s;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 3px;
  }
  
  .selected-item-display.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  
  .item-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: var(--chip-bg, #f3f4f6);
    border-radius: 16px;
    padding: 4px 8px;
    max-width: 100%;
  }
  
  .item-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  
  .item-badge.account {
    background-color: var(--account-color, #3498db);
    color: white;
  }
  
  .item-badge.contact {
    background-color: var(--contact-color, #2ecc71);
    color: white;
  }
  
  .item-label {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .clear-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-tertiary, #999);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s;
  }
  
  .clear-button:hover {
    color: var(--error-color, #e74c3c);
  }
  
  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background-color: var(--dropdown-bg, white);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
  }
  
  .group-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-tertiary, #999);
    padding: 8px 12px 4px;
    background-color: var(--group-bg, #f9f9f9);
    position: sticky;
    top: 0;
  }
  
  .autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.15s;
  }
  
  .autocomplete-item:hover, 
  .autocomplete-item.highlighted {
    background-color: var(--highlight-bg, #f5f9fd);
  }
  
  .autocomplete-item .item-name {
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .autocomplete-item .item-details {
    font-size: 13px;
    color: var(--text-secondary, #666);
    white-space: nowrap;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 13px;
    margin-top: 4px;
  }
  
  /* Adjust input padding when an item is selected */
  .selected-item-display.visible + input {
    color: transparent;
  }
  
  /* Animation when dropdown appears */
  .autocomplete-dropdown {
    animation: dropdown-fade 0.2s ease;
    transform-origin: top center;
  }
  
  @keyframes dropdown-fade {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .new-contact-option {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    border-top: 1px solid var(--border-color, #e0e0e0);
    background-color: var(--highlight-bg-subtle, #f7f9fc);
    color: var(--primary-color, #3498db);
    font-weight: 500;
    transition: background-color 0.15s;
  }
  
  .new-contact-option:hover {
    background-color: var(--highlight-bg, #f0f7fd);
  }
  
  .add-icon {
    font-size: 16px;
    font-weight: bold;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: var(--text-secondary, #666);
  }
  
  .no-results p {
    margin: 0 0 12px 0;
  }
  
  .add-new-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  
  .add-new-button:hover {
    background-color: var(--primary-color-dark, #2980b9);
  }
`;

@customElement({
  name: "to-account-field",
  template,
  styles
})
export class ToAccountField extends FASTElement {
  @attr accounts: Account[] = [];
  @attr paymentContacts: PaymentContact[] = [];
  @attr fromAccountId: string = '';
  @attr toAccountId: string = '';
  @attr required: boolean = false;
  
  @observable inputValue: string = '';
  @observable errorMessage: string = '';
  @observable showDropdown: boolean = false;
  @observable selectedItem: AutocompleteItem | null = null;
  @observable highlightedItem: AutocompleteItem | null = null;
  @observable allItems: AutocompleteItem[] = [];
  @observable filteredItems: AutocompleteItem[] = [];
  @observable filteredAccounts: AutocompleteItem[] = [];
  @observable filteredContacts: AutocompleteItem[] = [];
  @observable showNewContactOption: boolean = false;
  
  // Computed property for form group classes
  get formGroupClasses(): string {
    return `form-group ${this.errorMessage ? 'has-error' : ''}`;
  }
  
  // Computed property for selected item display classes
  get itemDisplayClasses(): string {
    return `selected-item-display ${this.selectedItem ? 'visible' : ''}`;
  }
  
  // Get item badge classes based on selected item
  getItemBadgeClasses(): string {
    if (!this.selectedItem) return 'item-badge';
    return `item-badge ${this.selectedItem.type === 'account' ? 'account' : 'contact'}`;
  }
  
  // Get classes for autocomplete items
  getItemClasses(item: AutocompleteItem): string {
    return `autocomplete-item ${item === this.highlightedItem ? 'highlighted' : ''}`;
  }
  
  // Event to notify parent of value changes
  private valueChangedEvent = new CustomEvent('valueChanged', { 
    bubbles: true,
    composed: true,
    detail: { value: '' }
  });
  
  // Event to emit validation errors
  private validationErrorEvent = new CustomEvent('validationError', {
    bubbles: true,
    composed: true,
    detail: { error: '' }
  });
  
  connectedCallback() {
    super.connectedCallback();
    this.processItems();
    
    // Handle clicks outside to close dropdown
    document.addEventListener('click', this.handleOutsideClick);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }
  
  accountsChanged() {
    this.processItems();
  }
  
  paymentContactsChanged() {
    this.processItems();
  }
  
  toAccountIdChanged(oldValue: string, newValue: string) {
    if (newValue) {
      // Set the selected item based on the toAccountId
      this.setSelectedItemFromId(newValue);
    } else {
      this.clearSelection();
    }
  }
  
  /**
   * Convert accounts and contacts into autocomplete items
   */
  private processItems() {
    const accountItems: AutocompleteItem[] = (this.accounts || []).map(account => ({
      id: account.id,
      displayName: `${account.name}`,
      type: 'account' as const,
      originalItem: account
    }));
    
    const contactItems: AutocompleteItem[] = (this.paymentContacts || []).map(contact => ({
      id: `contact:${contact.id}`,
      displayName: contact.name,
      type: 'contact' as const,
      originalItem: contact
    }));
    
    this.allItems = [...accountItems, ...contactItems];
    this.filteredItems = [...this.allItems];
    this.updateFilteredGroups();
  }
  
  /**
   * Set selected item based on ID
   */
  private setSelectedItemFromId(id: string) {
    const item = this.allItems.find(item => item.id === id);
    if (item) {
      this.selectedItem = item;
      this.inputValue = item.displayName;
    }
  }
  
  /**
   * Update filtered results based on input
   */
  private updateFilteredItems() {
    const query = this.inputValue.toLowerCase().trim();
    
    if (!query) {
      this.filteredItems = [...this.allItems];
      this.showNewContactOption = false;
    } else {
      this.filteredItems = this.allItems.filter(item => {
        if (item.type === 'account') {
          const account = item.originalItem as Account;
          return item.displayName.toLowerCase().includes(query) || 
                 account.accountNumber?.toLowerCase().includes(query) || 
                 false;
        } else {
          const contact = item.originalItem as PaymentContact;
          return (
            item.displayName.toLowerCase().includes(query) || 
            (contact.accountNumber && contact.accountNumber.toLowerCase().includes(query)) ||
            (contact.alias?.toLowerCase().includes(query) || false)
          );
        }
      });
      
      // Show new contact option if query looks like an account number
      // and we don't have matching results
      this.showNewContactOption = query.length > 5 && 
                                 /^[a-zA-Z0-9\-\s]+$/.test(query) &&
                                 this.filteredItems.length < 3;
    }
    
    // Disable current fromAccount
    this.filteredItems = this.filteredItems.filter(item => 
      !(item.type === 'account' && item.id === this.fromAccountId)
    );
    
    this.updateFilteredGroups();
  }
  
  /**
   * Update filtered accounts and contacts
   */
  private updateFilteredGroups() {
    this.filteredAccounts = this.filteredItems.filter(item => item.type === 'account');
    this.filteredContacts = this.filteredItems.filter(item => item.type === 'contact');
  }
  
  /**
   * Handle input event
   */
  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.inputValue = input.value;
    this.selectedItem = null;
    this.showDropdown = true;
    this.errorMessage = '';
    
    this.updateFilteredItems();
    
    // Notify parent that value was cleared
    this.dispatchValueChanged('');
  }
  
  /**
   * Handle focus event
   */
  handleFocus(event: Event) {
    this.showDropdown = true;
    this.updateFilteredItems();
  }
  
  /**
   * Handle blur event
   */
  handleBlur(event: Event) {
    event = event as FocusEvent;
    // Delay hiding dropdown to allow click events on dropdown items
    setTimeout(() => {
      if (this.required && !this.selectedItem && !this.inputValue) {
        this.errorMessage = 'Please select an account or contact';
        this.dispatchValidationError(this.errorMessage);
      }
    }, 200);
  }
  
  /**
   * Select an item from the dropdown
   */
  selectItem(item: AutocompleteItem) {
    this.selectedItem = item;
    this.inputValue = item.displayName;
    this.showDropdown = false;
    this.errorMessage = '';
    
    // Notify parent of selection
    this.dispatchValueChanged(item.id);
  }
  
  /**
   * Clear the current selection
   */
  clearSelection() {
    this.selectedItem = null;
    this.inputValue = '';
    this.showDropdown = false;
    
    // Notify parent that value was cleared
    this.dispatchValueChanged('');
  }
  
  /**
   * Handle clicks outside the component
   */
  private handleOutsideClick = (event: MouseEvent) => {
    if (!this.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  };
  
  /**
   * Dispatch valueChanged event to parent
   */
  private dispatchValueChanged(value: string) {
    this.valueChangedEvent = new CustomEvent('valueChanged', {
      bubbles: true,
      composed: true,
      detail: { value }
    });
    this.dispatchEvent(this.valueChangedEvent);
  }
  
  /**
   * Dispatch validation error event to parent
   */
  private dispatchValidationError(error: string) {
    this.validationErrorEvent = new CustomEvent('validationError', {
      bubbles: true,
      composed: true,
      detail: { error }
    });
    this.dispatchEvent(this.validationErrorEvent);
  }
  
  /**
   * Create a new contact from the current input
   */
  async createNewContact(): Promise<void> {
    try {
      // Start the add contact workflow
      const result = await workflowManager.startWorkflow('add-contact', {
        accountNumber: this.inputValue.trim()
      });
      
      if (result.success && result.data?.contact) {
        // If contact was successfully created, refresh the contacts
        // This would normally be handled by a service subscription
        // but for simplicity we'll just wait for parent to update the contacts
        
        // Select the new contact
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('contactCreated', {
            bubbles: true,
            composed: true,
            detail: { contact: result.data?.contact }
          }));
        }, 0);
      }
    } catch (error) {
      console.error("Error creating new contact:", error);
    }
  }
}