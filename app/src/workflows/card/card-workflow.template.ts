import { html, repeat, when } from "@microsoft/fast-element";
import { CardWorkflow } from "./card-workflow";
import "@primitives/select";

export const template = html<CardWorkflow>/*html*/`
  <div class="card-workflow">
    ${when(x => x.isLoading, html`
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading card information...</p>
      </div>
    `)}
    
    ${when(x => !x.isLoading, html`
      <!-- Card Type Selection -->
      ${when(x => !x.cardTypeSelected, html`
        <div class="card-selection-container">
          <h3>Select Card Type</h3>
          <div class="card-options">
            <div class="card-option ${x => x.tempCardType === 'debit' ? 'selected' : ''}" @click="${x => x.selectCardType('debit')}">
              <div class="card-option-icon debit-icon">💳</div>
              <div class="card-option-details">
                <h4>Debit Card</h4>
                <p>Link to your existing account</p>
              </div>
            </div>
            <div class="card-option ${x => x.tempCardType === 'credit' ? 'selected' : ''}" @click="${x => x.selectCardType('credit')}">
              <div class="card-option-icon credit-icon">💰</div>
              <div class="card-option-details">
                <h4>Credit Card</h4>
                <p>Open a new credit account</p>
              </div>
            </div>
          </div>
        </div>
      `)}
      
      <!-- Card Product Details -->
      ${when(x => x.cardTypeSelected, html`
        ${when(x => !x.selectedProduct, html`
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading card details...</p>
          </div>
        `)}
        
        ${when(x => x.selectedProduct, html`
          <div class="product-info">
            <!-- Card Image -->
            ${when(x => x.selectedProduct?.imageUrl, html`
              <img class="product-image" src="${x => x.selectedProduct!.imageUrl}" alt="${x => x.selectedProduct!.name}">
            `, html`
              <div class="product-image-placeholder">
                ${x => x.selectedProduct?.type === 'credit' ? 'Credit' : 'Debit'} Card
              </div>
            `)}
            
            <!-- Card Name -->
            <h3 class="product-name">${x => x.selectedProduct?.name || 'Card Product'}</h3>
            
            <!-- Price/Fee (if available) -->
            ${when(x => x.selectedProduct?.monthlyFee, html`
              <div class="product-price">
                ${x => x.formatPrice(x.selectedProduct?.monthlyFee!)} ${x => x.selectedProduct?.currency || 'USD'}/month
              </div>
            `)}
            
            <!-- Description -->
            <p class="product-description">${x => x.selectedProduct?.description || 'No description available'}</p>
            
            <!-- Features -->
            ${when(x => x.selectedProduct?.features && x.selectedProduct.features.length > 0, html`
              <div class="product-features">
                <h4>Features</h4>
                <ul>
                  ${repeat(x => x.selectedProduct!.features, html`<li>${x => x}</li>`)}
                </ul>
              </div>
            `)}
            
            <!-- Requirements Section -->
            ${when(x => x.selectedProduct?.requirements && x.selectedProduct.requirements.length > 0, html`
              <div class="product-requirements">
                <h4>Requirements</h4>
                <ul>
                  ${repeat(x => x.selectedProduct!.requirements, html`
                    <li class="${(x, c) => c.parent.requirementMet(x.type) ? 'met' : 'unmet'}">
                      ${x => x.description}
                      ${when((x, c) => c.parent.requirementMet(x.type), html`<span class="check-mark">✓</span>`)}
                      ${when((x, c) => !c.parent.requirementMet(x.type), html`<span class="x-mark">✗</span>`)}
                    </li>
                  `)}
                </ul>
              </div>
            `)}
            
            <!-- For Debit Card - Account Selection -->
            ${when(x => x.selectedProduct?.type === 'debit' && x.availableAccounts.length > 0, html`
              <div class="account-selection">
                <dream-select
                  label="Select Account to Link"
                  placeholder="Choose an account"
                  ?disabled="${x => x.hasSelectedCardBefore}"
                  ?error="${x => !!x.accountSelectError}"
                  error-message="${x => x.accountSelectError || ''}"
                  full-width
                  @change="${(x, c) => x.handleAccountSelection(c.event)}"
                >
                  ${repeat(x => x.availableAccounts, html`
                    <option value="${x => x.id}">${x => x.name}</option>
                  `)}
                </dream-select>
              </div>
            `)}
            
        ${when(x => x.selectedProduct?.type === 'debit' && x.availableAccounts.length === 0, html`
              <div class="no-accounts-message">
                <p>You don't have any compatible accounts for a debit card.</p>
                <dream-button variant="secondary" @click="${x => x.handleCreateAccount()}">Open a New Account</dream-button>
              </div>
            `)}
            
            ${when(x => x.isProductAdded, html`<div class="success-message">✓ Card request submitted successfully!</div>`)}
          </div>
          
          <!-- Agreement Section -->
          ${when(x => !x.hasSelectedCardBefore, html`
            <div class="agreement-container">
              <div class="agreement-checkbox-wrapper ${x => x.agreementChecked ? 'checked' : ''}" @click="${x => x.toggleAgreement()}">
                <div class="custom-checkbox">
                  ${when(x => x.agreementChecked, html`
                    <svg class="checkmark" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
                    </svg>
                  `)}
                </div>
                <span class="checkbox-label">I agree to the terms and conditions for this card. I understand that additional verification may be required.</span>
              </div>
              ${when(x => !x.agreementChecked && x.showValidationErrors, html`
                <div class="error-message">You must agree to the terms before proceeding</div>
              `)}
            </div>
          `)}
        `)}
      `)}
      
      <!-- If Card Already Exists -->
      ${when(x => x.hasSelectedCardBefore, html`
        <div class="already-active-message">
          <div class="active-icon">✓</div>
          <div class="active-text">
            <h4>You already have this card</h4>
            <p>You can manage your card settings in the account settings section.</p>
          </div>
        </div>
      `)}
      
      <!-- If Requirements Not Met -->
      ${when(x => x.cardTypeSelected && x.selectedProduct && !x.meetsAllRequirements && !x.hasSelectedCardBefore, html`
        <div class="requirements-not-met">
          <h4>Unable to proceed</h4>
          <p>You don't meet all requirements for this card. Please review the requirements above.</p>
        </div>
      `)}
    `)}
  </div>
`;
