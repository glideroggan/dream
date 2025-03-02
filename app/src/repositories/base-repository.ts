import { Entity, Repository } from '../services/repository-service';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';

// Base repository implementation using local storage
export abstract class LocalStorageRepository<T extends Entity> implements Repository<T> {
  protected entities: Map<string, T> = new Map();
  
  constructor(
    private storageKey: string,
    private storage: StorageService,
    private userService: UserService
  ) {
    this.loadFromStorage();
    
    // Initialize with mock data if repository is empty
    if (this.entities.size === 0) {
      this.initializeMockData();
    }
  }
  
  /**
   * Get the full storage key including user ID
   */
  private getUserStorageKey(): string {
    const userId = this.userService.getCurrentUserId();
    return `${userId}_${this.storageKey}`;
  }
  
  /**
   * Load entities from storage
   */
  protected loadFromStorage(): void {
    const key = this.getUserStorageKey();
    const data = this.storage.getItem<T[]>(key);
    
    if (data) {
      this.entities = new Map(data.map(entity => [entity.id, entity]));
      console.debug(`Loaded ${this.entities.size} items from ${key}`);
    } else {
      console.debug(`No data found for ${key}, will initialize with mock data`);
    }
  }
  
  /**
   * Save entities to storage
   */
  protected saveToStorage(): void {
    const data = Array.from(this.entities.values());
    const key = this.getUserStorageKey();
    this.storage.setItem(key, data);
    console.debug(`Saved ${data.length} items to ${key}`);
  }
  
  /**
   * Initialize repository with mock data
   * Override in derived classes
   */
  protected abstract initializeMockData(): void;
  
  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Repository implementation
  async getAll(): Promise<T[]> {
    return Array.from(this.entities.values());
  }
  
  async getById(id: string): Promise<T | undefined> {
    return this.entities.get(id);
  }
  
  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = this.generateId();
    // const accountNumber = Math.floor(Math.random() * 1000000000).toString()
    // const isActive = true
    // const createdAt = new Date().toISOString()
    const entity = { id,  ...data } as unknown as T;
    
    this.entities.set(id, entity);
    this.saveToStorage();
    
    return entity;
  }
  
  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    const entity = this.entities.get(id);
    
    if (!entity) {
      return undefined;
    }
    
    const updated = { ...entity, ...data };
    this.entities.set(id, updated);
    this.saveToStorage();
    
    return updated;
  }
  
  async delete(id: string): Promise<boolean> {
    const result = this.entities.delete(id);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }
}
