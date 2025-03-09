import { repositoryService } from "../../services/repository-service";

/**
 * Widget settings management functionality
 * Extracted from widget-wrapper.ts to make the code more manageable
 */
export class WidgetSettingsManager {
  constructor(private component: any) {}

  /**
   * Load widget dimensions from user settings
   */
  async loadDimensionsFromSettings(): Promise<void> {
    if (!this.component.widgetId || !this.component.pageType) return;
    
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      const dimensions = await settingsRepo.getWidgetGridDimensions(this.component.pageType, this.component.widgetId);
      console.debug(`Loaded dimensions for ${this.component.widgetId} from settings: ${dimensions.colSpan}x${dimensions.rowSpan}`);
      
      // Apply dimensions from settings
      if (dimensions.colSpan && dimensions.colSpan > 0) {
        this.component.colSpan = dimensions.colSpan;
      }
      
      if (dimensions.rowSpan && dimensions.rowSpan > 0) {
        this.component.rowSpan = dimensions.rowSpan;
      }
    } catch (error) {
      console.warn(`Failed to load dimensions from settings for widget ${this.component.widgetId}:`, error);
      
      // Fall back to widget registry values
      if (!this.component.hasAttribute('colSpan')) {
        this.component.colSpan = this.component.getWidgetColumnSpanFromRegistry();
      }
      
      if (!this.component.hasAttribute('rowSpan')) {
        this.component.rowSpan = this.component.getWidgetRowSpanFromRegistry();
      }
    }
  }

  /**
   * Save widget dimensions to user settings
   */
  async saveDimensionsToSettings(colSpan: number, rowSpan: number): Promise<void> {
    if (!this.component.saveDimensions || !this.component.widgetId || !this.component.pageType) return;
    
    try {
      const settingsRepo = repositoryService.getSettingsRepository();
      await settingsRepo.updateWidgetGridDimensions(
        this.component.pageType, 
        this.component.widgetId, 
        colSpan, 
        rowSpan
      );
      
      console.debug(`Saved dimensions for ${this.component.widgetId} to settings: ${colSpan}x${rowSpan}`);
    } catch (error) {
      console.warn(`Failed to save dimensions to settings for widget ${this.component.widgetId}:`, error);
    }
  }
}
