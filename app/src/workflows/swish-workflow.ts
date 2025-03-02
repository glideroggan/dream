import { customElement, html, css, observable, repeat, when } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "./workflow-base";
import { getProductService, BaseProduct } from "../services/product-service";

export interface SwishProduct extends BaseProduct {
  description: string;
  features: string[];
  price: number;
  currency: string;
  imageUrl?: string;
}

const template = html<SwishWorkflow>/*html*/`
  <div class="swish-workflow">
    <div class="product-info">
      ${(x) => x.productImage 
        ? html`<img class="product-image" src="${x => x.productImage}" alt="${x => x.product.name}">` 
        : html`<div class="product-image-placeholder">Swish</div>`
      }
      
      <h3 class="product-name">${x => x.product.name}</h3>
      <div class="product-price">${x => x.formatPrice(x.product.price)} ${x => x.product.currency}</div>
      
      <p class="product-description">${x => x.product.description}</p>
      
      <div class="product-features">
        <h4>Features</h4>
        <ul>
          ${repeat(x => x.product.features, html`<li>${x => x}</li>`)}
        </ul>
      </div>
      ${when(x => x.isProductAdded, html`<div class="success-message">✓ Product added to your account!</div>`)}
    </div>
    
    <div class="agreement-container">
      <div class="agreement-checkbox-wrapper ${x => x.agreementChecked ? 'checked' : ''}" @click="${x => x.toggleAgreement()}">
        <div class="custom-checkbox">
          ${when(x => x.agreementChecked, html`
            <svg class="checkmark" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
            </svg>
          `)}
        </div>
        <span class="checkbox-label">I agree to the terms and conditions. This product can be removed anytime from your account settings.</span>
      </div>
      ${when(x => !x.agreementChecked && x.showValidationErrors, html`
        <div class="error-message">You must agree to the terms before proceeding</div>
      `)}
    </div>
  </div>
`;

const styles = css`
  .swish-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 0;
    max-width: 600px;
  }
  
  .product-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .product-image-placeholder {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 8px;
    font-size: 24px;
    color: #666;
    font-weight: bold;
  }
  
  .product-name {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
  
  .product-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--accent-color, #3498db);
  }
  
  .product-description {
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-color, #333);
    margin: 8px 0;
  }
  
  .product-features {
    margin: 12px 0;
  }
  
  .product-features h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
  }
  
  .product-features ul {
    margin: 0;
    padding-left: 20px;
  }
  
  .product-features li {
    margin-bottom: 6px;
  }
  
  .product-note {
    font-size: 14px;
    color: var(--text-secondary, #666);
    background-color: #f9f9f9;
    padding: 12px;
    border-radius: 4px;
    border-left: 4px solid var(--accent-color, #3498db);
  }
  
  .success-message {
    background-color: #e8f7ee;
    color: #2ecc71;
    padding: 12px;
    border-radius: 4px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .agreement-container {
    margin-top: 12px;
    padding: 8px 0;
  }
  
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
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .agreement-checkbox-wrapper.checked {
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  /* Custom checkbox design */
  .custom-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color, #ccc);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
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
    color: var(--text-secondary, #666);
    line-height: 1.4;
    flex: 1;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    margin-top: 6px;
    animation: fadeIn 0.3s ease-in-out;
  }
`;

@customElement({
  name: "swish-workflow",
  template,
  styles
})
export class SwishWorkflow extends WorkflowBase {
  // TODO: there should be a product registry
  @observable product: SwishProduct = {
    id: "swish-standard",  // This ID must match what's checked in searchDisabledCondition
    name: "Swish Premium",
    type: "payment-service",
    active: true,
    description: "Swish is a modern payment solution that enables instant transfers between accounts with enhanced security features.",
    features: [
      "Instant transfers 24/7",
      "No transaction fees",
      "Enhanced security with biometric authentication",
      "Transaction history and insights",
      "Scheduled payments",
    ],
    price: 9.99,
    currency: "USD"
  };
  
  @observable productImage?: string;
  @observable isProductAdded: boolean = false;
  @observable agreementChecked: boolean = false;
  @observable showValidationErrors: boolean = false;
  
