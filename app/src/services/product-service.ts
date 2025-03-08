import { getSingletonManager } from './singleton-manager';
import { ProductRepository } from '../repositories/product-repository';
import { repositoryService } from './repository-service';
import { 
  ProductEntity, 
  ProductEntityType,
  ProductCategory,
  ProductRequirement
} from '../repositories/product-repository';
import { kycService } from './kyc-service';
import { userService } from './user-service';

// Base product interface that all product types extend
export interface BaseProduct {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

// Generic product type with optional properties
export interface Product extends BaseProduct {
  properties?: Record<string, any>;
  [key: string]: any; // Allow any additional properties
}

export type ProductChangeEventType = 'add' | 'remove' | 'update';

export interface ProductChangeEvent {
  type: ProductChangeEventType;
  productId: string;
  product?: Product;
}

export type ProductChangeListener = (event: ProductChangeEvent) => void;

export class ProductService {
  private static instance: ProductService;
  private products: Product[] = [];
  private initialized = false;
  private changeListeners: Set<ProductChangeListener> = new Set();
  private productRepository: ProductRepository | null = null;
  
  private constructor() {
    console.debug("ProductService instance created");
  }
  
  // Singleton accessor
  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }
  
  /**
   * Ensure the repository is initialized
   */
  private async ensureRepositoryInitialized(): Promise<void> {
    if (!this.productRepository) {
      this.productRepository = repositoryService.getProductRepository();
      await this.loadProductsFromRepository();
    }
  }
  
