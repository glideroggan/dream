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
    <div class="visual-balance">
      <div class="balance-bar-container">
        <div class="balance-bar assets-bar" 
             style="width: ${x => x.getAssetsPercentageWidth()}%">
          <span class="bar-label">Assets</span>
        </div>
        <div class="balance-bar liabilities-bar" 
             style="width: ${x => x.getLiabilitiesPercentageWidth()}%">
          <span class="bar-label">Liabilities</span>
        </div>
      </div>
    </div>
    
    ${when(x => x.showChart && x.accountTypeData.length > 0, html<NetWorthComponent>/*html*/`
      <div class="chart-section">
        <h5>Account Distribution</h5>
        <div class="chart-wrapper">
          <canvas id="account-types-canvas"></canvas>
        </div>
        <div class="account-type-legend">
          ${repeat(x => x.accountTypeLegendItems, html<AccountTypeMapItem>/*html*/`
            <div class="legend-item">
              <span class="legend-color" style="background-color: ${x => x.color}"></span>
              <span class="legend-label">${x => x.type.charAt(0).toUpperCase() + x.type.slice(1)}</span>
            </div>
          `)}
        </div>
      </div>
    `)}
  </div>
`;

const styles = css`
  .accounts-visualization {
    margin-top: 16px;
  }
  
  h5 {
    margin: 16px 0 8px 0;
    font-size: 15px;
    color: var(--secondary-text, #555);
  }
  
  /* Visual Balance Bar */
  .visual-balance {
    margin: 12px 0;
  }
  
  .balance-bar-container {
    display: flex;
    height: 36px;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .balance-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-width: 40px;
    color: white;
    font-weight: 600;
    position: relative;
  }
  
  .assets-bar {
    background: linear-gradient(to right, #2ecc71, #27ae60);
    border-right: 1px solid rgba(0,0,0,0.1);
  }
  
  .liabilities-bar {
    background: linear-gradient(to right, #e74c3c, #c0392b);
  }
  
  .bar-label {
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    font-size: 14px;
    white-space: nowrap;
    padding: 0 12px;
  }
  
  /* Chart Section */
  .chart-section {
    margin-top: 20px;
  }
  
  .chart-wrapper {
    height: 180px;
    margin-bottom: 16px;
  }
  
  .account-type-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 13px;
    justify-content: center;
    background: rgba(255,255,255,0.6);
    padding: 8px;
    border-radius: 6px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
  }
  
  .legend-color {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    margin-right: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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

  getAssetsPercentageWidth(): number {
    const total = Math.abs(this.totalAssets) + Math.abs(this.totalLiabilities);
    if (total === 0) return 50; // Default to 50-50 if no values
    return (Math.abs(this.totalAssets) / total) * 100;
  }

  getLiabilitiesPercentageWidth(): number {
    const total = Math.abs(this.totalAssets) + Math.abs(this.totalLiabilities);
    if (total === 0) return 50; // Default to 50-50 if no values
    return (Math.abs(this.totalLiabilities) / total) * 100;
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

    // Prepare data for doughnut chart
    const data = {
      labels: processedData.map(item => item.type.charAt(0).toUpperCase() + item.type.slice(1)),
      datasets: [{
        data: processedData.map(item => Math.abs(item.balance)),
        backgroundColor: processedData.map(item => item.actualColor),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    };
    
    // Create new chart
    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const dataPoint = this.accountTypeData[context.dataIndex];
                const formattedBalance = this.formatCurrency(dataPoint.balance);
                return `${dataPoint.type}: ${formattedBalance} (${Math.round(dataPoint.percentage)}%)`;
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
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
}
