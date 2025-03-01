import { LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { 
  Transaction, 
  TransactionStatus, 
  TransactionType 
} from '../services/repository-service';

export class TransactionRepository extends LocalStorageRepository<Transaction> {
  constructor(storage: StorageService, userService: UserService) {
    super('transactions', storage, userService);
  }
  
  protected initializeMockData(): void {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    
    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: 500,
        currency: 'USD',
        description: 'Monthly transfer to savings',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        createdAt: yesterday.toISOString(),
        completedDate: yesterday.toISOString()
      },
      {
        id: 'txn-2',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-3',
        amount: 250,
        currency: 'USD',
        description: 'Investment contribution',
        status: TransactionStatus.UPCOMING,
        type: TransactionType.TRANSFER,
        createdAt: currentDate.toISOString(),
        scheduledDate: nextWeek.toISOString()
      },
      {
        id: 'txn-3',
        fromAccountId: 'acc-1',
        amount: 49.99,
        currency: 'USD',
        description: 'Monthly subscription fee',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: yesterday.toISOString(),
        completedDate: yesterday.toISOString()
      },
      {
        id: 'txn-4',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: 1000,
        currency: 'USD',
        description: 'Rent payment transfer',
        status: TransactionStatus.UPCOMING,
        type: TransactionType.TRANSFER,
        createdAt: currentDate.toISOString(),
        scheduledDate: tomorrow.toISOString()
      }
    ];
    
    // Add mock transactions
    mockTransactions.forEach(transaction => {
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
