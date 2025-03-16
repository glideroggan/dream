import { generateUUID } from "../../utilities/id-generator";
import { simulationRepository, SimulationRepository, SimulationTask } from "../../repositories/simulation-repository";
import { UserProductRepository } from "../../repositories/user-product-repository";
import { processLoanApplication } from "./simulation-loan";

// Task interface for simulation queue
// interface SimulationTask {
//     id: string;
//     userProductId: string;
//     type: string; // 'loan', 'account', etc.
//     currentState: string;
//     nextStateTime: number; // Timestamp for when to process the next state
//     startTime: number;
//     metadata?: Record<string, any>; // Additional data needed for simulation

export interface TaskResults {
    success: boolean;
    task: SimulationTask;
    error?: string;
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
    
    // /**
    //  * Set the repositories needed for simulation
    //  */
    // setRepositories(
    //     simulationRepository: SimulationRepository, 
    //     userProductRepository: UserProductRepository
    // ): void {
    //     this.simulationRepository = simulationRepository;
    //     this.userProductRepository = userProductRepository;
    //     console.debug("SimulationService repositories configured");
    // }
    
    async initialize(): Promise<void> {
        // Clear any existing interval to avoid duplicates
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Start the interval to process the queue every 5 seconds
        this.intervalId = window.setInterval(() => {
            this.processQueue();
        }, this.PROCESSING_INTERVAL);
        
        console.debug("SimulationService initialized with task processor");
    }
    
