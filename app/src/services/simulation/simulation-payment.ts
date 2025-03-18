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
   console.debug('Processing recurring payment', task);
   const now = Date.now();
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
    const lastTransactionReference = task.metadata?.lastTransactionReference;
    if (!lastTransactionReference) {
        // create transaction
        await createScheduledPayment(task, loan);
        console.debug('Task', task);
        task.nextProcessTime = now + nextTime()
        return {
            success: true,
            task: task,
        }
    }
    // look if we have any upcoming
    const upcomingRepo = repositoryService.getUpcomingTransactionRepository();
    const upcoming = await upcomingRepo.getByReference(lastTransactionReference);
    if (upcoming) {
        // do nothing
        task.nextProcessTime = now + nextTime()
        return {
            success: true,
            task: task,
        }
    }
    // if not, then we need to create a new one
    await createScheduledPayment(task, loan);
    return {
        success: true,
        task: task,
    }
}

// TODO: we probably should check which product that is generating the task, so that we can put in the correct type
async function createScheduledPayment(task: SimulationTask, loan: Loan): Promise<Transaction> {
    const ref = `${generateUniqueId(`scheduled-payment-${task.id}`)}`;
    const now = Date.now();
    // TODO: check if this is correct, as we might need to incorporate the interest
    const amount = loan.monthlyPayment;
    const accountId = loan.accountId;
    const accountRepo = repositoryService.getAccountRepository();
    const account = await accountRepo.getById(accountId);
    const accountCurrency = account?.currency;
    // calculate the due date, which should be now + 30 days, closest 28th day
    const dueDate = getNextDate(now + 30, 28)
    const transaction = await transactionService.createToExternal(accountId, amount, accountCurrency!, undefined,
        'payment', 'Scheduled payment', dueDate, ref)
    console.debug('created scheduled payment', transaction);

    // update task with reference
    if (!task.metadata) {
        task.metadata = {};
    }
    task.metadata.lastTransactionReference = transaction.reference;
    console.debug('Task', task);
    return transaction;
}

function getNextDate(from: number, day: number): Date {
    const date = new Date(from);
    date.setDate(day);
    return date;
}

function nextTime():number {
    return 1000 * 60 * 60 // 1 hour
}
