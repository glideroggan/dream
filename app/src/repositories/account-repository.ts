import { repositoryService } from '../services/repository-service'
import { StorageService } from '../services/storage-service'
import { UserService } from '../services/user-service'
import { Entity, LocalStorageRepository } from './base-repository'
import {
  TransactionRepository,
} from './transaction-repository'

// Interface for transfer results
export interface TransferResult {
  success: boolean
  message?: string
  transactionId?: string
}

export interface Account extends Entity {
  name: string;
  balance: number;
  currency: string;
  type: string;
  accountNumber: string;
  interestRate?: number;
  isActive: boolean;
  createdAt: string; // ISO date string
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
    const mockAccounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Main Checking',
        balance: 2549.23,
        currency: 'USD',
        type: 'Checking',
        accountNumber: '**** **** **** 1234',
        createdAt: new Date('2020-01-15').toISOString(),
        isActive: true,
      },
      {
        id: 'acc-2',
        name: 'Savings',
        balance: 15720.5,
        currency: 'USD',
        type: 'Savings',
        accountNumber: '**** **** **** 5678',
        createdAt: new Date('2020-02-28').toISOString(),
        isActive: true,
        interestRate: 0.75,
      },
      {
        id: 'acc-3',
        name: 'Investment',
        balance: 42680.75,
        currency: 'USD',
        type: 'Investment',
        accountNumber: '**** **** **** 9012',
        createdAt: new Date('2020-03-10').toISOString(),
        isActive: true,
      },
    ]

    // Add mock accounts
    mockAccounts.forEach((account) => {
      this.entities.set(account.id, account)
    })

    // Save to storage
    this.saveToStorage()
  }

  async create(
    data: Omit<Account, 'id' | 'accountNumber' | 'isActive' | 'createdAt'>
  ): Promise<Account> {
    const id = this.generateId()
    const accountNumber = Math.floor(Math.random() * 1000000000).toString()
    const isActive = true
    const createdAt = new Date().toISOString()
    const entity = {
      id,
      accountNumber,
      isActive,
      createdAt,
      ...data,
    } as Account

    this.entities.set(id, entity)
    this.saveToStorage()

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
}
