// TODO: create a set product repository, of the banks services that are offered

import { StorageService } from "../services/storage-service";
import { UserService } from "../services/user-service";
import { LocalStorageRepository } from "./base-repository";
import { generateMockProducts } from "./mock/product-mock";
import { Product } from "./models/product-models";

export class ProductRepository {
    private products: Product[] = [];
    private storageKey: string = 'procucts';

    constructor(private storage: StorageService) {
        this.loadProducts();
        
        // Initialize with default users if none exist
        if (this.products.length === 0) {
          this.initializeDefaultProducts();
        }
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
        const mockUsers = generateMockProducts();
        
        // Add users to map
        mockUsers.forEach(user => {
          this.users.set(user.id, user);
        });
        
        // Save to storage
        this.saveProducts();
        
        console.debug('Initialized default users');
      }
      
      /**
       * Get a user by ID
       */
      public getUserById(id: string): UserProfile | undefined {
        return this.users.get(id);
      }
      
      /**
       * Get all users
       */
      public getAllUsers(): UserProfile[] {
        return Array.from(this.users.values());
      }


}