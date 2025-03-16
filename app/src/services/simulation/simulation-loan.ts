import { LoanRepository } from "../../repositories/loan-repository";
import { getNextLoanStatus, getStateDelay, LoanStatus } from "../../repositories/models/loan-models";
import { simulationRepository, SimulationTask } from "../../repositories/simulation-repository";
import { repositoryService } from "../repository-service";
import { TaskResults } from "./simulation-service";

/**
 * Process a loan application task
 */
export async function processLoanApplication(task: SimulationTask): Promise<TaskResults> {
    debugger

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
            nextState = getNextLoanStatus(currentState);
            task.nextProcessTime = now + getStateDelay(nextState!, 'loan');
            // Update the loan entity via repository
            ok = await updateProductState(task.productId, nextState!);
            console.log(`Transitioning loan ${task.productId} from ${task.currentState} to ${nextState}`);
            return {
                success: ok,
                task: task,
            }
        case 'pending_approval':
            // nothing?
            nextState = getNextLoanStatus(currentState);
            task.nextProcessTime = now + getStateDelay(nextState!, 'loan');
            // Update the loan entity via repository
            ok = await updateProductState(task.productId, nextState!);
            console.log(`Transitioning loan ${task.productId} from ${task.currentState} to ${nextState}`);
            return {
                success: ok,
                task: task,
            }
        case 'approved':
            // TODO: pay out the loan to the account
            // create a new recurring task that will create a scheduled payment for paying back the loan
            return {
                success: false,
                task: task,
            }
        case 'rejected':
            console.warn('Loan state not yet implemented');
            return {
                success: false,
                task: task,
            }
        case 'active':
            // TODO: check interest rates? change any related recurring payment tasks?
            // 
            console.warn('Loan state not yet implemented');
            return {
                success: false,
                task: task,
            }
        case 'paid_off':
            console.warn('Loan state not yet implemented');
            return {
                success: false,
                task: task,
            }
        case 'defaulted':
        default:
            console.error(`Unknown state ${currentState} for loan ${task.productId}`);
            return {
                success: false,
                task: task,
            }
    }
}

async function updateProductState(productId: string, state: LoanStatus): Promise<boolean> {
    console.log(`Updating product ${productId} state to ${state}`);
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