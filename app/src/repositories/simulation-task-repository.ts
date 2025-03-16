// import { LocalStorageRepository } from './base-repository';
// import { StorageService } from '../services/storage-service';
// import { UserService } from '../services/user-service';

// /**
//  * Interface for simulation tasks stored in the repository
//  */
// export interface SimulationTask {
//     id: string;
//     userProductId: string;
//     type: string; // 'loan', 'account', etc.
//     currentState: string;
//     nextStateTime: number; // Timestamp for when to process the next state
//     startTime: number;
//     lastProcessed?: number;
//     metadata?: Record<string, any>; // Additional data needed for simulation
// }

// /**
//  * Repository for simulation tasks
//  */
// export class SimulationTaskRepository extends LocalStorageRepository<SimulationTask> {
//     constructor(storage: StorageService, userService: UserService) {
//         super('simulation-tasks', storage, userService);
//     }

//     /**
//      * Get all tasks in the queue
//      */
//     async getQueue(): Promise<SimulationTask[]> {
//         return this.getAll();
//     }

//     /**
//      * Add a task to the queue
//      */
//     async addTask(task: SimulationTask): Promise<SimulationTask> {
//         return this.create(task);
//     }

//     /**
//      * Get a task by product ID
//      */
//     async getTaskByProductId(productId: string): Promise<SimulationTask | undefined> {
//         const tasks = await this.getAll();
//         return tasks.find(task => task.userProductId === productId);
//     }

//     /**
//      * Get the next task to process
//      */
//     async getNextTask(): Promise<SimulationTask | undefined> {
//         const now = Date.now();
//         const tasks = await this.getAll();
        
//         // Sort by nextStateTime to get the most urgent task
//         return tasks
//             .sort((a, b) => a.nextStateTime - b.nextStateTime)
//             .find(task => task.nextStateTime <= now);
//     }

//     /**
//      * Initialize with empty data - no mock data needed for simulation tasks
//      */
//     protected async initializeMockData(): Promise<void> {
//         // No mock data is needed for simulation tasks
//         return;
//     }
// }
