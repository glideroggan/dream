interface SingletonManagerInterface {
  instances: Map<string, unknown>;
  register<T>(key: string, instance: T): T;
  get<T>(key: string): T | undefined;
  getOrCreate<T>(key: string, factory: () => T): T;
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
