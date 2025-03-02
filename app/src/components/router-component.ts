import {
  FASTElement,
  customElement,
  html,
  css,
  Observable,
  observable
} from '@microsoft/fast-element';
import { routerService, Route } from '../services/router-service';

const template = html<RouterComponent>/*html*/`
  <div class="router-container">
    <div id="page-container" class="page-container">
      <!-- Pages will be dynamically inserted here -->
      <slot></slot>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
    width: 100%;
    position: relative;
  }

  .router-container {
    height: 100%;
    width: 100%;
  }

  .page-container {
    height: 100%;
    width: 100%;
    position: relative;
  }
`;

@customElement({
  name: 'dream-router',
  template,
  styles
})
export class RouterComponent extends FASTElement {
  @observable currentElementName: string | null = null;
  @observable currentParams: Record<string, unknown> = {};

  private currentElement: HTMLElement | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    
    // Subscribe to route changes
    Observable.getNotifier(routerService).subscribe(
      { handleChange: this.handleRouteChange.bind(this) },
      'currentRoute'
    );
    
    // Check if there's already a current route
    const { route, params } = routerService.getCurrentRoute();
    if (route) {
      this.renderPage(route, params);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up subscription (in a real implementation)
  }

  /**
   * Handle route changes
   */
  private handleRouteChange(source: any, propertyName: string): void {
    if (propertyName === 'currentRoute') {
      const { route, params } = routerService.getCurrentRoute();
      if (route) {
        this.renderPage(route, params);
      }
    }
  }

  /**
   * Render a page based on the current route
   */
  private renderPage(route: Route, params: Record<string, unknown>): void {
    if (this.currentElementName === route.elementName) {
      // If it's the same element, just update the parameters
      if (this.currentElement) {
        this.updateElementParams(this.currentElement, params);
      }
      return;
    }

    // Create new element
    const newElement = document.createElement(route.elementName);
    this.updateElementParams(newElement, params);
    
    // Get container
    const container = this
    // const container = this.shadowRoot?.getElementById('page-container');
    if (!container) {
      console.error('Page container not found');
      return;
    }
    
    // Optional: Add transition effect
    this.applyTransition(container, () => {
      // Remove current element if exists
      if (this.currentElement && container.contains(this.currentElement)) {
        container.removeChild(this.currentElement);
      }
      
      // Add new element
      container.appendChild(newElement);
      this.currentElement = newElement;
      this.currentElementName = route.elementName;
      this.currentParams = { ...params };
    });
  }

  /**
   * Update element parameters
   */
  private updateElementParams(element: HTMLElement, params: Record<string, unknown>): void {
    // For each parameter, set it as a property on the element
    Object.entries(params).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
  }

  /**
   * Apply a simple transition effect
   */
  private applyTransition(container: HTMLElement, callback: () => void): void {
    // Simple fade transition
    container.style.opacity = '0';
    
    setTimeout(() => {
      callback();
      container.style.opacity = '1';
    }, 150);
  }
}
