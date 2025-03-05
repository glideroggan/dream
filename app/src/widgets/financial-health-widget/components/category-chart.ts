import { FASTElement, customElement, html, css, observable, repeat } from "@microsoft/fast-element";
import Chart from 'chart.js/auto';

export interface CategoryItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const template = html<CategoryChart>/*html*/ `
  <div class="category-chart">
    <div class="chart-wrapper">
      <canvas id="category-canvas"></canvas>
    </div>
    <div class="category-legend">
      ${repeat(x => x.categories.slice(0, x.maxCategories), html<CategoryItem>/*html*/`
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${x => x.color}"></div>
          <div class="legend-label">${x => x.category}</div>
          <div class="legend-amount">${(x, c) => c.parent.formatCurrency(x.amount)} (${x => Math.round(x.percentage)}%)</div>
        </div>
      `)}
    </div>
  </div>
`;

const styles = css`
  .category-chart {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }
  
  .chart-wrapper {
    height: 200px;
    width: 100%;
    position: relative;
  }
  
  .category-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    font-size: 12px;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    margin-right: 8px;
  }
  
  .legend-label {
    flex-grow: 1;
    color: var(--secondary-text, #666);
  }
  
  .legend-amount {
    color: var(--text-color, #333);
    font-weight: 500;
  }
`;

@customElement({
  name: "category-chart",
  template,
  styles
})
export class CategoryChart extends FASTElement {
  @observable categories: CategoryItem[] = [];
  @observable maxCategories: number = 5;
  private chart: Chart | null = null;
  
  async connectedCallback() {
    super.connectedCallback();
    await this.loadChart();
  }
  
  async loadChart() {
    // Wait for shadowRoot to be available
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const canvas = this.shadowRoot?.getElementById('category-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Destroy previous chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare data for horizontal bar chart
    const data = {
      labels: this.categories.slice(0, this.maxCategories).map(item => item.category),
      datasets: [{
        data: this.categories.slice(0, this.maxCategories).map(item => item.amount),
        backgroundColor: this.categories.slice(0, this.maxCategories).map(item => item.color),
        borderWidth: 0,
        borderRadius: 4,
      }]
    };
    
    // Create new chart
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return this.formatAxisLabel(value as number);
              }
            }
          },
          y: {
            grid: {
              display: false,
              // drawBorder: false
            }
          }
        }
      }
    });
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
  
  /**
   * Format currency numbers
   */
  formatCurrency(value: number): string {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  }
}
