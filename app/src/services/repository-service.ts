import { StorageService, storageService } from './storage-service';
import { UserService, userService } from './user-service';
import { SettingsRepository } from '../repositories/settings-repository';
import { AccountRepository } from '../repositories/account-repository';

// Type definitions
export interface Entity {
  id: string;
}

export interface Account extends Entity {
  name: string;
  balance: number;
  currency: string;
  type: string;
}

// Repository interface
export interface Repository<T extends Entity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}

// Settings repository for user preferences
export interface UserSettings extends Entity {
  theme: string;
  enableNotifications: boolean;
  dashboardLayout: string[];
  preferredWidgets: string[];
}

// Repository service implementation
export class RepositoryService {
  private static instance: RepositoryService;
  private accountRepo: AccountRepository;
  private settingsRepo: SettingsRepository;
  
  private constructor(
    private storage: StorageService,
    private userService: UserService
  ) {
    this.accountRepo = new AccountRepository(storage, userService);
    this.settingsRepo = new SettingsRepository(storage, userService);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): RepositoryService {
    if (!RepositoryService.instance) {
      RepositoryService.instance = new RepositoryService(
        storageService, 
        userService
      );
    }
    return RepositoryService.instance;
  }
  
  /**
   * Get the account repository
   */
  getAccountRepository(): AccountRepository {
    return this.accountRepo;
  }
  
  /**
   * Get the settings repository
   */
  getSettingsRepository(): SettingsRepository {
    return this.settingsRepo;
  }
  
  /**
   * Clear all repositories data (useful for testing/resetting)
   */
  async clearAllData(): Promise<void> {
    const keys = this.storage.getKeysByPrefix(this.userService.getCurrentUserId());
    
    for (const key of keys) {
      this.storage.removeItem(key);
    }
    
    console.log('All repository data cleared');
  }
}

// Singleton getter for convenience
export function getRepositoryService(): RepositoryService {
  return RepositoryService.getInstance();
}
