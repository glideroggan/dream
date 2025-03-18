import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { generateUniqueId } from '../utilities/id-generator';

// Type definitions
export interface Entity {
  id: string;
}

export type RepositoryEventType = 'create' | 'update' | 'delete' | 'refresh';

export interface RepositoryEvent<T> {
  type: RepositoryEventType;
  entity?: T;
  entityId?: string;
}

export interface RepositorySubscriber<T> {
  (event: RepositoryEvent<T>): void;
}

// Repository interface
export interface Repository<T extends Entity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}

// Base repository implementation using local storage
export abstract class LocalStorageRepository<T extends Entity> implements Repository<T> {
  private entities: Map<string, T> = new Map();
  private subscribers: Set<RepositorySubscriber<T>> = new Set();
  
  constructor(
    private storageKey: string,
    private storage: StorageService,
    protected userService: UserService
  ) {
    this.loadFromStorage();
    
    // Initialize with mock data if repository is empty
    if (this.entities.size === 0) {
      this.initializeMockData();
    }
    // create a unique id for the this repo and print it
    const id = generateUniqueId()
    console.debug('created repo with id:', storageKey, id)
  }

  /**
   * Subscribe to repository changes
   */
  subscribe(subscriber: RepositorySubscriber<T>): () => void {
    this.subscribers.add(subscriber);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Notify subscribers of changes
   */
  protected notifySubscribers(event: RepositoryEvent<T>): void {
    this.subscribers.forEach(subscriber => subscriber(event));
  }

  protected createForMocks(data: T): T {
    this.entities.set(data.id, data);
    return data
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const entity = await this._create(data);
    console.debug('[base-repository] create', entity);
    this.notifySubscribers({ type: 'create', entity });
    return entity;
  }

  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    console.debug('update', id, data)
    const entity = await this._update(id, data);
    if (entity) {
      this.notifySubscribers({ type: 'update', entity });
    }

    return entity;
  }

  async delete(id: string): Promise<boolean> {
    const success = await this._delete(id);
    if (success) {
      this.notifySubscribers({ type: 'delete', entityId: id });
    }
    return success;
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
      
      // Check if this is a new user - if so, don't initialize with mock data
      const userType = this.userService.getUserType();
      if (userType === 'new') {
        console.debug(`New user detected, skipping mock data initialization`);
        this.entities = new Map(); // Empty map for new users
      } else {
        this.initializeMockData();
      }
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
  
  async getById(id: string | undefined): Promise<T | undefined> {
    if (!id) {
      return undefined;
    }
    // log content of entntities
    console.debug('entities:', this.entities)
    return this.entities.get(id);
  }
  
  private async _create(data: Omit<T, 'id'>): Promise<T> {
    const id = this.generateId();
    const entity = { id,  ...data } as unknown as T;
    
    this.entities.set(id, entity);
    this.saveToStorage();
    
    return entity;
  }
  
  private async _update(id: string, data: Partial<T>): Promise<T | undefined> {
    const entity = this.entities.get(id);
    
    if (!entity) {
      return undefined;
    }
    
    const updated = { ...entity, ...data };
    this.entities.set(id, updated);
    this.saveToStorage();
    
    return updated;
  }
  
  private async _delete(id: string): Promise<boolean> {
    const result = this.entities.delete(id);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }
}
