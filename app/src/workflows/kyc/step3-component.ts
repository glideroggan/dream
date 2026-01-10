import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { PersonalInformation } from "./kyc-workflow";
import '@primitives/input';
import '@primitives/select';
import '@primitives/checkbox';

const template = html<KycStep3Component>/*html*/`
  <div class="form-section">
    <h4>Address Information</h4>
    
    <dream-input
      id="addressLine1"
      type="text"
      label="Address Line 1"
      placeholder="Street address"
      :value="${x => x?.personalInfo.addressLine1}"
      ?error="${x => !!x.errors.addressLine1}"
      error-message="${x => x.errors.addressLine1 || ''}"
      full-width
      @input="${(x, c) => x.handleInputChange('addressLine1', c.event)}"
    ></dream-input>

    <dream-input
      id="addressLine2"
      type="text"
      label="Address Line 2 (Optional)"
      placeholder="Apartment, suite, unit, etc."
      :value="${x => x?.personalInfo.addressLine2 || ''}"
      full-width
      @input="${(x, c) => x.handleInputChange('addressLine2', c.event)}"
    ></dream-input>

    <div class="form-row">
      <dream-input
        id="city"
        type="text"
        label="City"
        placeholder="City"
        :value="${x => x?.personalInfo.city}"
        ?error="${x => !!x.errors.city}"
        error-message="${x => x.errors.city || ''}"
        full-width
        @input="${(x, c) => x.handleInputChange('city', c.event)}"
      ></dream-input>

      <dream-input
        id="postalCode"
        type="text"
        label="Postal Code"
        placeholder="Postal Code"
        :value="${x => x?.personalInfo.postalCode}"
        ?error="${x => !!x.errors.postalCode}"
        error-message="${x => x.errors.postalCode || ''}"
        full-width
        @input="${(x, c) => x.handleInputChange('postalCode', c.event)}"
      ></dream-input>
    </div>

    <dream-select
      id="country"
      label="Country"
      :value="${x => x?.personalInfo.country}"
      ?error="${x => !!x.errors.country}"
      error-message="${x => x.errors.country || ''}"
      full-width
      @change="${(x, c) => x.handleSelectChange('country', c.event)}"
    >
      <option value="" disabled selected>Select your country</option>
      <option value="US">United States</option>
      <option value="CA">Canada</option>
      <option value="UK">United Kingdom</option>
      <option value="AU">Australia</option>
      <option value="DE">Germany</option>
      <option value="FR">France</option>
    </dream-select>
    
    <div class="disclaimer ${x => x.errors.consent ? 'invalid' : ''}">
      <dream-checkbox
        id="consent"
        ?checked="${x => x.consentChecked}"
        ?error="${x => !!x.errors.consent}"
        @change="${(x, c) => x.handleConsentChange(c.event)}"
      >
        I confirm that all information provided is accurate and I consent to having my identity verified.
      </dream-checkbox>
      ${x => x.errors.consent ? html`<div class="error-message">${x => x.errors.consent}</div>` : ''}
    </div>
  </div>
`;

