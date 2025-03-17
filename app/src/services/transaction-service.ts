import { Transaction, TransactionDirections } from "../repositories/models/transaction-models";
import { repositoryService } from "./repository-service";

export class TransactionService {
    private static instance: TransactionService;

    private constructor() {
        console.debug("TransactionService instance created");
    }
    public static getInstance(): TransactionService {
        if (!TransactionService.instance) {
            TransactionService.instance = new TransactionService();
        }
        return TransactionService.instance;
    }
    async createFromExternal(toAccountId: string, amount: number, currency: string, description?: string, reference?: string): Promise<Transaction> {
        const accountRepo = repositoryService.getAccountRepository();
        const toAccount = await accountRepo.getById(toAccountId)
        if (!toAccount) {
            throw new Error(`Account ${toAccountId} not found`);
        }
        toAccount.balance += amount;
        await accountRepo.update(toAccountId, toAccount);
        const now = new Date()
        const transaction = await repositoryService.getTransactionRepository().create({
            fromAccountId: 'external',
            toAccountId,
            toAccountBalance: toAccount.balance,
            amount,
            direction: TransactionDirections.CREDIT,
            currency,
            description,
            status: 'completed',
            type: 'deposit',
            createdAt: now.toISOString(),
            completedDate: now.toISOString(),
            reference: reference || `transaction-${now.getTime()}`
        })
        return transaction;
    }

    async createToExternal(fromAccountId: string, amount: number, currency: string, description?: string, dueDate?: Date, reference?: string): Promise<Transaction> {
        /**  
         * as this is the service, we will handle all connections to other repositories here
         * validate any accounts
         * update the account balances
         * create the transaction
         * 
        */
        // validate the account
        const accountRepo = repositoryService.getAccountRepository();
        const fromAccount = await accountRepo.getById(fromAccountId);
        if (!fromAccount) {
            throw new Error(`Account ${fromAccountId} not found`);
        }
        // TODO: don't update account when the transaction is scheduled
        // update the account balance
        fromAccount.balance -= amount;
        await accountRepo.update(fromAccountId, fromAccount);
        // create the transaction
        const transactionRepo = repositoryService.getTransactionRepository();
        const now = new Date()
        const transaction = await transactionRepo.create({
            fromAccountId,
            fromAccountBalance: fromAccount.balance,
            amount,
            currency,
            description,
            createdAt: now.toISOString(),
            reference: reference || `transaction-${now.getTime()}`,
            direction: TransactionDirections.DEBIT,
            status: dueDate && dueDate > now ? 'upcoming' : 'completed',
            type: 'withdrawal',
            completedDate: dueDate && dueDate > now ? undefined : now.toISOString(),
            scheduledDate: dueDate && dueDate > now ? dueDate.toISOString() : undefined,
            toAccountBalance: undefined,
            toAccountId: 'external'
        })
        return transaction;
    }
}

export const transactionService = TransactionService.getInstance();