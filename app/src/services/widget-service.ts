// Widget size options
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  elementName: string;
  defaultConfig?: Record<string, unknown>;
  module: string; // Path to the module containing the widget
}

type WidgetsRegisteredCallback = () => void;

export class WidgetService {
  private static instance: WidgetService;
  private registeredWidgets: Map<string, WidgetDefinition> = new Map();
  private loadedWidgets: Set<string> = new Set();
  private moduleLoadPromises: Map<string, Promise<unknown>> = new Map();
  private observers: WidgetsRegisteredCallback[] = [];
  private areWidgetsRegistered = false;

  // Add error tracking
  private widgetLoadErrors: Map<string, string> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {
    console.debug("WidgetService instance created");
  }

  // Singleton accessor
  public static getInstance(): WidgetService {
    if (!WidgetService.instance) {
      WidgetService.instance = new WidgetService();
    }
    return WidgetService.instance;
  }

  async registerWidget(widget: WidgetDefinition): Promise<void> {
    if (this.registeredWidgets.has(widget.id)) {
      console.warn(`Widget with ID ${widget.id} is already registered. Overwriting.`);
    }

    this.registeredWidgets.set(widget.id, widget);
    console.debug(`Registered widget: ${widget.id}`);
  }

  getAvailableWidgets(): WidgetDefinition[] {
    const widgets = Array.from(this.registeredWidgets.values());
    console.debug(`Available widgets: ${widgets.length}`);
    return widgets;
  }

  getWidget(id: string): WidgetDefinition | undefined {
    const widget = this.registeredWidgets.get(id);
    if (!widget) {
      console.warn(`Widget "${id}" not found in registry`);
    }
    return widget;
  }

  /**
   * Creates a widget element with proper configuration
   * Note: This does NOT load the module - that's handled separately
   */
  async createWidgetElement(id: string, config?: Record<string, unknown>): Promise<HTMLElement | null> {
    console.debug(`Creating widget element: ${id}`);
    const widget = this.getWidget(id);

    if (!widget) {
      console.warn(`Widget with id "${id}" not found`);
      return null;
    }

    // Create element
    const element = document.createElement(widget.elementName);

    // Add ID attribute that matches the widget ID
    element.setAttribute('id', id);

    // Set widget configuration (combine default with provided config)
    const mergedConfig = {
      ...widget.defaultConfig,
      ...config,
      widgetId: id, // Always include widget ID
      widgetName: widget.name // Always include widget name
    };

    // Set the config property if it exists
    if ('config' in element) {
      (element as any).config = mergedConfig;
    }

    // Add data attributes
    element.dataset.widgetId = id;
    element.dataset.widgetName = widget.name;

    return element;
  }

  /**
   * Load a widget module
   * This allows the widget wrapper to request loading when needed
   */
  async loadWidgetModule(widget: WidgetDefinition): Promise<void> {
    const { id, module: modulePath } = widget;
    
    // Skip if already loaded
    if (this.loadedWidgets.has(id)) {
      return;
    }
    
    // If already loading, return the existing promise
    if (this.moduleLoadPromises.has(id)) {
      return this.moduleLoadPromises.get(id) as Promise<void>;
    }
    
    console.debug(`Loading widget module: ${id} from ${modulePath}`);
    
    // Create a promise to track this module load
    const loadPromise = (async () => {
      try {
        // Check if module path exists in importmap
        if (!this.isModuleInImportMap(modulePath)) {
          throw new Error(`Module "${modulePath}" not found in import map. Check your import map configuration.`);
        }

        // Import the module
        await import(/* @vite-ignore */ modulePath);
        console.debug(`Module ${modulePath} loaded successfully`);
        this.loadedWidgets.add(id);
        
        // Clear any existing error
        this.widgetLoadErrors.delete(id);
      } catch (error) {
        console.error(`Failed to load widget ${id} from ${modulePath}:`, error);
        
        // Store the error message
        let errorMessage = 'Unknown error loading widget';
        if (error instanceof Error) {
          errorMessage = error.message;

          // Add specific messaging for common import errors
          if (error.message.includes('Failed to fetch') || 
              error.message.includes('Cannot find module') ||
              error.message.includes('not found in import map')) {
            errorMessage = `Widget module could not be loaded from "${modulePath}". ` +
                          `Check that the module path is correct in your import map.`;
          }
        }
        
        this.widgetLoadErrors.set(id, errorMessage);
        
        // Remove the promise to allow retries
        this.moduleLoadPromises.delete(id);
        
        // Re-throw the error
        throw error;
      }
    })();
    
    this.moduleLoadPromises.set(id, loadPromise);
    
    try {
      await loadPromise;
    } catch (error) {
      // Error is logged and stored above, we need to re-throw here
      // so the widget wrapper can handle it
      throw error;
    }
  }

