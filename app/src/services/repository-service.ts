import { storageService } from './storage-service';
import { userService } from './user-service';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository, TransactionStatuses, TransactionTypes } from '../repositories/transaction-repository';
import { ProductRepository } from '../repositories/product-repository';
import { SettingsRepository } from '../repositories/settings-repository';
import { LoanRepository } from '../repositories/loan-repository';
import { CardRepository } from '../repositories/card-repository';

class RepositoryService {
  private _accountRepository: AccountRepository | null = null;
  private _transactionRepository: TransactionRepository | null = null;
  private _settingsRepository: SettingsRepository | null = null;
  private _productRepository: ProductRepository | null = null;
  private _loanRepository: LoanRepository | null = null;
  private _cardRepository: CardRepository | null = null;

  intialize() {
    this.getAccountRepository();
    this.getTransactionRepository();
    this.getSettingsRepository();
    this.getProductRepository();
    this.getLoanRepository();
    this.getCardRepository();
  }

  // Account repository
  getAccountRepository(): AccountRepository {
    if (!this._accountRepository) {
      // Initialize transaction repo first since account repo depends on it
      const transactionRepo = this.getTransactionRepository();
      this._accountRepository = new AccountRepository(
        storageService,
        userService,
        transactionRepo
      );
    }
    return this._accountRepository;
  }

  // Transaction repository
  getTransactionRepository(): TransactionRepository {
    if (!this._transactionRepository) {
      this._transactionRepository = new TransactionRepository(
        storageService,
        userService
      );
    }
    return this._transactionRepository;
  }

  // Settings repository
  getSettingsRepository(): SettingsRepository {
    if (!this._settingsRepository) {
      this._settingsRepository = new SettingsRepository(
        storageService,
        userService
      );
    }
    return this._settingsRepository;
  }

  // Product repository
  getProductRepository(): ProductRepository {
    if (!this._productRepository) {
      this._productRepository = new ProductRepository(
        storageService,
        userService
      );
    }
    return this._productRepository;
  }
  
  // Loan repository
  getLoanRepository(): LoanRepository {
    if (!this._loanRepository) {
      this._loanRepository = new LoanRepository(
        storageService,
        userService
      );
    }
    return this._loanRepository;
  }

  // Card repository
  getCardRepository(): CardRepository {
    if (!this._cardRepository) {
      this._cardRepository = new CardRepository(
        storageService,
        userService
      );
    }
    return this._cardRepository;
  }

  // Reset all repositories (useful for testing or user logout)
  resetRepositories(): void {
    this._accountRepository = null;
    this._transactionRepository = null;
    this._settingsRepository = null;
    this._productRepository = null;
    this._loanRepository = null;
    this._cardRepository = null;
    
    console.debug('All repositories have been reset');
  }
}


// Export singleton instance
export const repositoryService = new RepositoryService();
// create repositories right away
repositoryService.intialize();

// Re-export the constants for backwards compatibility
export { TransactionStatuses, TransactionTypes };
