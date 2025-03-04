import { FASTElement, customElement, html, css, attr } from "@microsoft/fast-element";

const template = html<HealthScoreComponent>/*html*/ `
  <div class="health-score">
    <div class="score-pill" style="background-color: ${x => x.getHealthScoreColor()}">
      ${x => x.score}/100
    </div>
  </div>
`;

const styles = css`
  .health-score {
    display: flex;
    align-items: center;
  }
  
  .score-pill {
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    color: white;
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
      return 'var(--success-color, #2ecc71)';
    } else if (this.score >= 60) {
      return 'var(--warning-color, #f39c12)';
    } else {
      return 'var(--error-color, #e74c3c)';
    }
  }
}
