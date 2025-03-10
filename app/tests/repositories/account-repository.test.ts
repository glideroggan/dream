import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the repository-service BEFORE importing AccountRepository
vi.mock('../../src/services/repository-service', () => ({
  repositoryService: {
    getTransactionRepository: vi.fn(),
    getSettingsRepository: vi.fn().mockReturnValue({
      getPaymentContacts: vi.fn().mockResolvedValue([
        { id: 'contact1', name: 'John Doe', accountNumber: '987654321' },
      ])
    }),
    getAccountRepository: vi.fn()
  }
}));

// Now import AccountRepository (after the mock)
import { AccountRepository } from '../../src/repositories/account-repository';
import { StorageService } from '../../src/services/storage-service';
import { UserService } from '../../src/services/user-service';
import { TransactionRepository } from '../../src/repositories/transaction-repository';
import { Account, AccountType } from '../../src/repositories/models/account-models';
import { repositoryService } from '../../src/services/repository-service';

// Import our test helpers
import { setupDateAndRandomMocks, cleanupDateAndRandomMocks } from '../utils/test-helpers';

describe('AccountRepository', () => {
  // Setup variables
  let mockStorage: Partial<StorageService>;
  let mockUserService: Partial<UserService>;
  let mockTransactionRepo: Partial<TransactionRepository>; 
  let accountRepo: AccountRepository;
  let storageData: Record<string, any> = {};

  // Declare mockTimestamp at the top level of the describe block
  let mockTimestamp: number;
  
  beforeEach(() => {
    // Clear any previous mocks
    vi.clearAllMocks();
    
    // Setup mock functions
    mockStorage = {
      getItem: vi.fn().mockImplementation((key: string) => storageData[key] || null),
      setItem: vi.fn().mockImplementation((key: string, value: any) => {
        storageData[key] = value;
        return true;
      }),
      removeItem: vi.fn().mockReturnValue(true),
      clear: vi.fn().mockReturnValue(true),
      getKeysByPrefix: vi.fn().mockReturnValue([]),
      isStorageAvailable: vi.fn().mockReturnValue(true)
    } as unknown as StorageService;

    mockUserService = {
      getCurrentUserId: vi.fn().mockReturnValue('test-user'),
      getUserType: vi.fn().mockReturnValue('standard'),
      isNewUser: vi.fn().mockReturnValue(false)
    };

    mockTransactionRepo = {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createTransferTransaction: vi.fn().mockImplementation((fromId, toId, amount) => {
        return Promise.resolve({
          id: 'tx-12345',
          fromAccountId: fromId,
          toAccountId: toId,
          amount,
          completed: true
        });
      }),
      subscribe: vi.fn()
    };

    // Use our shared test helper to setup date and random mocks
    // And store the timestamp for tests to use
    mockTimestamp = new Date('2023-04-01T10:30:00Z').getTime();
    setupDateAndRandomMocks(mockTimestamp);

    // Use our shared test helper to setup date and random mocks
    setupDateAndRandomMocks();

    // Create repository instance with proper type assertions
    accountRepo = new AccountRepository(
      mockStorage as StorageService,
      mockUserService as UserService,
      mockTransactionRepo as TransactionRepository
    );

    // Configure repository service mock responses
    vi.mocked(repositoryService.getTransactionRepository).mockReturnValue(
      mockTransactionRepo as TransactionRepository
    );
  });
  
  afterEach(() => {
    // Use our shared cleanup helper
    cleanupDateAndRandomMocks();
  });

  describe('createAccount', () => {
    it('should create an account with the correct properties', async () => {
      // No longer need to mock Date or Math.random here as they're set up in beforeEach
      
      // Setup spy on the parent class's create method with our own implementation
      const createSpy = vi.spyOn(accountRepo, 'create').mockImplementation(async (entity) => {
        return {
          id: `id-${mockTimestamp}-123abc`,
          ...entity
        } as Account;
      });
      
      // Call the method under test
      const result = await accountRepo.createAccount({
        name: 'Test Account',
        balance: 1000,
        type: 'checking' as AccountType,
        currency: 'USD'
      });
      
      // Verify result
      expect(result).toHaveProperty('accountNumber');
      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('createdAt');
      expect(result.name).toBe('Test Account');
      expect(result.balance).toBe(1000);
      expect(result.currency).toBe('USD');
      expect(result.type).toBe('checking');
      
      // Verify create method was called with correct params
      expect(createSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Account',
        balance: 1000,
        currency: 'USD',
        type: 'checking',
        isActive: true,
        accountNumber: expect.any(String),
        createdAt: expect.any(String)
      }));
    });
  });

  describe('transfer', () => {
    it('should successfully transfer between accounts', async () => {
      // Setup source and destination accounts
      const sourceAccount: Account = {
        id: 'source-acc',
        name: 'Source Account',
        balance: 1000,
        currency: 'USD',
        type: 'checking',
        accountNumber: '123456789',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const destAccount: Account = {
        id: 'dest-acc',
        name: 'Destination Account',
        balance: 500,
        currency: 'USD',
        type: 'savings',
        accountNumber: '987654321',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      // Mock getById to return our test accounts
      vi.spyOn(accountRepo, 'getById')
        .mockImplementation((id: string) => {
          if (id === 'source-acc') return Promise.resolve(sourceAccount);
          if (id === 'dest-acc') return Promise.resolve(destAccount);
          return Promise.resolve(undefined);
        });
      
      // Mock update to modify our test accounts
      vi.spyOn(accountRepo, 'update')
        .mockImplementation(async (id: string, data: Partial<Account>) => {
          if (id === 'source-acc') {
            Object.assign(sourceAccount, data);
            return sourceAccount;
          }
          if (id === 'dest-acc') {
            Object.assign(destAccount, data);
            return destAccount;
          }
          return undefined;
        });
      
      // Execute transfer
      const transferAmount = 300;
      const result = await accountRepo.transfer('source-acc', 'dest-acc', transferAmount, 'Test transfer');
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      
      // Verify account balances were updated
      expect(sourceAccount.balance).toBe(700); // 1000 - 300
      expect(destAccount.balance).toBe(800); // 500 + 300
    });
    
    // Add more transfer tests
  });
  
  // After the transfer tests, add external transfer tests
  describe('externalTransfer', () => {
    it('should successfully complete an external transfer', async () => {
      // Setup source account
      const sourceAccount: Account = {
        id: 'source-acc',
        name: 'Source Account',
        balance: 2000,
        currency: 'USD',
        type: 'checking',
        accountNumber: '123456789',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      // Mock contacts from settings repository
      const contacts = [
        { id: 'contact1', name: 'John Doe', accountNumber: '987654321' },
        { id: 'contact2', name: 'Jane Smith', accountNumber: '555666777' }
      ];
      
      // Mock getById to return our source account
      vi.spyOn(accountRepo, 'getById')
        .mockResolvedValue(sourceAccount);
      
      // Mock update to modify our source account
      vi.spyOn(accountRepo, 'update')
        .mockImplementation(async (id: string, data: Partial<Account>) => {
          Object.assign(sourceAccount, data);
          return sourceAccount;
        });
      
      // Mock the settings repository's getPaymentContacts
      vi.mocked(repositoryService.getSettingsRepository).mockReturnValue({
        getPaymentContacts: vi.fn().mockResolvedValue(contacts)
      } as any);
      
      // Execute external transfer
      const result = await accountRepo.externalTransfer({
        fromAccountId: 'source-acc',
        toContactId: 'contact1',
        amount: 500,
        description: 'External payment test'
      });
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.message).toContain('completed successfully');
      expect(result.transactionId).toBeDefined();
      
      // Verify account balance was updated
      expect(sourceAccount.balance).toBe(1500); // 2000 - 500
      
      // Verify transaction was created with correct parameters
      expect(mockTransactionRepo.createTransferTransaction).toHaveBeenCalledWith(
        'source-acc',
        '987654321', // Contact1's account number
        500,
        'USD',
        1500, // Updated source balance
        undefined, // External balance is undefined
        'External payment test',
        true
      );
    });

    it('should fail if source account has insufficient funds', async () => {
      // Setup source account with low balance
      const sourceAccount: Account = {
        id: 'source-acc',
        name: 'Source Account',
        balance: 200,
        currency: 'USD',
        type: 'checking',
        accountNumber: '123456789',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      // Mock contacts
      const contacts = [
        { id: 'contact1', name: 'John Doe', accountNumber: '987654321' }
      ];
      
      // Mock getById to return our source account
      vi.spyOn(accountRepo, 'getById')
        .mockResolvedValue(sourceAccount);
        
      // Mock the settings repository's getPaymentContacts
      vi.mocked(repositoryService.getSettingsRepository).mockReturnValue({
        getPaymentContacts: vi.fn().mockResolvedValue(contacts)
      } as any);
      
      // Mock update to verify it's not called
      const updateSpy = vi.spyOn(accountRepo, 'update');
      
      // Execute external transfer with insufficient funds
      const result = await accountRepo.externalTransfer({
        fromAccountId: 'source-acc',
        toContactId: 'contact1',
        amount: 500, // More than the balance
        description: 'Should fail'
      });
      
      // Verify failure result
      expect(result.success).toBe(false);
      expect(result.message).toBe('Insufficient funds');
      
      // Verify account balance was NOT changed
      expect(sourceAccount.balance).toBe(200);
      
      // Verify neither update nor createTransferTransaction were called
      expect(updateSpy).not.toHaveBeenCalled();
      expect(mockTransactionRepo.createTransferTransaction).not.toHaveBeenCalled();
    });

    it('should fail if source account does not exist', async () => {
      // Mock getById to return undefined (account not found)
      vi.spyOn(accountRepo, 'getById')
        .mockResolvedValue(undefined);
      
      // Execute external transfer with non-existent account
      const result = await accountRepo.externalTransfer({
        fromAccountId: 'non-existent-account',
        toContactId: 'contact1',
        amount: 500,
        description: 'Should fail'
      });
      
      // Verify failure result
      expect(result.success).toBe(false);
      expect(result.message).toBe('Source account not found');
      
      // Verify createTransferTransaction was not called
      expect(mockTransactionRepo.createTransferTransaction).not.toHaveBeenCalled();
    });

    it('should fail if contact does not exist', async () => {
      // Setup source account
      const sourceAccount: Account = {
        id: 'source-acc',
        name: 'Source Account',
        balance: 2000,
        currency: 'USD',
        type: 'checking',
        accountNumber: '123456789',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      // Mock contacts - without the one we'll try to use
      const contacts = [
        { id: 'contact2', name: 'Jane Smith', accountNumber: '555666777' }
      ];
      
      // Mock getById to return our source account
      vi.spyOn(accountRepo, 'getById')
        .mockResolvedValue(sourceAccount);
        
      // Mock the settings repository's getPaymentContacts
      vi.mocked(repositoryService.getSettingsRepository).mockReturnValue({
        getPaymentContacts: vi.fn().mockResolvedValue(contacts)
      } as any);
      
      // Execute external transfer with non-existent contact
      const result = await accountRepo.externalTransfer({
        fromAccountId: 'source-acc',
        toContactId: 'contact1', // This contact doesn't exist in our mock
        amount: 500,
        description: 'Should fail'
      });
      
      // Verify failure result
      expect(result.success).toBe(false);
      expect(result.message).toBe('Destination contact not found');
      
      // Verify account balance was NOT changed
      expect(sourceAccount.balance).toBe(2000);
      
      // Verify createTransferTransaction was not called
      expect(mockTransactionRepo.createTransferTransaction).not.toHaveBeenCalled();
    });
  });
  
  // Add tests for getCompatibleAccounts
  describe('getCompatibleAccounts', () => {
    it('should return only active checking and savings accounts', async () => {
      // Setup test accounts of various types
      const accounts: Account[] = [
        {
          id: 'acc1',
          name: 'Active Checking',
          balance: 1000,
          currency: 'USD',
          type: 'checking',
          accountNumber: '111222333',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'acc2',
          name: 'Active Savings',
          balance: 5000,
          currency: 'USD',
          type: 'savings',
          accountNumber: '444555666',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'acc3',
          name: 'Inactive Checking',
          balance: 500,
          currency: 'USD',
          type: 'checking',
          accountNumber: '777888999',
          isActive: false, // Should be filtered out
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'acc4',
          name: 'Credit Card',
          balance: -1000,
          currency: 'USD',
          type: 'credit', // Should be filtered out (wrong type)
          accountNumber: '999000111',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'acc5',
          name: 'Investment Account',
          balance: 10000,
          currency: 'USD',
          type: 'investment', // Should be filtered out (wrong type)
          accountNumber: '222333444',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];
      
      // Mock getAll to return our test accounts
      vi.spyOn(accountRepo, 'getAll').mockResolvedValue(accounts);
      
      // Execute the method
      const compatibleAccounts = await accountRepo.getCompatibleAccounts();
      
      // Verify that only active checking and savings accounts were returned
      expect(compatibleAccounts).toHaveLength(2);
      
      // Check that the correct accounts were included
      const accountIds = compatibleAccounts.map(a => a.id);
      expect(accountIds).toContain('acc1'); // Active checking
      expect(accountIds).toContain('acc2'); // Active savings
      
      // Check that the other accounts were filtered out
      expect(accountIds).not.toContain('acc3'); // Inactive checking
      expect(accountIds).not.toContain('acc4'); // Credit card
      expect(accountIds).not.toContain('acc5'); // Investment account
    });
    
    it('should return an empty array when no accounts exist', async () => {
      // Mock getAll to return an empty array
      vi.spyOn(accountRepo, 'getAll').mockResolvedValue([]);
      
      // Execute the method
      const compatibleAccounts = await accountRepo.getCompatibleAccounts();
      
      // Verify an empty array was returned
      expect(compatibleAccounts).toEqual([]);
    });
    
    it('should return an empty array when no compatible accounts exist', async () => {
      // Setup test accounts - none of which are compatible
      const accounts: Account[] = [
        {
          id: 'acc1',
          name: 'Inactive Checking',
          balance: 1000,
          currency: 'USD',
          type: 'checking',
          accountNumber: '111222333',
          isActive: false, // Inactive
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'acc2',
          name: 'Credit Card',
          balance: -500,
          currency: 'USD',
          type: 'credit',
          accountNumber: '444555666',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'acc3',
          name: 'Investment',
          balance: 10000,
          currency: 'USD',
          type: 'investment',
          accountNumber: '777888999',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];
      
      // Mock getAll to return our test accounts
      vi.spyOn(accountRepo, 'getAll').mockResolvedValue(accounts);
      
      // Execute the method
      const compatibleAccounts = await accountRepo.getCompatibleAccounts();
      
      // Verify an empty array was returned
      expect(compatibleAccounts).toEqual([]);
    });
  });
  
  // Add additional test suites for other methods
  
});