import { getSingletonManager } from './singleton-manager';
import { getWidgetById } from '../widgets/widget-registry';

// Widget size options
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  elementName: string;
  defaultConfig?: Record<string, unknown>;
  module: string; // Path to the module containing the widget
  preferredSize?: WidgetSize; // Added size preference
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
  private loadTimeouts: Map<string, number> = new Map();
  private readonly loadTimeout = 15000; // 15 seconds timeout for widget load

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

  public async signal(): Promise<void> {
    // Implementation omitted
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

  async loadWidget(id: string, config?: Record<string, unknown>): Promise<HTMLElement | null> {
    console.debug(`Attempting to load widget: ${id}`);
    const widget = this.getWidget(id);
    
    if (!widget) {
      console.warn(`Widget with id "${id}" not found`);
      return null;
    }

    if (!this.loadedWidgets.has(id)) {
      if (!this.moduleLoadPromises.has(id)) {
        console.debug(`Importing module for widget ${id}: ${widget.module}`);
        
        // Clear any previous error for this widget
        this.widgetLoadErrors.delete(id);
        
        // Create a promise to track this module load with timeout
        const loadPromise = (async () => {
            // Set up timeout for widget load
            const timeoutId = window.setTimeout(() => {
              this.widgetLoadErrors.set(id, `Widget ${id} load timed out after ${this.loadTimeout/1000} seconds`);
              console.error(`Widget load timeout: ${id}`);
              // Reject the promise if it's still pending
              if (this.moduleLoadPromises.has(id)) {
                this.moduleLoadPromises.delete(id);
              }
            }, this.loadTimeout);
            
            this.loadTimeouts.set(id, timeoutId);
            
            // Handle module path
            const modulePath = widget.module;
            console.debug(`Loading widget module from: ${modulePath}`);
            
            try {
              await import(/* @vite-ignore */ modulePath);
              console.debug(`Module ${modulePath} loaded successfully`);
            }  catch (error) {
            console.error(`Failed to load widget ${id}:`, error);
            
            // Clear timeout if we got an error
            if (this.loadTimeouts.has(id)) {
              window.clearTimeout(this.loadTimeouts.get(id));
              this.loadTimeouts.delete(id);
            }
            
            // Store the error message
            this.widgetLoadErrors.set(id, error instanceof Error ? error.message : `Failed to load widget ${id}`);
            
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
        return null;
      }
    } else {
      console.debug(`Widget ${id} already loaded, skipping import`);
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
    
    // Also clear any timeout
    if (this.loadTimeouts.has(id)) {
      window.clearTimeout(this.loadTimeouts.get(id));
      this.loadTimeouts.delete(id);
    }
  }

  async loadWidgets(ids: string[]): Promise<WidgetDefinition[]> {
    console.debug(`Loading multiple widgets: ${ids.join(', ')}`);
    
    // This was the problematic code - loadWidget returns HTMLElement | null, not WidgetDefinition
    // const promises = ids.map(id => this.loadWidget(id));
    // const widgets = await Promise.all(promises);
    // const filteredWidgets = widgets.filter((widget): widget is WidgetDefinition => widget !== undefined);

    // Fixed implementation:
    const results: WidgetDefinition[] = [];
    
    for (const id of ids) {
      const widgetDef = this.getWidget(id);
      if (widgetDef) {
        try {
          // Attempt to load the widget's module
          const element = await this.loadWidget(id);
          if (element) {
            // If successful, add the definition to results
            results.push(widgetDef);
          }
        } catch (error) {
          console.error(`Failed to load widget ${id}:`, error);
          // Failed widgets are not added to results
        }
      }
    }

    console.debug(`Successfully loaded ${results.length} out of ${ids.length} widgets`);
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

