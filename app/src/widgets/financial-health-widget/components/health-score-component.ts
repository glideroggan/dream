import { FASTElement, customElement, html, css, attr } from "@microsoft/fast-element";

const template = html<HealthScoreComponent>/*html*/ `
  <div class="health-score" title="${x => x.getHealthScoreDescription()}">
    <div class="score-container">
      <svg viewBox="0 0 36 36" class="score-circle">
        <path class="score-circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"/>
        <path class="score-circle-progress"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              style="stroke-dasharray: ${x => x.score}, 100;"/>
      </svg>
      <div class="score-value">${x => x.score}</div>
    </div>
  </div>
`;

const styles = css`
  .health-score {
    display: flex;
    align-items: center;
  }
  
  .score-container {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .score-value {
    position: absolute;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-text-color, #333);
    z-index: 2;
  }
  
  .score-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  
  .score-circle-bg {
    fill: none;
    stroke: var(--divider-color, #eaeaea);
    stroke-width: 3;
  }
  
  .score-circle-progress {
    fill: none;
    stroke: var(--score-color, var(--accent-color, #2ecc71));
    stroke-width: 3.8;
    stroke-linecap: round;
    transition: stroke-dasharray 0.8s ease;
    animation: progress 1s ease-in-out forwards;
  }
  
  @keyframes progress {
    0% {
      stroke-dasharray: 0, 100;
    }
  }
`;

@customElement({
  name: "health-score-component",
  template,
  styles
})
export class HealthScoreComponent extends FASTElement {
  @attr score: number = 0;

  /**
   * Get color for health score display
   */
  getHealthScoreColor(): string {
    if (this.score >= 80) {
      return 'var(--accent-color, #2ecc71)';
    } else if (this.score >= 60) {
      return 'var(--secondary-color, #f39c12)';
    } else {
      return 'var(--notification-badge-bg, #e74c3c)';
    }
  }
  
  /**
   * Get descriptive text based on score
   */
  getHealthScoreDescription(): string {
    if (this.score >= 90) {
      return 'Excellent Financial Health';
    } else if (this.score >= 80) {
      return 'Very Good Financial Health';
    } else if (this.score >= 70) {
      return 'Good Financial Health';
    } else if (this.score >= 60) {
      return 'Fair Financial Health';
    } else if (this.score >= 50) {
      return 'Financial Health Needs Attention';
    } else {
      return 'Financial Health Needs Improvement';
    }
  }
  
  connectedCallback(): void {
    super.connectedCallback();
    
    // Apply the health score color as a CSS variable
    this.style.setProperty('--score-color', this.getHealthScoreColor());
  }
  
  scoreChanged(): void {
    // Update the score color when the score changes
    if (this.isConnected) {
      this.style.setProperty('--score-color', this.getHealthScoreColor());
    }
  }
}
