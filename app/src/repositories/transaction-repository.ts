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