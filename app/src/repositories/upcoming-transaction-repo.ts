import { StorageService } from "../services/storage-service";
import { UserService } from "../services/user-service";
import { LocalStorageRepository } from "./base-repository";
import { UpcomingTransaction } from "./models/transaction-models";


export class UpcomingTransactionRepository extends LocalStorageRepository<UpcomingTransaction> {
    constructor(storage: StorageService, userService: UserService) {
        super('upcoming-transactions', storage, userService);
    }

    protected async initializeMockData(): Promise<void> {
        // Check user type before initializing with mock data
        // const userType = this.userService.getUserType();
        // const module = await import("@mocks/upcoming-transaction")
        // const upcoming = module.getMockUpcomingTransactionsByUserType(userType);

        // // Add mock transactions
        // upcoming.forEach(transaction => {
        //     this.createForMocks(transaction);
        // });

        // // Save to storage
        // this.saveToStorage();
    }
    async getByReference(reference: string): Promise<UpcomingTransaction | undefined> {
        const transactions = await this.getAll();
        return transactions.find(t => t.reference === reference);
    }
    /**
       * Get account transactions as an async iterator
       * @param accountId The account ID to filter by
       * @param batchSize Number of transactions per batch
       */
    public async *getByAccountIdIterator(accountId: string): AsyncGenerator<UpcomingTransaction> {
        const items = await this.getAll();
        // sort transactions by date in descending order
        items.sort((a, b) => {
            return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
        });
        // log out the two most recent transactions
        // console.debug('trans1', transactions[0]);
        // console.debug('trans2', transactions[1]);
        for (const txn of items) {
            if (txn.fromAccountId === accountId || txn.toAccountId === accountId) {
                // console.debug('txn', txn);
                yield txn;
            }
        }
    }
}