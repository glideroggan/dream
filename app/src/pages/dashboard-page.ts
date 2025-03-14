import {
  customElement,
  attr,
  css
} from '@microsoft/fast-element';
import { BasePage, baseContentTemplate } from './base-page';
import { baseStyles } from './base-page.css';
import { repositoryService } from '../services/repository-service';
import { PageWidgetSettings } from '../repositories/models/widget-settings';
import { WidgetWrapper } from '../components/widget-wrapper/widget-wrapper';

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
  initialWidgets: string = 'welcome,slow-widget,error-widget,account';

  constructor() {
    super();
    this.pageTitle = 'Dashboard';
    this.pageType = 'dashboard';
  }

  async loadWidgets(): Promise<void> {
    console.log('Dashboard page loading widgets...');
    
    // First try to load from user settings
    await this.loadUserWidgetPreferences();
    
    // Then load the widgets (either from settings or defaults)
    // This will respect the initialWidgets being potentially changed by loadUserWidgetPreferences
    await this.loadWidgetsFromList(this.initialWidgets);
    
    // save widget layout to settings
    const settingsRepo = await repositoryService.getSettingsRepository();
    const pageWidgets = this.getActiveWidgets()
    await settingsRepo.savePageWidgetLayout(this.pageType, pageWidgets);
    // Make sure page is ready, even if no widgets
    this.ready = true;
  }

  getActiveWidgets(): PageWidgetSettings[] {
    // get the grid, and then its children
    const grid = this.shadowRoot?.querySelector('grid-layout');
    if (!grid) {
      return [];
    }

    return Array.from(grid.children).map((child) => {
      const widget = child as WidgetWrapper;
      return {
        id: child.id,
        colSpan: widget.colSpan,
        rowSpan: widget.rowSpan
      };
    });
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