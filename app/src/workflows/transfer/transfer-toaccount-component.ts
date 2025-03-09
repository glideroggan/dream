import { css, customElement, FASTElement, html, observable, attr, repeat, when } from "@microsoft/fast-element";
import { PaymentContact } from "../../repositories/models/payment-contact";
import { Account } from "./transfer-workflow";
import { workflowManager } from "../../services/workflow-manager-service";
import { WorkflowIds } from "../workflow-registry";
import { styles } from "./transfer-toaccount-component.css";

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
      @keyup="${(x, c) => x.handleKeyup(c.event as KeyboardEvent)}"
      ?required="${x => x.required}"
      tabindex="1"
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
                tabindex="${(_, c) => c.index + 2}"
                data-result-index="${(item, c) => c.index + 2}"
                @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event as KeyboardEvent)}"
                @click="${(item, c) => c.parent.selectItem(item)}"
                @mouseenter="${(item, c) => c.parent.handleItemMouseEnter(item)}">
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
                tabindex="${(_, c) => c.parent.filteredAccounts.length + c.index + 2}"
                data-result-index="${(_, c) => c.parent.filteredAccounts.length + c.index + 2}"
                @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event as KeyboardEvent)}"
                @click="${(item, c) => c.parent.selectItem(item)}"
                @mouseenter="${(item, c) => c.parent.handleItemMouseEnter(item)}">
              <span class="item-badge contact">Contact</span>
              <span class="item-name">${item => item.displayName}</span>
              ${when(item => (item.originalItem as PaymentContact).accountNumber !== undefined, html`
                <span class="item-details">${item => (item.originalItem as PaymentContact).accountNumber}</span>
              `)}
            </div>
          `)}
        `)}
        
        ${when(x => x.showNewContactOption, html`
          <div class="new-contact-option" 
               @click="${x => x.createNewContact()}"
               tabindex="${x => x.filteredAccounts.length + x.filteredContacts.length + 2}"
               @keydown="${(x, c) => x.handleNewContactKeydown(c.event as KeyboardEvent)}">
            <span class="add-icon">+</span>
            <span>Add New Contact</span>
          </div>
        `)}
        
        ${when(x => x.filteredItems.length === 0 && !x.showNewContactOption, html`
          <div class="no-results">
            <p>No matches found</p>
            <button type="button" 
                   @click="${x => x.createNewContact()}" 
                   class="add-new-button"
                   tabindex="${x => x.filteredAccounts.length + x.filteredContacts.length + 2}">
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
  @observable currentFocusIndex: number = -1;
  @observable isKeyboardNavigation: boolean = false;
  
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
  
  // Get classes for autocomplete items with improved keyboard navigation indication
  getItemClasses(item: AutocompleteItem): string {
    const highlightClass = item === this.highlightedItem ? 'highlighted' : '';
    const keyboardNavClass = this.isKeyboardNavigation ? 'keyboard-nav' : '';
    return `autocomplete-item ${highlightClass} ${keyboardNavClass}`;
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
    this.isKeyboardNavigation = false; // Reset keyboard nav mode on focus
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
   * Handle keyboard events on the input field
   */
  handleKeyup(event: KeyboardEvent): void {
    // Set keyboard navigation mode flag for visual styling
    this.isKeyboardNavigation = true;
    
    // If dropdown isn't shown and user presses down, show it
    if (!this.showDropdown && event.key === 'ArrowDown') {
      this.showDropdown = true;
      this.updateFilteredItems();
      event.preventDefault();
      return;
    }
    
    if (this.showDropdown) {
      switch (event.key) {
        case 'ArrowDown':
          this.highlightNextItem();
          this.focusHighlightedItem();
          event.preventDefault();
          break;
        case 'ArrowUp':
          this.highlightPreviousItem();
          this.focusHighlightedItem();
          event.preventDefault();
          break;
        case 'Enter':
          if (this.highlightedItem) {
            this.selectItem(this.highlightedItem);
            event.preventDefault();
          } else if (this.showNewContactOption && this.inputValue.trim()) {
            this.createNewContact();
            event.preventDefault();
          }
          break;
        case 'Escape':
          this.showDropdown = false;
          event.preventDefault();
          break;
        case 'Tab':
          // Handle tabbing to the first result on Tab
          if (this.showDropdown && this.filteredItems.length > 0 && !event.shiftKey) {
            this.highlightedItem = this.filteredItems[0];
            this.focusHighlightedItem();
            event.preventDefault();
          }
          break;
      }
    }
  }
  
  /**
   * Focus the currently highlighted item in the DOM
   */
  private focusHighlightedItem(): void {
    if (!this.highlightedItem) return;
    
    // Request animation frame to ensure DOM is updated
    requestAnimationFrame(() => {
      const itemElement = this.shadowRoot?.querySelector(`[data-id="${this.highlightedItem?.id}"]`) as HTMLElement;
      if (itemElement) {
        itemElement.focus();
      }
    });
  }
  
  /**
   * Handle keyboard events on result items
   */
  handleResultKeydown(item: AutocompleteItem, event: KeyboardEvent): void {
    this.isKeyboardNavigation = true;
    this.highlightedItem = item; // Set the highlighted item to the current item
    
    switch (event.key) {
      case 'ArrowDown':
        this.highlightNextItem();
        this.focusHighlightedItem();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.highlightPreviousItem();
        this.focusHighlightedItem();
        event.preventDefault();
        break;
      case 'Enter':
        this.selectItem(item);
        event.preventDefault();
        break;
      case 'Escape':
        this.showDropdown = false;
        this.inputElement?.focus();
        event.preventDefault();
        break;
      case 'Tab':
        if (!event.shiftKey && item === this.getLastFocusableItem()) {
          // If we're on the last item and tabbing forward, close dropdown and move to next control
          this.showDropdown = false;
          return; // Let the tab proceed naturally to next element
        } else if (event.shiftKey && item === this.getFirstFocusableItem()) {
          // If we're on the first item and tabbing backward, go back to input
          this.inputElement?.focus();
          event.preventDefault();
        }
        break;
    }
  }
  
  /**
   * Get the first focusable item in the dropdown
   */
  private getFirstFocusableItem(): AutocompleteItem | null {
    return this.filteredItems.length > 0 ? this.filteredItems[0] : null;
  }
  
  /**
   * Get the last focusable item in the dropdown
   */
  private getLastFocusableItem(): AutocompleteItem | null {
    return this.filteredItems.length > 0 ? 
      this.filteredItems[this.filteredItems.length - 1] : null;
  }
  
  /**
   * Handle mouse entry on items to provide visual feedback
   */
  handleItemMouseEnter(item: AutocompleteItem): void {
    this.isKeyboardNavigation = false; // Reset keyboard navigation mode
    this.highlightedItem = item; // Highlight hovered item
  }
  
  /**
   * Handle new contact option keydown
   */
  handleNewContactKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.createNewContact();
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      if (this.filteredItems.length > 0) {
        this.highlightedItem = this.filteredItems[this.filteredItems.length - 1];
        this.focusHighlightedItem();
      } else {
        this.inputElement?.focus();
      }
      event.preventDefault();
    }
  }
  
  /**
   * Highlight the next item in the dropdown
   */
  private highlightNextItem(): void {
    if (this.filteredItems.length === 0) return;
    
    const currentIndex = this.highlightedItem 
      ? this.filteredItems.indexOf(this.highlightedItem) 
      : -1;
      
    const nextIndex = currentIndex + 1 >= this.filteredItems.length 
      ? 0 
      : currentIndex + 1;
      
    this.highlightedItem = this.filteredItems[nextIndex];
    this.scrollItemIntoView(this.highlightedItem);
  }
  
  /**
   * Highlight the previous item in the dropdown
   */
  private highlightPreviousItem(): void {
    if (this.filteredItems.length === 0) return;
    
    const currentIndex = this.highlightedItem 
      ? this.filteredItems.indexOf(this.highlightedItem) 
      : 0;
      
    const prevIndex = currentIndex - 1 < 0 
      ? this.filteredItems.length - 1 
      : currentIndex - 1;
      
    this.highlightedItem = this.filteredItems[prevIndex];
    this.scrollItemIntoView(this.highlightedItem);
  }
  
  /**
   * Scroll an item into view
   */
  private scrollItemIntoView(item: AutocompleteItem): void {
    // Find the DOM element for this item
    const itemElement = this.shadowRoot?.querySelector(`[data-id="${item.id}"]`) as HTMLElement;
    if (itemElement) {
      // Scroll the item into view if needed
      itemElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  
  // Reference to the input element for keyboard focus management
  private get inputElement(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector('#toAccountInput') as HTMLInputElement;
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
      const result = await workflowManager.startWorkflow(WorkflowIds.ADD_CONTACT, {
        accountNumber: this.inputValue.trim()
      }, true);
      
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