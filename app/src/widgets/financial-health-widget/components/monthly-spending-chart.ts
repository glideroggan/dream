import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";

import Chart from 'chart.js/auto'

export interface DataPoint {
  month: string;
  value: number;
}

const template = html<MonthlySpendingChart>/*html*/ `
  <div class="monthly-spending-container">
    <div class="chart-wrapper">
      <canvas id="spending-canvas"></canvas>
    </div>
    
    <div class="trend-info ${x => x.trend}">
      ${x => x.trendMessage}
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  .monthly-spending-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .chart-wrapper {
    margin-bottom: 8px;
    
    width: 100%;
    width: 800px;
    height: 200px;
  }
  
  .trend-info {
    text-align: center;
    font-size: 14px;
    margin-top: 8px;
    padding: 4px;
    border-radius: 4px;
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
    const canvas = this.shadowRoot?.getElementById('spending-canvas') as HTMLCanvasElement
    if (!canvas) return;
    console.log(canvas)
    const data = this.prepareChartData()
    console.log(data)
    new Chart(canvas, {
      type: 'line',
      data: data,
      options:{
        responsive: true,
        maintainAspectRatio: false
    }
    });
  }

  prepareChartData() {
    // Extract months and values from data points
    const labels = this.dataPoints.map(point => point.month);
    const values = this.dataPoints.map(point => point.value);

    // Create gradient fill
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
          // NOTE: below values seems to destroy the graph
          // borderColor: '#36A2EB',
          // backgroundColor: '#9BD0F5',
          // pointBorderColor: 'rgb(53, 162, 235)',
        }
      ]
    };
  }
  
  getChartOptions() {
    return {
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: this.maxValue,
          ticks: {
            // Use a callback to format the tick values
            callback: (value: number) => {
              return this.formatAxisLabel(value);
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
  
  formatAxisLabel(value: number): string {
    // For larger values, abbreviate with K or M
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
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
