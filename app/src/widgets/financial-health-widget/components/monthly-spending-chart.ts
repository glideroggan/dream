import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
import Chart from 'chart.js/auto';

export interface DataPoint {
  month: string;
  value: number;
  essential?: number;
  discretionary?: number;
}

const template = html<MonthlySpendingChart>/*html*/ `
  <div class="monthly-spending-container">
    <div class="chart-wrapper">
      <canvas id="spending-canvas"></canvas>
    </div>
    
    <div class="trend-info ${x => x.trend}">
      ${x => x.trendMessage}
    </div>
    
    <div class="spending-legend">
      <div class="legend-item">
        <div class="legend-color essential"></div>
        <div class="legend-label">Essential</div>
      </div>
      <div class="legend-item">
        <div class="legend-color discretionary"></div>
        <div class="legend-label">Discretionary</div>
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .monthly-spending-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .chart-wrapper {
    flex: 1;
    min-height: 0;
    width: 100%;
    position: relative;
  }
  
  .trend-info {
    text-align: center;
    font-size: 11px;
    padding: 2px 0;
  }
  
  .trend-info.up {
    color: var(--error-color, #e74c3c);
  }
  
  .trend-info.down {
    color: var(--success-color, #2ecc71);
  }
  
  .trend-info.flat {
    color: var(--secondary-text, #666);
  }
  
  .spending-legend {
    display: flex;
    justify-content: center;
    gap: 14px;
    margin-top: 2px;
    font-size: 10px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
  }
  
  .legend-color {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin-right: 3px;
  }
  
  .legend-color.essential {
    background-color: var(--primary-color, #3498db);
  }
  
  .legend-color.discretionary {
    background-color: var(--secondary-color, #9b59b6);
  }
`;

@customElement({
  name: "monthly-spending-chart",
  template,
  styles
})
export class MonthlySpendingChart extends FASTElement {
  @attr chartType: string = 'line';
  @attr trend: 'up' | 'down' | 'flat' = 'flat';
  @attr trendMessage: string = '';
  @observable dataPoints: DataPoint[] = [];
  @observable maxValue: number = 1000;
  
  async connectedCallback() {
    super.connectedCallback();
    await this.loadChart();
  }

  async loadChart() {
    const canvas = this.shadowRoot?.getElementById('spending-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Check if we have essential and discretionary data
    const hasDetailedData = this.dataPoints.length > 0 && 
      typeof this.dataPoints[0].essential === 'number' && 
      typeof this.dataPoints[0].discretionary === 'number';
    
    const data = hasDetailedData ? 
      this.prepareStackedChartData() : 
      this.prepareChartData();
      
    new Chart(canvas, {
      type: hasDetailedData ? 'bar' : 'line',
      data: data,
      options: hasDetailedData ?
        this.getStackedChartOptions() :
        this.getChartOptions()
    });
  }

  prepareChartData() {
    // Extract months and values from data points
    const labels = this.dataPoints.map(point => point.month);
    const values = this.dataPoints.map(point => point.value);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Spending',
          data: values,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }
  
  prepareStackedChartData() {
    // Extract data for stacked bar chart
    const labels = this.dataPoints.map(point => point.month);
    const essentialValues = this.dataPoints.map(point => point.essential || 0);
    const discretionaryValues = this.dataPoints.map(point => point.discretionary || 0);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Essential',
          data: essentialValues,
          // backgroundColor: 'var(--primary-color, #3498db)',
          borderWidth: 0
        },
        {
          label: 'Discretionary',
          data: discretionaryValues,
          // backgroundColor: 'var(--secondary-color, #9b59b6)',
          borderWidth: 0
        }
      ]
    };
  }
  
  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: this.maxValue,
          ticks: {
            callback: function(tickValue: number | string, index: number, ticks: any[]): string {
              // Convert to number if it's a string
              const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
              // For larger values, abbreviate with K or M
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
              }
              return `$${value}`;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `Spending: ${this.formatCurrency(context.parsed.y)}`;
            }
          }
        },
        legend: {
          display: false
        }
      },
      interaction: {
        intersect: false
      }
    };
  }
  
  getStackedChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          suggestedMax: this.maxValue,
          ticks: {
            callback: function(tickValue: number | string, index: number, ticks: any[]): string {
              // Convert to number if it's a string
              const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
              // For larger values, abbreviate with K or M
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
              }
              return `$${value}`;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const dataset = context.dataset.label;
              const value = context.parsed.y;
              return `${dataset}: ${this.formatCurrency(value)}`;
            },
            footer: (tooltipItems: any[]) => {
              // Calculate the total from all datasets for this month
              const total = tooltipItems.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
              return `Total: ${this.formatCurrency(total)}`;
            }
          }
        },
        legend: {
          display: false
        }
      }
    };
  }
  
  formatCurrency(value: number): string {
    return value.toLocaleString(undefined, { 
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
}
