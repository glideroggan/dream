import { getSingletonManager } from './singleton-manager';

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
  private registeredWidgets: Map<string, WidgetDefinition> = new Map();
  private loadedWidgets: Set<string> = new Set();
  private moduleLoadPromises: Map<string, Promise<unknown>> = new Map();
  private observers: WidgetsRegisteredCallback[] = [];
  private areWidgetsRegistered = false;

  // Private constructor for singleton pattern
  private constructor() {
    console.log("WidgetService instance created");
  }

  // Singleton accessor
  public static getInstance(): WidgetService {
    const singletonManager = getSingletonManager();
    return singletonManager.getOrCreate<WidgetService>('WidgetService', () => new WidgetService());
  }

  public async signal(): Promise<void> {

  }

  async registerWidget(widget: WidgetDefinition): Promise<void> {
    console.log(`Registering widget: ${widget.id} (${widget.name})`);
    this.registeredWidgets.set(widget.id, widget);
    this.emitWidgetsRegistered();
  }

  getAvailableWidgets(): WidgetDefinition[] {
    const widgets = Array.from(this.registeredWidgets.values());
    console.log(`Available widgets: ${widgets.length}`);
    return widgets;
  }

  getWidget(id: string): WidgetDefinition | undefined {
    const widget = this.registeredWidgets.get(id);
    if (!widget) {
      console.warn(`Widget "${id}" not found in registry`);
    }
    return widget;
  }

  async loadWidget(id: string): Promise<WidgetDefinition | undefined> {
    console.log(`Attempting to load widget: ${id}`);
    const widget = this.getWidget(id);
    
    if (!widget) {
      console.warn(`Widget with id "${id}" not found`);
      return undefined;
    }

    if (!this.loadedWidgets.has(id)) {
      if (!this.moduleLoadPromises.has(id)) {
        console.log(`Importing module for widget ${id}: ${widget.module}`);
        
        // Create a promise to track this module load
        const loadPromise = (async () => {
          try {
            // Small delay to avoid blocking the main thread
            await new Promise(resolve => setTimeout(resolve, 10)); 
            await import(/* @vite-ignore */ widget.module);
            console.log(`Successfully loaded widget module: ${id}`);
            this.loadedWidgets.add(id);
          } catch (error) {
            console.error(`Failed to load widget ${id}:`, error);
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
        return undefined;
      }
    } else {
      console.log(`Widget ${id} already loaded, skipping import`);
    }

    return widget;
  }

  async loadWidgets(ids: string[]): Promise<WidgetDefinition[]> {
    console.log(`Loading multiple widgets: ${ids.join(', ')}`);
    const promises = ids.map(id => this.loadWidget(id));
    const widgets = await Promise.all(promises);
    const filteredWidgets = widgets.filter((widget): widget is WidgetDefinition => widget !== undefined);
    console.log(`Successfully loaded ${filteredWidgets.length} out of ${ids.length} widgets`);
    return filteredWidgets;
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
    console.log(`Notifying ${this.observers.length} observers that widgets are registered`);
    this.observers.forEach(callback => callback());
    this.observers = []; // Clear the observers list after notifying them
  }

  areAllWidgetsRegistered(): boolean {
    return this.areWidgetsRegistered;
  }
}

export const widgetService = WidgetService.getInstance();
console.log("WidgetService loaded, ", widgetService);

