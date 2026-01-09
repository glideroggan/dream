export interface PageWidgetSettings {
  id: string;          // Widget ID
  colSpan: number;    // Number of columns this widget spans
  rowSpan: number;    // Number of rows this widget spans
  order?: number;     // Optional order/position in layout (legacy)
  gridCol?: number;   // 1-based column start position (V2)
  gridRow?: number;   // 1-based row start position (V2)
  config?: any;       // Optional widget-specific configuration
}

export interface WidgetsLayout {
  // Map of page keys to their widget settings
  [pageKey: string]: PageWidgetSettings[];
}
