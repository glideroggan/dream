import { customElement, html, css, observable, repeat } from "@microsoft/fast-element";
import { WorkflowBase } from "./workflow-base";
import { getProductService } from "../services/product-service";

export interface SwishProduct {
  id: string;
  name: string;
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
      
      ${(x) => x.isProductAdded 
        ? html`<div class="success-message">✓ Product added to your account!</div>` 
        : html``
      }
    </div>
    
    <div class="product-note">
      <p>By adding this product to your account, you agree to the terms and conditions. 
         You can remove it anytime from your account settings.</p>
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
`;

@customElement({
  name: "swish-workflow",
  template,
  styles
})
export class SwishWorkflow extends WorkflowBase {
  @observable product: SwishProduct = {
    id: "swish-standard",
    name: "Swish Premium",
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
  
  initialize(params?: Record<string, any>): void {
    // Override product details if provided in params
    if (params?.product) {
      this.product = { ...this.product, ...params.product };
    }
    
    // Set product image if available
    this.productImage = params?.imageUrl || this.product.imageUrl;
    
    // Set up the workflow UI
    this.updateTitle(`Add ${this.product.name} to Your Account`);
    this.updateFooter(true, "Add to My Account");
    
    // Check if user already has this product
    const productService = getProductService();
    if (productService.hasProduct(this.product.id)) {
      this.isProductAdded = true;
    }
  }
  
  formatPrice(price: number): string {
    return price.toFixed(2);
  }
  
  public handlePrimaryAction(): void {
    this.addProductToAccount();
  }
  
  private async addProductToAccount(): Promise<void> {
    try {
      const productService = getProductService();
      
      // Check if already added to avoid duplicates
      if (productService.hasProduct(this.product.id)) {
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
}
