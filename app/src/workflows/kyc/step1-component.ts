import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { PersonalInformation } from "./kyc-workflow";

const template = html<KycStep1Component>/*html*/`
  <div class="form-section">
    <h4>Personal Information</h4>
    <div class="form-group ${x => x.errors.fullName ? 'invalid' : ''}">
      <label for="fullName">Full Name</label>
      <input type="text" id="fullName" placeholder="Enter your full legal name"
            :value="${x => x.personalInfo.fullName}"
            @input="${(x, c) => x.handleTextInput('fullName', c.event)}" />
      ${x => x.errors.fullName ? html`<div class="error-message">${x => x.errors.fullName}</div>` : ''}
    </div>

    <div class="form-group ${x => x.errors.dateOfBirth ? 'invalid' : ''}">
      <label for="dateOfBirth">Date of Birth</label>
      <input type="date" id="dateOfBirth" 
            :value="${x => x.personalInfo.dateOfBirth}"
            @change="${(x, c) => x.handleTextInput('dateOfBirth', c.event)}" />
      ${x => x.errors.dateOfBirth ? html`<div class="error-message">${x => x.errors.dateOfBirth}</div>` : ''}
    </div>

    <div class="form-group ${x => x.errors.nationality ? 'invalid' : ''}">
      <label for="nationality">Nationality</label>
      <select id="nationality" 
              :value="${x => x.personalInfo.nationality}"
              @change="${(x, c) => x.handleTextInput('nationality', c.event)}">
        <option value="" disabled selected>Select your nationality</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="UK">United Kingdom</option>
        <option value="AU">Australia</option>
        <option value="DE">Germany</option>
        <option value="FR">France</option>
      </select>
      ${x => x.errors.nationality ? html`<div class="error-message">${x => x.errors.nationality}</div>` : ''}
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
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--secondary-text-color, #666);
  }
  
  input[type="text"],
  input[type="date"],
  select {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
    background-color: var(--background-color, white);
  }
  
  input[type="text"]:focus,
  input[type="date"]:focus,
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
  
  .form-group.invalid input,
  .form-group.invalid select {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg-color, rgba(231, 76, 60, 0.05));
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 12px;
    margin-top: 4px;
    font-weight: 500;
  }
  
  .form-group.invalid label {
    color: var(--error-color, #e74c3c);
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
  
  handleTextInput(field: string, event: Event) {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    
    // Update the field
    this.personalInfo = {
      ...this.personalInfo,
      [field]: input.value
    };

    // Validate the form after field update
    this.validateForm();
    
    // Dispatch event to parent
    this.dispatchEvent(new CustomEvent('field-changed', {
      detail: {
        field,
        value: input.value,
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