    /**
     * Add a new task to the simulation queue
     */
    addTask(userProductId: string, type: string = 'loan', initialState: string = 'pending_approval'): void {
        
        // const queue = this.getQueue();
        // const nextTask = this.simulationRepository.getNextTask();
        
        // Check if task already exists - using task ID is better as noted in TODO
        // const existingTask = queue.find(task => task.userProductId === userProductId);
        // if (existingTask) {
        //     console.debug(`Task already exists for product ${userProductId}`);
        //     return;
        // }
        
        // Create new task
        const now = Date.now();
        const newTask: SimulationTask = {
            id: `task_${generateUUID()}`,
            productId: userProductId,
            type,
            currentState: initialState,
            lastProcessedTime: now,
            nextProcessTime: now + this.simulationRepository.getStateDelay(initialState, type),
            createdTime: now,
            completedSteps: [],
            status: 'pending'
        };
        
        // Add task to queue
        this.simulationRepository.addTask(newTask);
        // queue.push(newTask);
        // this.saveQueue(queue);
        
        console.log(`SimulationService: Added simulation task for product ${userProductId} with initial state ${initialState}`);
    }
    
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
        //     console.log(`SimulationService: Removed task for product ${userProductId}`);
        // }
    }
    
    /**
     * Process all tasks in the queue
     */
    private processQueue(): void {
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
        
        // Set processing flag
        this.isProcessingQueue = true;
        
        try {
            // Only process one task at a time as requested in TODO
            const now = Date.now();
            
            console.log(`Processing simulation task: ${task.type} (${task.id})`);
            
            // Check if it's time to process this task
            if (now >= task.nextProcessTime) {
                const result = this.processTask(task);
                
                // Create updated queue
                const updatedQueue = [...remainingTasks];
                
                // If task is not completed, add it back to the end of the queue
                if (result) {
                    updatedQueue.push(result);
                } else {
                    console.log(`Task ${task.id} completed and removed from queue`);
                }
                
                // Save the updated queue
                this.saveQueue(updatedQueue);
            } else {
                // Not time to process yet, put it at the end of the queue
                console.debug(`Task ${task.id} not ready for processing, rescheduling`);
                this.saveQueue([...remainingTasks, task]);
            }
        } finally {
            // Clear processing flag
            this.isProcessingQueue = false;
        }
    }
    
    /**
     * Process a single task and return updated task or null if completed
     */
    private processTask(task: SimulationTask): SimulationTask | null {
        console.debug(`Processing task: ${task.type} in state ${task.currentState}`);
        
        switch (task.type.toLowerCase()) {
            case 'loan':
                const results = processLoanApplication(task);
                if (results.success) {
                    // TODO: should check if the task is completed, because then we can delete it from the repo
                    // otherwise, lets put it back in the repo

                    this.simulationRepository.updateTaskState(task, 'pending')
                    
                    return null;
                }
            case 'account':
                throw new Error("Account processing not implemented");
                // return this.processAccountCreation(task);
            case 'card':
                throw new Error("Card processing not implemented");
                // return this.processCardActivation(task);
            default:
                console.error(`Unknown task type: ${task.type}`);
                return null;
        }
    }
    
    /**
     * Process an account creation task
     */
    // private processAccountCreation(task: SimulationTask): SimulationTask | null {
    //     // These should eventually come from the account product definition
    //     const states = ['pending', 'processing', 'active'];
        
    //     // Similar implementation to processLoanApplication
    //     const currentIndex = states.indexOf(task.currentState);
        
    //     if (currentIndex === states.length - 1) {
    //         console.log(`Account ${task.userProductId} is now ${task.currentState}`);
            
    //         // Update the actual account entity via repository
    //         this.updateProductState(task.userProductId, task.currentState);
            
    //         // Record completion in simulation repository
    //         this.updateSimulationStatus(task.userProductId, 'completed', task.currentState);
            
    //         return null;
    //     }
        
    //     const nextState = states[currentIndex + 1];
    //     const now = Date.now();
        
    //     // Update the account entity via repository
    //     this.updateProductState(task.userProductId, nextState);
        
    //     // Update simulation status
    //     this.updateSimulationStatus(task.userProductId, 'in_progress', nextState, task.currentState);
        
    //     return {
    //         ...task,
    //         currentState: nextState,
    //         nextStateTime: now + this.getStateDelay(nextState)
    //     };
    // }
    
    /**
     * Process a card activation task
     */
    // private processCardActivation(task: SimulationTask): SimulationTask | null {
    //     // These should eventually come from the card product definition
    //     const states = ['issued', 'shipping', 'delivered', 'activated'];
        
    //     // Similar implementation to processLoanApplication
    //     const currentIndex = states.indexOf(task.currentState);
        
    //     if (currentIndex === states.length - 1) {
    //         console.log(`Card ${task.userProductId} is now ${task.currentState}`);
            
    //         // Update the actual card entity via repository
    //         this.updateProductState(task.userProductId, task.currentState);
            
    //         // Record completion in simulation repository
    //         this.updateSimulationStatus(task.userProductId, 'completed', task.currentState);
            
    //         return null;
    //     }
        
    //     const nextState = states[currentIndex + 1];
    //     const now = Date.now();
        
    //     // Update the card entity via repository
    //     this.updateProductState(task.userProductId, nextState);
        
    //     // Update simulation status
    //     this.updateSimulationStatus(task.userProductId, 'in_progress', nextState, task.currentState);
        
    //     return {
    //         ...task,
    //         currentState: nextState,
    //         nextStateTime: now + this.getStateDelay(nextState)
    //     };
    // }
    
    /**
     * Update the state of the actual product via repository
     */
    private async updateProductState(productId: string, state: string): Promise<void> {
        if (!this.userProductRepository) {
            console.warn("UserProductRepository not set, cannot update product state");
            return;
        }
        
        try {
            const product = await this.userProductRepository.getById(productId);
            if (product) {
                // Update product state in metadata
                const updatedMetadata = {
                    ...(product.metadata || {}),
                    state,
                    lastStateChange: new Date().toISOString()
                };
                
                await this.userProductRepository.update(productId, {
                    metadata: updatedMetadata,
                    lastUpdated: new Date().toISOString()
                });
                
                console.log(`Updated product ${productId} state to ${state}`);
            } else {
                console.warn(`Product ${productId} not found, cannot update state`);
            }
        } catch (error) {
            console.error(`Error updating product state:`, error);
        }
    }
    
    /**
     * Update the simulation status in the repository
     */
    private async updateSimulationStatus(
        productId: string, 
        status: string,
        currentState: string,
        completedState?: string
    ): Promise<void> {
        if (!this.simulationRepository) {
            console.warn("SimulationRepository not set, cannot update simulation status");
            return;
        }
        
        try {
            const simulation = await this.simulationRepository.getById(productId);
            if (simulation) {
                const completedSteps = [...simulation.completedSteps];
                if (completedState && !completedSteps.includes(completedState)) {
                    completedSteps.push(completedState);
                }
                
                await this.simulationRepository.addOrUpdateStatus({
                    ...simulation,
                    status,
                    currentState,
                    lastUpdated: Date.now(),
                    completedSteps
                });
                
                console.log(`Updated simulation status for ${productId}: ${status}, state: ${currentState}`);
            } else {
                console.warn(`Simulation for product ${productId} not found, cannot update status`);
            }
        } catch (error) {
            console.error(`Error updating simulation status:`, error);
        }
    }
    
    /**
     * Get the delay time for a specific state (in milliseconds)
     * In the future, these should be defined with the product models
     */
    // private getStateDelay(state: string): number {
    //     // Define delays for different states
    //     const delays: Record<string, number> = {
    //         // Loan states
    //         'pending_approval': 10000, // 10 seconds
    //         'reviewing': 15000,        // 15 seconds
    //         'approved': 8000,          // 8 seconds
    //         'funding': 12000,          // 12 seconds
            
    //         // Account states
    //         'pending': 8000,           // 8 seconds
    //         'processing': 10000,       // 10 seconds
            
    //         // Card states
    //         'issued': 5000,            // 5 seconds
    //         'shipping': 15000,         // 15 seconds
    //         'delivered': 10000,        // 10 seconds
            
    //         // Default delay
    //         'default': 10000           // 10 seconds
    //     };
        
    //     return delays[state] || delays['default'];
    // }
    
    /**
     * Get the current queue from localStorage
     * Will be replaced with repository usage
     */
    private getQueue(): SimulationTask[] {
        this.simulationRepository?.getAll
        if (this.simulationRepository) {
            // If we had implemented a queue in the repository, we would use it here
            // For now, we continue with localStorage as a temporary solution
        }
        
        const queueJson = localStorage.getItem(this.QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    }
    
    /**
     * Save the queue to localStorage
     * Will be replaced with repository usage
     */
    private saveQueue(queue: SimulationTask[]): void {
        if (this.simulationRepository) {
            // If we had implemented a queue in the repository, we would use it here
            // For now, we continue with localStorage as a temporary solution
        }
        
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
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