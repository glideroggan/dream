// import { FASTElement, customElement, html, css, attr, observable } from "@microsoft/fast-element";
// import { SavingsGoal } from "./savings-rate-component";

// // Interfaces
// export interface DataPoint {
//   month: string;
//   value: number;
// }

// export interface CategoryExpense {
//   category: string;
//   amount: number;
//   percentage: number;
//   color: string;
// }

// // A simple net worth chart
// const netWorthChartTemplate = html<NetWorthChart>/*html*/ `
//   <div class="chart-container">
//     <div class="account-type-bar">
//       ${x => x.renderAccountBars()}
//     </div>
//     <div class="account-type-legend">
//       ${x => x.renderLegend()}
//     </div>
//   </div>
// `;

// const netWorthChartStyles = css`
//   .chart-container {
//     margin-top: 12px;
//   }
  
//   .account-type-bar {
//     height: 24px;
//     border-radius: 4px;
//     overflow: hidden;
//     display: flex;
//     margin-bottom: 8px;
//   }
  
//   .account-type-legend {
//     display: flex;
//     flex-wrap: wrap;
//     gap: 12px;
//     font-size: 12px;
//   }
  
//   .legend-item {
//     display: flex;
//     align-items: center;
//   }
  
//   .legend-color {
//     width: 12px;
//     height: 12px;
//     border-radius: 2px;
//     margin-right: 4px;
//   }
// `;

// // Monthly spending chart
// const monthlySpendingChartTemplate = html<MonthlySpendingChart>/*html*/ `
//   <div class="chart-container">
//     <div class="y-axis">
//       <div>High</div>
//       <div>Medium</div>
//       <div>Low</div>
//       <div>0</div>
//     </div>
//     <div class="chart">
//       <svg class="spending-chart" viewBox="0 0 300 100" preserveAspectRatio="none">
//         <!-- Grid lines -->
//         <line x1="0" y1="25" x2="300" y2="25" class="grid-line" />
//         <line x1="0" y1="50" x2="300" y2="50" class="grid-line" />
//         <line x1="0" y1="75" x2="300" y2="75" class="grid-line" />
        
//         <!-- Spending line -->
//         <polyline
//           class="trend-line ${x => x.trend}"
//           fill="none"
//           stroke-width="2"
//           points="${x => x.calculatePoints()}"
//         />
//       </svg>
//     </div>
    
//     <!-- X-axis month labels -->
//     <div class="x-axis">
//       ${x => x.renderMonthLabels()}
//     </div>
    
//     <div class="trend-text ${x => x.trend}">
//       ${x => x.trendMessage}
//     </div>
//   </div>
// `;

// const monthlySpendingChartStyles = css`
//   .chart-container {
//     position: relative;
//     padding-bottom: 40px;
//   }
  
//   .chart {
//     width: 100%;
//     height: 120px;
//     margin-bottom: 10px;
//   }
  
//   .spending-chart {
//     width: 100%;
//     height: 100px;
//     background: var(--background-color, white);
//   }
  
//   .y-axis {
//     position: absolute;
//     left: 0;
//     top: 0;
//     height: 100px;
//     display: flex;
//     flex-direction: column;
//     justify-content: space-between;
//     font-size: 10px;
//     color: var(--tertiary-text, #999);
//     width: 50px;
//   }
  
//   .x-axis {
//     display: flex;
//     justify-content: space-between;
//     padding: 0 10px;
//     font-size: 10px;
//     color: var(--tertiary-text, #999);
//   }
  
//   .grid-line {
//     stroke: var(--divider-color, #eaeaea);
//     stroke-dasharray: 2 2;
//     stroke-width: 1;
//   }
  
//   .trend-line {
//     stroke: var(--primary-color, #3498db);
//   }
  
//   .trend-line.up {
//     stroke: var(--error-color, #e74c3c);
//   }
  
//   .trend-line.down {
//     stroke: var(--success-color, #2ecc71);
//   }
  
//   .trend-text {
//     text-align: center;
//     margin-top: 8px;
//     font-size: 14px;
//   }
  
//   .trend-text.up {
//     color: var(--error-color, #e74c3c);
//   }
  
