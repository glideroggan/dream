import { customElement, html, css, observable, attr } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";

export interface PersonalInformation {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  idNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface KYCCompletionData {
  personalInfo: PersonalInformation;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

const template = html<KYCWorkflow>/*html*/`
  <div class="kyc-workflow">
    <div class="kyc-form">
      <div class="form-section">
        <h4>Personal Information</h4>
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input type="text" id="fullName" placeholder="Enter your full legal name"
                 value="${x => x.personalInfo.fullName}"
                 @input="${(x, c) => x.handleTextInput('fullName', c.event)}" />
        </div>

        <div class="form-group">
          <label for="dateOfBirth">Date of Birth</label>
          <input type="date" id="dateOfBirth" 
                 value="${x => x.personalInfo.dateOfBirth}"
                 @input="${(x, c) => x.handleTextInput('dateOfBirth', c.event)}" />
        </div>

        <div class="form-group">
          <label for="nationality">Nationality</label>
          <select id="nationality" 
                  @change="${(x, c) => x.handleTextInput('nationality', c.event)}">
            <option value="" disabled selected>Select your nationality</option>
            <option value="US" ?selected="${x => x.personalInfo.nationality === 'US'}">United States</option>
            <option value="CA" ?selected="${x => x.personalInfo.nationality === 'CA'}">Canada</option>
            <option value="UK" ?selected="${x => x.personalInfo.nationality === 'UK'}">United Kingdom</option>
            <option value="AU" ?selected="${x => x.personalInfo.nationality === 'AU'}">Australia</option>
            <option value="DE" ?selected="${x => x.personalInfo.nationality === 'DE'}">Germany</option>
            <option value="FR" ?selected="${x => x.personalInfo.nationality === 'FR'}">France</option>
            <!-- Add more countries as needed -->
          </select>
        </div>
      </div>

      <div class="form-section">
        <h4>Identity Verification</h4>
        <div class="form-group">
          <label for="idType">ID Type</label>
          <select id="idType" 
                  @change="${(x, c) => x.handleTextInput('idType', c.event)}">
            <option value="" disabled selected>Select ID type</option>
            <option value="passport" ?selected="${x => x.personalInfo.idType === 'passport'}">Passport</option>
            <option value="drivers_license" ?selected="${x => x.personalInfo.idType === 'drivers_license'}">Driver's License</option>
            <option value="national_id" ?selected="${x => x.personalInfo.idType === 'national_id'}">National ID Card</option>
          </select>
        </div>

        <div class="form-group">
          <label for="idNumber">ID Number</label>
          <input type="text" id="idNumber" placeholder="Enter your ID number"
                 value="${x => x.personalInfo.idNumber}"
                 @input="${(x, c) => x.handleTextInput('idNumber', c.event)}" />
        </div>

        <div class="form-group">
          <label>ID Document Upload</label>
          <div class="document-upload">
            <input type="file" id="idDocument" accept="image/jpeg,image/png,application/pdf"
                   @change="${(x, c) => x.handleFileUpload(c.event)}" />
            <button class="upload-button" @click="${x => x.triggerFileUpload()}">
              Upload ID Document
            </button>
            <span class="file-name">${x => x.uploadedFileName || 'No file selected'}</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4>Address Information</h4>
        <div class="form-group">
          <label for="addressLine1">Address Line 1</label>
          <input type="text" id="addressLine1" placeholder="Street address"
                 value="${x => x.personalInfo.addressLine1}"
                 @input="${(x, c) => x.handleTextInput('addressLine1', c.event)}" />
        </div>

        <div class="form-group">
          <label for="addressLine2">Address Line 2 (Optional)</label>
          <input type="text" id="addressLine2" placeholder="Apartment, suite, unit, etc."
                 value="${x => x.personalInfo.addressLine2}"
                 @input="${(x, c) => x.handleTextInput('addressLine2', c.event)}" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="city">City</label>
            <input type="text" id="city" placeholder="City"
                   value="${x => x.personalInfo.city}"
                   @input="${(x, c) => x.handleTextInput('city', c.event)}" />
          </div>

          <div class="form-group">
            <label for="postalCode">Postal Code</label>
            <input type="text" id="postalCode" placeholder="Postal Code"
                   value="${x => x.personalInfo.postalCode}"
                   @input="${(x, c) => x.handleTextInput('postalCode', c.event)}" />
          </div>
        </div>

        <div class="form-group">
          <label for="country">Country</label>
          <select id="country" 
                  @change="${(x, c) => x.handleTextInput('country', c.event)}">
            <option value="" disabled selected>Select your country</option>
            <option value="US" ?selected="${x => x.personalInfo.country === 'US'}">United States</option>
            <option value="CA" ?selected="${x => x.personalInfo.country === 'CA'}">Canada</option>
            <option value="UK" ?selected="${x => x.personalInfo.country === 'UK'}">United Kingdom</option>
            <option value="AU" ?selected="${x => x.personalInfo.country === 'AU'}">Australia</option>
            <option value="DE" ?selected="${x => x.personalInfo.country === 'DE'}">Germany</option>
            <option value="FR" ?selected="${x => x.personalInfo.country === 'FR'}">France</option>
            <!-- Add more countries as needed -->
          </select>
        </div>
      </div>

      <div class="disclaimer">
        <label class="checkbox-container">
          <input type="checkbox" id="consent" 
                 ?checked="${x => x.consentChecked}"
                 @change="${(x, c) => x.handleConsentChange(c.event)}" />
          <span class="checkmark"></span>
          I confirm that all information provided is accurate and I consent to having my identity verified.
        </label>
      </div>

      ${x => x.errorMessage ? html`<div class="error-message">${x => x.errorMessage}</div>` : ''}
    </div>
  </div>
`;

const styles = css`
  .kyc-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .kyc-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-section {
    background-color: var(--section-bg, #f8f9fa);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--border-color, #e0e0e0);
  }
  
  .form-section h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--heading-color, #333);
    font-weight: 600;
    font-size: 18px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }
  
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
  }
  
  .form-row > .form-group {
    flex: 1;
  }
  
  label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  input[type="text"],
  input[type="date"],
  select {
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
    background-color: var(--input-bg, white);
  }
  
  input[type="text"]:focus,
  input[type="date"]:focus,
  select:focus {
    border-color: var(--primary-color, #3498db);
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
  }
  
  /* Only show validation styles after user interaction */
  input:user-invalid,
  select:user-invalid {
    border-color: var(--error-color, #e74c3c);
    background-color: var(--error-bg, rgba(231, 76, 60, 0.05));
  }
  
  .document-upload {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .document-upload input[type="file"] {
    display: none;
  }
  
  .upload-button {
    background-color: var(--upload-btn-bg, #f0f0f0);
    color: var(--upload-btn-text, #333);
    padding: 10px 16px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-weight: 500;
  }
  
  .upload-button:hover {
    background-color: var(--upload-btn-hover, #e0e0e0);
  }
  
  .file-name {
    font-size: 14px;
    color: var(--text-secondary, #666);
    font-style: italic;
  }
  
  .disclaimer {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
  
  .checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    position: relative;
    cursor: pointer;
    user-select: none;
  }
  
  .checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }
  
  .checkmark {
    position: relative;
    top: 2px;
    height: 18px;
    width: 18px;
    background-color: var(--checkbox-bg, #fff);
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    flex-shrink: 0;
  }
  
  .checkbox-container:hover input ~ .checkmark {
    border-color: var(--checkbox-hover, #ccc);
  }
  
  .checkbox-container input:checked ~ .checkmark {
    background-color: var(--primary-color, #3498db);
    border-color: var(--primary-color, #3498db);
  }
  
  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }
  
  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    padding: 10px;
    border-radius: 4px;
    background-color: var(--error-bg, rgba(231, 76, 60, 0.1));
    margin-top: 8px;
  }
`;

@customElement({
  name: "kyc-workflow",
  template,
  styles
})
export class KYCWorkflow extends WorkflowBase {
  @attr({ mode: "boolean" }) autoFocus: boolean = true;
  
