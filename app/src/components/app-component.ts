import { FASTElement, customElement, html, css, observable } from '@microsoft/fast-element';
import { routerService } from '../services/router-service';
import { registerAppRoutes } from '../routes/routes-registry';

// Import components
import './sidebar-component';
import './header-component';
import './footer-component';
import './router-component';

const template = html<AppComponent>/*html*/ `
  <div class="app-container ${x => x.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
    <dream-header></dream-header>
    <div class="app-main">
      <dream-sidebar></dream-sidebar>
      <main class="main-content">
        <dream-router></dream-router>
      </main>
    </div>
    <dream-footer></dream-footer>
  </div>
`

const styles = css`
  :host {
    display: block;
    height: 100vh;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .app-main {
    display: flex;
    flex: 1;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
    background-color: #f9f9f9;
    transition: margin-left 0.3s ease;
  }
  
  // @media (max-width: 730px) {
  //   .sidebar-collapsed .main-content {
  //     margin-left: 60px;
  //   }
  // }
`

@customElement({
  name: 'dream-app',
  template,
  styles,
})
export class AppComponent extends FASTElement {
  @observable sidebarCollapsed: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();

    // Register all routes
    registerAppRoutes();

    // Initialize the router (will navigate to default route if needed)
    routerService.initialize();

    // get the sidebar element, and listen for events
    const sidebar = this.shadowRoot?.querySelector('dream-sidebar');
    sidebar?.addEventListener('navigation', this.handleNavigation.bind(this));

    // Check initial screen size
    this.sidebarCollapsed = window.innerWidth < 730;
  }

  /**
   * Handle navigation events from the sidebar
   */
  handleNavigation(event: Event): void {
    console.debug('Received navigation event', event);
    const navigationEvent = event as CustomEvent;
    const item = navigationEvent.detail;

    if (item && item.route) {
      // Extract the path from the route (remove the # if present)
      const path = item.route

      // Use the router service to navigate
      routerService.navigateTo(path);

      // Log navigation
      console.debug(`Navigating to: ${path}`);

      // Prevent default browser navigation
      event.preventDefault();
    } else {
      console.warn('Navigation event received but no valid route found', navigationEvent);
    }
  }

  // /**
  //  * Handle sidebar toggle events
  //  */
  // handleSidebarToggle(event: Event): void {
  //   const customEvent = event as CustomEvent;
  //   this.sidebarCollapsed = customEvent.detail.collapsed;
  //   console.debug(`Sidebar collapsed state changed to: ${this.sidebarCollapsed}`);
  // }
}
