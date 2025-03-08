/**
 * Service for dynamically loading modules
 */
export class ModuleLoaderService {
  private static instance: ModuleLoaderService;
  private loadedModules: Set<string> = new Set();
  private moduleLoadPromises: Map<string, Promise<unknown>> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {
    console.debug("ModuleLoaderService instance created");
  }
  
  // Singleton accessor
  public static getInstance(): ModuleLoaderService {
    if (!ModuleLoaderService.instance) {
      ModuleLoaderService.instance = new ModuleLoaderService();
    }
    return ModuleLoaderService.instance;
  }
  
  /**
   * Dynamically loads a module by path
   * 
   * @param modulePath - Path to the module to load
   * @param moduleId - Optional identifier for the module (defaults to path)
   * @returns Promise that resolves when the module is loaded
   */
  async loadModule(modulePath: string, moduleId?: string): Promise<void> {
    const id = moduleId || modulePath;
    
    if (this.isModuleLoaded(id)) {
      console.debug(`Module ${id} already loaded, skipping import`);
      return;
    }
    
    if (!this.moduleLoadPromises.has(id)) {
      console.debug(`Importing module: ${id} (${modulePath})`);
      
      // Create a promise to track this module load
      const loadPromise = (async () => {
        try {
          // Small delay to avoid blocking the main thread
          await new Promise(resolve => setTimeout(resolve, 10)); 
          await import(/* @vite-ignore */ modulePath);
          console.debug(`Successfully loaded module: ${id}`);
          this.loadedModules.add(id);
        } catch (error) {
          console.error(`Failed to load module ${id}:`, error);
          // Remove the promise to allow retries
          this.moduleLoadPromises.delete(id);
          throw error;
        }
      })();
      
      this.moduleLoadPromises.set(id, loadPromise);
    }
    
    // Wait for the module to load
    try {
      await this.moduleLoadPromises.get(id);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Checks if a module has been loaded
   * 
   * @param moduleId - Identifier of the module to check
   * @returns true if the module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }
  
  /**
   * Loads multiple modules
   * 
   * @param modules - Array of module paths or objects with id and path
   * @returns Promise that resolves when all modules are loaded
   */
  async loadModules(modules: Array<string | { id: string, path: string }>): Promise<void> {
    const promises = modules.map(module => {
      if (typeof module === 'string') {
        return this.loadModule(module);
      } else {
        return this.loadModule(module.path, module.id);
      }
    });
    
    await Promise.all(promises);
  }
}

export const moduleLoaderService = ModuleLoaderService.getInstance();