  @observable personalInfo: PersonalInformation = {
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
  
  @observable errorMessage: string = '';
  @observable consentChecked: boolean = false;
  @observable uploadedFile: File | null = null;
  @observable uploadedFileName: string = '';
  
  initialize(params?: Record<string, any>): void {
    // Set initial title and footer
    this.updateTitle("Identity Verification (KYC)");
    this.updateFooter(true, "Submit Verification");
    
    // Pre-fill data if provided
    if (params?.personalInfo) {
      this.personalInfo = { ...this.personalInfo, ...params.personalInfo };
    }
    
    // Default validation state is invalid until user completes form
    this.validateForm();
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // Add required attributes to form fields
    setTimeout(() => {
      const requiredFields = [
        'fullName', 'dateOfBirth', 'nationality', 
        'idType', 'idNumber', 'addressLine1', 
        'city', 'postalCode', 'country'
      ];
      
      requiredFields.forEach(fieldId => {
        const field = this.shadowRoot?.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement;
        if (field) field.required = true;
      });
      
      // Focus on first field when component is loaded
      if (this.autoFocus) {
        const firstField = this.shadowRoot?.getElementById('fullName') as HTMLInputElement;
        if (firstField) firstField.focus();
      }
    }, 0);
  }
  
  handleTextInput(field: string, event: Event) {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    this.personalInfo = {
      ...this.personalInfo,
      [field]: input.value
    };
    this.validateForm();
  }
  
  handleConsentChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.consentChecked = checkbox.checked;
    this.validateForm();
  }
  
  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadedFile = input.files[0];
      this.uploadedFileName = input.files[0].name;
      this.validateForm();
    }
  }
  