  /**
   * Check if a module path exists in the import map
   */
  private isModuleInImportMap(modulePath: string): boolean {
    // Check if there's a document we can access (for SSR safety)
    if (typeof document === 'undefined') return true;

    // Get all script tags that might contain import maps
    const scriptTags = document.querySelectorAll('script[type="importmap"]');
    
    // If no import maps are found, assume the module is available
    if (scriptTags.length === 0) return true;
    
    // Process each import map
    for (let i = 0; i < scriptTags.length; i++) {
      try {
        const importMapText = scriptTags[i].textContent;
        if (!importMapText) continue;
        
        const importMap = JSON.parse(importMapText);
        if (!importMap.imports) continue;
        
        // Check if the module path is in the import map
        if (modulePath.startsWith('@')) {
          // For bare specifiers like "@widgets/account"
          if (modulePath in importMap.imports) {
            return true;
          }
        } else {
          // For relative or absolute paths, check if they exist as values
          const importValues = Object.values(importMap.imports) as string[];
          if (importValues.includes(modulePath)) {
            return true;
          }
        }
      } catch (e) {
        console.warn('Error parsing import map:', e);
      }
    }
    
    // Module path not found in any import map
    return false;
  }

  /**
   * Check if a widget had a loading error
   */
  hasLoadError(id: string): boolean {
    return this.widgetLoadErrors.has(id);
  }

  /**
   * Get error message for a widget
   */
  getLoadErrorMessage(id: string): string | undefined {
    return this.widgetLoadErrors.get(id);
  }

  /**
   * Clear load error for retry
   */
  clearLoadError(id: string): void {
    this.widgetLoadErrors.delete(id);
    
    // Also clear loaded status to force a reload
    this.loadedWidgets.delete(id);

    // Clear any existing module load promise
    this.moduleLoadPromises.delete(id);
  }

  /**
   * Check if a widget is loaded
   */
  isWidgetLoaded(id: string): boolean {
    return this.loadedWidgets.has(id);
  }

  /**
   * Preload a widget module
   */
  async preloadWidget(id: string): Promise<boolean> {
    const widget = this.getWidget(id);
    if (!widget) {
      return false;
    }

    try {
      await this.loadWidgetModule(widget);
      return true;
    } catch (error) {
      return false;
    }
  }

  async loadWidgets(ids: string[]): Promise<WidgetDefinition[]> {
    console.debug(`Getting widget definitions for: ${ids.join(', ')}`);

    // Only get the widget definitions, don't actually load the modules yet
    const results: WidgetDefinition[] = [];

    for (const id of ids) {
      const widgetDef = this.getWidget(id);
      if (widgetDef) {
        results.push(widgetDef);
      }
    }

    console.debug(`Found ${results.length} widget definitions out of ${ids.length} requested`);
    return results;
  }

  getRegisteredWidgets(): string[] {
    return Array.from(this.registeredWidgets.keys());
  }

  // Observer pattern methods
  onWidgetsRegistered(callback: WidgetsRegisteredCallback): void {
    if (this.areWidgetsRegistered) {
      // If widgets are already registered, call the callback immediately
      setTimeout(() => callback(), 0);
    } else {
      // Otherwise, add to observers list
      this.observers.push(callback);
    }
  }

  emitWidgetsRegistered(): void {
    this.areWidgetsRegistered = true;
    console.debug(`Notifying ${this.observers.length} observers that widgets are registered`);
    this.observers.forEach(callback => callback());
    this.observers = []; // Clear the observers list after notifying them
  }

  areAllWidgetsRegistered(): boolean {
    return this.areWidgetsRegistered;
  }
}

export const widgetService = WidgetService.getInstance();
console.debug("WidgetService loaded, ", widgetService);

