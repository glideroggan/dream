import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { PersonalInformation } from "./kyc-workflow";
import '@primitives/input';
import '@primitives/select';

const template = html<KycStep1Component>/*html*/`
  <div class="form-section">
    <h4>Personal Information</h4>
    
    <dream-input
      id="fullName"
      type="text"
      label="Full Name"
      placeholder="Enter your full legal name"
      :value="${x => x.personalInfo.fullName}"
      ?error="${x => !!x.errors.fullName}"
      error-message="${x => x.errors.fullName || ''}"
      full-width
      @input="${(x, c) => x.handleInputChange('fullName', c.event)}"
    ></dream-input>

    <dream-input
      id="dateOfBirth"
      type="date"
      label="Date of Birth"
      :value="${x => x.personalInfo.dateOfBirth}"
      ?error="${x => !!x.errors.dateOfBirth}"
      error-message="${x => x.errors.dateOfBirth || ''}"
      full-width
      @input="${(x, c) => x.handleInputChange('dateOfBirth', c.event)}"
    ></dream-input>

    <dream-select
      id="nationality"
      label="Nationality"
      :value="${x => x.personalInfo.nationality}"
      ?error="${x => !!x.errors.nationality}"
      error-message="${x => x.errors.nationality || ''}"
      full-width
      @change="${(x, c) => x.handleSelectChange('nationality', c.event)}"
    >
      <option value="" disabled selected>Select your nationality</option>
      <option value="US">United States</option>
      <option value="CA">Canada</option>
      <option value="UK">United Kingdom</option>
      <option value="AU">Australia</option>
      <option value="DE">Germany</option>
      <option value="FR">France</option>
    </dream-select>
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
`;

@customElement({
  name: "kyc-step1",
  template,
  styles
})
export class KycStep1Component extends FASTElement {
  @observable personalInfo: PersonalInformation;
  @observable errors: Record<string, string> = {};
  @observable isValid: boolean = false;
  
  constructor() {
    super();
    // fill any undefined props with empty
    this.personalInfo = {
      fullName: this.personalInfo?.fullName || '',
      email: this.personalInfo?.email || '',
      phone: this.personalInfo?.phone || '',
      dateOfBirth: this.personalInfo?.dateOfBirth || '',
      addressLine1: this.personalInfo?.addressLine1 || '',
      addressLine2: this.personalInfo?.addressLine2 || '',
      city: this.personalInfo?.city || '',
      country: this.personalInfo?.country || '',
      idNumber: this.personalInfo?.idNumber || '',
      idType: this.personalInfo?.idType || '',
      nationality: this.personalInfo?.nationality || '',
      postalCode: this.personalInfo?.postalCode || ''
    }
    
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // Focus on the first field when loaded
    setTimeout(() => {
      const firstField = this.shadowRoot?.getElementById('fullName') as HTMLInputElement;
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

    // Validate the form after field update
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

    // Validate the form after field update
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
  
  validateForm() {
    const newErrors: Record<string, string> = {};
    
    // Validate Full Name
    if (!this.personalInfo.fullName || this.personalInfo.fullName.trim() === '') {
      newErrors.fullName = 'Full name is required';
    } else if (this.personalInfo.fullName.length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }
    
    // Validate Date of Birth
    if (!this.personalInfo.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(this.personalInfo.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format';
      } else if (
        age < 18 || 
        (age === 18 && monthDiff < 0) || 
        (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      } else if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    // Validate Nationality
    if (!this.personalInfo.nationality) {
      newErrors.nationality = 'Please select your nationality';
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
