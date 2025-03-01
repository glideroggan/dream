import { Account } from '../services/repository-service';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { LocalStorageRepository } from './base-repository';
import { TransactionRepository } from './transaction-repository';

// Interface for transfer results
export interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

// Account repository implementation
export class AccountRepository extends LocalStorageRepository<Account> {
  constructor(
    storage: StorageService, 
    userService: UserService,
    private transactionRepo: TransactionRepository
  ) {
    super('accounts', storage, userService);
  }
  
  protected initializeMockData(): void {
    const mockAccounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Main Checking',
        balance: 2549.23,
        currency: 'USD',
        type: 'Checking'
      },
      {
        id: 'acc-2',
        name: 'Savings',
        balance: 15720.50,
        currency: 'USD',
        type: 'Savings'
      },
      {
        id: 'acc-3',
        name: 'Investment',
        balance: 42680.75,
        currency: 'USD',
        type: 'Investment'
      }
    ];
    
    // Add mock accounts
    mockAccounts.forEach(account => {
      this.entities.set(account.id, account);
    });
    
    // Save to storage
    this.saveToStorage();
  }
  
  /**
   * Make a transfer between accounts
   * @returns TransferResult with success status, message, and transaction ID
   */
  async transfer(
    fromId: string, 
    toId: string, 
    amount: number, 
    description?: string
  ): Promise<TransferResult> {
    try {
      const fromAccount = await this.getById(fromId);
      const toAccount = await this.getById(toId);
      
      if (!fromAccount || !toAccount) {
        return {
          success: false,
          message: 'One or more accounts not found'
        };
      }
      
      if (fromAccount.balance < amount) {
        return {
          success: false,
          message: 'Insufficient funds in source account'
        };
      }
      
      // Update balances
      await this.update(fromId, { balance: fromAccount.balance - amount });
      await this.update(toId, { balance: toAccount.balance + amount });
      
      // Create transaction record
      const transaction = await this.transactionRepo.createTransferTransaction(
        fromId,
        toId,
        amount,
        fromAccount.currency,
        description
      );
      
      return {
        success: true,
        message: 'Transfer completed successfully',
        transactionId: transaction.id
      };
    } catch (error) {
      console.error('Transfer failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Transfer failed due to an unexpected error'
      };
    }
  }
  
  /**
   * Schedule a transfer for future execution
   */
  async scheduleTransfer(
    fromId: string, 
    toId: string, 
    amount: number, 
    scheduledDate: Date, 
    description?: string
  ): Promise<TransferResult> {
    try {
      const fromAccount = await this.getById(fromId);
      const toAccount = await this.getById(toId);
      
      if (!fromAccount || !toAccount) {
        return {
          success: false,
          message: 'One or more accounts not found'
        };
      }
      
      // For scheduled transfers, we don't check balance now
      // We'll check when executing the transfer
      
      // Create upcoming transaction record
      const transaction = await this.transactionRepo.createTransferTransaction(
        fromId,
        toId,
        amount,
        fromAccount.currency,
        description,
        false // not completed yet
      );
      
      // Update the scheduled date
      await this.transactionRepo.update(transaction.id, {
        scheduledDate: scheduledDate.toISOString()
      });
      
      return {
        success: true,
        message: 'Transfer scheduled successfully',
        transactionId: transaction.id
      };
    } catch (error) {
      console.error('Scheduling transfer failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Scheduling transfer failed due to an unexpected error'
      };
    }
  }
}
