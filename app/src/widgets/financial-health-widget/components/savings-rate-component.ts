import { FASTElement, customElement, html, css, attr, observable, repeat } from "@microsoft/fast-element";
import Chart from 'chart.js/auto';

export interface SavingsGoal {
  label: string;
  amount: number;
  target: number;
  percentage: number;
}

const template = html<SavingsRateComponent>/*html*/ `
  <div class="section savings-section">
    <div class="savings-rate-container">
      <div class="rate-chart-container">
        <canvas id="savings-rate-canvas"></canvas>
        <div class="rate-text">${x => Math.round(x.rate)}%</div>
      </div>
      <div class="savings-rate-text">
        ${x => x.getSavingsRateMessage()}
      </div>
    </div>
    
    <div class="savings-goals">
      <h5>Savings Goals Progress</h5>
      <div class="goals-list">
        ${repeat(x => x.goals, html<SavingsGoal, SavingsRateComponent>/*html*/`
          <div class="goal-item">
            <div class="goal-header">
              <div class="goal-label">${x => x.label}</div>
              <div class="goal-amount">${(x, c) => c.parent.formatCurrency(x.amount)} / ${(x, c) => c.parent.formatCurrency(x.target)}</div>
            </div>
            <div class="goal-progress-container">
              <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width: ${x => Math.min(x.percentage, 100)}%"></div>
              </div>
              <div class="goal-percentage">${x => Math.round(x.percentage)}%</div>
            </div>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

const styles = css`
  .savings-section {
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
  
  /* Savings Rate Ring */
  .savings-rate-container {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .rate-chart-container {
    width: 80px;
    height: 80px;
    position: relative;
    flex-shrink: 0;
  }
  
  .rate-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    font-weight: bold;
    color: var(--text-color, #333);
  }
  
  .savings-rate-text {
    font-size: 14px;
    flex-grow: 1;
  }
  
  /* Savings Goals */
  .savings-goals {
    margin-top: 16px;
  }
  
  .goals-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .goal-item {
    display: flex;
    flex-direction: column;
    padding: 10px 0;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  .goal-item:last-child {
    border-bottom: none;
  }
  
  .goal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .goal-label {
    font-size: 14px;
    color: var(--text-color, #333);
    font-weight: 500;
  }
  
  .goal-amount {
    font-size: 14px;
    color: var(--secondary-text, #666);
  }
  
  .goal-progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .goal-progress-bar {
    flex-grow: 1;
    height: 8px;
    background-color: var(--divider-color, #eaeaea);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .goal-progress-fill {
    height: 100%;
    background-color: var(--success-color, #2ecc71);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .goal-percentage {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color, #333);
    min-width: 40px;
    text-align: right;
  }
`;

@customElement({
  name: "savings-rate-component",
  template,
  styles
})
export class SavingsRateComponent extends FASTElement {

  @attr rate: number = 0;
  @attr currency: string = 'USD';
  @observable goals: SavingsGoal[] = [];
  
  private rateChart: Chart | null = null;
  private goalCharts: Chart[] = [];

  async connectedCallback() {
    super.connectedCallback();
    // Allow time for properties to be bound
    setTimeout(() => this.loadCharts(), 50);
  }

  async loadCharts() {
    // Wait for shadowRoot to be available
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Create the savings rate doughnut chart
    await this.createRateChart();
    
    // Create goal progress bar charts
    await this.createGoalCharts();
  }

  async createRateChart() {
    const canvas = this.shadowRoot?.getElementById('savings-rate-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Destroy previous chart if it exists
    if (this.rateChart) {
      this.rateChart.destroy();
    }
    
    // Prepare data for doughnut chart
    const data = {
      datasets: [{
        data: [this.rate, 100 - this.rate],
//         backgroundColor: [
//             this.getSavingsRateColor(),
//             'var(--divider-color, #eaeaea)'
//         ],
        borderWidth: 0,
        cutout: '75%',
        circumference: 360,
        rotation: -90
      }]
    };
    
    // Create new chart
    this.rateChart = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            enabled: false
          },
          legend: {
            display: false
          }
        }
      }
    });
  }

  async createGoalCharts() {
    // Destroy previous goal charts
    this.goalCharts.forEach(chart => chart.destroy());
    this.goalCharts = [];
    
    // Create a new chart for each goal
    for (let i = 0; i < this.goals.length; i++) {
      const container = this.shadowRoot?.getElementById(`goal-chart-${i}`);
      if (!container) continue;
      
      // Create canvas element
      const canvas = document.createElement('canvas');
      canvas.id = `goal-canvas-${i}`;
      canvas.style.width = '100%';
      canvas.style.height = '12px';
      container.innerHTML = '';
      container.appendChild(canvas);
      
      const goal = this.goals[i];
      
      // Prepare data for progress bar chart
      const data = {
        datasets: [{
          data: [goal.percentage, 100 - goal.percentage],
          backgroundColor: [
            'var(--success-color, #2ecc71)',
            'var(--divider-color, #eaeaea)'
          ],
          borderWidth: 0,
          borderRadius: 4
        }]
      };
      
      // Create new chart
      const chart = new Chart(canvas, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            tooltip: {
              enabled: false
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              display: false,
              min: 0,
              max: 100,
              stacked: true
            },
            y: {
              display: false,
              stacked: true
            }
          }
        }
      });
      
      this.goalCharts.push(chart);
    }
  }

  getSavingsRateColor(): string {
    if (this.rate >= 20) {
      return 'var(--success-color, #2ecc71)';
    } else if (this.rate >= 10) {
      return 'var(--primary-color, #3498db)';
    } else if (this.rate > 0) {
      return 'var(--warning-color, #f39c12)';
    } else {
      return 'var(--error-color, #e74c3c)';
    }
  }

  /**
   * Get message for savings rate
   */
  getSavingsRateMessage(): string {
    if (this.rate >= 20) {
      return "Excellent! You're saving 20%+ of your income. You're on track for financial independence and building wealth for the future.";
    } else if (this.rate >= 10) {
      return "Good job! Saving 10-20% of your income is building a solid financial foundation. Consider increasing this rate over time.";
    } else if (this.rate > 0) {
      return "You're making progress by saving some of your income. Try to increase your savings rate to at least 10% for better financial security.";
    } else {
      return "You're currently not allocating any income to savings or investments. Focus on reducing expenses or increasing income to start saving.";
    }
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
