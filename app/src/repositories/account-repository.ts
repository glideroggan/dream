import { Account } from '../services/repository-service';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { LocalStorageRepository } from './base-repository';

// Account repository implementation
export class AccountRepository extends LocalStorageRepository<Account> {
  constructor(storage: StorageService, userService: UserService) {
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
   */
  async transfer(fromId: string, toId: string, amount: number): Promise<boolean> {
    const fromAccount = await this.getById(fromId);
    const toAccount = await this.getById(toId);
    
    if (!fromAccount || !toAccount) {
      return false;
    }
    
    if (fromAccount.balance < amount) {
      return false;
    }
    
    // Update balances
    await this.update(fromId, { balance: fromAccount.balance - amount });
    await this.update(toId, { balance: toAccount.balance + amount });
    
    return true;
  }
}