//   .trend-text.down {
//     color: var(--success-color, #2ecc71);
//   }
// `;

// // Expense categories chart
// const expenseCategoriesChartTemplate = html<ExpenseCategoriesChart>/*html*/ `
//   <div class="chart-container">
//     ${x => x.renderCategoryBars()}
//   </div>
// `;

// const expenseCategoriesChartStyles = css`
//   .chart-container {
//     margin-top: 12px;
//   }

//   .category-item {
//     margin-bottom: 12px;
//   }
  
//   .category-header {
//     display: flex;
//     justify-content: space-between;
//     margin-bottom: 4px;
//   }
  
//   .category-bar-container {
//     height: 12px;
//     border-radius: 4px;
//     background-color: var(--divider-color, #eaeaea);
//     overflow: hidden;
//   }
  
//   .category-bar {
//     height: 100%;
//     border-radius: 4px;
//   }
// `;

// // Savings rate chart
// const savingsRateChartTemplate = html<SavingsRateChart>/*html*/ `
//   <div class="chart-container">
//     <div class="savings-rate-container">
//       <div class="progress-ring">
//         <svg viewBox="0 0 100 100">
//           <circle class="progress-bg" cx="50" cy="50" r="40"/>
//           <circle class="progress-circle" 
//                   cx="50" cy="50" r="40"
//                   stroke-dashoffset="${x => x.getProgressOffset()}"/>
//           <text x="50" y="50" class="progress-text">${x => Math.round(x.rate)}%</text>
//         </svg>
//       </div>
//       <div class="rate-message">
//         ${x => x.getSavingsRateMessage()}
//       </div>
//     </div>
    
//     <h5>Savings Goals</h5>
//     <div class="goals-container">
//       ${x => x.renderSavingsGoals()}
//     </div>
//   </div>
// `;

// const savingsRateChartStyles = css`
//   .chart-container {
//     margin-top: 12px;
//   }
  
//   .savings-rate-container {
//     display: flex;
//     align-items: center;
//     gap: 20px;
//     margin-bottom: 20px;
//   }
  
//   .progress-ring {
//     width: 80px;
//     height: 80px;
//     position: relative;
//     flex-shrink: 0;
//   }
  
//   .progress-bg {
//     fill: none;
//     stroke: var(--divider-color, #eaeaea);
//     stroke-width: 8;
//   }
  
//   .progress-circle {
//     fill: none;
//     stroke: var(--success-color, #2ecc71);
//     stroke-width: 8;
//     stroke-dasharray: 251.2; /* 2 * π * 40 */
//     transform: rotate(-90deg);
//     transform-origin: 50% 50%;
//     transition: stroke-dashoffset 0.5s;
//   }
  
//   .progress-text {
//     font-size: 16px;
//     font-weight: bold;
//     text-anchor: middle;
//     dominant-baseline: middle;
//     fill: var(--text-color, #333);
//   }
  
//   .rate-message {
//     font-size: 14px;
//   }
  
//   h5 {
//     font-size: 14px;
//     margin: 0 0 12px 0;
//   }
  
//   .goals-container {
//     display: flex;
//     flex-direction: column;
//     gap: 12px;
//   }
  
//   .goal-item {
//     display: flex;
//     flex-direction: column;
//     gap: 4px;
//   }
  
//   .goal-header {
//     display: flex;
//     justify-content: space-between;
//     font-size: 12px;
//   }
  
//   .goal-progress-container {
//     height: 12px;
//     border-radius: 4px;
//     background-color: var(--divider-color, #eaeaea);
//     overflow: hidden;
//   }
  
//   .goal-progress {
//     height: 100%;
//     background-color: var(--success-color, #2ecc71);
//     border-radius: 4px;
//   }
// `;

// // Net Worth Chart Component
// @customElement({
//   name: "net-worth-chart",
//   template: netWorthChartTemplate,
//   styles: netWorthChartStyles
// })
// export class NetWorthChart extends FASTElement {
//   @observable accountTypeData: any[] = [];
  
//   renderAccountBars() {
//     return this.accountTypeData.map(item => 
//       `<div style="width: ${item.percentage}%; background-color: ${item.color}"></div>`
//     ).join('');
//   }
  