  /**
   * Load products from the repository
   */
  private async loadProductsFromRepository(): Promise<void> {
    if (!this.productRepository) return;
    
    try {
      const storedProducts = await this.productRepository.getActiveProducts();
      
      if (storedProducts.length > 0) {
        this.products = storedProducts;
        console.debug("Loaded products from repository:", this.products);
      } else {
        this.initializeProducts();
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error loading products from repository:", error);
      this.initializeProducts();
    }
  }
  
  private initializeProducts(): void {
    // Some initial mock products
    this.products = [
      { id: 'checking-account', name: 'Checking Account', type: 'account', active: true },
      { id: 'savings-account', name: 'Savings Account', type: 'account', active: true },
      // Don't add Swish initially
    ];
    
    // Save initial products to repository
    this.products.forEach(product => {
      this.saveProductToRepository(product);
    });
    
    this.initialized = true;
    console.debug("Initialized products:", this.products);
  }
  
  /**
   * Save a product to the repository
   */
  private async saveProductToRepository(product: Product): Promise<void> {
    if (!this.productRepository) await this.ensureRepositoryInitialized();
    if (!this.productRepository) {
      console.error("Failed to initialize product repository");
      return;
    }
    
    try {
      await this.productRepository.addOrUpdateProduct(product);
      console.debug(`Saved product to repository: ${product.id}`);
    } catch (error) {
      console.error(`Error saving product ${product.id} to repository:`, error);
    }
  }
  
  /**
   * Subscribe to product changes
   * @param listener The callback function to be called when products change
   * @returns A function that can be called to unsubscribe
   */
  public subscribe(listener: ProductChangeListener): () => void {
    this.changeListeners.add(listener);
    console.debug(`Subscribed to product changes, total listeners: ${this.changeListeners.size}`);
    return () => this.unsubscribe(listener);
  }
  
  /**
   * Unsubscribe from product changes
   * @param listener The callback function to remove
   */
  public unsubscribe(listener: ProductChangeListener): void {
    this.changeListeners.delete(listener);
    console.debug(`Unsubscribed from product changes, remaining listeners: ${this.changeListeners.size}`);
  }
  
  /**
   * Force refresh of products from repository
   * This can be used to ensure we have the latest data
   */
  public async refreshProducts(): Promise<void> {
    await this.ensureRepositoryInitialized();
    
    if (this.productRepository) {
      try {
        // Clear the current products list
        this.products = [];
        
        // Load fresh from repository
        const storedProducts = await this.productRepository.getActiveProducts();
        this.products = storedProducts;
        
        // Log all product IDs for debugging
        console.debug("Products refreshed from repository:", 
          this.products.map(p => `${p.id} (active=${p.active})`).join(', '));
      } catch (error) {
        console.error("Error refreshing products:", error);
      }
    }
  }
  
  /**
   * Check if the user has a specific product
   */
  public async hasProduct(productId: string): Promise<boolean> {
    await this.ensureRepositoryInitialized();
    
    // Force refresh from repository to ensure we have the latest data
    // Use direct repository method instead of refreshProducts to avoid circular refreshing
    if (this.productRepository) {
      try {
        const hasProduct = await this.productRepository.hasActiveProduct(productId);
        console.debug(`Direct repository check: User has product ${productId} = ${hasProduct}`);
        return hasProduct;
      } catch (error) {
        console.error(`Error checking if user has product ${productId}:`, error);
      }
    }
    
    // Fallback to in-memory check if repository check failed
    const hasProductInMemory = this.products.some(p => p.id === productId && p.active);
    console.debug(`In-memory check: User has product ${productId} = ${hasProductInMemory}`);
    return hasProductInMemory;
  }
  
  /**
   * Get all products
   */
  public async getProducts(): Promise<Product[]> {
    await this.ensureRepositoryInitialized();
    return [...this.products]; // Return a copy to prevent direct modification
  }
  
  /**
   * Get a specific product by ID with optional type casting
   */
  public async getProduct<T extends Product = Product>(productId: string): Promise<T | undefined> {
    await this.ensureRepositoryInitialized();
    const product = this.products.find(p => p.id === productId && p.active);
    return product as T | undefined;
  }
  
  /**
   * Get products of a specific type
   */
  public async getProductsByType<T extends Product = Product>(type: string): Promise<T[]> {
    await this.ensureRepositoryInitialized();
    return this.products.filter(p => p.type === type && p.active) as T[];
  }
  
  /**
   * Add a product to the user's account
   * This method accepts any product type that extends BaseProduct
   */
  public async addProduct<T extends BaseProduct>(product: T): Promise<void> {
    await this.ensureRepositoryInitialized();
    
    // Create a normalized product object that includes all properties
    const normalizedProduct: Product = {
      ...product, // Copy all properties from the specialized product
      type: product.type || 'service',
      active: true
    };
    
    // Check if product already exists
    const existingIndex = this.products.findIndex(p => p.id === normalizedProduct.id);
    
    if (existingIndex >= 0) {
      // Update existing product
      this.products[existingIndex] = { 
        ...this.products[existingIndex],
        ...normalizedProduct 
      };
      console.debug(`Updated existing product: ${normalizedProduct.id}`);
      
      // Save to repository
      await this.saveProductToRepository(this.products[existingIndex]);
      
      // Notify listeners
      this.notifyProductChange('update', normalizedProduct.id, this.products[existingIndex]);
    } else {
      // Add new product
      this.products.push(normalizedProduct);
      console.debug(`Added new product: ${normalizedProduct.id}`);
      
      // Save to repository
      await this.saveProductToRepository(normalizedProduct);
      
      // Notify listeners
      this.notifyProductChange('add', normalizedProduct.id, normalizedProduct);
    }
    
    // Also dispatch DOM event for backward compatibility
    this.dispatchProductChangeEvent();
    
    // Force a full refresh after adding the product to ensure
    // all components will see the change immediately
    setTimeout(() => {
      console.debug(`Refreshing products after adding ${normalizedProduct.id}`);
      this.refreshProducts();
    }, 100);
    
    return Promise.resolve();
  }
  
  /**
   * Remove a product from the user's account
   */
  public async removeProduct(productId: string): Promise<void> {
    await this.ensureRepositoryInitialized();
    
    // Find product index
    const existingIndex = this.products.findIndex(p => p.id === productId);
    
    if (existingIndex >= 0) {
      // Store product before removing for notification
      const removedProduct = this.products[existingIndex];
      
      // Mark as inactive
      this.products[existingIndex].active = false;
      
      // Update repository
      if (this.productRepository) {
        await this.productRepository.deactivateProduct(productId);
      }
      
      console.debug(`Removed product: ${productId}`);
      
      // Notify listeners
      this.notifyProductChange('remove', productId, removedProduct);
      
      // Also dispatch DOM event for backward compatibility
      this.dispatchProductChangeEvent();
    }
    
    return Promise.resolve();
  }
  
  /**
   * Notify subscribers about product changes
   */
  private notifyProductChange(type: ProductChangeEventType, productId: string, product?: Product): void {
    const event: ProductChangeEvent = { type, productId, product };
    
    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in product change listener for ${type} event:`, error);
      }
    });
    
    console.debug(`Notified ${this.changeListeners.size} listeners about ${type} event for product ${productId}`);
  }
  
  /**
   * Dispatch DOM event for backward compatibility
   * This will be removed in a future version
   */
  private dispatchProductChangeEvent(): void {
    // Dispatch a custom event that can be listened to by other components
    const event = new CustomEvent('user-products-changed', {
      bubbles: true,
      composed: true, // Cross shadow DOM boundaries
      detail: { products: this.getProducts() }
    });
    
    document.dispatchEvent(event);
    console.debug('Product change DOM event dispatched for backward compatibility');
  }

  /**
   * Get all available products
   */
  async getAllProducts(): Promise<ProductEntity[]> {
    const repo = repositoryService.getProductRepository();
    return await repo.getActive();
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<ProductEntity[]> {
    const repo = repositoryService.getProductRepository();
    return await repo.getByCategory(category);
  }

  /**
   * Get products by entity type
   */
  async getProductsByEntityType(entityType: ProductEntityType): Promise<ProductEntity[]> {
    const repo = repositoryService.getProductRepository();
    return await repo.getByEntityType(entityType);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductEntity | null> {
    const repo = repositoryService.getProductRepository();
    return await repo.getById(id);
  }

  /**
   * Check if user is eligible for a product
   */
  async checkEligibility(productId: string): Promise<{
    eligible: boolean;
    requirementsMet: string[];
    requirementsNotMet: string[];
    message?: string;
  }> {
    const product = await this.getProductById(productId);
    if (!product) {
      return {
        eligible: false,
        requirementsMet: [],
        requirementsNotMet: ["Product not found"],
        message: "Product not found"
      };
    }

    if (!product.requirements || product.requirements.length === 0) {
      return {
        eligible: true,
        requirementsMet: [],
        requirementsNotMet: [],
      };
    }

    const requirementsMet: string[] = [];
    const requirementsNotMet: string[] = [];

    // Check each requirement
    for (const requirement of product.requirements) {
      const meetsRequirement = await this.checkRequirement(requirement);
      if (meetsRequirement) {
        requirementsMet.push(requirement.description);
      } else {
        requirementsNotMet.push(requirement.description);
      }
    }

    const eligible = requirementsNotMet.length === 0;
    
    return {
      eligible,
      requirementsMet,
      requirementsNotMet,
      message: eligible 
        ? "You are eligible for this product" 
        : "You don't meet all requirements for this product"
    };
  }

  /**
   * Check if a specific requirement is met
   */
  private async checkRequirement(requirement: ProductRequirement): Promise<boolean> {
    switch (requirement.type) {
      case "kyc":
        return kycService.meetsKycRequirements(requirement.value as string);
      
      case "age":
        const userAge = userService.getUserAge();
        return userAge >= (requirement.value as number);
      
      case "creditScore":
        // This would need integration with a credit score service
        return true;
      
      case "income":
        // This would need integration with an income verification service
        return true;
      
      case "residency":
        return userService.getUserResidency() === requirement.value;
      
      case "custom":
        // Custom requirements would need specific logic
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Get related products for cross-selling opportunities
   */
  async getRelatedProducts(productId: string): Promise<ProductEntity[]> {
    const repo = repositoryService.getProductRepository();
    return await repo.getRelatedProducts(productId);
  }
}

// Export a singleton instance
export const productService = ProductService.getInstance();

// Export a function to get the product service
export function getProductService(): ProductService {
  return productService;
}
