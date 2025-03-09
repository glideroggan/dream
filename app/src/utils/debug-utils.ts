/**
 * Debug utilities for troubleshooting widget layout issues
 */

/**
 * Log the DOM structure of a widget and its parent containers
 * @param widgetId The widget ID to inspect
 */
export function debugWidgetStructure(widgetId: string): void {
  console.group(`Widget Structure Debug: ${widgetId}`);
  try {
    // Try different attribute combinations to find the widget
    const possibleSelectors = [
      `widget-wrapper[widgetId="${widgetId}"]`,
      `widget-wrapper[data-widget-id="${widgetId}"]`,
      `[data-grid-item-id="${widgetId}"]`,
      `[data-widget-id="${widgetId}"]`
    ];
    
    let wrapper = null;
    let usedSelector = '';
    
    // Try each selector until we find a match
    for (const selector of possibleSelectors) {
      const found = document.querySelector(selector);
      if (found) {
        wrapper = found;
        usedSelector = selector;
        console.debug(`Found widget using selector: ${selector}`);
        break;
      }
    }
    
    if (!wrapper) {
      console.warn(`Could not find widget with ID "${widgetId}" using any selector`);
      
      // List all widget-wrappers to help diagnose
      const allWrappers = document.querySelectorAll('widget-wrapper');
      console.debug(`Found ${allWrappers.length} total widget-wrapper elements:`);
      allWrappers.forEach((w, i) => {
        console.debug(`Widget ${i+1}:`, {
          widgetId: w.getAttribute('widgetId'),
          'data-widget-id': w.getAttribute('data-widget-id'),
          'data-grid-item-id': w.getAttribute('data-grid-item-id')
        });
      });
      
      // List all grid items too
      const allGridItems = document.querySelectorAll('[data-grid-item-id]');
      console.debug(`Found ${allGridItems.length} elements with data-grid-item-id:`);
      allGridItems.forEach((item, i) => {
        console.debug(`Grid item ${i+1}:`, item.getAttribute('data-grid-item-id'));
      });
      
      return;
    }
    
    console.debug('Widget wrapper:', wrapper);
    console.debug('Widget wrapper attributes:', getElementAttributes(wrapper));
    
    // Find parent grid item - based on what we found
    let gridItem;
    if (usedSelector.includes('data-grid-item-id')) {
      // The wrapper IS the grid item
      gridItem = wrapper;
    } else {
      // Otherwise look for parent
      gridItem = wrapper.parentElement;
    }
    
    if (gridItem) {
      console.debug('Grid item (widget container):', gridItem);
      console.debug('Grid item attributes:', getElementAttributes(gridItem));
      console.debug('Grid item classes:', Array.from(gridItem.classList));
      
      // Check for data attributes
      console.debug('Grid item data-grid-item-id:', gridItem.getAttribute('data-grid-item-id'));
      
      // Find child widget-wrapper if this is a grid item
      if (usedSelector.includes('data-grid-item-id')) {
        const childWrapper = gridItem.querySelector('widget-wrapper');
        if (childWrapper) {
          console.debug('Child widget-wrapper found inside grid item:', childWrapper);
          console.debug('Child widget-wrapper attributes:', getElementAttributes(childWrapper));
        } else {
          console.warn('No widget-wrapper found inside grid item!');
        }
      }
      
      // Find grid layout
      const gridLayout = gridItem.parentElement;
      if (gridLayout) {
        console.debug('Grid layout:', gridLayout);
        console.debug('Grid layout tagName:', gridLayout.tagName);
      } else {
        console.warn('Grid item has no parent element!');
      }
    } else {
      console.warn('Widget wrapper has no parent element!');
    }
    
    // Compare with a known-working widget (e.g., account widget)
    if (widgetId === 'welcome') {
      console.debug('COMPARISON WITH ACCOUNT WIDGET:');
      // Try all possible selectors for account widget too
      let accountWrapper = null;
      for (const selector of possibleSelectors.map(s => s.replace(widgetId, 'account'))) {
        const found = document.querySelector(selector);
        if (found) {
          accountWrapper = found;
          console.debug(`Found account widget using selector: ${selector}`);
          break;
        }
      }
      
      if (accountWrapper) {
        console.debug('Account wrapper attributes:', getElementAttributes(accountWrapper));
        
        const accountGridItem = accountWrapper.closest('[data-grid-item-id]') || accountWrapper.parentElement;
        if (accountGridItem) {
          console.debug('Account grid item classes:', Array.from(accountGridItem.classList));
          console.debug('Account grid item attributes:', getElementAttributes(accountGridItem));
        }
      } else {
        console.debug('No account widget found for comparison.');
      }
    }
  } catch (error) {
    console.error('Error in debugWidgetStructure:', error);
  }
  console.groupEnd();
}

