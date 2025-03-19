import { CardStatus, CreditCard } from "../../repositories/models/card-models";
import { UpcomingTransaction } from "../../repositories/models/transaction-models";
import { SimulationTask } from "../../repositories/simulation-repository";
import { UpcomingTransactionRepository } from "../../repositories/upcoming-transaction-repo";
import { generateUniqueId } from "../../utilities/id-generator";
import { repositoryService } from "../repository-service";
import { transactionService } from "../transaction-service";
import { TaskResults } from "./simulation-service";

export async function processCardActivation(task: SimulationTask): Promise<TaskResults> {
    // get current state of the card
    const userProductsRepo = repositoryService.getUserProductRepository()
    const userProduct = await userProductsRepo.getById(task.productId)
    // console.debug('[processCardActivation]', userProduct)
    const cardRepo = repositoryService.getCardRepository();
    if (!userProduct?.metadata?.cardId) {
        return {
            success: false,
            task: task,
            error: "No card associated with this product"
        }
    }
    const card = await cardRepo.getById(userProduct.metadata.cardId);
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
            if (card.type === 'debit') {
                card.status = 'active'
                task.nextProcessTime = now + 5000
            }
            // for credit card, update the card attributes with relevant data and move to next state 'active'
            /** TODO:
             * set a due date
             * convert card to credit card
             * set credit limit
             * 
            */
            return {
                success: true,
                task: task,
            }
            

        case 'active':
            if (card.type === 'debit') {
                return success(task)
                
            }
            const creditCard = card as CreditCard
            // for credit card only?
            // TODO: have the card expired?
            // TODO: we need to check the credit limit?
            // TODO: what happens if there are overdrafts on the creditlimit?
            // do the account have overdraft protection?
            const accountRepo = repositoryService.getAccountRepository()
            const account = await accountRepo.getById(creditCard.accountId)
            if (!account) {
                console.error(`Account ${creditCard.accountId} not found`);
                return failure(task, 'Account not found')
            }
            if (!account?.hasOverdraftProtection) {
                // no protection, check for overdrafts, which should be a balance over the credit limit
                if (account.balance < 0) {
                    const overdrafts = Math.abs(account.balance) - creditCard.creditLimit
                    if (overdrafts > 0) {
                        // overdraft found, create a scheduled payment for the amount
                        const dueDate = new Date(now + 1000 * 60 * 60 * 24 * 3) // 3 days from now
                        // TODO: the 10% should be on the product/card level, not hardcoded here
                        const amount = overdrafts* 1.1 // 10% fee for overdraft
                        const scheduledPayment = await createScheduledPayment(creditCard, account, amount, dueDate, task, 'Overdraft payment')
                    }
                }

            }
            // check card due date
            if (!creditCard.dueDate) {
                // set a due date
                creditCard.dueDate = new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days from now
                await cardRepo.update(creditCard.id, creditCard)
                return success(task)
            }
            // due date found
            let scheduledPayment = await checkScheduledPayment(creditCard.paymentReferenceId)
            if (scheduledPayment) {
                // scheduled payment found
                return success(task)
            }
            // no payment found
            // is due date soon? a week from now?
            const dueDate = new Date(creditCard.dueDate).getTime()
            const diff = dueDate - now
            if (diff > 1000 * 60 * 60 * 24 * 7) {
                // not yet
                return success(task)
            }
            // due date is soon, create a scheduled payment
            // collect owed amount from the account
            const amount = account.balance < 0 ? Math.abs(account.balance) : 0
            scheduledPayment = await createScheduledPayment(creditCard, account, amount, new Date(creditCard.dueDate), 
                task, 'Credit card debt payment')
            creditCard.paymentReferenceId = scheduledPayment.reference
            await cardRepo.update(creditCard.id, creditCard)
            return success(task)
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

async function createScheduledPayment(card: CreditCard, account: any, amount: number, dueDate:Date, task: SimulationTask, description:string): Promise<UpcomingTransaction> {
    // TODO: there are numerous ways to pay back debt on a credit card, each card should have this set in their structure
    // const amount = account.balance < 0 ? Math.abs(account.balance) : 0
    const ref = `credit-card-${card.id}-${generateUniqueId()}`
    const transaction = await transactionService.createToExternal(account.id, amount, account.currency, 'credit card provider', 'fee', 
        description, dueDate, ref)
    return transaction as UpcomingTransaction
}

async function checkScheduledPayment(paymentReferenceId: string | undefined): Promise<UpcomingTransaction|undefined> {
    if (!paymentReferenceId) {
        return undefined
    }
    const upcomingTransactionRepo = repositoryService.getUpcomingTransactionRepository()
    return await upcomingTransactionRepo.getById(paymentReferenceId)
}

function success(task:SimulationTask): TaskResults {
    task.nextProcessTime = Date.now() + 15000 // 15 seconds from now
    return {
        success: true,
        task: task,
    }
}
function failure(task:SimulationTask, error:string): TaskResults {
    task.nextProcessTime = Date.now() + 15000 // 15 seconds from now
    return {
        success: false,
        task: task,
        error: error,
    }
}
