// import { FASTElement, customElement, html, css, attr, observable } from '@microsoft/fast-element';
// import { WidgetService } from '../services/widget-service';
// import { getWidgetById } from '../widgets/widget-registry';

// const template = html<WidgetLoader>/*html*/`
//   <widget-wrapper 
//     widgetId="${x => x.widgetId}" 
//     state="${x => x.state}" 
//     warningTimeout="${x => x.warningTimeout}"
//     failureTimeout="${x => x.failureTimeout}"
//     id="wrapper-${x => x.widgetId}"
//     class="widget-wrapper">
    
//     <div id="widget-container-${x => x.widgetId}" class="widget-container"></div>
//   </widget-wrapper>
// `;

// const styles = css`
//   :host {
//     display: block;
//     width: 100%;
//     height: 100%;
//   }
  
//   .widget-wrapper {
//     width: 100%;
//     height: 100%;
//   }
  
//   .widget-container {
//     width: 100%;
//     height: 100%;
//   }
// `;

// @customElement({
//   name: 'widget-loader',
//   template,
//   styles
// })
// export class WidgetLoader extends FASTElement {
//   @attr widgetId: string = '';
//   @observable state: 'loading' | 'loaded' | 'error' | 'timeout-warning' = 'loading';
//   @observable elementInstance: HTMLElement | null = null;
  
//   // Timeouts
//   @attr({ mode: "fromView" }) warningTimeout: number = 5000;
//   @attr({ mode: "fromView" }) failureTimeout: number = 10000;
  
//   // Services
//   private widgetService: WidgetService;
  
//   constructor() {
//     super();
//     this.widgetService = WidgetService.getInstance();
//   }
  
//   connectedCallback() {
//     super.connectedCallback();
    
//     // Load and render widget
//     this.loadWidget();
    
//     // Listen for events
//     this.addEventListener('retry-widget', this.handleRetry.bind(this));
//   }
  
//   disconnectedCallback() {
//     super.disconnectedCallback();
//     this.removeEventListener('retry-widget', this.handleRetry.bind(this));
//   }
  
//   /**
//    * Load the widget dynamically
//    */
//   private async loadWidget() {
//     try {
//       const widgetDef = getWidgetById(this.widgetId);
//       const widgetName = widgetDef?.name || this.widgetId;
      
//       console.debug(`Loading widget: ${this.widgetId} (${widgetName})`);
      
//       // Set initial state
//       this.state = 'loading';
      
//       // Get container element
//       const container = this.shadowRoot?.querySelector(`#widget-container-${this.widgetId}`);
//       if (!container) {
//         throw new Error(`Container not found for widget ${this.widgetId}`);
//       }
      
//       // Load the widget using the widget service
//       const element = await this.widgetService.loadWidget(this.widgetId);
      
//       if (!element) {
//         throw new Error(`Failed to load widget: ${this.widgetId}`);
//       }
      
//       // Clear container
//       container.innerHTML = '';
      
//       // Append the element to the container
//       container.appendChild(element);
//       this.elementInstance = element;
      
//       // Widget wrapper will handle state change to loaded when the widget emits 'initialized'
      
//       console.debug(`Widget ${this.widgetId} (${widgetName}) loaded successfully`);
//     } catch (error) {
//       console.error(`Failed to load widget ${this.widgetId}:`, error);
//       this.state = 'error';
//     }
//   }
  
//   /**
//    * Handle retry events
//    */
//   private handleRetry() {
//     // Remove existing widget instance
//     if (this.elementInstance && this.elementInstance.parentNode) {
//       this.elementInstance.parentNode.removeChild(this.elementInstance);
//       this.elementInstance = null;
//     }
    
//     // Reload widget
//     this.loadWidget();
//   }
  
//   /**
//    * Handle attribute changes
//    */
//   attributeChangedCallback(name: string, oldValue: string, newValue: string) {
//     super.attributeChangedCallback(name, oldValue, newValue);
    
//     if (name === 'widgetId' && oldValue !== newValue && newValue) {
//       // Reload widget with new ID
//       if (this.$fastController.isConnected) {
//         this.loadWidget();
//       }
//     }
//   }
// }
