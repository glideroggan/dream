import { repositoryService } from '../services/repository-service'
import { StorageService } from '../services/storage-service'
import { UserService } from '../services/user-service'
import { Entity, LocalStorageRepository } from './base-repository'
import { TransactionRepository } from './transaction-repository'
import { getMockAccountsByUserType } from './mock/account-mock'

// Interface for transfer results
export interface TransferResult {
  success: boolean
  message?: string
  transactionId?: string
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'pension' | 'mortgage' | 'isk'

export interface Account extends Entity {
  name: string;
  balance: number;
  currency: string;
  type: AccountType;
  accountNumber: string;
  interestRate?: number;
  isActive: boolean;
  createdAt: string; // ISO date string
  goal?: number; // Optional savings goal amount
  targetDate?: string; // Target date to reach goal

  // Credit card specific properties
  creditLimit?: number;
  availableCredit?: number; 
  paymentDueDate?: string;
  minimumPaymentDue?: number;
  
  // Savings specific properties
  savingsGoal?: number;
  
  // Checking/Current account
  averageBalance?: number;
  hasOverdraftProtection?: boolean;
  
  // Loan specific
  originalLoanAmount?: number;
  interestRateLoan?: number;
  nextPaymentAmount?: number;
  nextPaymentDueDate?: string;
  
  // Investment account
  performanceYTD?: number;
  lastUpdated?: string;
}

// Account repository implementation
export class AccountRepository extends LocalStorageRepository<Account> {
  constructor(
    storage: StorageService,
    userService: UserService,
    private transactionRepo: TransactionRepository
  ) {
    super('accounts', storage, userService)
  }

  protected initializeMockData(): void {
    // Get user type to determine which mock accounts to use
    const userType = this.userService.getUserType();
    console.debug(`Initializing mock accounts for user type: ${userType}`);
    
    // Get appropriate mock accounts based on user type
    const accounts = getMockAccountsByUserType(userType);
    
    if (accounts.length === 0 && userType === 'new') {
      console.debug('New user detected, starting with empty account list');
      return; // Return without saving anything to storage
    }
    
    // Add mock accounts
    accounts.forEach((account) => {
      this.createForMocks(account);
    });
    
    // Save to storage
    this.saveToStorage();
    
    console.debug(`Initialized ${accounts.length} mock accounts for ${userType} user`);
  }

  async createAccount(
    data: Omit<Account, 'id' | 'accountNumber' | 'isActive' | 'createdAt'>
  ): Promise<Account> {
    const accountNumber = Math.floor(Math.random() * 1000000000).toString()
    const isActive = true
    const createdAt = new Date().toISOString()
    const entity = {
      accountNumber,
      isActive,
      createdAt,
      ...data,
    } as Account

    await super.create(entity)
    // this.saveToStorage()

    return entity
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
      const fromAccount = await this.getById(fromId)
      const toAccount = await this.getById(toId)

      if (!fromAccount) {
        return { success: false, message: 'Source account not found' }
      }

      if (!toAccount) {
        return { success: false, message: 'Destination account not found' }
      }

      if (fromAccount.balance < amount) {
        return { success: false, message: 'Insufficient funds' }
      }

      // Update balances
      fromAccount.balance -= amount
      toAccount.balance += amount

      // Save updated accounts
      await this.update(fromAccount.id, fromAccount)
      await this.update(toAccount.id, toAccount)

      // Create transaction record with updated balances
      const transactionRepository = repositoryService.getTransactionRepository()
      console.debug('creating transaction')
      const transaction = await transactionRepository.createTransferTransaction(
        fromId,
        toId,
        amount,
        fromAccount.currency,
        fromAccount.balance, // Include updated balance of source account
        toAccount.balance, // Include updated balance of destination account
        description,
        true
      )

      return {
        success: true,
        transactionId: transaction.id,
      }
    } catch (error) {
      console.error('Transfer failed:', error)
      return {
        success: false,
        message: 'An error occurred during the transfer',
      }
    }
  }

  async externalTransfer(options: {
    fromAccountId: string
    toContactId: string
    amount: number
    description?: string
  }) {
    const fromAccount = await this.getById(options.fromAccountId)
    if (!fromAccount) {
      return { success: false, message: 'Source account not found' }
    }

    // TODO: we have the contactId, get the data from there
    const settingsRepository = repositoryService.getSettingsRepository()
    const contacts = await settingsRepository.getPaymentContacts()
    const contact = contacts.find((c) => c.id === options.toContactId)
    if (!contact) {
      return { success: false, message: 'Destination contact not found' }
    }
    const toAccountNumber = contact?.accountNumber

    // validation
    if (fromAccount.balance < options.amount) {
      return { success: false, message: 'Insufficient funds' }
    }

    // update balance
    fromAccount!.balance -= options.amount

    // save updated account
    await this.update(fromAccount.id, fromAccount)

    // TODO: we should have the toAccountId, even if it is external
    // TODO: let the function return an id of the transaction
    // create transaction record
    const transactionRepository = repositoryService.getTransactionRepository()
    await transactionRepository.createTransferTransaction(
      fromAccount.id,
      toAccountNumber,
      options.amount,
      fromAccount.currency,
      fromAccount.balance,
      undefined,
      options.description,
      true
    )

    return {
      success: true,
      message: 'External transfer completed successfully',
      transactionId: 'ext-123',
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
      const fromAccount = await this.getById(fromId)
      const toAccount = await this.getById(toId)

      if (!fromAccount || !toAccount) {
        return {
          success: false,
          message: 'One or more accounts not found',
        }
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
      )

      // Update the scheduled date
      await this.transactionRepo.update(transaction.id, {
        scheduledDate: scheduledDate.toISOString(),
      })

      return {
        success: true,
        message: 'Transfer scheduled successfully',
        transactionId: transaction.id,
      }
    } catch (error) {
      console.error('Scheduling transfer failed:', error)
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Scheduling transfer failed due to an unexpected error',
      }
    }
  }

  /**
   * Get accounts that are compatible with debit cards
   */
  async getCompatibleAccounts(): Promise<Account[]> {
    const accounts = await this.getAll();
    return accounts.filter(account => 
      account.isActive && 
      (account.type === 'checking' || account.type === 'savings')
    );
  }
}
