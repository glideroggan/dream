import { CardStatus } from "../../repositories/models/card-models";
import { SimulationTask } from "../../repositories/simulation-repository";
import { repositoryService } from "../repository-service";
import { TaskResults } from "./simulation-service";

export async function processCardActivation(task: SimulationTask): Promise<TaskResults> {
    // get current state of the card
    const cardRepo = repositoryService.getCardRepository();
    const card = await cardRepo.getById(task.productId);
    if (!card) {
        console.error(`Card ${task.productId} not found`);
        return {
            success: false,
            task: task,
        }
    }

    const currentState = card.status;
    let nextState: CardStatus | null = null;
    const now = Date.now();
    let ok: boolean = false
    // process current state
    switch (currentState) {
        case 'pending':
            // TODO: 
            // for debit card, set a delay and move to next state 'active'
            // for credit card, update the card attributes with relevant data and move to next state 'active'
            return {
                success: true,
                task: task,
            }
        case 'active':
            /** TODO: continue here
             * debit:
             * check for overdraft protection
             * if none, check for overdraft
             * if overdraft, calculate a scheduled payment to pay for the overdraft fee
             * 
             * credit:
             * here we should schedule a payment for what is owed
             * check due date on card (for new cards, set to 30 days from now)
             * if due date is reached
             *   schedule a payment for the minimum payment
             *   to be paid in 3 days
             *   set ref to card
             * check ref on card
             *   find completed transaction with ref
             *   if found, update card balance
             * 
             * 
             *   
             * 
             * 
            */
            return {
                success: true,
                task: task,
            }
        case 'canceled':
            console.warn('Card state not yet implemented');
            return {
                success: false,
                task: task,
                error: 'Card closure not yet implemented',
            }
        default:
            console.error(`Unknown card state: ${currentState}`);
            return {
                success: false,
                task: task,
                error: `Unknown card state: ${currentState}`,
            }
    }
}