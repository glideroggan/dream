import { Entity, LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { generateMockProducts } from './mock/product-mock';
import { generateUUID } from "../utilities/id-generator";
import { 
  Product, 
  ProductEntity, 
  ProductCategory, 
  ProductEntityType 
} from './models/product-models';

export class ProductRepository extends LocalStorageRepository<ProductEntity> {
  constructor(storage: StorageService, userService: UserService) {
    super('products', storage, userService);
  }
  
  /**
   * Initialize with mock data
   */
  protected initializeMockData(): void {
    const mockProducts = generateMockProducts();
    
    mockProducts.forEach(product => {
      this.createForMocks(product);
    });
    
    this.saveToStorage();
  }
  
  /**
   * Add or update a product
   */
  async addOrUpdateProduct(product: Product): Promise<ProductEntity> {
    const now = new Date().toISOString();
    
    // Try to get existing product
    const existingProduct = await this.getById(product.id);
    
    if (existingProduct) {
      // Update existing product
      const updatedProduct = {
        ...existingProduct,
        ...product,
        type: (product as any).type as ProductEntityType,
        lastUpdated: now
      };
      
      return await this.update(product.id, updatedProduct) as ProductEntity;
    } else {
      // Create new product entity with required fields
      const productEntity: Omit<ProductEntity, 'id'> = {
        ...product as any, // Cast to satisfy TypeScript
        category: (product as any).category || ProductCategory.SERVICES,
        type: (product as any).type || ProductEntityType.SERVICE,
        addedDate: now,
        lastUpdated: now
      };
      
      return await this.create(productEntity);
    }
  }
  
  /**
   * Get all active products
   */
  async getActiveProducts(): Promise<ProductEntity[]> {
    const all = await this.getAll();
    return all.filter(product => product.active);
  }
  
  /**
   * Get active products
   */
  async getActive(): Promise<ProductEntity[]> {
    return this.getActiveProducts();
  }

  /**
   * Get products by category
   */
  async getByCategory(category: ProductCategory): Promise<ProductEntity[]> {
    const products = await this.getAll();
    return products.filter(
      product => product.category === category && product.active
    );
  }

  /**
   * Get products by entity type
   */
  async getByEntityType(entityType: ProductEntityType): Promise<ProductEntity[]> {
    const products = await this.getAll();
    return products.filter(
      product => product.type === entityType && product.active
    );
  }

  /**
   * Get a product by ID
   */
  async getById(id: string): Promise<ProductEntity | undefined> {
    return await super.getById(id);
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string): Promise<ProductEntity[]> {
    const product = await this.getById(productId);
    if (!product || !product.relatedProductIds || product.relatedProductIds.length === 0) {
      return [];
    }
    
    const relatedProducts: ProductEntity[] = [];
    for (const relatedId of product.relatedProductIds) {
      const related = await this.getById(relatedId);
      if (related && related.active) {
        relatedProducts.push(related);
      }
    }
    
    return relatedProducts;
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
