import { generateUUID } from "../../utilities/id-generator";
import { simulationRepository, SimulationRepository, SimulationTask } from "../../repositories/simulation-repository";
import { UserProductRepository } from "../../repositories/user-product-repository";
import { processLoanApplication } from "./simulation-loan";
import { processSystemUpcomingProcessing } from "./simulation-upcoming";

export interface TaskResults {
    success: boolean;
    task: SimulationTask;
    error?: string;
}

export type SupportedTaskType = 'recurring_payment' | 'loan' | 'system-upcoming-processing' | 'card-processing'

export interface CreateSimulationTask {
    productId: string;
    type: SupportedTaskType
    // TODO: maybe these metadata fields is just a reminder that we can instead use "extends" to create more
    // specific types for each task type
    metadata: Record<string, any>
}

class SimulationService {
    

    private static instance: SimulationService;
    private intervalId: number | null = null;
    private readonly QUEUE_KEY = 'simulation_task_queue';
    private readonly PROCESSING_INTERVAL = 5000; // 5 seconds
    private isProcessingQueue = false;

    // Dependencies
    private simulationRepository: SimulationRepository;
    private userProductRepository?: UserProductRepository;

    private constructor(simulationRepo: SimulationRepository) {
        console.debug("SimulationService instance created");
        this.simulationRepository = simulationRepo;
    }

    public static getInstance(): SimulationService {
        if (!SimulationService.instance) {
            SimulationService.instance = new SimulationService(simulationRepository);
        }
        return SimulationService.instance;
    }

    async initialize(): Promise<void> {
        // Clear any existing interval to avoid duplicates
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Start the interval to process the queue every 5 seconds
        this.intervalId = window.setInterval(() => {
            this.processQueue();
        }, this.PROCESSING_INTERVAL);

        // TODO: always create a task that will check upcoming transactions processing
        // maybe this should be in that repo instead?

        console.debug("SimulationService initialized with task processor");
    }

    async getTaskByType(type: string):Promise<SimulationTask|undefined> {
        const tasks = await this.simulationRepository.getAll();
        return tasks.find(task => task.type === type);    
    }

    async createTask(task: CreateSimulationTask): Promise<void> {
        // TODO: take in a task and only add the necessary fields
        const now = Date.now();
        let newTask: SimulationTask;
        switch (task.type) {
            case 'loan':
                newTask = {
                    id: `task_${generateUUID()}`,
                    productId: task.productId,
                    type: task.type,
                    currentState: 'pending_approval',
                    lastProcessedTime: now,
                    nextProcessTime: now + 10000, // 10 seconds
                    createdTime: now,
                    completedSteps: [],
                    status: 'pending',
                    metadata: task.metadata
                };
                break
            case 'system-upcoming-processing': // handles upcoming transactions
                newTask = {
                    id: `task_system_${generateUUID()}`,
                    productId: task.productId,
                    type: task.type,
                    currentState: 'pending',
                    lastProcessedTime: now,
                    nextProcessTime: now + 10000, // 10 seconds
                    createdTime: now,
                    completedSteps: [],
                    status: 'pending',
                    metadata: task.metadata
                };
                break
            case 'recurring_payment': 
                throw new Error("The original task should handle this");
                // newTask = {
                //     id: `task_${generateUUID()}`,
                //     productId: task.productId,
                //     type: task.type,
                //     currentState: 'pending',
                //     lastProcessedTime: now,
                //     nextProcessTime: now + 10000, // 10 seconds
                //     createdTime: now,
                //     completedSteps: [],
                //     status: 'pending',
                //     metadata: task.metadata
                // };
                break;
            default:
                throw new Error(`Unsupported task type: ${task.type}`);
        }
        this.simulationRepository.addTask(newTask);
        console.debug(`SimulationService: Added simulation task for product ${task.productId} with initial state ${newTask.currentState}`);
    }

