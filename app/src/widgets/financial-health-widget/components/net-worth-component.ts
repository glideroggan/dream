import { FASTElement, customElement, html, css, attr, observable, repeat, when } from "@microsoft/fast-element";
import Chart from 'chart.js/auto';

// Interfaces for account type visualization
export interface AccountTypeData {
  type: string;
  balance: number;
  color: string;
  percentage: number;
}

export interface AccountTypeMapItem {
  type: string;
  color: string;
}

const template = html<NetWorthComponent>/*html*/ `
  <div class="accounts-visualization">
    <div class="chart-section">
      <div class="chart-wrapper">
        <canvas id="account-types-canvas"></canvas>
      </div>
      
      <div class="account-legend">
        ${repeat(x => x.accountTypeLegendItems, html<AccountTypeMapItem>/*html*/`
          <div class="legend-item">
            <div class="legend-color" style="background-color: ${x => x.color}"></div>
            <div class="legend-label">${x => x.type.charAt(0).toUpperCase() + x.type.slice(1)}</div>
          </div>
        `)}
      </div>
      
      <div class="account-summary">
        <div class="summary-item assets">
          <div class="summary-label">Assets:</div>
          <div class="summary-value">${x => x.formatCurrencyShort(x.totalAssets)}</div>
        </div>
        <div class="summary-item liabilities">
          <div class="summary-label">Liabilities:</div>
          <div class="summary-value">${x => x.formatCurrencyShort(x.totalLiabilities)}</div>
        </div>
      </div>
    </div>
  </div>
`;

const styles = css`
  .accounts-visualization {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .chart-section {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .chart-wrapper {
    height: 50px;
    position: relative;
    margin-bottom: 8px;
  }
  
  .account-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
    justify-content: center;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
  }
  
  .legend-color {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 4px;
  }
  
  .legend-label {
    font-size: 11px;
    white-space: nowrap;
  }
  
  .account-summary {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid var(--divider-color, #eaeaea);
    font-size: 12px;
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .summary-label {
    font-weight: 500;
    color: var(--secondary-text, #666);
  }
  
  .summary-value {
    font-weight: 600;
  }
  
  .assets .summary-value {
    color: var(--success-color, #2ecc71);
  }
  
  .liabilities .summary-value {
    color: var(--error-color, #e74c3c);
  }
`;

@customElement({
  name: "net-worth-component",
  template,
  styles
})
export class NetWorthComponent extends FASTElement {
  @attr totalAssets: number = 0;
  @attr totalLiabilities: number = 0;
  @attr({ mode: "boolean" }) showChart: boolean = true;

  @observable accountTypeData: AccountTypeData[] = [];
  @observable accountTypeLegendItems: AccountTypeMapItem[] = [];
  private chart: Chart | null = null;

  accountTypeDataChanged(oldValue: AccountTypeData[], newValue: AccountTypeData[]) {
    if (newValue && newValue.length > 0) {
      this.accountTypeLegendItems = newValue.map(item => ({ 
        type: item.type, 
        color: item.color 
      }));
      
      if (this.showChart) {
        this.initChart();
      }
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    
    if (this.accountTypeData.length > 0 && this.showChart) {
      // Small delay to ensure DOM is ready
      setTimeout(() => this.initChart(), 50);
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up chart on disconnect
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  async initChart() {
    if (!this.showChart || this.accountTypeData.length === 0) return;
    
    const canvas = this.shadowRoot?.getElementById('account-types-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Destroy previous chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Convert any CSS variable colors to actual hex colors
    const processedData = this.accountTypeData.map(item => {
      return {
        ...item,
        actualColor: this.getCssVarColor(item.color)
      };
    });

    // Prepare data for horizontal stacked bar chart
    const data = {
      labels: [''],
      datasets: processedData.map(item => ({
        label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
        data: [Math.abs(item.balance)], // Use absolute value for visualization
        backgroundColor: item.actualColor,
        borderColor: 'white',
        borderWidth: 0.5
      }))
    };
    
    // Create new horizontal stacked bar chart
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            display: false
          },
          y: {
            stacked: true,
            display: false
          }
        },
        plugins: {
          legend: {
            display: false // We're using custom legends
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const dataPoint = this.accountTypeData[context.datasetIndex];
                const formattedBalance = this.formatCurrency(Math.abs(dataPoint.balance));
                return `${dataPoint.type}: ${formattedBalance} (${Math.round(dataPoint.percentage)}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Convert CSS variables to actual color values
   * Fallback to direct colors if not a CSS variable
   */
  getCssVarColor(colorValue: string): string {
    if (colorValue.startsWith('var(--')) {
      // Extract the variable name and default value
      const match = colorValue.match(/var\(([^,)]+)(?:,\s*([^)]+))?\)/);
      if (match) {
        const [_, variable, fallback] = match;
        // Get computed value or use fallback
        const computed = getComputedStyle(document.documentElement).getPropertyValue(variable.trim());
        return computed || fallback || '#666666';
      }
    }
    return colorValue;
  }

  /**
   * Format currency numbers
   */
  formatCurrency(value: number): string {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }

  /**
   * Format currency with K/M abbreviations for axis labels
   */
  formatCurrencyShort(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  }
}
