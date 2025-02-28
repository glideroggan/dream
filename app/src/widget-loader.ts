declare global {
  interface Window {
    WIDGET_MAP: Record<string, string>;
  }
}

/**
 * Dynamically loads a widget module by its type
 * @param widgetType The widget type (e.g., 'welcome', 'dashboard', etc.)
 * @returns A promise that resolves to the widget module
 */
export async function loadWidget(widgetType: string): Promise<any> {
  if (!window.WIDGET_MAP) {
    console.error('Widget map not loaded. Make sure widget-map.js is included before calling loadWidget');
    return null;
  }

  const widgetPath = window.WIDGET_MAP[widgetType];
  if (!widgetPath) {
    console.error(`Widget type '${widgetType}' not found in widget map`);
    return null;
  }

  try {
    // Dynamically import the widget using the hash-mapped path
    return await import(/* @vite-ignore */ widgetPath);
  } catch (error) {
    console.error(`Failed to load widget '${widgetType}'`, error);
    return null;
  }
}
