import { LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { Entity } from '../services/repository-service';
import { Product } from '../services/product-service';

/**
 * Product entity for storage that extends the Product interface
 */
export interface ProductEntity extends Entity, Product {
  // Entity already provides the id field
  // Adding any additional storage-specific fields here
  addedDate: string;
  lastUpdated: string;
}

/**
 * Repository for managing user products
 */
export class ProductRepository extends LocalStorageRepository<ProductEntity> {
  constructor(storage: StorageService, userService: UserService) {
    super('products', storage, userService);
  }
  
  /**
   * Initialize with mock data
   */
  protected initializeMockData(): void {
    const now = new Date().toISOString();
    
    const mockProducts: ProductEntity[] = [
      {
        id: 'checking-account',
        name: 'Checking Account',
        type: 'account',
        active: true,
        addedDate: now,
        lastUpdated: now
      },
      {
        id: 'savings-account',
        name: 'Savings Account',
        type: 'account',
        active: true,
        addedDate: now,
        lastUpdated: now
      }
    ];
    
    mockProducts.forEach(product => {
      this.entities.set(product.id, product);
    });
    
    this.saveToStorage();
  }
  
  /**
   * Add or update a product
   */
  async addOrUpdateProduct(product: Product): Promise<ProductEntity> {
    const now = new Date().toISOString();
    
    const existingProduct = await this.getById(product.id);
    
    if (existingProduct) {
      // Update existing product
      const updatedProduct = {
        ...existingProduct,
        ...product,
        lastUpdated: now
      };
      
      return this.update(product.id, updatedProduct) as Promise<ProductEntity>;
    } else {
      // Create new product entity
      const productEntity: ProductEntity = {
        ...product,
        addedDate: now,
        lastUpdated: now
      };
      
      return this.create(productEntity);
    }
  }
  
  /**
   * Get active products
   */
  async getActiveProducts(): Promise<ProductEntity[]> {
    const all = await this.getAll();
    return all.filter(product => product.active);
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
        console.log(`Repository: Product ${productId} found, active = ${product.active}`);
      } else {
        console.debug(`Repository: Product ${productId} not found`);
      }
      
      if (!result) {
        // Log all available products for debugging
        const allProducts = await this.getAll();
        console.debug(`All products in repository: ${allProducts.map(p => `${p.id} (active=${p.active})`).join(', ')}`);
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
