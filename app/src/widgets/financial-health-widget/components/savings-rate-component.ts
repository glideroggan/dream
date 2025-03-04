import { FASTElement, customElement, html, css, attr, observable, repeat } from "@microsoft/fast-element";

export interface SavingsGoal {
  label: string;
  amount: number;
  target: number;
  percentage: number;
}

const template = html<SavingsRateComponent>/*html*/ `
  <div class="section savings-section">
    <h4>Savings Rate</h4>
    <div class="savings-rate-container">
      <div class="progress-ring">
        <svg viewBox="0 0 100 100">
          <circle class="progress-ring-circle-bg" cx="50" cy="50" r="40" />
          <circle class="progress-ring-circle" cx="50" cy="50" r="40"
                  stroke-dasharray="${x => 2 * Math.PI * 40}"
                  stroke-dashoffset="${x => 2 * Math.PI * 40 * (1 - x.rate / 100)}" />
          <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" class="progress-text">
            ${x => Math.round(x.rate)}%
          </text>
        </svg>
      </div>
      <div class="savings-rate-text">
        ${x => x.getSavingsRateMessage()}
      </div>
    </div>
    
    <div class="savings-goals">
      <h5>Savings Goals Progress</h5>
      <div class="goals-list">
        ${repeat(x => x.goals, html<SavingsGoal>/*html*/`
          <div class="goal-item">
            <div class="goal-label">${x => x.label}</div>
            <div class="goal-progress-container">
              <div class="goal-progress-bar">
                <div class="goal-progress" style="width: ${x => x.percentage}%;"></div>
              </div>
              <div class="goal-amount">${(x, c) => c.parent.formatCurrency(x.amount)} / ${(x, c) => c.parent.formatCurrency(x.target)}</div>
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
  
  .progress-ring {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }
  
  .progress-ring-circle-bg {
    fill: none;
    stroke: var(--divider-color, #eaeaea);
    stroke-width: 8;
  }
  
  .progress-ring-circle {
    fill: none;
    stroke: var(--success-color, #2ecc71);
    stroke-width: 8;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 0.5s ease;
  }
  
  .progress-text {
    font-size: 14px;
    font-weight: bold;
    fill: var(--text-color, #333);
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
    gap: 12px;
  }
  
  .goal-item {
    display: flex;
    flex-direction: column;
  }
  
  .goal-label {
    font-size: 12px;
    color: var(--secondary-text, #666);
    margin-bottom: 4px;
  }
  
  .goal-progress-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .goal-progress-bar {
    height: 12px;
    border-radius: 4px;
    flex-grow: 1;
    background-color: var(--divider-color, #eaeaea);
    position: relative;
  }
  
  .goal-progress {
    height: 100%;
    border-radius: 4px;
    background-color: var(--success-color, #2ecc71);
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .goal-amount {
    font-size: 12px;
    color: var(--secondary-text, #666);
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

  /**
   * Get message for savings rate
   */
  getSavingsRateMessage(): string {
    if (this.rate >= 20) {
      return "Excellent savings rate! You're on track for financial independence.";
    } else if (this.rate >= 10) {
      return "Good savings rate. You're building a solid financial foundation.";
    } else if (this.rate > 0) {
      return "You're saving, but try to increase your rate to at least 10%.";
    } else {
      return "You're spending more than you earn. Try to reduce expenses.";
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
