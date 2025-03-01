import { RepositoryService } from './repository-service';

interface SingletonManagerInterface {
  instances: Map<string, unknown>;
  register<T>(key: string, instance: T): T;
  get<T>(key: string): T | undefined;
  getOrCreate<T>(key: string, factory: () => T): T;
}

// Define interface for singleton types
export interface SingletonTypes {
  'WidgetService': any; // Replace with actual widget service type when available
  'WorkflowService': any; // Replace with actual workflow service type when available
  'RepositoryService': RepositoryService; 
}

// Extend the Window interface to include our singleton manager
declare global {
  interface Window {
    singletonManager?: SingletonManagerInterface;
  }
}

// Initialize the singleton manager if it doesn't exist
export function initSingletonManager(): void {
  if (!window.singletonManager) {
    window.singletonManager = {
      instances: new Map<string, unknown>(),
      
      register<T>(key: string, instance: T): T {
        this.instances.set(key, instance);
        return instance;
      },
      
      get<T>(key: string): T | undefined {
        return this.instances.get(key) as T | undefined;
      },
      
      getOrCreate<T>(key: string, factory: () => T): T {
        if (!this.instances.has(key)) {
          this.instances.set(key, factory());
        }
        return this.instances.get(key) as T;
      }
    };
    
    console.log("SingletonManager initialized on window object");
  }
}

// Export a function to access the singleton manager
export function getSingletonManager(): SingletonManagerInterface {
  return window.singletonManager!;
}

initSingletonManager();