//   renderLegend() {
//     return this.accountTypeData.map(item => `
//       <div class="legend-item">
//         <span class="legend-color" style="background-color: ${item.color}"></span>
//         <span class="legend-label">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
//       </div>
//     `).join('');
//   }
// }

// // Monthly Spending Chart Component
// @customElement({
//   name: "monthly-spending-chart",
//   template: monthlySpendingChartTemplate,
//   styles: monthlySpendingChartStyles
// })
// export class MonthlySpendingChart extends FASTElement {
//   @observable dataPoints: DataPoint[] = [];
//   @attr trend: 'up' | 'down' | 'flat' = 'flat';
//   @attr trendMessage: string = '';
  
//   calculatePoints() {
//     if (!this.dataPoints.length) return '';
    
//     const width = 300;
//     const height = 100;
//     const pointGap = width / (this.dataPoints.length - 1);
    
//     // Find max value for scaling
//     const maxValue = Math.max(...this.dataPoints.map(p => p.value), 1);
    
//     return this.dataPoints
//       .map((point, i) => {
//         const x = i * pointGap;
//         // Scale y value (0 is top in SVG)
//         const y = height - ((point.value / maxValue) * height * 0.8 + 10);
//         return `${x},${y}`;
//       })
//       .join(' ');
//   }
  
//   renderMonthLabels() {
//     return this.dataPoints.map(point => 
//       `<div>${point.month}</div>`
//     ).join('');
//   }
// }

// // Expense Categories Chart Component
// @customElement({
//   name: "expense-categories-chart",
//   template: expenseCategoriesChartTemplate,
//   styles: expenseCategoriesChartStyles
// })
// export class ExpenseCategoriesChart extends FASTElement {
//   @observable categories: CategoryExpense[] = [];
//   @observable maxCategories: number = 4;
  
//   renderCategoryBars() {
//     const topCategories = [...this.categories]
//       .sort((a, b) => b.amount - a.amount)
//       .slice(0, this.maxCategories);
      
//     return topCategories.map(category => `
//       <div class="category-item">
//         <div class="category-header">
//           <div>${category.category}</div>
//           <div>${this.formatCurrency(category.amount)} (${Math.round(category.percentage)}%)</div>
//         </div>
//         <div class="category-bar-container">
//           <div class="category-bar" style="width: ${category.percentage}%; background-color: ${category.color}"></div>
//         </div>
//       </div>
//     `).join('');
//   }
  
//   formatCurrency(value: number): string {
//     return value.toLocaleString(undefined, { 
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0 
//     });
//   }
// }

// // Savings Rate Chart Component
// @customElement({
//   name: "savings-rate-chart",
//   template: savingsRateChartTemplate,
//   styles: savingsRateChartStyles
// })
// export class SavingsRateChart extends FASTElement {
//   @attr rate: number = 0;
//   @observable goals: SavingsGoal[] = [];
  
//   getProgressOffset(): number {
//     const circumference = 2 * Math.PI * 40;
//     return circumference * (1 - this.rate / 100);
//   }
  
//   getSavingsRateMessage(): string {
//     if (this.rate >= 20) {
//       return "Excellent savings rate! You're on track for financial independence.";
//     } else if (this.rate >= 10) {
//       return "Good savings rate. You're building a solid financial foundation.";
//     } else if (this.rate > 0) {
//       return "You're saving, but try to increase your rate to at least 10%.";
//     } else {
//       return "You're spending more than you earn. Try to reduce expenses.";
//     }
//   }
  
//   renderSavingsGoals() {
//     return this.goals.map(goal => `
//       <div class="goal-item">
//         <div class="goal-header">
//           <div>${goal.label}</div>
//           <div>${this.formatCurrency(goal.amount)} / ${this.formatCurrency(goal.target)}</div>
//         </div>
//         <div class="goal-progress-container">
//           <div class="goal-progress" style="width: ${goal.percentage}%"></div>
//         </div>
//       </div>
//     `).join('');
//   }
  
//   formatCurrency(value: number): string {
//     return value.toLocaleString(undefined, { 
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0 
//     });
//   }
// }
