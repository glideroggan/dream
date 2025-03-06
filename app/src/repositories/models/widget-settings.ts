import { WidgetSize } from "../../widgets/widget-registry";

export interface PageWidgetSettings {
  id: string;          // Widget ID
  size: WidgetSize;    // Widget size preference
  order?: number;      // Optional order/position in layout
  config?: any;        // Optional widget-specific configuration
}

export interface WidgetsLayout {
  // Map of page keys to their widget settings
  [pageKey: string]: PageWidgetSettings[];
}