    /**
     * Add a new task to the simulation queue
     */
    // addTask(userProductId: string, type: SupportedTaskType = 'loan', initialState: string = 'pending_approval'): void {
    //     // Create new task
    //     const now = Date.now();
    //     const newTask: SimulationTask = {
    //         id: `task_${generateUUID()}`,
    //         productId: userProductId,
    //         type,
    //         currentState: initialState,
    //         lastProcessedTime: now,
    //         nextProcessTime: now + this.simulationRepository.getStateDelay(initialState, type),
    //         createdTime: now,
    //         completedSteps: [],
    //         status: 'pending'
    //     };

    //     // Add task to queue
    //     this.simulationRepository.addTask(newTask);
    //     // queue.push(newTask);
    //     // this.saveQueue(queue);

    //     console.debug(`SimulationService: Added simulation task for product ${userProductId} with initial state ${initialState}`);
    // }

    /**
     * Remove a task from the queue
     */
    removeTask(userProductId: string): void {
        // TODO: for now, we just stop it
        this.simulationRepository.stopTask(userProductId);
        // const queue = this.getQueue();
        // const updatedQueue = queue.filter(task => task.userProductId !== userProductId);

        // if (queue.length !== updatedQueue.length) {
        //     this.saveQueue(updatedQueue);
        //     console.debug(`SimulationService: Removed task for product ${userProductId}`);
        // }
    }

    /**
     */
    private async processQueue(): Promise<void> {
        console.debug("Processing simulation queue...");
        // Prevent concurrent processing
        if (this.isProcessingQueue) {
            console.debug("Queue processing already in progress, skipping");
            return;
        }

        const task = await this.simulationRepository.getNextTaskToProcess();
        if (!task) {
            console.debug("No tasks ready for processing");
            return;
        }

        /** TODO: handle tasks that are "late"
         * What we mean here is that the tasks only run when user is here, so there could be really old tasks, like scheduled transactions/payments
         * We should handle those as if they were done in the correct time, meaning that if a payment is 3 days late, we still do it, but set the date as 3 days ago
         * so for the loan example, its actually not working, because of the states
         * current state: pending, next state approved, which would be a payout...
         * if pending would just be a few seconds, but we are now 3 days late, then we should have completed that AND the approved state, how do we handle that?
         * */

        // Set processing flag
        this.isProcessingQueue = true;

        try {
            // Only process one task at a time as requested in TODO
            const now = Date.now();

            console.debug(`Processing simulation task: ${task.type} (${task.id})`);

            // Check if it's time to process this task
            if (now >= task.nextProcessTime) {
                const result = await this.processTask(task);

                // If task is not completed, add it back to the end of the queue
                if (result.success) {
                    // TODO: handle COMPLETED state
                    this.simulationRepository.updateTaskState(task, 'pending')
                } else {
                    console.error(`Error processing task ${task.id}: ${result.error}`);
                    // this.simulationRepository.updateTaskState(task, 'pending');
                }
            } else {
                // Not time to process yet, put it at the end of the queue
                console.warn(`Task ${task.id} not ready for processing yet`);
            }
        } finally {
            // Clear processing flag
            this.isProcessingQueue = false;
        }
    }

    /**
     * Process a single task and return updated task or null if completed
     */
    private async processTask(task: SimulationTask): Promise<TaskResults> {
        console.debug(`Processing task: ${task.type} in state ${task.currentState}`);

        switch (task.type.toLowerCase()) {
            case 'system-upcoming-processing':
                return await processSystemUpcomingProcessing(task);
            case 'recurring_payment':
                // console.warn("Recurring payment processing is not a thing")
                throw new Error("Recurring payment processing is not a thing")
                // return await processRecurringPayment(task);
            case 'loan':
                return await processLoanApplication(task);
            case 'account':
                throw new Error("Account processing not implemented");
            // return this.processAccountCreation(task);
            case 'card':
                throw new Error("Card processing not implemented");
            // return this.processCardActivation(task);
            default:
                console.error(`Unknown task type: ${task.type}`);
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }

    /**
     * Clean up resources when service is destroyed
     */
    destroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export const simulationService = SimulationService.getInstance();