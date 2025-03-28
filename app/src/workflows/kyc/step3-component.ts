import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { PersonalInformation } from "./kyc-workflow";

const template = html<KycStep3Component>/*html*/`
  <div class="form-section">
    <h4>Address Information</h4>
    <div class="form-group">
      <label for="addressLine1">Address Line 1</label>
      <input type="text" id="addressLine1" placeholder="Street address"
            :value="${x => x?.personalInfo.addressLine1}"
            @input="${(x, c) => x.handleTextInput('addressLine1', c.event)}" />
    </div>

    <div class="form-group">
      <label for="addressLine2">Address Line 2 (Optional)</label>
      <input type="text" id="addressLine2" placeholder="Apartment, suite, unit, etc."
            :value="${x => x?.personalInfo.addressLine2 || ''}"
            @input="${(x, c) => x.handleTextInput('addressLine2', c.event)}" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="city">City</label>
        <input type="text" id="city" placeholder="City"
              :value="${x => x?.personalInfo.city}"
              @input="${(x, c) => x.handleTextInput('city', c.event)}" />
      </div>

      <div class="form-group">
        <label for="postalCode">Postal Code</label>
        <input type="text" id="postalCode" placeholder="Postal Code"
              :value="${x => x?.personalInfo.postalCode}"
              @input="${(x, c) => x.handleTextInput('postalCode', c.event)}" />
      </div>
    </div>

    <div class="form-group">
      <label for="country">Country</label>
      <select id="country" 
              :value="${x => x?.personalInfo.country}"
              @change="${(x, c) => x.handleTextInput('country', c.event)}">
        <option value="" disabled selected>Select your country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="UK">United Kingdom</option>
        <option value="AU">Australia</option>
        <option value="DE">Germany</option>
        <option value="FR">France</option>
      </select>
    </div>
    
    <div class="disclaimer">
      <!-- Use the agreement-checkbox approach from the Swish workflow -->
      <div class="agreement-checkbox-wrapper ${x => x.consentChecked ? 'checked' : ''}" 
           @click="${x => x.toggleConsent()}">
        <div class="custom-checkbox">
          ${x => x.consentChecked ? html`
            <svg class="checkmark" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
            </svg>
          ` : ''}
        </div>
        <span class="checkbox-label">
          I confirm that all information provided is accurate and I consent to having my identity verified.
        </span>
      </div>
    </div>
  </div>
`;

const styles = css`
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }
  
  .form-group:last-child {
    margin-bottom: 0;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
    width: 100%;
  }
  
  .form-row > .form-group {
    flex: 1;
    min-width: 0; /* Prevents flexbox children from overflowing */
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--secondary-text-color, #666);
  }
  
  input[type="text"],
  select {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
    background-color: var(--background-color, white);
    width: 100%;
    box-sizing: border-box;
  }
  
  input[type="text"]:focus,
  select:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
  }
  
  .form-section {
    background-color: var(--background-card, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--border-color, #e0e0e0);
  }
  
  .form-section h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--primary-text-color, #333);
    font-weight: 600;
    font-size: 18px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }
  
  .disclaimer {
    margin-top: 16px;
  }
  
  /* Checkbox styles */
  .agreement-checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .agreement-checkbox-wrapper:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .agreement-checkbox-wrapper.checked {
    background-color: color-mix(in srgb, var(--accent-color, #3498db) 5%, transparent);
  }
  
  .custom-checkbox {
    width: 20px;
    height: 20px;
    min-width: 20px; /* Prevent shrinking */
    border: 2px solid var(--border-color, #ccc);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-color, white);
    transition: all 0.2s;
  }
  
  .agreement-checkbox-wrapper:hover .custom-checkbox {
    border-color: var(--accent-color, #3498db);
  }
  
  .agreement-checkbox-wrapper.checked .custom-checkbox {
    background-color: var(--accent-color, #3498db);
    border-color: var(--accent-color, #3498db);
  }
  
  .checkmark {
    width: 16px;
    height: 16px;
    fill: white;
    animation: scale 0.2s ease-in-out;
  }
  
  @keyframes scale {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .checkbox-label {
    font-size: 14px;
    color: var(--secondary-text-color, #666);
    line-height: 1.4;
  }
`;

@customElement({
  name: "kyc-step3",
  template,
  styles
})
export class KycStep3Component extends FASTElement {
  @observable personalInfo: PersonalInformation;
  @observable consentChecked: boolean = false;
  
  constructor() {
    super();
    this.personalInfo = {
      fullName: '',
      dateOfBirth: '',
      nationality: '',
      idType: '',
      idNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: ''
    };
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // Focus on the first field when loaded
    setTimeout(() => {
      const firstField = this.shadowRoot?.getElementById('addressLine1') as HTMLInputElement;
      if (firstField) firstField.focus();
    }, 0);
  }
  
  handleTextInput(field: string, event: Event) {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    
    // Update the field
    this.personalInfo = {
      ...this.personalInfo,
      [field]: input.value
    };
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('field-changed', {
      detail: {
        field,
        value: input.value,
        personalInfo: this.personalInfo
      },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Toggle consent checkbox state (similar to Swish workflow)
   */
  toggleConsent(): void {
    this.consentChecked = !this.consentChecked;
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('consent-changed', {
      detail: {
        checked: this.consentChecked
      },
      bubbles: true,
      composed: true
    }));
  }
}
