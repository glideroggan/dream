// import { repositoryService } from '../services/repository-service';
// import { PageWidgetSettings } from '../repositories/models/widget-settings';

// export class WidgetStorageService {
//   private static instance: WidgetStorageService;
//   private settingsRepository = repositoryService.getSettingsRepository();
  
//   private constructor() {}
  
//   public static getInstance(): WidgetStorageService {
//     if (!WidgetStorageService.instance) {
//       WidgetStorageService.instance = new WidgetStorageService();
//     }
//     return WidgetStorageService.instance;
//   }
  
//   /**
//    * Save the preferred size of a widget for a specific page
//    */
//   async saveWidgetSize(pageKey: string, widgetId: string, size: WidgetSize): Promise<void> {
//     await this.settingsRepository.updateWidgetSize(pageKey, widgetId, size);
//   }
  
//   /**
//    * Get the preferred size of a widget for a specific page
//    */
//   async getWidgetSize(pageKey: string, widgetId: string, defaultSize: WidgetSize): Promise<WidgetSize> {
//     return await this.settingsRepository.getWidgetSize(pageKey, widgetId, defaultSize);
//   }
  
//   /**
//    * Get all widget settings for a page
//    */
//   async getPageWidgetSettings(pageKey: string): Promise<PageWidgetSettings[]> {
//     return await this.settingsRepository.getPageWidgetSettings(pageKey);
//   }
  
//   /**
//    * Save the complete widget layout for a page
//    */
//   async savePageWidgetLayout(pageKey: string, pageWidgets: PageWidgetSettings[]): Promise<void> {
//     await this.settingsRepository.savePageWidgetLayout(pageKey, pageWidgets);
//   }
// }

// export const widgetStorageService = WidgetStorageService.getInstance();
