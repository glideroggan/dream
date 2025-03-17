import { UserService } from '../services/user-service';
import { StorageService } from '../services/storage-service';
import { LocalStorageRepository } from './base-repository';
import { generateUUID } from '../utilities/id-generator';
import { SupportedTaskType } from '../services/simulation/simulation-service';

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
  type: SupportedTaskType;          // 'loan', 'account', etc.
  currentState: string;  // Current state of the simulation
  nextProcessTime: number; // When to process next
  createdTime: number;
  lastProcessedTime?: number;
  completedSteps: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'stopped';
  metadata?: Record<string, any>;
}

/**
 * Repository to manage simulation tasks
 */
export class SimulationRepository extends LocalStorageRepository<SimulationTask> {
  private static instance: SimulationRepository;
  private constructor(storage: StorageService, userService: UserService) {
    super('simulation-tasks', storage, userService);
    console.log('Simulation repository initialized');
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

    this.sanitycheck()
    
    return readyTask;
  }

  async sanitycheck() {
    console.debug('implement sanity check')
    // TODO: add a sanity check for tasks that are stuck in 'in_progress' state
    // and have not been updated for a long time
    // if the lastProcessedTime is more than 5 minutes ago, mark the task as 'pending'
  }

  /**
   * Update a task's state after processing
   */
  async updateTaskState(
    task: SimulationTask, 
    newState: string, 
    isCompleted: boolean = false
  ): Promise<SimulationTask> {
    console.log(`Updating task ${task.id} state from ${task.currentState} to ${newState}`);
    // Add the current state to completed steps
    const completedSteps = [...task.completedSteps];
    if (!completedSteps.includes(task.currentState)) {
      completedSteps.push(task.currentState);
    }
    
    const now = Date.now();
    const updates: Partial<SimulationTask> = {
      nextProcessTime: task.nextProcessTime,
      currentState: newState,
      lastProcessedTime: now,
      completedSteps,
      status: isCompleted ? 'completed' : 'pending',
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