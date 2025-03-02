import { getWidgetPreferredSize, getWidgetMinWidth } from '../widgets/widget-registry';
import { WidgetDefinition, widgetService } from '../services/widget-service';

/**
 * Options for creating a widget element
 */
export interface WidgetOptions {
  // Required properties
  widgetId: string;
  
  // Optional properties with defaults
  initialState?: 'loading' | 'loaded' | 'error' | 'timeout-warning';
  errorMessage?: string;
  warningTimeout?: number;
  failureTimeout?: number;
  
  // Additional class names
  additionalClasses?: string[];
  
  // Additional attributes
  additionalAttributes?: Record<string, string>;
  
  // Whether to add size class automatically based on widget registry
  autoAddSizeClass?: boolean;
}

/**
 * Default option values
 */
const DEFAULT_OPTIONS: Partial<WidgetOptions> = {
  initialState: 'loading',
  warningTimeout: 5000,
  failureTimeout: 10000,
  autoAddSizeClass: true,
  additionalClasses: [],
  additionalAttributes: {}
};

/**
 * Creates a widget wrapper element with standardized attributes
 * 
 * @param options Widget options
 * @returns The created widget wrapper element
 */
export function createWidgetWrapper(options: WidgetOptions): HTMLElement {
  // Merge with default options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create the wrapper element
  const wrapperElement = document.createElement('widget-wrapper') as HTMLElement;
  
  // Set standard attributes - use camelCase to match the @attr decoration in the component
  wrapperElement.setAttribute('widgetId', opts.widgetId);
  wrapperElement.setAttribute('state', opts.initialState || 'loading');
  
  if (opts.warningTimeout !== undefined) {
    wrapperElement.setAttribute('warningTimeout', opts.warningTimeout.toString());
  }
  
  if (opts.failureTimeout !== undefined) {
    wrapperElement.setAttribute('failureTimeout', opts.failureTimeout.toString());
  }
  
  if (opts.errorMessage) {
    wrapperElement.setAttribute('errorMessage', opts.errorMessage);
  }
  
  // Add data attribute for easier selection (this is a data attribute, so kebab-case is appropriate)
  wrapperElement.setAttribute('data-widget-id', opts.widgetId);
  
  // Add size class if requested
  if (opts.autoAddSizeClass) {
    const preferredSize = getWidgetPreferredSize(opts.widgetId);
    const size = preferredSize || 'md';
    wrapperElement.classList.add(`widget-${size}`);
  }
  
  // Add min-width information as a data attribute
  const minWidth = getWidgetMinWidth(opts.widgetId);
  wrapperElement.setAttribute('data-min-width', minWidth.toString());
  
  // Add any additional classes
  if (opts.additionalClasses && opts.additionalClasses.length > 0) {
    wrapperElement.classList.add(...opts.additionalClasses);
  }
  
  // Add any additional attributes
  if (opts.additionalAttributes) {
    Object.entries(opts.additionalAttributes).forEach(([key, value]) => {
      wrapperElement.setAttribute(key, value);
    });
  }
  
  return wrapperElement;
}

/**
 * Creates a widget element based on its definition
 * 
 * @param widget Widget definition
 * @returns The created widget element
 */
export async function createWidgetElement(widget: WidgetDefinition): Promise<HTMLElement | null> {
  // Use the service to create the element
  return widgetService.createWidgetElement(widget.id);
}

/**
 * Creates a complete widget with wrapper and element
 * 
 * @param widget Widget definition
 * @param options Widget options
 * @returns The created widget wrapper containing the widget element
 */
export async function createCompleteWidget(
  widget: WidgetDefinition, 
  options?: Partial<WidgetOptions>
): Promise<HTMLElement> {
  // Create options with widget ID from definition
  const mergedOptions: WidgetOptions = {
    widgetId: widget.id,
    ...(options || {})
  };
  
  // Create wrapper
  const wrapper = createWidgetWrapper(mergedOptions);
  
  // Create and add widget element
  const element = await createWidgetElement(widget);
  if (element) {
    wrapper.appendChild(element);
  }
  
  return wrapper;
}
