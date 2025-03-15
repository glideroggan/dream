import { LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { UserProduct } from './models/user-product-models';
import { generateProductsForUsers } from './mock/user-products-mock';
import { ProductCategory, ProductEntityType } from './models/product-models';

export class UserProductRepository extends LocalStorageRepository<UserProduct> {
  
  
  constructor(storage: StorageService, userService: UserService) {
    super('user-products', storage, userService);
  }
  
  /**
   * Initialize current user with mock data
   */
  protected async initializeMockData(): Promise<void> {
    // TODO: these should be mocked from the actual products that are offered
    const userType = this.userService.getUserType();
    const mockProducts = await generateProductsForUsers(userType);
    
    mockProducts.forEach(product => {
      this.createForMocks(product);
    });
    
    this.saveToStorage();
  }
  
  /**
   * Add or update a product
   */
  async addOrUpdateProduct(userProduct: UserProduct): Promise<UserProduct> {
    const now = new Date().toISOString();
    
    // Try to get existing product
    const existingProduct = await this.getById(userProduct.id);
    
    if (existingProduct) {
      // Update existing product
      const updatedProduct = {
        ...existingProduct,
        ...userProduct,
        lastUpdated: now
      };
      
      return await this.update(userProduct.id, updatedProduct) as UserProduct;
    } else {
      // Create new product entity
      const newProduct: UserProduct = {
        ...userProduct,
        addedDate: userProduct.addedDate || now,
        lastUpdated: now
      };
      
      return await this.create(newProduct);
    }
  }
  
  /**
   * Get all active products
   */
  async getActiveProducts(): Promise<UserProduct[]> {
    const all = await this.getAll();
    return all.filter(product => product.active);
  }
  
  /**
   * Get active products
   */
  // async getActive(): Promise<UserProduct[]> {
  //   return this.getActiveProducts();
  // }

  async removeProduct(productId: string): Promise<void> {
    await this.delete(productId);
  }

  /**
   * Get products by category
   */
  async getByCategory(category: ProductCategory): Promise<UserProduct[]> {
    const products = await this.getAll();
    return products.filter(
      product => product.category === category && product.active
    );
  }

  /**
   * Get products by entity type
   */
  async getByEntityType(entityType: ProductEntityType): Promise<UserProduct[]> {
    const products = await this.getAll();
    return products.filter(
      product => product.type === entityType && product.active
    );
  }

  /**
   * Get a product by ID
   */
  async getById(id: string): Promise<UserProduct | undefined> {
    const all = await super.getAll()
    return all.find(product => product.metadata?.originalProductId === id);
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string): Promise<UserProduct[]> {
    const product = await this.getById(productId);
    if (!product || !product.relatedProductIds || product.relatedProductIds.length === 0) {
      return [];
    }
    
    const relatedProducts: UserProduct[] = [];
    for (const relatedId of product.relatedProductIds) {
      const related = await this.getById(relatedId);
      if (related && related.active) {
        relatedProducts.push(related);
      }
    }
    
    return relatedProducts;
  }

  async hasProduct(productId: string): Promise<boolean> {
    const product = await this.getById(productId);
    return !!product;
  }
  
  /**
   * Check if a product exists and is active
   */
  async hasActiveProduct(productId: string): Promise<boolean> {
    try {
      // Force a refresh from storage first
      await this.loadFromStorage();
      
      const product = await this.getById(productId);
      const result = !!product && product.active;
      
      // Log more details
      if (product) {
        console.debug(`Repository: Product ${productId} found, active = ${product.active}`);
      } else {
        console.debug(`Repository: Product ${productId} not found`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error checking if product ${productId} is active:`, error);
      return false;
    }
  }
  
  /**
   * Deactivate a product (soft delete)
   */
  async deactivateProduct(productId: string): Promise<boolean> {
    const product = await this.getById(productId);
    
    if (!product) {
      return false;
    }
    
    await this.update(productId, { 
      active: false,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  }
}
