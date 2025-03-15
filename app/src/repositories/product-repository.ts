import { StorageService } from "../services/storage-service";
import { generateMockProducts } from "./mock/product-mock";
import { Product, ProductEntityType } from "./models/product-models";

export class ProductRepository {
  private static instance: ProductRepository;  
  private products: Product[] = [];
  private storageKey: string = 'procucts';

  // Make constructor public but add isTest parameter with default value
  public constructor(private storage: StorageService, private isTest = false) {
    if (!isTest) {
      this.loadProducts();

      // Initialize with default users if none exist
      if (this.products.length === 0) {
        this.initializeDefaultProducts();
      }
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ProductRepository {
    if (!ProductRepository.instance) {
      ProductRepository.instance = new ProductRepository(StorageService.getInstance());
    }
    return ProductRepository.instance;
  }

  /**
   * Create a test instance with mocked dependencies
   */
  public static createTestInstance(storage: StorageService): ProductRepository {
    if (!ProductRepository.instance) {
      ProductRepository.instance = new ProductRepository(storage);
    }
    return ProductRepository.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    ProductRepository.instance = undefined!;
  }

  async getAll(): Promise<Product[]>{
    return this.products;
  }
  getByEntityType(type: ProductEntityType): Product[] {
    return this.products.filter(product => product.type === type);
  }

  async getById(id: string): Promise<Product | undefined> {
    return this.products.find(product => product.id === id);
  }

  /**
     * Load products from storage
     */
  private loadProducts(): void {
    const storedProducts = this.storage.getItem<Product[]>(this.storageKey);

    if (storedProducts) {
      this.products = storedProducts
      console.debug(`Loaded ${this.products.length} products from storage`);
    }
  }

  getProductsByEntityType<T extends Product = Product>(types: ProductEntityType[]): T[] {
    return this.products.filter(product => types.includes(product.type)) as T[];
  }
    

  /**
   * Save users to storage
   */
  private saveProducts(): void {
    // const users = Array.from(this.users.values());
    this.storage.setItem(this.storageKey, this.products);
    console.debug(`Saved ${this.products.length} products to storage`);
  }

  /**
   * Initialize with default users
   */
  private initializeDefaultProducts(): void {
    const mockProducts = generateMockProducts();

    // Add users to map
    this.products = mockProducts;

    // Save to storage
    this.saveProducts();

    console.debug('Initialized default users');
  }
}

export const productRepository = ProductRepository.getInstance();