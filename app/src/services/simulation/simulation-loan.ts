import { LoanRepository } from "../../repositories/loan-repository";
import { getNextLoanStatus, getStateDelay, LoanStatus } from "../../repositories/models/loan-models";
import { simulationRepository, SimulationTask } from "../../repositories/simulation-repository";
import { repositoryService } from "../repository-service";
import { transactionService } from "../transaction-service";
import { CreateSimulationTask, simulationService, TaskResults } from "./simulation-service";

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
            const accountId = loan.accountId;
            // TODO: we should validate that this account exists on this user
            const accountRepo = repositoryService.getAccountRepository();
            const account = await accountRepo.getById(accountId);
            const accountCurrency = account?.currency;
            const amount = loan.amount;
            const transactionRepo = repositoryService.getTransactionRepository();
            // TODO: what if this fails? where should we handle errors?
            // maybe as a rule, repositories never throws?
            // payout the money to the account
            // TODO: should we tie this tranaction somehow to the loan?
            const transaction = await transactionService.createFromExternal(accountId, amount, accountCurrency!, 'Loan payout');
            if (!loan.metadata) {
                loan.metadata = {}
            }
            loan.metadata.payoutTransactionId = transaction.id;
            loan.metadata.payoutTime = now;
            loan.metadata.currentlyOwed = amount;
            // TODO: create a new recurring task that will create a scheduled payment for paying back the loan
            const recurringTask: CreateSimulationTask = {
                productId: loan.id,
                type: 'recurring_payment',
                metadata: {
                    amount: loan.monthlyPayment,
                    currency: accountCurrency,
                    fromAccountId: accountId,
                    toAccountId: 'bank',
                }
            }
            // TODO: not to forget, we need to update the loan entity after a recurring payment
            // so the actual amount still owned is updated
            await simulationService.createTask(recurringTask)

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
            // 

            task.nextProcessTime = now + getStateDelay(LoanStatus.ACTIVE, 'loan');
            console.debug('Loan state not yet implemented');
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