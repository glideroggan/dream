import { FASTElement, customElement, html, css, attr, observable, repeat, when } from "@microsoft/fast-element";

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const template = html<MonthlySpendingComponent>/*html*/ `
  <div class="section spending-section">
    <h4>Monthly Spending</h4>
    <div class="chart-container">
      <div class="y-axis">
        <div class="y-axis-label">${x => x.formatCurrency(x.maxSpending)}</div>
        <div class="y-axis-label">${x => x.formatCurrency(x.maxSpending * 0.75)}</div>
        <div class="y-axis-label">${x => x.formatCurrency(x.maxSpending * 0.5)}</div>
        <div class="y-axis-label">${x => x.formatCurrency(x.maxSpending * 0.25)}</div>
        <div class="y-axis-label">0</div>
      </div>
      <svg class="spending-chart" viewBox="0 0 300 120" preserveAspectRatio="none">
        <!-- Grid lines -->
        <line x1="30" y1="25" x2="300" y2="25" class="chart-grid" />
        <line x1="30" y1="50" x2="300" y2="50" class="chart-grid" />
        <line x1="30" y1="75" x2="300" y2="75" class="chart-grid" />
        <line x1="30" y1="100" x2="300" y2="100" class="chart-grid" />
        
        <!-- Month labels on x-axis -->
        <text x="40" y="115" class="chart-label">6M</text>
        <text x="94" y="115" class="chart-label">5M</text>
        <text x="148" y="115" class="chart-label">4M</text>
        <text x="202" y="115" class="chart-label">3M</text>
        <text x="256" y="115" class="chart-label">2M</text>
        <text x="290" y="115" class="chart-label">1M</text>
        
        <!-- Spending line -->
        <polyline 
          fill="none" 
          stroke="var(--primary-color, #3498db)" 
          stroke-width="2"
          stroke-linecap="round" 
          stroke-linejoin="round"
          points="${x => x.chartPoints}" 
        />
        
        <!-- Points on the line -->
        ${repeat(x => x.dataPoints, html<{x: number, y: number, value: number}, MonthlySpendingComponent>`
          <circle 
            cx="${x => x.x}" 
            cy="${x => x.y}" 
            r="4" 
            fill="var(--background-color, #fff)" 
            stroke="var(--primary-color, #3498db)" 
            stroke-width="2"
          />
          <title>${(x, c) => c.parent.formatCurrency(x.value)}</title>
        `)}
        
        ${when(x => x.trend === 'up', html<MonthlySpendingComponent>`
          <path class="trend-arrow up" d="M290,50 L290,30 L280,40 M290,30 L300,40" />
        `)}
        ${when(x => x.trend === 'down', html<MonthlySpendingComponent>`
          <path class="trend-arrow down" d="M290,50 L290,70 L280,60 M290,70 L300,60" />
        `)}
      </svg>
    </div>
    <div class="trend-text ${x => x.trend}">
      ${x => x.trendText}
    </div>
    
    <div class="expense-categories">
      <h5>Top Expense Categories</h5>
      <div class="category-bars">
        ${repeat(x => x.categories.slice(0, 4), html<CategoryExpense>/*html*/`
          <div class="category-item">
            <div class="category-header">
              <div class="category-label">${x => x.category}</div>
              <div class="category-amount">${(x, c) => c.parent.formatCurrency(x.amount)} (${x => Math.round(x.percentage)}%)</div>
            </div>
            <div class="category-bar-container">
              <div class="category-bar" style="width: ${x => x.percentage}%; background-color: ${x => x.color}"></div>
            </div>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

const styles = css`
  .spending-section {
    padding: 16px;
    background-color: var(--background-light, #f9f9f9);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  h4, h5 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: var(--secondary-text, #555);
  }
  
  h5 {
    margin: 16px 0 8px 0;
    font-size: 14px;
  }
  
  /* Chart Styles */
  .chart-container {
    height: 120px;
    margin-bottom: 16px;
    position: relative;
    display: flex;
    align-items: stretch;
  }
  
  .y-axis {
    width: 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 25px;
    padding-bottom: 20px;
  }
  
  .y-axis-label {
    font-size: 8px;
    color: var(--tertiary-text, #999);
    text-align: right;
    padding-right: 4px;
    height: 12px;
    line-height: 1;
  }
  
  .spending-chart {
    flex: 1;
    background-color: var(--background-color, #fff);
    border: 1px solid var(--divider-color, #eaeaea);
    border-radius: 4px;
  }
  
  .chart-grid {
    stroke: var(--divider-color, #eaeaea);
    stroke-width: 0.5;
    stroke-dasharray: 2 2;
  }
  
  .chart-label {
    font-size: 9px;
    fill: var(--tertiary-text, #999);
    text-anchor: middle;
  }
  
  .trend-text {
    font-size: 14px;
    text-align: center;
    margin-top: 8px;
  }
  
  .trend-text.up {
    color: var(--error-color, #e74c3c);
  }
  
  .trend-text.down {
    color: var(--success-color, #2ecc71);
  }
  
  .trend-text.flat {
    color: var(--secondary-text, #666);
  }
  
  .trend-arrow {
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  
  .trend-arrow.up {
    stroke: var(--error-color, #e74c3c);
  }
  
  .trend-arrow.down {
    stroke: var(--success-color, #2ecc71);
  }
  
  /* Expense Categories */
  .expense-categories {
    margin-top: 16px;
  }
  
  .category-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .category-item {
    display: flex;
    flex-direction: column;
  }
  
  .category-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .category-label {
    font-size: 12px;
    color: var(--secondary-text, #666);
    font-weight: 500;
  }
  
  .category-amount {
    font-size: 12px;
    color: var(--secondary-text, #666);
  }
  
  .category-bar-container {
    height: 12px;
    border-radius: 4px;
    background-color: var(--divider-color, #eaeaea);
    overflow: hidden;
  }
  
  .category-bar {
    height: 100%;
    border-radius: 4px;
  }
`;

@customElement({
  name: "monthly-spending-component",
  template,
  styles
})
export class MonthlySpendingComponent extends FASTElement {
  @attr chartPoints: string = '';
  @attr trend: 'up' | 'down' | 'flat' = 'flat';
  @attr trendText: string = '';
  @attr currency: string = 'USD';

  @observable categories: CategoryExpense[] = [];
  @observable maxSpending: number = 0;
  @observable dataPoints: {x: number, y: number, value: number}[] = [];
  
  // When categories or chartPoints are updated, parse the data
  categoriesChanged() {
    // The categories should already have the correct percentages from the parent component
    // Each category percentage represents (category amount / total expenses) * 100
  }
  
  chartPointsChanged() {
    // Parse the chartPoints string to extract data points
    if (this.chartPoints) {
      const points = this.chartPoints.trim().split(' ');
      this.dataPoints = points.map(point => {
        const [x, y] = point.split(',').map(Number);
        
        // Calculate the original value (approximation)
        // We need to reverse the calculation done to generate these points
        // Assuming chartHeight = 100, scaling = 0.8, and offset = 10
        const chartHeight = 100;
        const value = ((chartHeight - y - 10) / 0.8) * this.maxSpending / chartHeight;
        
        return { x, y, value };
      });
    }
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
