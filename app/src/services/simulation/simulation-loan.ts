import { simulationRepository, SimulationTask } from "../../repositories/simulation-repository";
import { TaskResults } from "./simulation-service";

/**
 * Process a loan application task
 */
export function processLoanApplication(task: SimulationTask): TaskResults {
    debugger
    // In the future, these states should come from the loan product definition
    const states = ['pending_approval', 'reviewing', 'approved', 'funding', 'active'];
    
    // Get current state index
    const currentIndex = states.indexOf(task.currentState);
    
    // If we're at the end of the workflow, task is complete
    if (currentIndex === states.length - 1) {
        debugger
        console.log(`Loan application ${task.productId} is now ${task.currentState}`);
        
        // Update the actual loan entity via repository
        updateProductState(task.productId, task.currentState);

        // TODO: if this is the last state, then money should be paid out
        // a recurring payment should be set up, tied to the loan product
        // and this recurring payment is just another simulation task that needs to be processed
        
        // Record completion in simulation repository
        // this.updateSimulationStatus(task.userProductId, 'completed', task.currentState);
        
        debugger
        // TODO: we should probably send something with, as this task is now completed
        // but there is another task that needs to be created, is that here?
        return {
            success: true,
            task: task,
        }
    }

    // TODO: process the current state
    
    // Move to next state
    const nextState = states[currentIndex + 1];
    const now = Date.now();
    task.nextProcessTime = now + simulationRepository.getStateDelay(nextState, 'loan');
    
    console.log(`Transitioning loan ${task.productId} from ${task.currentState} to ${nextState}`);
    
    // Update the loan entity via repository
    updateProductState(task.productId, nextState);
    
    // return state of processing
    // was the state successful?
    // did we have errors
    return {
        success: true,
        task: task,
    }
}

function updateProductState(productId: string, state: string) {
    console.log(`Updating product ${productId} state to ${state}`);
    // TODO: update the state of the loan product in the repository loan-repository.ts
}