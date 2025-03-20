import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import { PersonalInformation } from "./kyc-workflow";

const template = html<KycStep2Component>/*html*/`
  <div class="form-section">
    <h4>Identity Verification</h4>
    <div class="form-group ${x => x.errors.idType ? 'invalid' : ''}">
      <label for="idType">ID Type</label>
      <select id="idType" 
              :value="${x => x.personalInfo.idType}"
              @change="${(x, c) => x.handleTextInput('idType', c.event)}">
        <option value="" disabled selected>Select ID type</option>
        <option value="passport">Passport</option>
        <option value="drivers_license">Driver's License</option>
        <option value="national_id">National ID Card</option>
      </select>
      ${x => x.errors.idType ? html`<div class="error-message">${x => x.errors.idType}</div>` : ''}
    </div>

    <div class="form-group ${x => x.errors.idNumber ? 'invalid' : ''}">
      <label for="idNumber">ID Number</label>
      <input type="text" id="idNumber" placeholder="Enter your ID number"
             :value="${x => x.personalInfo.idNumber}"
             @input="${(x, c) => x.handleTextInput('idNumber', c.event)}" />
      ${x => x.errors.idNumber ? html`<div class="error-message">${x => x.errors.idNumber}</div>` : ''}
    </div>

    <div class="form-group ${x => x.errors.document ? 'invalid' : ''}">
      <label>ID Document Upload</label>
      <div class="document-upload">
        <button class="upload-button" @click="${x => x.fakeDocumentUpload()}">
          Upload ID Document
        </button>
        <span class="file-name">${x => x.uploadedFileName || 'No file selected'}</span>
      </div>
      ${x => x.errors.document ? html`<div class="error-message">${x => x.errors.document}</div>` : ''}
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
  select {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
    background-color: var(--background-color, white);
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
  
  .document-upload {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .upload-button {
    background-color: var(--background-card, #f0f0f0);
    color: var(--primary-text-color, #333);
    padding: 10px 16px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-weight: 500;
  }
  
  .upload-button:hover {
    background-color: var(--hover-bg, #e0e0e0);
  }
  
  .file-name {
    font-size: 14px;
    color: var(--secondary-text-color, #666);
    font-style: italic;
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
  
  .form-group.invalid .upload-button {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg-color, rgba(231, 76, 60, 0.05));
  }
`;

@customElement({
  name: "kyc-step2",
  template,
  styles
})
export class KycStep2Component extends FASTElement {
  @observable personalInfo: PersonalInformation;
  @observable uploadedFileName: string = '';
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
      const firstField = this.shadowRoot?.getElementById('idType') as HTMLSelectElement;
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
    
    // Validate the form
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
  
  fakeDocumentUpload(): void {
    // Show an alert to simulate file selection
    alert("Document upload simulated. In a real application, this would open a file picker.");
    
    // Set a fake file name
    this.uploadedFileName = "id_document.jpg";
    
    // Clear document error if it exists
    if (this.errors.document) {
      const { document, ...remainingErrors } = this.errors;
      this.errors = remainingErrors;
    }
    
    // Re-validate the form
    this.validateForm();
    
    // Notify parent component
    this.dispatchEvent(new CustomEvent('document-uploaded', {
      detail: {
        fileName: this.uploadedFileName,
        isValid: this.isValid,
        errors: this.errors
      },
      bubbles: true,
      composed: true
    }));
  }
  
  validateForm() {
    const newErrors: Record<string, string> = {};
    
    // Validate ID Type
    if (!this.personalInfo.idType) {
      newErrors.idType = 'Please select an ID type';
    }
    
    // Validate ID Number based on ID type
    if (!this.personalInfo.idNumber) {
      newErrors.idNumber = 'ID number is required';
    } else {
      // Add specific validation based on ID type
      switch (this.personalInfo.idType) {
        case 'passport':
          if (!/^[A-Z0-9]{6,9}$/i.test(this.personalInfo.idNumber)) {
            newErrors.idNumber = 'Passport number should be 6-9 alphanumeric characters';
          }
          break;
        case 'drivers_license':
          if (this.personalInfo.idNumber.length < 5) {
            newErrors.idNumber = 'Driver\'s license number is too short';
          }
          break;
        case 'national_id':
          if (!/^[0-9]{6,12}$/.test(this.personalInfo.idNumber)) {
            newErrors.idNumber = 'National ID should be 6-12 digits';
          }
          break;
      }
    }
    
    // Validate Document Upload
    if (!this.uploadedFileName) {
      newErrors.document = 'Please upload your ID document';
    }
    
    // Update errors state
    this.errors = newErrors;

    console.debug("Validation errors:", this.errors);
    
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
