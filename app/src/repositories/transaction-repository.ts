import { Entity, LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { 
  TransactionStatus, 
  TransactionType 
} from '../services/repository-service';


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
    const now = new Date();
    const transactions: Transaction[] = [];
    
    // Helper to create date objects relative to current date
    const getRelativeDate = (dayOffset: number): Date => {
      const date = new Date(now);
      date.setDate(now.getDate() + dayOffset);
      return date;
    };
    
    // Generate transaction history for the last 6 months
    for (let i = 180; i >= 0; i -= 3) { // Every ~3 days
      // Salary deposits - monthly
      if (i % 30 <= 2) {
        transactions.push({
          id: `txn-salary-${i}`,
          fromAccountId: 'external-employer',
          toAccountId: 'acc-1', // Main checking
          amount: 3800,
          currency: 'USD',
          description: 'Payroll Deposit',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.DEPOSIT,
          createdAt: getRelativeDate(-i).toISOString(),
          completedDate: getRelativeDate(-i).toISOString(),
          toAccountBalance: 2500 + Math.random() * 1500, // Simulate varying balance
          category: 'Income'
        });
      }
      
      // Transfers to savings - monthly
      if (i % 30 <= 2 && i > 0) {
        transactions.push({
          id: `txn-savings-${i}`,
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2', // Emergency Fund
          amount: 500,
          currency: 'USD',
          description: 'Monthly savings transfer',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.TRANSFER,
          createdAt: getRelativeDate(-i + 1).toISOString(),
          completedDate: getRelativeDate(-i + 1).toISOString(),
          fromAccountBalance: 2000 + Math.random() * 1000,
          toAccountBalance: 15000 + (6 - Math.floor(i / 30)) * 500 + Math.random() * 300,
          category: 'Savings'
        });
        
        // Also transfer to vacation fund occasionally
        if (i % 60 <= 2) {
          transactions.push({
            id: `txn-vacation-${i}`,
            fromAccountId: 'acc-1',
            toAccountId: 'acc-4', // Vacation Fund
            amount: 300,
            currency: 'USD',
            description: 'Vacation fund contribution',
            status: TransactionStatus.COMPLETED,
            type: TransactionType.TRANSFER,
            createdAt: getRelativeDate(-i + 1).toISOString(),
            completedDate: getRelativeDate(-i + 1).toISOString(),
            fromAccountBalance: 1700 + Math.random() * 1000,
            toAccountBalance: 3000 + (6 - Math.floor(i / 30)) * 200 + Math.random() * 100,
            category: 'Savings'
          });
        }
        
        // Home down payment savings
        if (i % 30 <= 2 && i >= 30) {
          transactions.push({
            id: `txn-home-${i}`,
            fromAccountId: 'acc-1',
            toAccountId: 'acc-7', // Home Down Payment
            amount: 1000,
            currency: 'USD',
            description: 'Home down payment savings',
            status: TransactionStatus.COMPLETED,
            type: TransactionType.TRANSFER,
            createdAt: getRelativeDate(-i + 2).toISOString(),
            completedDate: getRelativeDate(-i + 2).toISOString(),
            fromAccountBalance: 1000 + Math.random() * 800,
            toAccountBalance: 23000 + (6 - Math.floor(i / 30)) * 1000 + Math.random() * 200,
            category: 'Savings'
          });
        }
      }
      
      // Rent payment - monthly
      if (i % 30 <= 2) {
        transactions.push({
          id: `txn-rent-${i}`,
          fromAccountId: 'acc-1',
          toAccountId: 'external-landlord',
          amount: -1200,
          currency: 'USD',
          description: 'Rent payment',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i + 3).toISOString(),
          completedDate: getRelativeDate(-i + 3).toISOString(),
          fromAccountBalance: 3300 + Math.random() * 800 - 1200,
          category: 'Housing'
        });
      }
      
      // Utility bills - monthly
      if (i % 30 <= 4) {
        transactions.push({
          id: `txn-utilities-${i}`,
          fromAccountId: 'acc-1',
          amount: -180 - Math.random() * 40, // Varying utility bill
          currency: 'USD',
          description: 'Utilities payment',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i + 5).toISOString(),
          completedDate: getRelativeDate(-i + 5).toISOString(),
          fromAccountBalance: 2000 + Math.random() * 800,
          category: 'Utilities'
        });
      }
      
      // Groceries - weekly
      if (i % 7 <= 1) {
        transactions.push({
          id: `txn-groceries-${i}`,
          fromAccountId: 'acc-1',
          amount: -85 - Math.random() * 30, // Varying grocery costs
          currency: 'USD',
          description: 'Grocery shopping',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i).toISOString(),
          completedDate: getRelativeDate(-i).toISOString(),
          fromAccountBalance: 1900 + Math.random() * 700,
          category: 'Groceries'
        });
      }
      
      // Dining out - semi-weekly
      if (i % 14 <= 2) {
        transactions.push({
          id: `txn-dining-${i}`,
          fromAccountId: 'acc-1',
          amount: -45 - Math.random() * 25, // Varying dining costs
          currency: 'USD',
          description: 'Dining out',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i).toISOString(),
          completedDate: getRelativeDate(-i).toISOString(),
          fromAccountBalance: 1850 + Math.random() * 650,
          category: 'Dining'
        });
      }
      
      // Credit card payments - monthly
      if (i % 30 <= 2) {
        const paymentAmount = 300 + Math.random() * 150;
        transactions.push({
          id: `txn-cc-payment-${i}`,
          fromAccountId: 'acc-1',
          toAccountId: 'acc-5',
          amount: -paymentAmount,
          currency: 'USD',
          description: 'Credit card payment',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i + 10).toISOString(),
          completedDate: getRelativeDate(-i + 10).toISOString(),
          fromAccountBalance: 1800 - paymentAmount + Math.random() * 600,
          toAccountBalance: -3500 + paymentAmount + Math.random() * 200,
          category: 'Debt Payment'
        });
      }
      
      // Car loan payment - monthly
      if (i % 30 <= 2) {
        transactions.push({
          id: `txn-car-payment-${i}`,
          fromAccountId: 'acc-1',
          toAccountId: 'acc-6',
          amount: -350,
          currency: 'USD',
          description: 'Car loan payment',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i + 15).toISOString(),
          completedDate: getRelativeDate(-i + 15).toISOString(),
          fromAccountBalance: 1450 + Math.random() * 550,
          toAccountBalance: -16000 + (6 - Math.floor(i / 30)) * 350 + Math.random() * 100,
          category: 'Debt Payment'
        });
      }
      
      // Entertainment expenses - randomly
      if (i % 10 <= 2) {
        transactions.push({
          id: `txn-entertainment-${i}`,
          fromAccountId: 'acc-1',
          amount: -25 - Math.random() * 35,
          currency: 'USD',
          description: 'Entertainment expense',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i).toISOString(),
          completedDate: getRelativeDate(-i).toISOString(),
          fromAccountBalance: 1400 + Math.random() * 500,
          category: 'Entertainment'
        });
      }
      
      // Subscription services - monthly
      if (i % 30 <= 4) {
        transactions.push({
          id: `txn-subscription-${i}`,
          fromAccountId: 'acc-1',
          amount: -15.99,
          currency: 'USD',
          description: 'Streaming service subscription',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i + 7).toISOString(),
          completedDate: getRelativeDate(-i + 7).toISOString(),
          fromAccountBalance: 1385 + Math.random() * 480,
          category: 'Subscriptions'
        });
      }
      
      // Phone/Internet bill - monthly
      if (i % 30 <= 3) {
        transactions.push({
          id: `txn-phone-${i}`,
          fromAccountId: 'acc-1',
          amount: -110,
          currency: 'USD',
          description: 'Phone and Internet bill',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i + 8).toISOString(),
          completedDate: getRelativeDate(-i + 8).toISOString(),
          fromAccountBalance: 1270 + Math.random() * 450,
          category: 'Utilities'
        });
      }
      
      // Occasional large purchases
      if (i === 45 || i === 110) {
        transactions.push({
          id: `txn-large-purchase-${i}`,
          fromAccountId: 'acc-1',
          amount: -299,
          currency: 'USD',
          description: 'Electronics purchase',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          createdAt: getRelativeDate(-i).toISOString(),
          completedDate: getRelativeDate(-i).toISOString(),
          fromAccountBalance: 1000 + Math.random() * 400,
          category: 'Shopping'
        });
      }
    }

    // Add a few upcoming transactions
    transactions.push({
      id: 'txn-upcoming-1',
      fromAccountId: 'acc-1',
      toAccountId: 'external-landlord',
      amount: -1200,
      currency: 'USD',
      description: 'Rent payment',
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: getRelativeDate(15).toISOString(),
      category: 'Housing'
    });
    
    transactions.push({
      id: 'txn-upcoming-2',
      fromAccountId: 'acc-1',
      toAccountId: 'acc-2',
      amount: 500,
      currency: 'USD',
      description: 'Monthly savings transfer',
      status: TransactionStatus.UPCOMING,
      type: TransactionType.TRANSFER,
      createdAt: now.toISOString(),
      scheduledDate: getRelativeDate(16).toISOString(),
      category: 'Savings'
    });
    
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