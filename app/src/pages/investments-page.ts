import {
  customElement,
  attr,
  html,
  css
} from '@microsoft/fast-element';
import { BasePage, baseContentTemplate, baseStyles } from './base-page';

// Use the base template
const template = baseContentTemplate;

// Extend base styles with investments-specific styling
const styles = css`
  ${baseStyles}
  
  /* Investments-specific styles */
  .content-header {
    background-color: var(--accent-fill-rest);
    color: var(--accent-foreground-on-accent);
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .content-header h1 {
    color: var(--neutral-foreground-on-accent);
  }
  
  /* Special styling for investment widgets */
  .widget-investment-chart {
    grid-column: span 2;
  }
`;

@customElement({
  name: 'investments-page',
  template,
  styles
})
export class InvestmentsPage extends BasePage {
  // Initial empty widgets list - will show empty state initially
  // This is because we don't have real investment widgets yet
  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = '';

  constructor() {
    super();
    this.pageTitle = 'Investments';
    this.pageType = 'investments';
    
    // Set preferred widget sizes for investment widgets (for future use)
    this.widgetSizeMap = {
      ...this.widgetSizeMap,
      'portfolio-summary': 'lg',
      'investment-performance': 'lg',
      'market-news': 'md',
      'stock-monitor': 'sm'
    };
  }
  
  async loadWidgets(): Promise<void> {
    console.debug('Investments page loading widgets...');
    
    // First check if we have user-saved preferences
    await this.loadUserWidgetPreferences();
    
    // Then load any widgets we have (might be none initially)
    await this.loadWidgetsFromList(this.initialWidgets);
    
    // Set ready state even if we have no widgets
    if (!this._initialWidgetsLoaded) {
      this.ready = true;
    }
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
  
  /**
   * Override workflow title formatting for investment-specific workflows
   */
  protected getWorkflowTitle(workflowId: string): string {
    // Add investment-specific workflow titles
    const investmentWorkflowTitles: Record<string, string> = {
      'buy-stock': 'Buy Stocks',
      'sell-investment': 'Sell Investment',
      'transfer-portfolio': 'Transfer Portfolio'
    };
    
    // Check if it's an investment-specific workflow
    if (investmentWorkflowTitles[workflowId]) {
      return investmentWorkflowTitles[workflowId];
    }
    
    // Fall back to base implementation for other workflows
    return super.getWorkflowTitle(workflowId);
  }
}
