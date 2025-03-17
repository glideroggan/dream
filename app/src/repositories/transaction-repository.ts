import { Entity, LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { getMockTransactionsByUserType } from './mock/transaction-mock';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  TransactionStatuses,
  TransactionTypes,
  TransactionDirections,
  ExternalTransactionRequest
} from './models/transaction-models';
import { repositoryService } from '../services/repository-service';
import { generateUniqueId } from '../utilities/id-generator';

export class TransactionRepository extends LocalStorageRepository<Transaction> {
  constructor(storage: StorageService, userService: UserService) {
    super('transactions', storage, userService);
  }

  protected initializeMockData(): void {
    // Check user type before initializing with mock data
    const userType = this.userService.getUserType();
    const transactions = getMockTransactionsByUserType(userType);

    // Add mock transactions
    transactions.forEach(transaction => {
      this.createForMocks(transaction);
    });

    // Save to storage
    this.saveToStorage();
  }

  /**
   * Get all transactions as an async iterator
   * @param batchSize Number of transactions per batch
   */
  public async *getAllIterator(): AsyncGenerator<Transaction> {
    const transactions = await this.getAll();
    for (const txn of transactions) {
      yield txn;
    }
  }

  /**
   * Get transactions by status as an async iterator
   * @param status The transaction status to filter by
   * @param batchSize Number of transactions per batch
   */
  public async *getByStatusIterator(status: TransactionStatus): AsyncGenerator<Transaction> {
    const transactions = await this.getAll();
    for (const txn of transactions) {
      if (txn.status === status) {
        yield txn;
      }
    }
  }

  /**
   * Get account transactions as an async iterator
   * @param accountId The account ID to filter by
   * @param batchSize Number of transactions per batch
   */
  public async *getByAccountIdIterator(accountId: string): AsyncGenerator<Transaction> {
    const transactions = await this.getAll();
    // sort transactions by date in descending order
    transactions.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    // log out the two most recent transactions
    // console.debug('trans1', transactions[0]);
    // console.debug('trans2', transactions[1]);
    for (const txn of transactions) {
      if (txn.fromAccountId === accountId || txn.toAccountId === accountId) {
        // console.debug('txn', txn);
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

  async find(params: Partial<Transaction>): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(txn => {
      return Object.keys(params).every(key => txn[key as keyof Transaction] === params[key as keyof Transaction]);
    });
  }

  /**
   * Get upcoming transactions
   */
  // async getUpcoming(): Promise<Transaction[]> {
  //   return this.getByStatus(TransactionStatuses.UPCOMING);
  // }

  /**
   * Get completed transactions
   */
  async getCompleted(): Promise<Transaction[]> {
    return this.getByStatus(TransactionStatuses.COMPLETED);
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

  /**TODO: 
   * we want to have a type of Transaction that contains the things we need to create an external transaction
   * we need:
   * fromAccountId, amount, currency
   * fromAccountBalance
   * */  
  
  /**
   * Create a transaction to an external account
   * @param request The external transaction request data
   */
  // async toExternal(request: ExternalTransactionRequest): Promise<Transaction> {
  //   const { fromAccountId, amount, currency, fromAccountBalance, description, dueDate, reference } = request;
    
  //   const now = new Date();
  //   const transaction: Omit<Transaction, 'id'> = {
  //     fromAccountId,
  //     fromAccountBalance,
  //     toAccountId: 'external',
  //     amount,
  //     direction: TransactionDirections.DEBIT,
  //     currency,
  //     description,
  //     scheduledDate: dueDate && dueDate > now ? dueDate.toISOString() : now.toISOString(),
  //     status: dueDate && dueDate > now ? TransactionStatuses.UPCOMING : TransactionStatuses.COMPLETED,
  //     type: TransactionTypes.WITHDRAWAL,
  //     createdAt: now.toISOString(),
  //     completedDate: dueDate && dueDate > now ? undefined : now.toISOString(),
  //     reference
  //   };
    
  //   return this.create(transaction);
  // }

  // async fromExternal(toAccountId: string, amount: number, currency: string, description?: string): Promise<Transaction> {
  //   const accounRepo = repositoryService.getAccountRepository();
  //   const toAccount = await accounRepo.getById(toAccountId);
  //   if (!toAccount) {
  //     throw new Error(`Account ${toAccountId} not found`);
  //   }
  //   toAccount.balance += amount;
  //   const now = new Date();
  //   const transaction: Omit<Transaction, 'id'> = {
  //     fromAccountId: 'external',
  //     toAccountId,
  //     toAccountBalance: toAccount.balance,
  //     amount,
  //     direction: TransactionDirections.CREDIT,
  //     currency,
  //     description,
  //     status: TransactionStatuses.COMPLETED,
  //     type: 'deposit',
  //     createdAt: now.toISOString(),
  //     completedDate: now.toISOString(),
  //     reference: generateUniqueId('external-deposit')
  //   };

  //   return this.create(transaction);

  // }

  /**
   * Create a new transfer transaction
   */
  // async createTransferTransaction(
  //   fromAccountId: string,
  //   toAccountId: string,
  //   amount: number,
  //   currency: string,
  //   fromAccountBalance: number,
  //   toAccountBalance?: number,
  //   description?: string,
  //   isCompleted: boolean = true
  // ): Promise<Transaction> {
  //   const now = new Date();
  //   const transaction: Omit<Transaction, 'id'> = {
  //     fromAccountId,
  //     toAccountId,
  //     amount,
  //     direction: TransactionDirections.DEBIT,
  //     currency,
  //     description,
      
  //     status: isCompleted ? TransactionStatuses.COMPLETED : TransactionStatuses.UPCOMING,
  //     type: TransactionTypes.TRANSFER,
  //     createdAt: now.toISOString(),
  //     fromAccountBalance: fromAccountBalance,
  //     toAccountBalance: toAccountBalance
  //   };

  //   // Add the appropriate date based on status
  //   if (isCompleted) {
  //     transaction.completedDate = now.toISOString();
  //   } else {
  //     transaction.scheduledDate = now.toISOString();
  //   }

  //   return this.create(transaction);
  // }
}