export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  module: string;
  elementName: string;
  defaultConfig?: Record<string, unknown>;
}

export class WidgetService {
  private loadedWidgets: Map<string, boolean> = new Map();
  private widgetDefinitions: Map<string, WidgetDefinition> = new Map();
  
  constructor() {
    // Register built-in widgets with paths to the built files
    this.registerWidget({
      id: 'welcome',
      name: 'Welcome Widget',
      description: 'Displays welcome information',
      module: '/src/widgets/welcome/welcome-widget-[hash].js', // This will be updated by htmlUpdaterPlugin
      elementName: 'welcome-widget'
    });
    
    this.registerWidget({
      id: 'dashboard',
      name: 'Dashboard Widget',
      description: 'Shows dashboard information',
      module: '/src/widgets/dashboard/dashboard-widget-[hash].js', // This will be updated by htmlUpdaterPlugin
      elementName: 'dashboard-widget'
    });
    
    this.registerWidget({
      id: 'chart',
      name: 'Chart Widget',
      description: 'Displays analytics charts',
      module: '/src/widgets/chart/chart-widget-[hash].js', // This will be updated by htmlUpdaterPlugin
      elementName: 'chart-widget',
      defaultConfig: {
        type: 'bar',
        showLegend: true
      }
    });
  }
  
  public getAvailableWidgets(): WidgetDefinition[] {
    return Array.from(this.widgetDefinitions.values());
  }
  
  public getWidgetDefinition(id: string): WidgetDefinition | undefined {
    return this.widgetDefinitions.get(id);
  }
  
  public registerWidget(definition: WidgetDefinition): void {
    this.widgetDefinitions.set(definition.id, definition);
  }
  
  public async loadWidget(widgetId: string): Promise<WidgetDefinition | undefined> {
    const definition = this.widgetDefinitions.get(widgetId);
    
    if (!definition) {
      console.error(`Widget with ID "${widgetId}" not found`);
      return undefined;
    }
    
    // If already loaded, return the definition
    if (this.loadedWidgets.get(widgetId)) {
      return definition;
    }
    
    try {
      // Dynamically import the widget module
      await import(definition.module);
      this.loadedWidgets.set(widgetId, true);
      return definition;
    } catch (error) {
      console.error(`Failed to load widget "${widgetId}":`, error);
      return undefined;
    }
  }
}

// Create a singleton instance
export const widgetService = new WidgetService();
