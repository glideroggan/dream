import { StorageService, storageService } from './storage-service';
import { UserService, userService } from './user-service';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { ProductRepository } from '../repositories/product-repository';
import { SettingsRepository } from '../repositories/settings-repository';
import { PaymentContact } from '../repositories/models/payment-contact';



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





// Define types for user settings


// Repository service implementation
export class RepositoryService {
  private static instance: RepositoryService;
  private accountRepo: AccountRepository;
  private settingsRepo: SettingsRepository;
  private transactionRepo: TransactionRepository;
  private productRepo: ProductRepository;
  
  private constructor(
    private storage: StorageService,
    private userService: UserService
  ) {
    this.transactionRepo = new TransactionRepository(storage, userService);
    this.accountRepo = new AccountRepository(storage, userService, this.transactionRepo);
    this.settingsRepo = new SettingsRepository(storage, userService);
    this.productRepo = new ProductRepository(storage, userService);
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
   * Get the product repository
   */
  getProductRepository(): ProductRepository {
    return this.productRepo;
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

export const repositoryService = RepositoryService.getInstance();