  async initialize(params?: Record<string, any>): Promise<void> {
    console.debug("Initializing SwishWorkflow with params:", params);
    
    // Override product details if provided in params
    if (params?.product) {
      this.product = { ...this.product, ...params.product };
    }
    
    // Set product image if available
    this.productImage = params?.imageUrl || this.product.imageUrl;
    
    // Set up the workflow UI
    this.updateTitle(`Add ${this.product.name} to Your Account`);
    this.updateFooter(true, "Add to My Account");
    
    // Initially the form is invalid until agreement is checked
    this.notifyValidation(false);
    
    // Check if user already has this product
    const productService = getProductService();
    const hasProduct = await productService.hasProduct(this.product.id);
    if (hasProduct) {
      this.isProductAdded = true;
      // No need for agreement if product is already added
      this.agreementChecked = true;
      this.notifyValidation(true);
    }
  }
  
  connectedCallback(): void {
    super.connectedCallback?.();
    console.debug("SwishWorkflow connected to DOM");
  }
  
  /**
   * Simpler approach: just toggle the agreement state when the whole container is clicked
   * This is more reliable than trying to handle checkbox events directly in FAST Element
   */
  toggleAgreement(): void {
    console.debug("Toggle agreement called, current state:", this.agreementChecked);
    this.agreementChecked = !this.agreementChecked;
    this.validateForm();
  }
  
  validateForm(): boolean {
    const isValid = this.agreementChecked;
    console.debug("Form validation result:", isValid, "Agreement checked:", this.agreementChecked);
    this.notifyValidation(isValid, isValid ? undefined : "Please agree to terms and conditions");
    return isValid;
  }
  
  formatPrice(price: number): string {
    return price.toFixed(2);
  }
  
  public handlePrimaryAction(): void {
    console.debug("Primary action triggered, agreement state:", this.agreementChecked);
    this.showValidationErrors = true;
    
    if (this.validateForm()) {
      this.addProductToAccount();
    }
  }
  
  private async addProductToAccount(): Promise<void> {
    try {
      const productService = getProductService();
      
      // Check if already added to avoid duplicates
      const alreadyAdded = await productService.hasProduct(this.product.id);
      if (alreadyAdded) {
        this.complete(true, { 
          productId: this.product.id,
          alreadyAdded: true
        }, "Product was already added to your account");
        return;
      }
      
      // Add the product to user's account
      await productService.addProduct(this.product);
      
      // Show success message briefly before closing
      this.isProductAdded = true;
      
      // Complete the workflow after a short delay to show success message
      setTimeout(() => {
        this.complete(true, { 
          productId: this.product.id,
          added: true
        }, "Product added successfully");
      }, 1500);
      
    } catch (error) {
      console.error("Failed to add product:", error);
      this.complete(false, undefined, "Failed to add product to your account");
    }
  }
  
  /**
   * Start the KYC process workflow
   */
  async initiateKycWorkflow(): Promise<WorkflowResult> {
    console.debug("Starting KYC process for Swish activation...");
    
    // Make sure we're not trying to start a nested workflow if one is already active
    if ((window as any).__nestedWorkflowActive) {
      console.warn("Nested workflow already active, preventing duplicate");
      return { success: false, message: "Workflow already in progress" };
    }
    
    // Set flag to prevent multiple workflows
    (window as any).__nestedWorkflowActive = true;
    
    try {
      // Start the KYC workflow and wait for its result
      const result = await this.startNestedWorkflow('kyc', {
        reason: `Activating ${this.product.name} requires identity verification.`
      });
      return result;
    } finally {
      // Clear flag when finished
      (window as any).__nestedWorkflowActive = false;
    }
  }
  
  /**
   * Handle resuming after a nested workflow completes
   */
  public resume(result?: WorkflowResult): void {
    console.debug("Swish workflow resumed after nested workflow", result);
    
    // Clear the nested workflow flag just to be sure
    (window as any).__nestedWorkflowActive = false;
    
    // Restore the original UI state
    this.updateTitle(`Add ${this.product.name} to Your Account`);
    this.updateFooter(true, "Add to My Account");
    
    if (result?.success) {
      // Handle successful completion of the nested workflow
      console.debug("Nested workflow completed successfully:", result);
      
      // Continue with product activation if needed
      this.validateForm();
    } else {
      console.debug("Nested workflow was cancelled or failed");
    }
  }
}
