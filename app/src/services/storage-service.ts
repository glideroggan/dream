/**
 * Storage service that provides an abstraction layer for browser storage
 * Currently implements localStorage with fallback options and error handling
 */
export class StorageService {
  private static instance: StorageService;
  private storageAvailable: boolean = false;
  
  private constructor() {
    this.storageAvailable = this.isStorageAvailable();
    console.debug(`Storage service initialized: Storage available = ${this.storageAvailable}`);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  /**
   * Check if storage is available in the current browser
   */
  private isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('Local storage is not available:', e);
      return false;
    }
  }
  
  /**
   * Get an item from storage
   * @param key The key to get
   * @returns The parsed value or null if not found
   */
  getItem<T>(key: string): T | null {
    if (!this.storageAvailable) return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Error getting item '${key}' from storage:`, e);
      return null;
    }
  }
  
  /**
   * Set an item in storage
   * @param key The key to set
   * @param value The value to store
   * @returns True if successful, false otherwise
   */
  setItem(key: string, value: any): boolean {
    if (!this.storageAvailable) return false;
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error(`Error setting item '${key}' in storage:`, e);
      return false;
    }
  }
  
  /**
   * Remove an item from storage
   * @param key The key to remove
   * @returns True if successful, false otherwise
   */
  removeItem(key: string): boolean {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing item '${key}' from storage:`, e);
      return false;
    }
  }
  
  /**
   * Clear all items from storage
   * @returns True if successful, false otherwise
   */
  clear(): boolean {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing storage:', e);
      return false;
    }
  }
  
  /**
   * Get all keys matching a prefix
   */
  getKeysByPrefix(prefix: string): string[] {
    if (!this.storageAvailable) return [];
    
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
}

export const storageService = StorageService.getInstance();
