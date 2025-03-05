import { FASTElement, customElement, html, css, observable } from "@microsoft/fast-element";
import Chart from 'chart.js/auto';

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const template = html<ExpenseCategoriesChart>/*html*/ `
  <div class="expense-categories-chart">
    <div class="chart-container">
      <canvas id="expense-categories-canvas"></canvas>
    </div>
  </div>
`;

const styles = css`
  .expense-categories-chart {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .chart-container {
    flex: 1;
    min-height: 0;
    width: 100%;
    position: relative;
  }
`;

@customElement({
  name: "expense-categories-chart",
  template,
  styles
})
export class ExpenseCategoriesChart extends FASTElement {
  @observable categories: CategoryExpense[] = [];
  private chart: Chart | null = null;
  
  async connectedCallback() {
    super.connectedCallback();
    await this.loadChart();
  }
  
  async loadChart() {
    // Wait for shadowRoot to be available
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const canvas = this.shadowRoot?.getElementById('expense-categories-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Destroy previous chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Only create chart if we have data
    if (this.categories.length === 0) return;
    
    // Get top categories sorted by amount
    const topCategories = [...this.categories]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Prepare data for horizontal stacked bar chart
    const data = {
      labels: ['Expenses'],
      datasets: topCategories.map(category => ({
        label: category.category,
        data: [category.amount],
        backgroundColor: category.color,
        borderColor: 'white',
        borderWidth: 0.5,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }))
    };
    
    // Create new horizontal stacked bar chart
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y', // Horizontal bar
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              callback: (value) => {
                return value === 0 ? '' : this.formatCurrencyShort(Number(value));
              }
            }
          },
          y: {
            stacked: true,
            display: false
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              },
              padding: 8
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const category = topCategories[context.datasetIndex];
                return `${category.category}: ${this.formatCurrency(category.amount)} (${Math.round(category.percentage)}%)`;
              }
            }
          }
        },
        layout: {
          padding: {
            top: 5,
            bottom: 5
          }
        }
      }
    });
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
