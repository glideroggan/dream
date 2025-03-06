import { Entity, LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { 
  TransactionStatus, 
  TransactionType 
} from '../services/repository-service';
import { generateMockTransactions } from './mock/transaction-mock';

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
  // New properties for balance tracking
  fromAccountBalance?: number; // Balance of fromAccount after transaction
  toAccountBalance?: number;   // Balance of toAccount after transaction
  category?: string; // Transaction category for better analytics
}

export class TransactionRepository extends LocalStorageRepository<Transaction> {
  constructor(storage: StorageService, userService: UserService) {
    super('transactions', storage, userService);
  }
  
  protected initializeMockData(): void {
    const transactions = generateMockTransactions();
    
    // Add mock transactions
    transactions.forEach(transaction => {
      this.entities.set(transaction.id, transaction);
    });
    
    // Save to storage
    this.saveToStorage();
  }
  
  /**
   * Create an async generator that yields batches of transactions
   * @param transactions The transactions to iterate over
   * @param batchSize The number of transactions to include in each batch
   */
  private async *createBatchIterator(
    transactions: Transaction[], 
    batchSize: number
  ): AsyncGenerator<Transaction[]> {
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      // Simulate network delay for more realistic behavior in development
      // In production, this would be a real API call that takes time
      // await new Promise(resolve => setTimeout(resolve, 100));
      yield batch;
    }
  }
  
  /**
   * Get all transactions as an async iterator
   * @param batchSize Number of transactions per batch
   */
  public async *getAllIterator(): AsyncGenerator<Transaction> {
    for (const txn of this.entities.values()) {
      yield txn;
    }
  }
  
  /**
   * Get transactions by status as an async iterator
   * @param status The transaction status to filter by
   * @param batchSize Number of transactions per batch
   */
  public async *getByStatusIterator(status: TransactionStatus): AsyncGenerator<Transaction> {
    for (const txn of this.entities.values()) {
      if (txn.status === status) {
        yield txn;
      }
    }
  }
  
  // /**
  //  * Get upcoming transactions as an async iterator
  //  * @param batchSize Number of transactions per batch
  //  */
  // public async *getUpcomingIterator(): AsyncGenerator<Transaction> {
  //   yield* this.getByStatusIterator(TransactionStatus.UPCOMING);
  //   // return this.getByStatusIterator(TransactionStatus.UPCOMING, batchSize);
  // }
  
  // /**
  //  * Get completed transactions as an async iterator
  //  * @param batchSize Number of transactions per batch
  //  */
  // getCompletedIterator(batchSize = 10): TransactionAsyncIterator {
  //   return this.getByStatusIterator(TransactionStatus.COMPLETED, batchSize);
  // }
  
  /**
   * Get account transactions as an async iterator
   * @param accountId The account ID to filter by
   * @param batchSize Number of transactions per batch
   */
  public async *getByAccountIdIterator(accountId: string): AsyncGenerator<Transaction> {
    for (const txn of this.entities.values()) {
      if (txn.fromAccountId === accountId || txn.toAccountId === accountId) {
        yield txn;
      }
    }
  }
  
  /**
   * Get all transactions with a specific status
   */
  async getByStatus(status: TransactionStatus): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(txn => txn.status === status);
  }
  
  /**
   * Get upcoming transactions
   */
  async getUpcoming(): Promise<Transaction[]> {
    return this.getByStatus(TransactionStatus.UPCOMING);
  }
  
  /**
   * Get completed transactions
   */
  async getCompleted(): Promise<Transaction[]> {
    return this.getByStatus(TransactionStatus.COMPLETED);
  }
  
  /**
   * Get transactions for a specific account
   */
  async getByAccountId(accountId: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(txn => 
      txn.fromAccountId === accountId || txn.toAccountId === accountId
    );
  }
  
  /**
   * Create a new transfer transaction
   */
  async createTransferTransaction(
    fromAccountId: string, 
    toAccountId: string, 
    amount: number, 
    currency: string, 
    fromAccountBalance: number,
    toAccountBalance?: number,
    description?: string, 
    isCompleted: boolean = true
  ): Promise<Transaction> {
    const now = new Date();
    
    const transaction: Omit<Transaction, 'id'> = {
      fromAccountId,
      toAccountId,
      amount,
      currency,
      description,
      status: isCompleted ? TransactionStatus.COMPLETED : TransactionStatus.UPCOMING,
      type: TransactionType.TRANSFER,
      createdAt: now.toISOString(),
      fromAccountBalance: fromAccountBalance,
      toAccountBalance: toAccountBalance
    };
    
    // Add the appropriate date based on status
    if (isCompleted) {
      transaction.completedDate = now.toISOString();
    } else {
      transaction.scheduledDate = now.toISOString();
    }
    
    return this.create(transaction);
  }
}