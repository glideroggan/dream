import { repositoryService } from "../../services/repository-service";

/**
 * Widget settings management functionality
 * Extracted from widget-wrapper.ts to make the code more manageable
 */
export class WidgetSettingsManager {
  // Reference to the settings repository
  private settingsRepository = repositoryService.getSettingsRepository();

  constructor(private component: any) {}

  /**
   * Load widget dimensions from settings
   */
  async loadDimensionsFromSettings(): Promise<void> {
    // Skip if no page type or widget ID
    if (!this.component.pageType || !this.component.widgetId) {
      return;
    }

    try {
      // Get dimensions from settings repository
      const dimensions = await this.settingsRepository.getWidgetGridDimensions(
        this.component.pageType,
        this.component.widgetId,
        this.component.colSpan,  // Default to current colSpan if not in settings
        this.component.rowSpan   // Default to current rowSpan if not in settings
      );

      // Update component dimensions
      if (dimensions) {
        console.debug(`Widget ${this.component.widgetId} loaded dimensions from settings: ${dimensions.colSpan}x${dimensions.rowSpan}`);
        
        // Update spans if they're different from current
        if (dimensions.colSpan !== this.component.colSpan || dimensions.rowSpan !== this.component.rowSpan) {
          this.component.colSpan = dimensions.colSpan;
          this.component.rowSpan = dimensions.rowSpan;

          // Update attributes to ensure consistency
          this.component.setAttribute('colSpan', dimensions.colSpan.toString());
          this.component.setAttribute('rowSpan', dimensions.rowSpan.toString());
        }
      } else {
        console.debug(`No saved dimensions found for widget ${this.component.widgetId}`);
      }
    } catch (error) {
      console.warn(`Error loading dimensions for widget ${this.component.widgetId}:`, error);
    }
  }

  /**
   * Save widget dimensions to settings
   */
  async saveDimensionsToSettings(colSpan: number, rowSpan: number): Promise<void> {
    // Skip if no page type or widget ID
    if (!this.component.pageType || !this.component.widgetId) {
      console.debug(`Cannot save dimensions - missing pageType or widgetId`);
      return;
    }

    try {
      console.debug(`Saving dimensions for widget ${this.component.widgetId}: ${colSpan}x${rowSpan}`);
      
      // Save to settings repository
      await this.settingsRepository.updateWidgetGridDimensions(
        this.component.pageType,
        this.component.widgetId,
        colSpan,
        rowSpan
      );
    } catch (error) {
      console.error(`Error saving dimensions for widget ${this.component.widgetId}:`, error);
    }
  }
}
