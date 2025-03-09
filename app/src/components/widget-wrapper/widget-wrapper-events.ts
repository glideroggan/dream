/**
 * Creates custom events for the widget wrapper
 */
export function createWidgetEvents(widgetId: string, pageType: string = '') {
  // Event for retry requests
  const retryEvent = new CustomEvent('retry-widget', {
    bubbles: true,
    composed: true,
    detail: { widgetId }
  });

  // Event for dismiss requests
  const dismissEvent = new CustomEvent('dismiss-widget', {
    bubbles: true,
    composed: true,
    detail: { widgetId }
  });

  // Event for cancel requests
  const cancelEvent = new CustomEvent('cancel-widget-load', {
    bubbles: true,
    composed: true,
    detail: { widgetId }
  });

  // Event for notifying when the wrapper is connected
  const connectedToDomEvent = new CustomEvent('connected-to-dom', {
    bubbles: true,
    composed: false,
    detail: { widgetId }
  });

  // Event for close requests
  const closeEvent = new CustomEvent('close-widget', {
    bubbles: true,
    composed: true,
    detail: { widgetId, pageType }
  });

  return {
    retryEvent,
    dismissEvent,
    cancelEvent,
    connectedToDomEvent,
    closeEvent,
    
    // Update event details with current widget ID and page type
    updateEventDetails(newWidgetId: string, newPageType: string = '') {
      retryEvent.detail.widgetId = newWidgetId;
      dismissEvent.detail.widgetId = newWidgetId;
      cancelEvent.detail.widgetId = newWidgetId;
      connectedToDomEvent.detail.widgetId = newWidgetId;
      closeEvent.detail.widgetId = newWidgetId;
      
      if (newPageType) {
        closeEvent.detail.pageType = newPageType;
      }
    }
  };
}



/**
 * Create bound event handlers to ensure proper 'this' context
 * Modified to accept explicit handlers which allows more flexibility
 */
export function createBoundEventHandlers(component: any, handlers?: any) {
  return {
    // Default implementation binds to component methods if handlers not provided
    handleChildError: (handlers?.handleChildError || component.handleChildError).bind(component),
    handleInitialized: (handlers?.handleInitialized || component.handleInitialized).bind(component),
    handleModuleError: (handlers?.handleModuleError || component.handleModuleError).bind(component)
  };
}
