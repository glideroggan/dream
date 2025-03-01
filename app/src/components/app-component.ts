import { FASTElement, customElement, html, css } from '@microsoft/fast-element';
import { routerService } from '../services/router-service';
import { registerAppRoutes } from '../routes/routes-registry';

// Import components
import './sidebar-component';
import './header-component';
import './footer-component';
import './router-component';

const template = html<AppComponent>/*html*/ `
  <div class="app-container">
    <dream-header></dream-header>
    <div class="app-main">
      <dream-sidebar @navigation="${(x, c) => x.handleNavigation(c.event)}"></dream-sidebar>
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
    --sidebar-bg: #2c3e50;
    --header-bg: #ffffff;
    --primary-color: #3498db;
    --text-color: #333333;
    --text-light: #ffffff;
    --border-color: #e0e0e0;
    --hover-bg: rgba(52, 152, 219, 0.1);
    --divider-color: #ecf0f1;
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
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
    background-color: #f9f9f9;
  }
`

@customElement({
  name: 'dream-app',
  template,
  styles,
})
export class AppComponent extends FASTElement {
  connectedCallback(): void {
    super.connectedCallback();
    
    // Register all routes
    registerAppRoutes();
    
    // Initialize the router (will navigate to default route if needed)
    routerService.initialize();
  }
  
  /**
   * Handle navigation events from the sidebar
   */
  handleNavigation(event: Event): void {
    const navigationEvent = event as CustomEvent;
    const item = navigationEvent.detail;
    
    if (item && item.route) {
      // Extract the path from the route (remove the # if present)
      const path = item.route.replace(/^#/, '');
      routerService.navigateTo(path);
    }
  }
}
