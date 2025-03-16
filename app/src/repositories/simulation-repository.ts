import { UserService } from '../services/user-service';
import { StorageService } from '../services/storage-service';
import { LocalStorageRepository } from './base-repository';
import { generateUUID } from '../utilities/id-generator';

/**
 * Simulation task interface
 * status:
 * - pending: Task is waiting to be processed
 * - in_progress: Task is currently being processed
 * - completed: Task has been completed
 * - stopped: Task has been stopped
 */
export interface SimulationTask {
  id: string;
  productId: string;
  type: string;          // 'loan', 'account', etc.
  currentState: string;  // Current state of the simulation
  nextProcessTime: number; // When to process next
  createdTime: number;
  lastProcessedTime?: number;
  completedSteps: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'stopped';
}

/**
 * Repository to manage simulation tasks
 */
export class SimulationRepository extends LocalStorageRepository<SimulationTask> {
  private static instance: SimulationRepository;
  private constructor(storage: StorageService, userService: UserService) {
    super('simulation-tasks', storage, userService);
  }

  public static getInstance(
    storageService: StorageService = StorageService.getInstance(),
    userService: UserService = UserService.getInstance(storageService)
): SimulationRepository {
    if (!SimulationRepository.instance) {
      SimulationRepository.instance = new SimulationRepository(storageService, userService);
    }
    return SimulationRepository.instance;
}

  /**
   * Add a task to the simulation queue
   */
  async addTask(task: SimulationTask): Promise<SimulationTask> {
    // Check if task already exists for this product
    // const existing = await this.getTaskByProductId(productId);
    // if (existing) {
    //   console.log(`Task already exists for product ${productId}`);
    //   return existing;
    // }
    
    // const now = Date.now();
    // const task: SimulationTask = {
    //   id: `task_${generateUUID()}`,
    //   productId,
    //   type,
    //   currentState: initialState,
    //   nextProcessTime: now + this.getStateDelay(initialState, type),
    //   createdTime: now,
    //   completedSteps: [],
    //   status: 'pending'
    // };
    
    const created = await this.create(task);
    console.log(`Created simulation task for product ${task.productId} with initial state ${task.currentState}`);
    return created;
  }

  /**
   * Get the next task that's ready for processing
   */
  async getNextTaskToProcess(): Promise<SimulationTask | undefined> {
    const now = Date.now();
    const tasks = await this.getAll();
    
    const readyTask = tasks.find(task => 
      (task.status === 'pending' || task.status === 'in_progress') && 
      task.nextProcessTime <= now
    );
    
    if (readyTask) {
      // Mark this task as being worked on
      await this.update(readyTask.id, {
      status: 'in_progress',
      lastProcessedTime: now
      });
    }
    
    return readyTask;
  }

  /**
   * Update a task's state after processing
   */
  async updateTaskState(
    task: SimulationTask, 
    newState: string, 
    isCompleted: boolean = false
  ): Promise<SimulationTask> {
    // Add the current state to completed steps
    const completedSteps = [...task.completedSteps];
    if (!completedSteps.includes(task.currentState)) {
      completedSteps.push(task.currentState);
    }
    
    const now = Date.now();
    const updates: Partial<SimulationTask> = {
      currentState: newState,
      lastProcessedTime: now,
      completedSteps,
      status: isCompleted ? 'completed' : 'pending',
      // TODO: this is dependent on the product type, so it should not be set here
    };
    
    const updated = await this.update(task.id, updates);
    return updated as SimulationTask;
  }

  /**
   * Get task by product ID
   */
  async getTaskByProductId(productId: string): Promise<SimulationTask | undefined> {
    const all = await this.getAll();
    return all.find(task => task.productId === productId);
  }

  /**
   * Stop a simulation task
   */
  async stopTask(productId: string): Promise<boolean> {
    const task = await this.getTaskByProductId(productId);
    if (!task) {
      return false;
    }
    
    await this.update(task.id, { 
      status: 'stopped',
      lastProcessedTime: Date.now() 
    });
    return true;
  }

  /**
   * Get state delay based on state and product type
   */
  public getStateDelay(state: string, type: string): number {
    // A mapping of delays by product type and state
    const delays: Record<string, Record<string, number>> = {
      loan: {
        'pending_approval': 10000, // 10 seconds
        'reviewing': 15000,        // 15 seconds
        'approved': 8000,          // 8 seconds
        'funding': 12000,          // 12 seconds
        'default': 10000           // Default for loan
      },
      account: {
        'pending': 8000,           // 8 seconds
        'processing': 10000,       // 10 seconds
        'default': 9000            // Default for account
      },
      card: {
        'issued': 5000,            // 5 seconds
        'shipping': 15000,         // 15 seconds
        'delivered': 10000,        // 10 seconds
        'default': 8000            // Default for card
      },
      default: {
        default: 10000             // Default for unknown type
      }
    };
    
    // Get delays for the type
    const typeDelays = delays[type] || { default: delays.default };
    
    // Return specific state delay or default for the type
    return typeDelays[state] || typeDelays.default;
  }

  /**
   * Initialize with empty data - no mock data needed
   */
  protected async initializeMockData(): Promise<void> {
    // No mock data needed for simulation tasks
    return;
  }
}

export const simulationRepository = SimulationRepository.getInstance();