const styles = css`
  .form-section {
    background-color: var(--background-card, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .form-section h4 {
    margin-top: 0;
    margin-bottom: 0;
    color: var(--primary-text-color, #333);
    font-weight: 600;
    font-size: 18px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }
  
  .form-row {
    display: flex;
    gap: 16px;
    width: 100%;
  }
  
  .form-row > * {
    flex: 1;
    min-width: 0;
  }
  
  .disclaimer {
    margin-top: 8px;
  }
  
  .disclaimer.invalid dream-checkbox {
    --checkbox-border-color: var(--error-color, #e74c3c);
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 12px;
    margin-top: 4px;
    font-weight: 500;
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
  @observable errors: Record<string, string> = {};
  @observable isValid: boolean = false;
  
  constructor() {
    super();
    this.personalInfo = {
      addressLine1: this.personalInfo?.addressLine1 || '',
      addressLine2: this.personalInfo?.addressLine2 || '',
      city: this.personalInfo?.city || '',
      country: this.personalInfo?.country || '',
      idType: this.personalInfo?.idType || '',
      idNumber: this.personalInfo?.idNumber || '',
      fullName: this.personalInfo?.fullName || '',
      email: this.personalInfo?.email || '',
      phone: this.personalInfo?.phone || '',
      dateOfBirth: this.personalInfo?.dateOfBirth || '',
      nationality: this.personalInfo?.nationality || '',
      postalCode: this.personalInfo?.postalCode || ''
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
  
handleInputChange(field: string, event: Event): void {
    const customEvent = event as CustomEvent;
    const value = customEvent.detail?.value ?? (event.target as HTMLInputElement).value;
    
    // Update the field
    this.personalInfo = {
      ...this.personalInfo,
      [field]: value
    };
    
    // Validate the form
    this.validateForm();
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('field-changed', {
      detail: {
        field,
        value,
        personalInfo: this.personalInfo,
        isValid: this.isValid,
        errors: this.errors
      },
      bubbles: true,
      composed: true
    }));
  }
  
  handleSelectChange(field: string, event: Event): void {
    const customEvent = event as CustomEvent;
    const value = customEvent.detail?.value ?? (event.target as HTMLSelectElement).value;
    
    // Update the field
    this.personalInfo = {
      ...this.personalInfo,
      [field]: value
    };
    
    // Validate the form
    this.validateForm();
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('field-changed', {
      detail: {
        field,
        value,
        personalInfo: this.personalInfo,
        isValid: this.isValid,
        errors: this.errors
      },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Handle consent checkbox change (from dream-checkbox)
   */
  handleConsentChange(event: Event): void {
    const customEvent = event as CustomEvent;
    this.consentChecked = customEvent.detail?.checked ?? (event.target as HTMLInputElement).checked;
    
    // Validate form after toggling consent
    this.validateForm();
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('consent-changed', {
      detail: {
        checked: this.consentChecked,
        isValid: this.isValid,
        errors: this.errors
      },
      bubbles: true,
      composed: true
    }));
  }
  
  validateForm() {
    const newErrors: Record<string, string> = {};
    
    // Validate Address Line 1
    if (!this.personalInfo.addressLine1 || this.personalInfo.addressLine1.trim() === '') {
      newErrors.addressLine1 = 'Address is required';
    } else if (this.personalInfo.addressLine1.length < 5) {
      newErrors.addressLine1 = 'Please enter a complete address';
    }
    
    // Validate City
    if (!this.personalInfo.city || this.personalInfo.city.trim() === '') {
      newErrors.city = 'City is required';
    }
    
    // Validate Postal Code
    if (!this.personalInfo.postalCode || this.personalInfo.postalCode.trim() === '') {
      newErrors.postalCode = 'Postal code is required';
    } else {
      // Different validation based on country
      if (this.personalInfo.country === 'US' && !/^\d{5}(-\d{4})?$/.test(this.personalInfo.postalCode)) {
        newErrors.postalCode = 'US postal code should be 5 digits or ZIP+4 format';
      } else if (this.personalInfo.country === 'CA' && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(this.personalInfo.postalCode)) {
        newErrors.postalCode = 'Canadian postal code format: A1A 1A1';
      } else if (this.personalInfo.country === 'UK' && !/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(this.personalInfo.postalCode)) {
        newErrors.postalCode = 'UK postal code format is invalid';
      }
    }
    
    // Validate Country
    if (!this.personalInfo.country) {
      newErrors.country = 'Please select a country';
    }
    
    // Validate Consent
    if (!this.consentChecked) {
      newErrors.consent = 'You must agree to the terms to proceed';
    }
    
    // Update errors state
    this.errors = newErrors;
    
    // Update overall validity
    this.isValid = Object.keys(newErrors).length === 0;
    
    // Notify parent about validation status
    this.dispatchEvent(new CustomEvent('validation-changed', {
      detail: {
        isValid: this.isValid,
        errors: this.errors
      },
      bubbles: true,
      composed: true
    }));
    
    return this.isValid;
  }
}
