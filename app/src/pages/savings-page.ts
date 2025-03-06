import {
  customElement,
  attr,
  html,
  css
} from '@microsoft/fast-element';
import { BasePage, baseContentTemplate, baseStyles } from './base-page';

// Use the base template
const template = baseContentTemplate;

// Extend base styles with savings-specific styling
const styles = css`
  ${baseStyles}
  
  /* Savings-specific styles */
  .content-header {
    background-color: var(--neutral-layer-1);
    padding: 0 20px;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .content-header h1 {
    color: var(--accent-foreground-rest);
  }
`;

@customElement({
  name: 'savings-page',
  template,
  styles
})
export class SavingsPage extends BasePage {
  // Initial empty widgets list - will use settings if available
  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = 'financial-health';

  constructor() {
    super();
    this.pageTitle = 'Savings';
    this.pageType = 'savings';
  }
  
  async loadWidgets(): Promise<void> {
      console.debug('Savings page loading widgets...');
    
    // First check if we have user-saved preferences
    await this.loadUserWidgetPreferences();
    
    // Then load any widgets we have (from settings or initial defaults)
    await this.loadWidgetsFromList(this.initialWidgets);
    
    // Set ready state even if we have no widgets
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
  
  /**
   * Override workflow title formatting for savings-specific workflows
   */
  protected getWorkflowTitle(workflowId: string): string {
    // Add savings-specific workflow titles
    const savingsWorkflowTitles: Record<string, string> = {
      'create-savings-goal': 'Create New Savings Goal',
      'deposit-savings': 'Deposit to Savings',
      'withdraw-savings': 'Withdraw from Savings'
    };
    
    // Check if it's a savings-specific workflow
    if (savingsWorkflowTitles[workflowId]) {
      return savingsWorkflowTitles[workflowId];
    }
    
    // Fall back to base implementation for other workflows
    return super.getWorkflowTitle(workflowId);
  }
}
