import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { PersonalInformation } from "./kyc-workflow";

const template = html<KycStep1Component>/*html*/`
  <div class="form-section">
    <h4>Personal Information</h4>
    <div class="form-group">
      <label for="fullName">Full Name</label>
      <input type="text" id="fullName" placeholder="Enter your full legal name"
            :value="${x => x.personalInfo.fullName}"
            @input="${(x, c) => x.handleTextInput('fullName', c.event)}" />
    </div>

    <div class="form-group">
      <label for="dateOfBirth">Date of Birth</label>
      <input type="date" id="dateOfBirth" 
            :value="${x => x.personalInfo.dateOfBirth}"
            @change="${(x, c) => x.handleTextInput('dateOfBirth', c.event)}" />
    </div>

    <div class="form-group">
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
`;

@customElement({
  name: "kyc-step1",
  template,
  styles
})
export class KycStep1Component extends FASTElement {
  @observable personalInfo: PersonalInformation;
  
  constructor() {
    super();
    this.personalInfo = {
      email: '',
      phone: '',
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
}
