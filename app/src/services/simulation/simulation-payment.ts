import { Loan } from "../../repositories/models/loan-models";
import { Transaction } from "../../repositories/models/transaction-models";
import { SimulationTask } from "../../repositories/simulation-repository";
import { generateUniqueId } from "../../utilities/id-generator";
import { repositoryService } from "../repository-service";
import { transactionService } from "../transaction-service";
import { TaskResults } from "./simulation-service";

export async function processRecurringPayment(task: SimulationTask): Promise<TaskResults> {
    /**
     * once processing, 
     * get the loan from productId, check the amount left to pay
     * if zero, then set this task as completed/stopped
     * check for a transaction that is a scheduled payment with a specific reference
     * if it exists in the future, then do nothing
     * if it exists in the past, then create a new scheduled transaction for the next payment, counting from that date
     * if it doesn't exists, then create a new scheduled transaction for the next payment
    */
    const loanRepo = repositoryService.getLoanRepository();
    const loan = await loanRepo.getById(task.productId);
    if (!loan) {
        throw new Error(`Loan ${task.productId} not found`);
    }
    if (loan?.metadata?.currentlyOwed === undefined) {
        throw new Error(`Loan ${task.productId} has no amount left to pay`);
    }
    const amountLeft = loan.metadata.currentlyOwed;
    if (amountLeft === 0) {
        task.status = 'completed';
        return {
            success: true,
            task: task
        }
    }
    debugger
    const lastTransactionReference = task.metadata?.lastTransactionReference;
    if (!lastTransactionReference) {
        // create transaction
        await createScheduledPayment(task, loan);
        console.log('Task', task);
        // TODO: we should return a updated nextProcessTime, as this can be quite far in the future
        return {
            success: true,
            task: task,
        }
    }
    // look for the last transaction
    const transactionRepo = repositoryService.getTransactionRepository();
    const transactions = await transactionRepo.find({ reference: lastTransactionReference });
    if (transactions.length === 0) {
        // didn't exists
        await createScheduledPayment(task, loan);
        console.log('Task', task);
        return {
            success: true,
            task: task,
        }
    }
    const lastTransaction = transactions[0];
    if (!lastTransaction.scheduledDate) {
        throw new Error(`Transaction ${lastTransaction.id} has no scheduled date`);
    }

    const inTheFuture = new Date(lastTransaction.scheduledDate) > new Date();
    if (inTheFuture) {
        return {
            success: true,
            task: task,
        }
    }

    // TODO: handle the case where the transaction is in the past

    return {
        success: false,
        task: task,
        error: 'Not implemented'
    }
}

async function createScheduledPayment(task: SimulationTask, loan: Loan): Promise<Transaction> {
    const ref = `${generateUniqueId(`scheduled-payment-${task.id}`)}`;
    const now = Date.now();
    const amount = loan.monthlyPayment;
    const accountId = loan.accountId;
    const accountRepo = repositoryService.getAccountRepository();
    const account = await accountRepo.getById(accountId);
    const accountCurrency = account?.currency;
    // TODO: calculate the due date, which should be now + 30 days, closest 28th day
    const dueDate = getNextDate(now + 30, 28)
    const transaction = await transactionService.createTransaction(accountId, amount, accountCurrency!, 'Scheduled payment', dueDate, ref)

    // update task with reference
    if (!task.metadata) {
        task.metadata = {};
    }
    task.metadata.lastTransactionReference = transaction.reference;
    console.log('Task', task);
    return transaction;
}

function getNextDate(from: number, day: number): Date {
    const date = new Date(from);
    date.setDate(day);
    return date;
}