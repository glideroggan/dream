import { StorageService, storageService } from './storage-service';
import { UserService, userService } from './user-service';
import { SettingsRepository } from '../repositories/settings-repository';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';

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

export enum TransactionStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TransactionType {
  TRANSFER = 'transfer',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  FEE = 'fee'
}

export interface Transaction extends Entity {
  fromAccountId: string;
  toAccountId?: string;  // Optional for withdrawals, fees
  amount: number;
  currency: string;
  description?: string;
  status: TransactionStatus;
  type: TransactionType;
  createdAt: string; // ISO date string
  scheduledDate?: string; // ISO date string for upcoming transactions
  completedDate?: string; // ISO date string for completed transactions
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
  private transactionRepo: TransactionRepository;
  
  private constructor(
    private storage: StorageService,
    private userService: UserService
  ) {
    this.transactionRepo = new TransactionRepository(storage, userService);
    this.accountRepo = new AccountRepository(storage, userService, this.transactionRepo);
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
   * Get the transaction repository
   */
  getTransactionRepository(): TransactionRepository {
    return this.transactionRepo;
  }
  
  /**
   * Clear all repositories data (useful for testing/resetting)
   */
  async clearAllData(): Promise<void> {
    const keys = this.storage.getKeysByPrefix(this.userService.getCurrentUserId());
    
    for (const key of keys) {
      this.storage.removeItem(key);
    }
    
    console.debug('All repository data cleared');
  }
}

// Singleton getter for convenience
export function getRepositoryService(): RepositoryService {
  return RepositoryService.getInstance();
}
