import { html, when, repeat, ref } from "@microsoft/fast-element";
import { AddContactWorkflow } from "./add-contact-workflow";
import "@primitives/input";

export const template = html<AddContactWorkflow>/*html*/`
  <div class="contact-workflow">
    <div class="tabs">
      <button class="tab ${x => x.activeTab === 'add' ? 'active' : ''}" 
              @click="${x => x.setActiveTab('add')}">
        Add Contact
      </button>
      <button class="tab ${x => x.activeTab === 'manage' ? 'active' : ''}" 
              @click="${x => x.setActiveTab('manage')}">
        Manage Contacts
      </button>
      <button class="tab ${x => x.activeTab === 'remove' ? 'active' : ''}" 
              @click="${x => x.setActiveTab('remove')}">
        Remove Contacts
      </button>
    </div>

    <!-- Add Contact Tab -->
    ${when(x => x.activeTab === 'add', html`
      <div class="tab-content">
        ${when(x => x.showSuccessMessage, html`
          <div class="success-message">
            <span class="success-icon">✓</span>
            ${x => x.successMessage}
          </div>
        `)}
        
        <form @submit="${(x, c) => x.handleSubmit(c.event)}">
          <div class="form-group">
            <dream-input
              ${ref('inputNameElement')}
              label="Contact Name"
              :value="${x => x.contactName}"
              @input="${(x, c) => x.handleNameInput(c.event)}"
              ?error="${x => !!x.errors.name}"
              error-message="${x => x.errors.name || ''}"
              required
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <dream-input
              ${ref('inputAccountElement')}
              label="Account Number"
              :value="${x => x.accountNumber}"
              @input="${(x, c) => x.handleAccountNumberInput(c.event)}"
              ?error="${x => !!x.errors.accountNumber}"
              error-message="${x => x.errors.accountNumber || ''}"
              required
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <dream-input
              ${ref('inputBankElement')}
              label="Bank Name"
              :value="${x => x.bankName}"
              @input="${(x, c) => x.handleBankNameInput(c.event)}"
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <dream-input
              ${ref('inputAliasElement')}
              label="Alias (Optional)"
              :value="${x => x.alias}"
              @input="${(x, c) => x.handleAliasInput(c.event)}"
              placeholder="Nickname for this contact"
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <label for="notes">Notes (Optional)</label>
            <textarea 
              ${ref('textareaNotesElement')}
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
              <dream-checkbox
                ?checked="${x => x.isFavorite}"
                @change="${(x, c) => x.handleFavoriteToggle(c.event)}"
                ariaLabel="Add to favorites"/>
              <span class="checkbox-text">Add to favorites</span>
            </label>
          </div>
        </form>
      </div>
    `)}

    <!-- Manage Contacts Tab -->
    ${when(x => x.activeTab === 'manage', html`
      <div class="tab-content">
        ${when(x => x.showSuccessMessage, html`
          <div class="success-message">
            <span class="success-icon">✓</span>
            ${x => x.successMessage}
          </div>
        `)}
        
        ${when(x => x.isLoading, html`
          <div class="loading-indicator">Loading contacts...</div>
        `)}
        
        ${when(x => !x.isLoading && x.contacts.length === 0, html`
          <div class="empty-state">
            <p>No saved contacts found.</p>
            <dream-button variant="primary" @click="${x => x.setActiveTab('add')}">Add a contact</dream-button>
          </div>
        `)}
        
        ${when(x => !x.isLoading && x.contacts.length > 0, html`
          <div class="contacts-list">
            ${repeat(x => x.contacts, html`
              <div class="contact-item">
                <div class="contact-item-details">
                  <div class="contact-name">
                    ${x => x.name}
                    ${when(x => x.isFavorite, html`<span class="favorite-star">★</span>`)}
                  </div>
                  <div class="contact-info">
                    ${x => x.accountNumber} ${x => x.bankName ? `• ${x.bankName}` : ''}
                  </div>
                </div>
                <dream-button variant="primary" size="sm" @click="${(x, c) => c.parent.editContact(x)}">Edit</dream-button>
              </div>
            `)}
          </div>
        `)}
      </div>
    `)}

    <!-- Remove Contacts Tab -->
    ${when(x => x.activeTab === 'remove', html`
      <div class="tab-content">
        ${when(x => x.isLoading, html`
          <div class="loading-indicator">Loading contacts...</div>
        `)}
        
        ${when(x => !x.isLoading && x.contacts.length === 0, html`
          <div class="empty-state">
            <p>No saved contacts found to remove.</p>
          </div>
        `)}
        
        ${when(x => !x.isLoading && x.contacts.length > 0, html`
          <div class="contacts-list">
            ${repeat(x => x.contacts, html`
              <div class="contact-item">
                <div class="contact-item-details">
                  <div class="contact-name">
                    ${x => x.name}
                    ${when(x => x.isFavorite, html`<span class="favorite-star">★</span>`)}
                  </div>
                  <div class="contact-info">
                    ${x => x.accountNumber} ${x => x.bankName ? `• ${x.bankName}` : ''}
                  </div>
                </div>
                <dream-button variant="danger" size="sm" @click="${(x, c) => c.parent.confirmDeleteContact(x)}">Remove</dream-button>
              </div>
            `)}
          </div>
        `)}
        
        ${when(x => x.showConfirmDialog, html`
          <div class="confirm-dialog">
            <div class="confirm-dialog-content">
              <h4>Remove Contact</h4>
              <p>Are you sure you want to remove "${x => x.contactToDelete?.name}"?</p>
              <div class="confirm-dialog-actions">
                <dream-button variant="ghost" @click="${x => x.cancelDelete()}">Cancel</dream-button>
                <dream-button variant="danger" @click="${x => x.deleteContact()}">Remove</dream-button>
              </div>
            </div>
          </div>
        `)}
      </div>
    `)}
  </div>
`;