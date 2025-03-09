import {
  customElement,
  attr,
  css
} from '@microsoft/fast-element';
import { BasePage, baseContentTemplate } from './base-page';
import { baseStyles } from './base-page.css';

// Use the base template
const template = baseContentTemplate;

// Extend base styles with dashboard-specific styling
const styles = css`
  ${baseStyles}
  
  /* Dashboard-specific styles */
  .content-header {
    border-bottom: 1px solid var(--neutral-outline-rest);
  }
`;

@customElement({
  name: 'dashboard-page',
  template,
  styles,
})
export class DashboardPage extends BasePage {
  // Default widgets for dashboard - only used if user has no saved settings
  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = 'welcome,account,slow-widget,error-widget';

  constructor() {
    super();
    this.pageTitle = 'Dashboard';
    this.pageType = 'dashboard';
  }

  async loadWidgets(): Promise<void> {
    console.debug('Dashboard page loading widgets...');
    
    // First try to load from user settings
    await this.loadUserWidgetPreferences();
    
    // Then load the widgets (either from settings or defaults)
    // This will respect the initialWidgets being potentially changed by loadUserWidgetPreferences
    await this.loadWidgetsFromList(this.initialWidgets);
    
    // Make sure page is ready, even if no widgets
    this.ready = true;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue);

    if (name === 'initialwidgets' && newValue !== oldValue) {
      console.debug(`initialWidgets attribute changed to: "${newValue}"`);
      this.initialWidgets = newValue;
      if (this.isConnected && !this._initialWidgetsLoaded) {
        this.loadWidgets();
      }
    }
  }
}