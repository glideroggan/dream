import { customElement, html, css, attr, observable } from '@microsoft/fast-element';
import { BaseWidget, baseWidgetStyles } from '../../components/base-widget';

const template = html<WelcomeWidget>/*html*/`
  <div class="welcome-widget">
    <h2>${x => x.title}</h2>
    <p class="intro">${x => x.message}</p>
    
    <div class="tabs">
      <button id="navigation" class="tab-button active" 
              @click="${(x,c) => x.setActiveTab(c.event)}">
        <i class="icon-menu"></i> Navigation
      </button>
      <button id="search" class="tab-button" 
              @click="${(x,c) => x.setActiveTab(c.event)}">
        <i class="icon-search"></i> Search
      </button>
      <button id="widgets" class="tab-button" 
              @click="${(x,c) => x.setActiveTab(c.event)}">
        <i class="icon-widget"></i> Widgets
      </button>
      <button id="workflows" class="tab-button" 
              @click="${(x,c) => x.setActiveTab(c.event)}">
        <i class="icon-workflow"></i> Workflows
      </button>
    </div>
    
    <div class="tab-content" ?hidden="${x => x.activeTab !== 'navigation'}">
      <h3>Theme Pages</h3>
      <div class="feature-illustration navigation-illustration"></div>
      <p>Browse through different theme pages using the menu on the left. Each theme organizes related widgets and functionality to help you accomplish specific tasks.</p>
      <button class="action-button" @click="${x => x.showThemeDemo()}">Show me how</button>
    </div>
    
    <div class="tab-content" ?hidden="${x => x.activeTab !== 'search'}">
      <h3>Search Bar</h3>
      <div class="feature-illustration search-illustration"></div>
      <p>Use the search bar in the header to quickly find widgets and workflows. Type keywords related to what you're looking for to see available options.</p>
      <button class="action-button" @click="${x => x.showSearchDemo()}">Try searching</button>
    </div>
    
    <div class="tab-content" ?hidden="${x => x.activeTab !== 'widgets'}">
      <h3>Interactive Widgets</h3>
      <div class="feature-illustration widgets-illustration"></div>
      <p>Widgets provide information and functionality at a glance. You can:</p>
      <ul>
        <li>Add widgets through the search bar</li>
        <li>Close widgets you don't need (top right corner)</li>
        <li>Rearrange widgets on your theme pages (TBD)</li>
      </ul>
      <button class="action-button" @click="${x => x.showWidgetsDemo()}">Explore widgets</button>
    </div>
    
    <div class="tab-content" ?hidden="${x => x.activeTab !== 'workflows'}">
      <h3>Available Workflows</h3>
      <div class="feature-illustration workflows-illustration"></div>
      <p>Workflows are actions that help you accomplish tasks efficiently. Access workflows from:</p>
      <ul>
        <li>Widget action menus</li>
        <li>The search bar by typing related commands</li>
        <li>Context menus within the application</li>
      </ul>
      <button class="action-button" @click="${x => x.showWorkflowsDemo()}">Discover workflows</button>
    </div>
  </div>
`;

// Merge with base widget styles
const styles = css`
  ${baseWidgetStyles}
  
  :host {
    display: flex;
    flex-direction: column;
    min-height: 0; /* Allow container to control height */
  }
  
  /* Ensure welcome widget content doesn't block widget header controls */
  .welcome-widget {
    text-align: center;
    // background: var(--background-color, #fff);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1; /* Lower z-index than header controls */
  }
  
  h2 {
    color: var(--heading-color, #2c3e50);
    margin-top: 0;
    font-size: 1.8em;
  }
  
  h3 {
    color: var(--subheading-color, #34495e);
    margin-top: 0;
  }
  
  .intro {
    font-size: 1.1em;
    color: var(--text-color, #333);
    margin-bottom: 20px;
  }
  
  .tabs {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    flex-wrap: wrap; /* Allow tabs to wrap on smaller screens */
  }
  
  .tab-button {
    background: none;
    border: none;
    padding: 10px 20px;
    margin: 0 5px;
    cursor: pointer;
    font-size: 1em;
    color: var(--text-color, #333);
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }
  
  .tab-button.active {
    border-bottom: 2px solid var(--accent-color, #3498db);
    color: var(--accent-color, #3498db);
  }
  
  .tab-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .tab-content {
    padding: 20px 10px;
    text-align: left;
    flex: 1;
    min-height: 250px; /* Ensure minimum height for content */
  }
  
  ul {
    text-align: left;
    margin-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  .feature-illustration {
    height: 120px;
    margin: 15px auto;
    background-color: #f0f0f0;
    border-radius: 6px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }
  
  .navigation-illustration {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>');
  }
  
  .search-illustration {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>');
  }
  
  .widgets-illustration {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M13 13v8h8v-8h-8zM3 21h8v-8H3v8zM3 3v8h8V3H3zm13.66-1.31L11 7.34 16.66 13l5.66-5.66-5.66-5.65z"/></svg>');
  }
  
  .workflows-illustration {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z"/></svg>');
  }
  
  .action-button {
    background-color: var(--accent-color, #3498db);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    margin-top: 10px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
  }
  
  .action-button:hover {
    background-color: var(--accent-hover-color, #2980b9);
  }
  
  .controls {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
  }
  
  .dismiss-button {
    background-color: var(--secondary-color, #95a5a6);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
  }
  
  .dismiss-button:hover {
    background-color: var(--secondary-hover-color, #7f8c8d);
  }
  
  .show-again {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: var(--text-color, #333);
  }
  
  [hidden] {
    display: none;
  }
`;

