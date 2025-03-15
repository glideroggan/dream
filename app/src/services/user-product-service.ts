import { repositoryService } from './repository-service';
import { kycService } from './kyc-service';
import { userService } from './user-service';
import { 
  BaseProduct,
  Product,
  ProductEntity, 
  ProductEntityType,
  ProductCategory,
  ProductRequirement,
  ProductChangeEventType,
  ProductChangeEvent,
  ProductChangeListener
} from '../repositories/models/product-models';


/**
 * User product service
 * This service handles user-specific product operations
 */
export class UserProductService {
  // Static instance for singleton pattern
  private static instance: UserProductService;
  
  private products: Product[] = [];
  private initialized = false;
  private changeListeners: Set<ProductChangeListener> = new Set();
  private productRepository: any | null = null;
  
  private constructor() {
    console.debug("ProductService instance created");
  }
  
  // Singleton accessor
  public static getInstance(): UserProductService {
    if (!UserProductService.instance) {
      UserProductService.instance = new UserProductService();
    }
    return UserProductService.instance;
  }
  
  /**
   * Ensure the repository is initialized
   */
  private async ensureRepositoryInitialized(): Promise<void> {
    if (!this.productRepository) {
      this.productRepository = repositoryService.getUserProductRepository();
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
   * @param productId ID of the product to check
   * @returns Promise resolving to true if the user has the product
   */
  public async hasProduct(productId: string): Promise<boolean> {
    // Use user repository to check if user has the product
    return userService.hasProduct(productId);
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
    
    // First, check if the user already has the product
    // This prevents duplicate activation
    const alreadyHasProduct = userService.hasProduct(product.id);
    if (alreadyHasProduct) {
      console.debug(`User already has product ${product.id}, won't add again`);
      return Promise.resolve();
    }
    
    // Create a normalized product object that includes all properties
    const normalizedProduct: Product = {
      ...product, // Copy all properties from the specialized product
      type: product.type || 'service',
      active: true
    };
    
    // Add to repository
    if (this.productRepository) {
      await this.productRepository.addOrUpdateProduct(normalizedProduct);
      console.debug(`Added product to repository: ${normalizedProduct.id}`);
    }
    
    // Add to user profile
    userService.addProduct(product.id);
    
    // Check if product already exists in memory
    const existingIndex = this.products.findIndex(p => p.id === normalizedProduct.id);
    
    if (existingIndex >= 0) {
      // Update existing product
      this.products[existingIndex] = { 
        ...this.products[existingIndex],
        ...normalizedProduct
      };
      console.debug(`Updated existing product: ${normalizedProduct.id}`);
      
      // Notify listeners
      this.notifyProductChange('update', normalizedProduct.id, this.products[existingIndex]);
    } else {
      // Add new product
      this.products.push(normalizedProduct);
      console.debug(`Added new product: ${normalizedProduct.id}`);
      
      // Notify listeners
      this.notifyProductChange('add', normalizedProduct.id, normalizedProduct);
    }
    
    // Also dispatch DOM event for backward compatibility
    // this.dispatchProductChangeEvent();
    
    return Promise.resolve();
  }
  
  /**
   * Remove a product from the user's account
   */
  public async removeProduct(productId: string): Promise<void> {
    await this.ensureRepositoryInitialized();
    
    // Remove from user profile
    userService.removeProduct(productId);
    
    // Find product index
    const existingIndex = this.products.findIndex(p => p.id === productId);
    
    if (existingIndex >= 0) {
      // Store product before removing for notification
        const removedProduct = this.products[existingIndex];
      
      // Notify listeners
      this.notifyProductChange('remove', productId, removedProduct);
      
      // Also dispatch DOM event for backward compatibility
      // this.dispatchProductChangeEvent();
    }
    
    return Promise.resolve();
  }
  

  // TODO: not so sure about this, we already have observer pattern in the base repository
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
  
  // /**
  //  * Dispatch DOM event for backward compatibility
  //  * This will be removed in a future version
  //  */
  // private dispatchProductChangeEvent(): void {
  //   // Dispatch a custom event that can be listened to by other components
  //   const event = new CustomEvent('user-products-changed', {
  //     bubbles: true,
  //     composed: true, // Cross shadow DOM boundaries
  //     detail: { products: this.getProducts() }
  //   });
    
  //   document.dispatchEvent(event);
  //   console.debug('Product change DOM event dispatched for backward compatibility');
  // }

  /**
   * Get all available products
   */
  async getAllProducts(): Promise<ProductEntity[]> {
    const repo = repositoryService.getUserProductRepository();
    return await repo.getActive();
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<ProductEntity[]> {
    const repo = repositoryService.getUserProductRepository();
    return await repo.getByCategory(category);
  }

  /**
   * Get products by entity type
   */
  async getProductsByEntityType(entityType: ProductEntityType): Promise<ProductEntity[]> {
    const repo = repositoryService.getUserProductRepository();
    return await repo.getByEntityType(entityType);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductEntity | undefined> {
    const repo = repositoryService.getUserProductRepository();
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
      
      case "hasAccount":
        // Check if user has any compatible accounts
        // For now, we'll implement a simple check
        return await this.userHasCompatibleAccount();
      
      case "custom":
        // Custom requirements would need specific logic
        return true;
      
      default:
        return false;
    }
  }
  
  /**
   * Check if user has any accounts that are compatible with debit cards
   * This is a simplified implementation - in a real system, we would check
   * account types more carefully
   */
  private async userHasCompatibleAccount(): Promise<boolean> {
    try {
      // Get all user's banking accounts
      const accounts = await this.getProductsByType('account');
      return accounts.length > 0;
    } catch (error) {
      console.error("Error checking if user has compatible account:", error);
      return false;
    }
  }

  /**
   * Get related products for cross-selling opportunities
   */
  async getRelatedProducts(productId: string): Promise<ProductEntity[]> {
    const repo = repositoryService.getUserProductRepository();
    return await repo.getRelatedProducts(productId);
  }

  /**
   * Get all products for the current user
   */
  public async getUserProducts(): Promise<Product[]> {
    await this.ensureRepositoryInitialized();
    
    const productIds = userService.getUserProducts();
    const products: Product[] = [];
    
    for (const id of productIds) {
      const product = await this.getProduct(id);
      if (product) {
        products.push(product);
      }
    }
    
    return products;
  }
}

// Export a singleton instance
export const userProductService = UserProductService.getInstance();

// Export a function to get the product service
// export function getProductService(): UserProductService {
//   return userProductService;
// }
