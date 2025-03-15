import { StorageService } from './storage-service';
import { UserService } from './user-service';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { SettingsRepository } from '../repositories/settings-repository';
import { UserProductRepository } from '../repositories/user-product-repository';

export class RepositoryService {
  private static instance: RepositoryService;
  
  private accountRepo: AccountRepository;
  private transactionRepo: TransactionRepository;
  private settingsRepo: SettingsRepository;
  private userProductRepo: UserProductRepository;
  private cardRepo: CardRepository;
  private loanRepo: LoanRepository
  // private productRepo: ProductRepository;
  
  private constructor(storage: StorageService, userService: UserService) {
    // Initialize repositories
    // this.productRepo = new ProductRepository(storage);
    this.transactionRepo = new TransactionRepository(storage, userService);
    this.accountRepo = new AccountRepository(storage, userService, this.transactionRepo);
    this.settingsRepo = new SettingsRepository(storage, userService);
    this.userProductRepo = new UserProductRepository(storage, userService);
    this.cardRepo = new CardRepository(storage, userService);
    this.loanRepo = new LoanRepository(storage, userService);
    
  }
  
  public static getInstance(storage: StorageService, userService: UserService): RepositoryService {
    if (!RepositoryService.instance) {
      RepositoryService.instance = new RepositoryService(storage, userService);
    }
    return RepositoryService.instance;
  }

  getLoanRepository(): LoanRepository {
    return this.loanRepo;
  }

  getCardRepository(): CardRepository {
    return this.cardRepo;
  }
  
  getAccountRepository(): AccountRepository {
    return this.accountRepo;
  }
  
  getTransactionRepository(): TransactionRepository {
    return this.transactionRepo;
  }
  
  getSettingsRepository(): SettingsRepository {
    return this.settingsRepo;
  }
  
  /**
   * Handles the current user's product repository
   * @returns UserProductRepository
   */
  getUserProductRepository(): UserProductRepository {
    return this.userProductRepo;
  }

  /**
   * Handles the overall product repository
   * @returns ProductRepository
   */
  getProductRepository(): ProductRepository {
    return productRepository
  }
}

// Create and export singleton instance
import { storageService } from './storage-service';
import { userService } from './user-service';
import { CardRepository } from '../repositories/card-repository';
import { LoanRepository } from '../repositories/loan-repository';
import { ProductRepository, productRepository } from '../repositories/product-repository';

export const repositoryService = RepositoryService.getInstance(storageService, userService);