@customElement({
  name: 'welcome-widget',
  template,
  styles
})
export class WelcomeWidget extends BaseWidget {
  @attr({ attribute: 'widget-title' }) title = 'Welcome to Your Workspace';
  @observable message = 'Get started with your personalized dashboard. Here\'s how to navigate the interface.';
  @observable config: Record<string, unknown> = {};
  @observable activeTab: string = 'navigation';
  @observable showOnStartup: boolean = true;

  connectedCallback(): void {
    super.connectedCallback();
    
    // Remove any title attribute to avoid unwanted tooltips
    if (this.hasAttribute('title')) {
      this.removeAttribute('title');
    }
    
    // Ensure we're using consistent ID attributes across the DOM
    this.setAttribute('data-widget-id', 'welcome');
    
    // Find our parent widget-wrapper and ensure it has the right ID
    const parentWrapper = this.closest('widget-wrapper');
    if (parentWrapper) {
      parentWrapper.setAttribute('widgetId', 'welcome');
      parentWrapper.setAttribute('data-widget-id', 'welcome');
      
      // Also ensure our grandparent (grid item) has the right ID
      const gridItem = parentWrapper.parentElement;
      if (gridItem) {
        gridItem.setAttribute('data-grid-item-id', 'welcome');
        gridItem.setAttribute('data-widget-id', 'welcome');
      }
    }
    
    // Add event debugging to see what's happening with clicks
    this.addEventListener('click', (e) => {
      // Don't do anything with the event, just log it to see if it's being captured
      // and ensure we're not accidentally stopping propagation
      const target = e.target as HTMLElement;
      const targetId = target.id || target.tagName;
      console.debug(`Welcome widget received click on ${targetId}`, e);
      
      // Explicitly ensure propagation continues (shouldn't be needed but let's be safe)
      e.stopPropagation = () => {
        console.warn('Welcome widget prevented stopPropagation call');
      };
    }, { passive: true });
    
    // Notify parent that we're initialized
    this.notifyInitialized();
    
    // Check if we need more space using base widget method
    this.checkInitialContentFit();
    
    // Check if the widget should be shown based on user preference
    this.loadPreferences();
    
    // Add event listener for debugging span change events
    this.addEventListener('widget-spans-change', (e) => {
      console.debug('Welcome widget intercepted widget-spans-change event:', (e as CustomEvent).detail);
      // Make sure event continues to propagate up
    });
  }
  
  setActiveTab(event: Event): void {
    // Only handle clicks directly on tab buttons, not from other elements
    if (!(event.target as HTMLElement).closest('.tab-button')) {
      return; // Don't handle clicks that didn't originate from tab buttons
    }
    
    const target = event.target as HTMLElement;
    const button = target.closest('.tab-button');
    
    // get all tab buttons
    const tabButtons = this.shadowRoot?.querySelectorAll('.tab-button');
    tabButtons?.forEach(tabButton => {
      tabButton.setAttribute('aria-selected', 'false');
      tabButton.classList.remove('active');
    });
    
    this.activeTab = button?.id ?? 'navigation';
    button?.setAttribute('aria-selected', 'true');
    button?.classList.add('active');
    
    // Make sure we're NOT stopping propagation
    // event.stopPropagation(); - this would be wrong!
    
    // Use base widget method to update layout after tab change
    this.handleContentViewChange();
  }
  
  showThemeDemo(): void {
    // Dispatch an event to highlight the theme navigation
    this.dispatchEvent(new CustomEvent('demo-request', {
      bubbles: true,
      composed: true,
      detail: { demoType: 'theme-navigation' }
    }));
  }
  
  showSearchDemo(): void {
    // Dispatch an event to highlight the search bar
    this.dispatchEvent(new CustomEvent('demo-request', {
      bubbles: true,
      composed: true,
      detail: { demoType: 'search-bar' }
    }));
  }
  
  showWidgetsDemo(): void {
    // Dispatch an event to demonstrate widget interactions
    this.dispatchEvent(new CustomEvent('demo-request', {
      bubbles: true,
      composed: true,
      detail: { demoType: 'widgets-interaction' }
    }));
  }
  
  showWorkflowsDemo(): void {
    // Dispatch an event to demonstrate workflow interactions
    this.dispatchEvent(new CustomEvent('demo-request', {
      bubbles: true,
      composed: true,
      detail: { demoType: 'workflows-demonstration' }
    }));
  }
  
  dismiss(): void {
    // Dispatch an event to close the welcome widget
    this.dispatchEvent(new CustomEvent('dismiss', {
      bubbles: true,
      composed: true
    }));
  }
  
  toggleShowOnStartup(): void {
    this.showOnStartup = !this.showOnStartup;
    this.savePreferences();
  }
  
  loadPreferences(): void {
    // Load user preferences from localStorage
    try {
      const storedPreferences = localStorage.getItem('welcome-widget-preferences');
      if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        this.showOnStartup = preferences.showOnStartup ?? true;
      }
    } catch (error) {
      console.error('Failed to load welcome widget preferences', error);
    }
  }
  
  savePreferences(): void {
    // Save user preferences to localStorage
    try {
      localStorage.setItem('welcome-widget-preferences', JSON.stringify({
        showOnStartup: this.showOnStartup
      }));
    } catch (error) {
      console.error('Failed to save welcome widget preferences', error);
    }
  }
}
