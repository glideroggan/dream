import { SwishProduct } from "../workflows/swish-workflow";

/**
 * Service to manage user products
 */
export class ProductService {
  private static instance: ProductService;
  private userProducts: SwishProduct[] = [];
  private productIds: Set<string> = new Set();
  
  private constructor() {
    // Load any saved products from localStorage
    this.loadProducts();
  }
  
  /**
   * Get the singleton instance of ProductService
   */
  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }
  
  /**
   * Add a product to the user's account
   */
  public async addProduct(product: SwishProduct): Promise<void> {
    if (!this.productIds.has(product.id)) {
      this.userProducts.push(product);
      this.productIds.add(product.id);
      this.saveProducts();
    }
  }
  
  /**
   * Remove a product from the user's account
   */
  public async removeProduct(productId: string): Promise<void> {
    this.userProducts = this.userProducts.filter(p => p.id !== productId);
    this.productIds.delete(productId);
    this.saveProducts();
  }
  
  /**
   * Check if the user has a specific product
   */
  public hasProduct(productId: string): boolean {
    return this.productIds.has(productId);
  }
  
  /**
   * Get all user products
   */
  public getUserProducts(): SwishProduct[] {
    return [...this.userProducts];
  }
  
  /**
   * Get product by ID
   */
  public getProduct(productId: string): SwishProduct | undefined {
    return this.userProducts.find(p => p.id === productId);
  }
  
  /**
   * Save products to localStorage
   */
  private saveProducts(): void {
    try {
      localStorage.setItem('userProducts', JSON.stringify(this.userProducts));
    } catch (error) {
      console.error('Failed to save products to localStorage:', error);
    }
  }
  
  /**
   * Load products from localStorage
   */
  private loadProducts(): void {
    try {
      const savedProducts = localStorage.getItem('userProducts');
      if (savedProducts) {
        this.userProducts = JSON.parse(savedProducts);
        this.productIds = new Set(this.userProducts.map(p => p.id));
      }
    } catch (error) {
      console.error('Failed to load products from localStorage:', error);
    }
  }
}

/**
 * Convenience function to get the product service
 */
export function getProductService(): ProductService {
  return ProductService.getInstance();
}
