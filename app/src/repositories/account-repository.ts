import { Account } from '../services/repository-service';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { LocalStorageRepository } from './base-repository';
import { TransactionRepository } from './transaction-repository';
import { getRepositoryService } from '../services/repository-service';

// Interface for transfer results
export interface TransferResult {
  success: boolean;
  message?: string;
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
      
      if (!fromAccount) {
        return { success: false, message: "Source account not found" };
      }

      if (!toAccount) {
        return { success: false, message: "Destination account not found" };
      }

      if (fromAccount.balance < amount) {
        return { success: false, message: "Insufficient funds" };
      }

      // Update balances
      fromAccount.balance -= amount;
      toAccount.balance += amount;

      // Save updated accounts
      await this.update(fromAccount.id, fromAccount);
      await this.update(toAccount.id, toAccount);

      // Create transaction record with updated balances
      const transactionRepository = getRepositoryService().getTransactionRepository();
      const transaction = await transactionRepository.createTransferTransaction(
        fromId,
        toId,
        amount,
        fromAccount.currency,
        fromAccount.balance, // Include updated balance of source account
        toAccount.balance,   // Include updated balance of destination account
        description,
        true
      );

      return { 
        success: true, 
        transactionId: transaction.id
      };
    } catch (error) {
      console.error("Transfer failed:", error);
      return {
        success: false,
        message: "An error occurred during the transfer"
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
        fromAccount.balance,
        toAccount.balance,
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
