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
    margin-top: 12px;
  }
  
  .chart-container {
    height: 200px;
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
    
    // Prepare data for pie chart - limit to top 5 categories
    const topCategories = [...this.categories]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      console.log('topCategories', topCategories.map(item => item.category));
      console.log('topCategories-data', topCategories.map(item => item.amount));
    
    const data = {
      labels: topCategories.map(item => item.category),
      datasets: [{
        data: topCategories.map(item => item.amount),
        // backgroundColor: topCategories.map(item => item.color),
        // borderWidth: 1,
        // borderColor: 'white'
      }]
    };

    console.log('expenses', data);
    
    // Create new chart
    this.chart = new Chart(canvas, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const dataIndex = context.dataIndex;
                const category = topCategories[dataIndex];
                return `${category.category}: ${this.formatCurrency(category.amount)} (${Math.round(category.percentage)}%)`;
              }
            }
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
}
