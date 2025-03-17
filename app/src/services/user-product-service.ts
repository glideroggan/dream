import { repositoryService } from './repository-service';
import { kycService } from './kyc-service';
import { userService } from './user-service';
import {
  Product,
  ProductEntityType,
  ProductCategory,
  ProductRequirement,
} from '../repositories/models/product-models';
import { ChangeEventType, UserProduct, UserProductChangeEvent, UserProductChangeListener } from '../repositories/models/user-product-models';
import { UserProductRepository } from '../repositories/user-product-repository';
import { AccountType } from '../repositories/models/account-models';
import { cardService } from './card-service';


/**
 * User product service
 * This service handles user-specific product operations
 */
export class UserProductService {
  
  // Static instance for singleton pattern
  private static instance: UserProductService;

  private products: UserProduct[] = [];
  private initialized = false;
  private changeListeners: Set<UserProductChangeListener> = new Set();
  private userProductRepository: UserProductRepository

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
    if (!this.userProductRepository) {
      this.userProductRepository = repositoryService.getUserProductRepository();
      await this.loadProductsFromRepository();
    }
  }

  /**
   * Load products from the repository
   */
  private async loadProductsFromRepository(): Promise<void> {
    if (!this.userProductRepository) return;

    try {
      const storedProducts = await this.userProductRepository.getActiveProducts();
      console.debug("Loaded products from repository:", storedProducts);

      if (storedProducts.length > 0) {
        this.products = storedProducts;
        console.debug("Loaded products from repository:", this.products);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Error loading products from repository:", error);
    }
  }

  /**
   * Request creation of a product based on a product template
   * @param productId The ID of the product template to use
   * @param params Additional parameters for product creation
   * @returns The created user product
   */
  async requestProductCreation(productId: string, params: Record<string, any> = {}): Promise<UserProduct> {
    
    await this.ensureRepositoryInitialized();
    
    // 1. Get the product template from the repository
    const productRepo = repositoryService.getProductRepository();
    const productTemplate = await productRepo.getById(productId);
    
    if (!productTemplate) {
      console.error(`Product template with ID ${productId} not found`);
      throw new Error(`Product template not found`);
    }
    
    console.debug(`Creating user product from template:`, productTemplate);
    
    // 2. Create appropriate product based on the type
    let userProduct: UserProduct;
    
    switch (productTemplate.type) {
      case 'account':
        userProduct = await this.createAccountProduct(productTemplate, params);
        break;
        
      case 'card':
      case 'credit':
      case 'debit':
        userProduct = await this.createCardProduct(productTemplate, params);
        break;
        
      case 'service':
        userProduct = await this.createServiceProduct(productTemplate, params);
        break;
        
      case 'loan':
        userProduct = await this.createLoanProduct(productTemplate, params);
        break;
        
      case 'insurance':
        userProduct = await this.createInsuranceProduct(productTemplate, params);
        break;
        
      default:
        // Generic product creation
        userProduct = await this.createGenericProduct(productTemplate, params);
    }
    
    return userProduct;
  }

  /**
   * Create an account product for the user
   */
  private async createAccountProduct(template: Product, params: Record<string, any>): Promise<UserProduct> {
    const accountRepo = repositoryService.getAccountRepository();
    
    // Create the actual account in the account repository
    const account = await accountRepo.createAccount({
      name: params.accountName || `My ${template.name}`,
      balance: params.initialBalance || 0,
      currency: params.currency || 'USD',
      type: this.mapProductToAccountType(template.id)
    });
    
    console.debug(`Created account:`, account);
    
    // Now create a user product that references this account
    const userProduct = await this.addProduct({
      ...template,
      metadata: {
        ...template.metadata,
        accountId: account.id,
        status: 'active'
      }
    });
    
    if (!userProduct) {
      throw new Error('Failed to create user product for account');
    }
    
    return userProduct;
  }

  /**
   * Create a card product for the user
   */
  private async createCardProduct(template: Product, params: Record<string, any>): Promise<UserProduct> {
    // For cards, we use the card service to handle the creation
    
    // If we don't have a direct card service, we'll use the standard product creation
    if (!cardService) {
      return this.createGenericProduct(template, params);
    }
    
    // The card service will handle the actual card creation and return a card request result
    const cardResult = await cardService.requestCard({
      productId: template.id,
      cardType: params.cardType || 'debit',
      linkedAccountId: params.linkedAccountId,
      requestDate: new Date().toISOString()
    });
    
    if (!cardResult.success || !cardResult.data?.productId) {
      throw new Error(cardResult.message || 'Failed to create card product');
    }
    
    // The card service should have created the user product, so we can just retrieve it
    const userProduct = await this.getProductById(cardResult.data.productId);
    
    if (!userProduct) {
      throw new Error('Card service did not properly create user product');
    }
    
    return userProduct;
  }

  /**
   * Create a service product for the user
   */
  private async createServiceProduct(template: Product, params: Record<string, any>): Promise<UserProduct> {
    // For services like Swish, overdraft protection, etc.
    return this.createGenericProduct(template, params);
  }

  /**
   * Create a loan product for the user
   */
  private async createLoanProduct(template: Product, params: Record<string, any>): Promise<UserProduct> {
    // For loans, we'd typically trigger a loan application workflow
    // But for now, we'll use the generic product creation
    return this.createGenericProduct(template, params);
  }

  /**
   * Create an insurance product for the user
   */
  private async createInsuranceProduct(template: Product, params: Record<string, any>): Promise<UserProduct> {
    // For insurance products, we might trigger an insurance application
    // But for now, we'll use the generic product creation
    return this.createGenericProduct(template, params);
  }

  /**
   * Create a generic product from a template
   */
  private async createGenericProduct(template: Product, params: Record<string, any>): Promise<UserProduct> {
    const userProduct = await this.addProduct({
      ...template,
      metadata: {
        ...template.metadata,
        ...(params.metadata || {}),
        status: params.status || 'active'
      }
    });
    
    if (!userProduct) {
      throw new Error('Failed to create user product');
    }
    
    return userProduct;
  }

  /**
   * Map product ID to account type
   */
  private mapProductToAccountType(productId: string): AccountType {
    const mapping: Record<string, AccountType> = {
      'checking-account': 'checking',
      'savings-account': 'savings',
      'isk-account': 'investment',
      'pension-account': 'investment'
    };
    
    return mapping[productId] || 'checking';
  }

  /**
   * Subscribe to product changes
   * @param listener The callback function to be called when products change
   * @returns A function that can be called to unsubscribe
   */
  public subscribe(listener: UserProductChangeListener): () => void {
    this.changeListeners.add(listener);
    console.debug(`Subscribed to product changes, total listeners: ${this.changeListeners.size}`);
    return () => this.unsubscribe(listener);
  }

  /**
   * Unsubscribe from product changes
   * @param listener The callback function to remove
   */
  public unsubscribe(listener: UserProductChangeListener): void {
    this.changeListeners.delete(listener);
    console.debug(`Unsubscribed from product changes, remaining listeners: ${this.changeListeners.size}`);
  }

  /**
   * Force refresh of products from repository
   * This can be used to ensure we have the latest data
   */
  public async refreshProducts(): Promise<void> {
    await this.ensureRepositoryInitialized();

    if (this.userProductRepository) {
      try {
        // Clear the current products list
        this.products = [];

        // Load fresh from repository
        const storedProducts = await this.userProductRepository.getActiveProducts();
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
    await this.ensureRepositoryInitialized();
    // Use user repository to check if user has the product
    // return this.userProductRepository.hasProduct(productId);
    return !!this.products.find(p => p.metadata?.originalProductId === productId && p.active);
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
  public async getProduct<T extends UserProduct = UserProduct>(productId: string): Promise<T | undefined> {
    await this.ensureRepositoryInitialized();
    console.debug('[UserProductService:getProduct] productId', productId, this.products)
    
    const product = this.products.find(p => p.metadata?.originalProductId === productId && p.active);
    console.debug('[UserProductService:getProduct] product', product)
    return product as T | undefined;
  }

  /**
   * Get products of a specific type
   */
  public async getProductsByType<T extends UserProduct = UserProduct>(type: string): Promise<T[]> {
    await this.ensureRepositoryInitialized();
    return this.products.filter(p => p.type === type && p.active) as T[];
  }

  /**
   * Add a product to the user's account
   * This method accepts any product type that extends BaseProduct
   */
  // TODO: should be calling "requestProductCreation" instead
  public async addProduct<T extends Partial<UserProduct>>(product: T): Promise<UserProduct | undefined> {
    
    await this.ensureRepositoryInitialized();

    let userProduct: UserProduct;
    let templateProductId: string | undefined;

    /** 
     * Should add the specific product to the users product list, 
     * filled in with specific details for the user
     * 
     * Should create a task if the product requires processing
     */
    
    // Check if this is a template product (doesn't have addedDate) or already a user product
    const isTemplateProduct = !product.addedDate;
    
    if (isTemplateProduct) {
      // This is a template - get the full template from product repository
      const productRepo = repositoryService.getProductRepository();
      let productTemplate;
      
      // Try to get template ID from the provided data
      templateProductId = product.metadata?.originalProductId || product.id;
      
      if (templateProductId) {
        productTemplate = await productRepo.getById(templateProductId);
        console.debug(`Looking up product template by ID: ${templateProductId}`);
      }
      
      // Generate a unique ID for the user product
      const uniqueId = `user-product-${templateProductId || product.type}-${Date.now()}`;
      
      // Create a user product by extending the template
      userProduct = {
        ...(productTemplate || {}), // Base properties from template if found
        ...product as any, // Override with provided properties
        id: uniqueId, // Use our generated unique ID
        active: true,
        addedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        // Retain any provided metadata and add standard fields
        metadata: {
          ...(productTemplate?.metadata || {}),
          ...(product.metadata || {}),
          originalProductId: templateProductId, // Store the original template ID
          status: product.metadata?.status || 'active'
        }
      };
    } else {
      // This is already a user product with all required fields
      userProduct = {
        ...product as any,
        id: product.id || `user-product-${Date.now()}`, // Generate ID if not provided
        active: product.active !== undefined ? product.active : true,
        addedDate: product.addedDate || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      templateProductId = product.metadata?.originalProductId;
    }
    
    // Check if the user already has this product (by original product ID)
    if (templateProductId) {
      const alreadyHasProduct = await this.userProductRepository!.hasActiveProduct(templateProductId);
      if (alreadyHasProduct) {
        console.debug(`User already has product ${templateProductId}, won't add again`);
        return await this.getProductById(templateProductId);
      }
    }

    // Add to repository
    let addedProduct: UserProduct | undefined;
    try {
      addedProduct = await this.userProductRepository!.addOrUpdateProduct(userProduct);
      console.debug(`Added product to repository: ${userProduct.id}`);
      
      // Update in-memory cache
      const existingIndex = this.products.findIndex(p => p.id === userProduct.id);
      if (existingIndex >= 0) {
        this.products[existingIndex] = userProduct;
        this.notifyProductChange('update', userProduct.id, userProduct);
      } else {
        this.products.push(userProduct);
        this.notifyProductChange('add', userProduct.id, userProduct);
      }
    } catch (error) {
      console.error('Error adding product to repository:', error);
    }

    return addedProduct;
  }

  /**
   * Remove a product from the user's account
   */
  public async removeProduct(productId: string): Promise<void> {
    await this.ensureRepositoryInitialized();

    // Remove from user profile
    // userService.removeProduct(productId);
    await this.userProductRepository.removeProduct(productId);

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
  private notifyProductChange(type: ChangeEventType, productId: string, product?: UserProduct): void {
    const event: UserProductChangeEvent = { type, productId, product };

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
  // async getAllProducts(): Promise<UserProduct[]> {
  //   return await this.userProductRepository.getAll();
  // }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<UserProduct[]> {
    return await this.userProductRepository.getByCategory(category);
  }

  /**
   * Get products by entity type
   */
  async getProductsByEntityType(entityType: ProductEntityType): Promise<UserProduct[]> {
    return await this.userProductRepository.getByEntityType(entityType);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<UserProduct | undefined> {
    return await this.userProductRepository.getById(id);
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
  async getRelatedProducts(productId: string): Promise<UserProduct[]> {
    return await this.userProductRepository.getRelatedProducts(productId);
  }

  /**
   * Get all products for the current user
   */
  public async getUserProducts(): Promise<Product[]> {
    await this.ensureRepositoryInitialized();
    const products = await this.userProductRepository.getAll()

    return products;
  }
}

// Export a singleton instance
export const userProductService = UserProductService.getInstance();

// Export a function to get the product service
// export function getProductService(): UserProductService {
//   return userProductService;
// }
