import { Transaction } from "../repositories/models/transaction-models";

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

    async createTransaction(fromAccountId:string, amount:number, currency:string, description?:string, dueDate?: Date, reference?:string): Promise<Transaction> {
        /** TODO: continue here
         * as this is the service, we will handle all connections to other repositories here
         * validate any accounts
         * update the account balances
         * create the transaction
         * 
        */

    }
}

export const transactionService = TransactionService.getInstance();