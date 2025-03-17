import { Transaction, TransactionDirections, TransactionType } from "../repositories/models/transaction-models";
import { paymentContactsService, PaymentContactsService } from "./payment-contacts-service";
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

    async createTransfer(fromAccountId: string, toAccountId: string, amount: number, currency: string,
        description?: string, reference?: string): Promise<Transaction> {
        const accountRepo = repositoryService.getAccountRepository();
        const fromAccount = await accountRepo.getById(fromAccountId);
        if (!fromAccount) {
            throw new Error(`Account ${fromAccountId} not found`);
        }
        const toAccount = await accountRepo.getById(toAccountId);
        if (!toAccount) {
            throw new Error(`Account ${toAccountId} not found`);
        }
        // update the account balance
        fromAccount.balance -= amount;
        toAccount.balance += amount;
        await accountRepo.update(fromAccountId, fromAccount);
        // create the transaction
        const transactionRepo = repositoryService.getTransactionRepository();
        const now = new Date()
        const transaction = await transactionRepo.create({
            fromAccountId,
            fromAccountBalance: fromAccount.balance,
            toAccountId: toAccount.id || 'external',
            toAccountBalance: toAccount.balance,
            amount,
            currency,
            description,
            createdAt: now.toISOString(),
            reference: reference || `transfer-${now.getTime()}`,
            direction: TransactionDirections.DEBIT,
            status: 'completed',
            type: 'transfer',
            completedDate: now.toISOString(),
        })
        return transaction;

    }

    async createToContact(fromAccountId: string, toContactId: string, amount: number, currency: string,
        description?: string, type?: TransactionType, dueDate?: Date, reference?: string): Promise<Transaction> {
        const accountRepo = repositoryService.getAccountRepository();
        const fromAccount = await accountRepo.getById(fromAccountId);
        if (!fromAccount) {
            throw new Error(`Account ${fromAccountId} not found`);
        }
        // TODO: we need to check the amount in the account
        // check contact
        const contact = await paymentContactsService.getContactById(toContactId);
        if (!contact) {
            throw new Error(`Contact ${toContactId} not found`);
        }
        if (dueDate && dueDate > new Date()) {
            const upcomingRepo = repositoryService.getUpcomingTransactionRepository();
            return await upcomingRepo.create({
                fromAccountId,
                toAccountId: contact.accountNumber || 'external',
                amount,
                currency,
                description,
                scheduledDate: dueDate.toISOString(),
                status: 'upcoming',
                type: type || 'withdrawal',
                createdAt: new Date().toISOString(),
                direction: TransactionDirections.DEBIT,
                reference: reference || `transaction-${dueDate.getTime()}`
            })
        }
        // update the account balance
        fromAccount.balance -= amount;
        await accountRepo.update(fromAccountId, fromAccount);
        // create the transaction
        const transactionRepo = repositoryService.getTransactionRepository();
        const now = new Date()
        const transaction = await transactionRepo.create({
            fromAccountId,
            toAccountId: contact.accountNumber || 'external',
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
            toAccountBalance: undefined,
        })
        return transaction;
    }

    /***
     * Create a transaction from an account to an external account
     * @param fromAccountId - the account ID to transfer from
     */
    async createToExternal(fromAccountId: string, amount: number, currency: string,
        toAccountId?: string,
        type?: TransactionType, description?: string, dueDate?: Date, reference?: string): Promise<Transaction> {
        // validate the account
        const accountRepo = repositoryService.getAccountRepository();
        const fromAccount = await accountRepo.getById(fromAccountId);
        if (!fromAccount) {
            throw new Error(`Account ${fromAccountId} not found`);
        }
        // TODO: we need to check the amount in the account
        if (dueDate && dueDate > new Date()) {
            const upcomingRepo = repositoryService.getUpcomingTransactionRepository();
            return await upcomingRepo.create({
                fromAccountId,
                toAccountId: toAccountId || 'external',
                amount,
                currency,
                description,
                scheduledDate: dueDate.toISOString(),
                status: 'upcoming',
                type: type || 'withdrawal',
                createdAt: new Date().toISOString(),
                direction: TransactionDirections.DEBIT,
                reference: reference || `transaction-${dueDate.getTime()}`
            })
        }
        // update the account balance
        fromAccount.balance -= amount;
        await accountRepo.update(fromAccountId, fromAccount);
        // create the transaction
        const transactionRepo = repositoryService.getTransactionRepository();
        const now = new Date()
        const transaction = await transactionRepo.create({
            fromAccountId,
            toAccountId: toAccountId || 'external',
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
            toAccountBalance: undefined,
        })
        return transaction;
    }
}

export const transactionService = TransactionService.getInstance();