  triggerFileUpload() {
    const fileInput = this.shadowRoot?.getElementById('idDocument') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  
  validateForm(): boolean {
    // Clear previous error message
    this.errorMessage = '';
    
    // Validate required fields
    const requiredFields: Array<[keyof PersonalInformation, string]> = [
      ['fullName', 'Full Name'],
      ['dateOfBirth', 'Date of Birth'],
      ['nationality', 'Nationality'],
      ['idType', 'ID Type'],
      ['idNumber', 'ID Number'],
      ['addressLine1', 'Address'],
      ['city', 'City'],
      ['postalCode', 'Postal Code'],
      ['country', 'Country']
    ];
    
    for (const [field, label] of requiredFields) {
      if (!this.personalInfo[field]) {
        this.errorMessage = `${label} is required`;
        this.notifyValidation(false, this.errorMessage);
        this.markInvalid(field as string);
        return false;
      }
    }
    
    // Validate date of birth - must be at least 18 years ago
    if (this.personalInfo.dateOfBirth) {
      const birthDate = new Date(this.personalInfo.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (age < 18 || (age === 18 && monthDiff < 0) || 
          (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        this.errorMessage = 'You must be at least 18 years old';
        this.notifyValidation(false, this.errorMessage);
        this.markInvalid('dateOfBirth');
        return false;
      }
    }
    
    // Validate ID document upload
    if (!this.uploadedFile) {
      this.errorMessage = 'Please upload your ID document';
      this.notifyValidation(false, this.errorMessage);
      return false;
    }
    
    // Validate file type and size
    const validFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validFileTypes.includes(this.uploadedFile.type)) {
      this.errorMessage = 'Invalid file type. Please upload a JPEG, PNG, or PDF';
      this.notifyValidation(false, this.errorMessage);
      return false;
    }
    
    if (this.uploadedFile.size > 5 * 1024 * 1024) { // 5MB limit
      this.errorMessage = 'File size exceeds 5MB limit';
      this.notifyValidation(false, this.errorMessage);
      return false;
    }
    
    // Validate consent checkbox
    if (!this.consentChecked) {
      this.errorMessage = 'You must confirm that the information is accurate and consent to verification';
      this.notifyValidation(false, this.errorMessage);
      return false;
    }
    
    // Reset any invalid states
    this.resetInvalidStates();
    
    // If we got here, form is valid
    this.notifyValidation(true);
    return true;
  }
  
  /**
   * Mark a form element as invalid using HTML's validity API
   */
  private markInvalid(elementId: string): void {
    const element = this.shadowRoot?.getElementById(elementId) as HTMLInputElement | HTMLSelectElement;
    if (element) {
      element.setCustomValidity(this.errorMessage);
      element.reportValidity();
    }
  }
  
  /**
   * Reset invalid states for all inputs
   */
  private resetInvalidStates(): void {
    const fields = [
      'fullName', 'dateOfBirth', 'nationality', 
      'idType', 'idNumber', 'addressLine1', 
      'addressLine2', 'city', 'postalCode', 'country'
    ];
    
    fields.forEach(id => {
      const element = this.shadowRoot?.getElementById(id) as HTMLInputElement | HTMLSelectElement;
      if (element) {
        element.setCustomValidity('');
      }
    });
  }
  
  /**
   * Submit KYC verification data
   */
  private submitKYC() {
    if (!this.validateForm()) return;
    
    // In a real app, you'd upload the document and personal information to a server
    // For this example, we'll simulate a successful submission
    
    const kycData: KYCCompletionData = {
      personalInfo: { ...this.personalInfo },
      verificationStatus: 'pending'
    };
    
    // Use the workflow base methods to complete
    this.complete(true, { kyc: kycData }, "Your identity verification has been submitted");
  }
  
  // Handle primary action from modal footer
  public handlePrimaryAction(): void {
    this.submitKYC();
  }
}