/**
 * Get all attributes of an element as an object
 */
function getElementAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {};
  Array.from(element.attributes).forEach(attr => {
    attributes[attr.name] = attr.value;
  });
  return attributes;
}

/**
 * Log detailed information about a layout event
 */
export function debugLayoutEvent(eventName: string, widgetId: string, event: CustomEvent): void {
  console.group(`Layout Event Debug: ${eventName} for ${widgetId}`);
  try {
    console.debug('Event detail:', event.detail);
    console.debug('Event bubbles:', event.bubbles);
    console.debug('Event composed:', event.composed);
    console.debug('Event target:', event.target);
    
    // Check if the event is reaching the grid layout
    setTimeout(() => {
      const gridLayout = document.querySelector('grid-layout');
      if (gridLayout) {
        const gridItems = gridLayout.querySelectorAll('[data-grid-item-id]');
        console.debug(`Grid layout has ${gridItems.length} grid items`);
        
        const targetItem = Array.from(gridItems).find(
          item => item.getAttribute('data-grid-item-id') === widgetId
        );
        
        if (targetItem) {
          console.debug('Target grid item classes after event:', Array.from(targetItem.classList));
        } else {
          console.warn(`Could not find grid item for widget ${widgetId} in grid layout`);
        }
      }
    }, 100);
  } catch (error) {
    console.error('Error in debugLayoutEvent:', error);
  }
  console.groupEnd();
}

/**
 * Fix widget structure issues by ensuring proper IDs and data attributes
 */
export function fixWidgetStructure(widgetId: string): boolean {
  try {
    console.group(`Fixing widget structure for ${widgetId}`);
    
    // Try to find the widget wrapper using various selectors
    const possibleWrapperSelectors = [
      `widget-wrapper[widgetId="${widgetId}"]`,
      `widget-wrapper[data-widget-id="${widgetId}"]`
    ];
    
    let wrapper = null;
    for (const selector of possibleWrapperSelectors) {
      const found = document.querySelector(selector);
      if (found) {
        wrapper = found;
        console.debug(`Found wrapper using selector: ${selector}`);
        break;
      }
    }
    
    if (!wrapper) {
      console.warn(`Could not find widget wrapper for ${widgetId}`);
      return false;
    }
    
    // Ensure widgetId is set correctly on the wrapper
    wrapper.setAttribute('widgetId', widgetId);
    
    // Find grid item - either parent of wrapper or the wrapper itself if it's already a grid item
    const wrapperParent = wrapper.parentElement;
    const gridItem = wrapperParent?.hasAttribute('data-grid-item-id') ? wrapperParent : wrapper;
    
    // Ensure data-grid-item-id is set correctly on the grid item
    if (gridItem) {
      gridItem.setAttribute('data-grid-item-id', widgetId);
      gridItem.setAttribute('data-widget-id', widgetId);
      console.debug(`Ensured grid item has proper IDs: ${widgetId}`);
      
      const gridClasses = Array.from(gridItem.classList);
      if (!gridClasses.some(c => c.startsWith('col-span-'))) {
        // If no column span class, add default
        gridItem.classList.add('col-span-8');
        console.debug(`Added default col-span-8 class to grid item`);
      }
      
      if (!gridClasses.some(c => c.startsWith('row-span-'))) {
        // If no row span class, add default
        gridItem.classList.add('row-span-4');
        console.debug(`Added default row-span-4 class to grid item`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error fixing widget structure:', error);
    return false;
  } finally {
    console.groupEnd();
  }
}
