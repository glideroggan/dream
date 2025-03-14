import { FASTElement, customElement, html, css, attr, observable, repeat } from "@microsoft/fast-element";
import Chart from 'chart.js/auto';

export interface SavingsGoal {
  label: string;
  amount: number;
  target: number;
  percentage: number;
}

const template = html<SavingsRateComponent>/*html*/ `
  <div class="savings-rate-container">
    <div class="savings-rate-header">
      <div class="rate-chart-container">
        <canvas id="savings-rate-canvas"></canvas>
        <div class="rate-text">${x => Math.round(x.rate)}%</div>
      </div>
      <div class="savings-message">${x => x.getSavingsRateMessage()}</div>
    </div>
    
    <div class="savings-goals">
      <h5>Goals Progress</h5>
      <div class="goals-list">
        ${repeat(x => x.goals.slice(0, 2), html<SavingsGoal, SavingsRateComponent>/*html*/`
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
  .savings-rate-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .savings-rate-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }
  
  /* Savings Rate Ring */
  .rate-chart-container {
    width: 56px;
    height: 56px;
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
    color: var(--primary-text-color, #333);
  }
  
  .savings-message {
    font-size: 13px;
    flex: 1;
    min-width: 0;
  }
  
  /* Savings Goals */
  .savings-goals {
    margin-top: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  h5 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: var(--secondary-text-color, #555);
  }
  
  .goals-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }
  
  .goal-item {
    display: flex;
    flex-direction: column;
  }
  
  .goal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .goal-label {
    font-size: 13px;
    color: var(--primary-text-color, #333);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }
  
  .goal-amount {
    font-size: 12px;
    color: var(--secondary-text-color, #666);
    white-space: nowrap;
  }
  
  .goal-progress-container {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .goal-progress-bar {
    flex-grow: 1;
    height: 6px;
    background-color: var(--divider-color, #eaeaea);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .goal-progress-fill {
    height: 100%;
    background-color: var(--accent-color, #2ecc71);
    border-radius: 3px;
    transition: width 0.5s ease;
  }
  
  .goal-percentage {
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-text-color, #333);
    min-width: 36px;
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
        backgroundColor: [
          this.getSavingsRateColor(),
          '#eaeaea'
        ],
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
      return 'var(--accent-color, #2ecc71)';
    } else if (this.rate >= 10) {
      return 'var(--primary-color, #3498db)';
    } else if (this.rate > 0) {
      return 'var(--secondary-color, #f39c12)';
    } else {
      return 'var(--notification-badge-bg, #e74c3c)';
    }
  }

  /**
   * Get message for savings rate
   */
  getSavingsRateMessage(): string {
    if (this.rate >= 20) {
      return "Excellent! Your 20%+ savings rate is building wealth for the future.";
    } else if (this.rate >= 10) {
      return "Good job! Your 10-20% savings rate builds a solid financial foundation.";
    } else if (this.rate > 0) {
      return "You're making progress. Try to increase to at least 10% for better security.";
    } else {
      return "Focus on reducing expenses or increasing income to start saving.";
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
