import { SimulationTask } from "../../repositories/simulation-repository";
import { repositoryService } from "../repository-service";
import { TaskResults } from "./simulation-service";

export async function processSystemUpcomingProcessing(task: SimulationTask): Promise<TaskResults> {
    /** TODO:
     * go through the upcoming transaction list
     * if scheduledDate < now, complete the transaction
     * if scheduledDate > now, do nothing
     * run again in 1 minute
    */

    console.debug('checking for upcoming transactions');
    const upcomingRepo = repositoryService.getUpcomingTransactionRepository();
    const upcomingList = await upcomingRepo.getAll();
    const now = new Date();
    for (const upcoming of upcomingList) {
        if (new Date(upcoming.scheduledDate) < now) {
            // update account balances
            const accountRepo = repositoryService.getAccountRepository();
            const fromAccount = await accountRepo.getById(upcoming.fromAccountId);
            const toAccount = await accountRepo.getById(upcoming.toAccountId);
            if (fromAccount?.accountNumber) {
                // if we have an account number, lets update the balance
                fromAccount.balance -= upcoming.amount;
                await accountRepo.update(fromAccount.id, fromAccount);
            }
            if (toAccount?.accountNumber) {
                toAccount.balance += upcoming.amount;
                await accountRepo.update(toAccount.id, toAccount);
            }

            // complete the transaction
            const transactionRepo = repositoryService.getTransactionRepository();
            const transaction = await transactionRepo.create({
                fromAccountId: upcoming.fromAccountId,
                toAccountId: upcoming.toAccountId,
                toAccountBalance: toAccount?.balance || 0,
                fromAccountBalance: fromAccount?.balance || 0,
                amount: upcoming.amount,
                direction: upcoming.direction,
                currency: upcoming.currency,
                description: upcoming.description,
                status: 'completed',
                type: upcoming.type,
                createdAt: upcoming.createdAt,
                completedDate: now.toISOString(),
            });
            await upcomingRepo.delete(upcoming.id);

            console.debug(`Completed transaction: ${transaction.id}`);

            // TODO: should we update related services here? might be better
            /**//
        }
    }
    

    task.nextProcessTime = now.getTime() + 60000; // 1 minute
    return {
        success: true,
        task: task,
    }
}