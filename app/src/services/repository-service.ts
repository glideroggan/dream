import { StorageService, storageService } from './storage-service';
import { UserService, userService } from './user-service';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { ProductRepository } from '../repositories/product-repository';
import { SettingsRepository } from '../repositories/settings-repository';
import { LoanRepository } from '../repositories/loan-repository';

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  UPCOMING = 'UPCOMING'
}

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  FEE = 'FEE',
  INTEREST = 'INTEREST',
  ADJUSTMENT = 'ADJUSTMENT',
}

// Repository service implementation
export class RepositoryService {
  private static instance: RepositoryService;
  private accountRepo: AccountRepository;
  private settingsRepo: SettingsRepository;
  private transactionRepo: TransactionRepository;
  private productRepo: ProductRepository;
  private loanRepo: LoanRepository;
  
  private constructor(
    private storage: StorageService,
    private userService: UserService
  ) {
    this.transactionRepo = new TransactionRepository(storage, userService);
    this.accountRepo = new AccountRepository(storage, userService, this.transactionRepo);
    this.settingsRepo = new SettingsRepository(storage, userService);
    this.productRepo = new ProductRepository(storage, userService);
    this.loanRepo = new LoanRepository(storage, userService);
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
   * Get the loan repository
   */
  getLoanRepository(): LoanRepository {
    return this.loanRepo;
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
