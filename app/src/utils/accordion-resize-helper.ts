// /**
//  * Helper utilities for accordion-style components to trigger proper widget resizing
//  */

// /**
//  * Find the parent BaseWidget component
//  */
// function findParentWidget(element: HTMLElement): any {
//   // Navigate up the DOM to find the containing widget
//   let parent = element.parentElement;
  
//   while (parent) {
//     // If parent has a recalculateSize method, it's a BaseWidget
//     if (parent.recalculateSize && typeof parent.recalculateSize === 'function') {
//       return parent;
//     }
    
//     // Check if it's a custom element that derives from BaseWidget
//     if (parent.tagName && parent.tagName.includes('-')) {
//       if (typeof (parent as any).recalculateSize === 'function') {
//         return parent;
//       }
//     }
    
//     parent = parent.parentElement;
//   }
  
//   return null;
// }

// /**
//  * Call after expanding accordion content to allow widget to grow if needed
//  */
// export function notifyAccordionExpanded(accordionElement: HTMLElement): void {
//   const widget = findParentWidget(accordionElement);
  
//   if (widget) {
//     // Give time for expansion animation to complete
//     setTimeout(() => {
//       if (typeof widget.updateContentLayout === 'function') {
//         widget.updateContentLayout();
//         console.debug('Notified widget of accordion expansion');
//       }
//     }, 300);
//   }
// }

// /**
//  * Call after collapsing accordion content to allow widget to shrink if needed
//  */
// export function notifyAccordionCollapsed(accordionElement: HTMLElement): void {
//   const widget = findParentWidget(accordionElement);
  
//   if (widget) {
//     // Give time for collapse animation to complete
//     setTimeout(() => {
//       if (typeof widget.recalculateSize === 'function') {
//         widget.recalculateSize();
//         console.debug('Notified widget of accordion collapse');
//       }
//     }, 300);
//   }
// }

// /**
//  * Generic handler to attach to accordion toggle elements
//  */
// export function setupAccordionResizeHandler(accordionElement: HTMLElement, toggleSelector: string = '.accordion-toggle'): void {
//   const toggles = accordionElement.querySelectorAll(toggleSelector);
  
//   toggles.forEach(toggle => {
//     toggle.addEventListener('click', (e) => {
//       const isExpanded = accordionElement.classList.contains('expanded');
      
//       if (isExpanded) {
//         // Accordion is being collapsed
//         notifyAccordionCollapsed(accordionElement);
//       } else {
//         // Accordion is being expanded
//         notifyAccordionExpanded(accordionElement);
//       }
//     });
//   });
  
//   console.debug(`Setup resize handlers for ${toggles.length} accordion toggles`);
// }
