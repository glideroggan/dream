import { getNextLoanStatus, getStateDelay, Loan, LoanStatus } from "../../repositories/models/loan-models";
import { UpcomingTransaction } from "../../repositories/models/transaction-models";
import { SimulationTask } from "../../repositories/simulation-repository";
import { generateUniqueId } from "../../utilities/id-generator";
import { repositoryService } from "../repository-service";
import { transactionService } from "../transaction-service";
import { TaskResults } from "./simulation-service";

/**
 * Process a loan application task
 */
export async function processLoanApplication(task: SimulationTask): Promise<TaskResults> {
    // get current state of the loan
    const loanRepo = repositoryService.getLoanRepository();
    const loan = await loanRepo.getById(task.productId);
    if (!loan) {
        console.error(`Loan ${task.productId} not found`);
        return {
            success: false,
            task: task,
        }
    }

    const currentState = loan.status;
    let nextState: LoanStatus | null = null;
    const now = Date.now();
    let ok: boolean = false
    // process current state
    switch (currentState) {
        case 'draft':
            // nothing?
            ok = await updateNextState(currentState, now, task);
            return {
                success: ok,
                task: task,
            }
        case 'pending_approval':
            // nothing?
            ok = await updateNextState(currentState, now, task);
            return {
                success: ok,
                task: task,
            }
        case 'approved':
            const {transactionId, amount} = await doInitialPayout(loan);
            if (!loan.metadata) {
                loan.metadata = {}
            }
            loan.metadata.payoutTransactionId = transactionId;
            loan.metadata.payoutTime = now;
            loan.metadata.currentlyOwed = amount;

            // update state
            ok = await updateNextState(currentState, now, task);
            return {
                success: ok,
                task: task,
            }
        case 'rejected':
            console.warn('Loan state not yet implemented');
            return {
                success: false,
                task: task,
                error: 'Loan rejection not yet implemented',
            }
        case 'active':
            // TODO: check interest rates? change any related recurring payment tasks?
            // once being checked here, check also the recurring payment task, and adjust interest rates if needed
            
            // TODO: here we will instead do what the previous task would do
            // update the loan attributes with details of the last completed payment
            const upcomingRepo = repositoryService.getUpcomingTransactionRepository()
            const transactionRepo = repositoryService.getTransactionRepository()
            if (!loan.metadata) {
                loan.metadata = {}
            }
            // first payment
            if (!loan.metadata.lastTransactionReference) {
                // first payment, create scheduled payment
                const scheduledTransaction = await createScheduledPayment(task, loan)
                loan.metadata.lastTransactionReference = scheduledTransaction.reference;
                loan.nextPaymentDate = scheduledTransaction.scheduledDate
                await loanRepo.update(loan.id, loan);
                task.nextProcessTime = now + getStateDelay(LoanStatus.ACTIVE, 'loan');
                return {
                    success: true,
                    task: task,
                }
            }

            // get the last transaction
            const lastTransaction = await transactionRepo.getByReference(loan.metadata.lastTransactionReference)
            if (lastTransaction) {
                // update the loan attributes from last completed transaction
                loan.metadata.currentlyOwed -= lastTransaction.amount;
                loan.paymentsMade += 1;
                loan.paymentsRemaining -= 1;
                loan.remainingAmount -= lastTransaction.amount;
                await loanRepo.update(loan.id, loan);
            } 
            // TODO: check interest rates and update amounts

            // check if we have already created a new scheduled payment
            const upcoming = await upcomingRepo.getByReference(loan.metadata.lastTransactionReference)
            if (!upcoming) {
                // create a new scheduled payment
                const scheduledTransaction = await createScheduledPayment(task, loan)
                loan.metadata.lastTransactionReference = scheduledTransaction.reference;
                loan.nextPaymentDate = scheduledTransaction.scheduledDate;
                await loanRepo.update(loan.id, loan);
            }
            task.nextProcessTime = now + getStateDelay(LoanStatus.ACTIVE, 'loan');
            return {
                success: true,
                task: task,
            }
        case 'paid_off':
            console.warn('Loan state not yet implemented');
            return {
                success: false,
                task: task,
                error: 'Loan paid off not yet implemented',
            }
        case 'defaulted':
        default:
            console.error(`Unknown state ${currentState} for loan ${task.productId}`);
            return {
                success: false,
                task: task,
                error: 'Unknown loan state',
            }
    }
}

function getNextDate(from: number, day: number): Date {
    const date = new Date(from);
    date.setDate(day);
    return date;
}

async function createScheduledPayment(task: SimulationTask, loan: Loan): Promise<UpcomingTransaction> {
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
        'payment', 'Loan payment', dueDate, ref)
    console.debug('created scheduled payment', transaction);

    // update task with reference
    if (!task.metadata) {
        task.metadata = {};
    }
    task.metadata.lastTransactionReference = transaction.reference;
    console.debug('Task', task);
    return transaction as UpcomingTransaction
}

async function updateNextState(currentState:LoanStatus, now:number, task:SimulationTask): Promise<boolean> {
    const nextState = getNextLoanStatus(currentState);
    task.nextProcessTime = now + getStateDelay(nextState!, 'loan');
    // Update the loan entity via repository
    const ok = await updateProductState(task.productId, nextState!);
    console.debug(`Transitioning loan ${task.productId} from ${task.currentState} to ${nextState}`);
    return ok
}

async function updateProductState(productId: string, state: LoanStatus): Promise<boolean> {
    console.debug(`Updating product ${productId} state to ${state}`);
    // TODO: update the state of the loan product in the repository loan-repository.ts
    const loanRepository = repositoryService.getLoanRepository();

    const loan = await loanRepository.getById(productId);
    if (!loan) {
        console.error(`Loan ${productId} not found`);
        return false
    }
    loan.status = state;
    await loanRepository.update(productId, loan);
    return true;
}

async function doInitialPayout(loan: Loan): Promise<{ transactionId: string; amount: number; }> {
    const accountId = loan.accountId;
    // TODO: we should validate that this account exists on this user
    const accountRepo = repositoryService.getAccountRepository();
    const account = await accountRepo.getById(accountId);
    const accountCurrency = account?.currency;
    const amount = loan.amount;
    // const transactionRepo = repositoryService.getTransactionRepository();
    // TODO: what if this fails? where should we handle errors?
    // maybe as a rule, repositories never throws?
    // payout the money to the account
    // TODO: should we tie this tranaction somehow to the loan?
    const transaction = await transactionService.createFromExternal(accountId, amount, accountCurrency!, 'Loan payout');
    return { transactionId: transaction.id, amount: amount };
}
