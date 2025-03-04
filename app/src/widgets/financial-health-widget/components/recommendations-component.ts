import { FASTElement, customElement, html, css, observable, repeat } from "@microsoft/fast-element";

const template = html<RecommendationsComponent>/*html*/ `
  <div class="section recommendations-section">
    <h4>Recommendations</h4>
    <div class="recommendations-list">
      ${repeat(x => x.recommendations.length > 0 ? x.recommendations : ['no-recommendations'], html<string, RecommendationsComponent>`
        ${(x, c) => x === 'no-recommendations' 
          ? html<RecommendationsComponent>`<div class="no-recommendations">No recommendations at this time. Keep up the good work!</div>`
          : html<RecommendationsComponent>`<div class="recommendation-item">${x}</div>`
        }
      `)}
    </div>
  </div>
`;

const styles = css`
  .recommendations-section {
    padding: 16px;
    background-color: var(--background-light, #f9f9f9);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: var(--secondary-text, #555);
  }
  
  .recommendations-list {
    font-size: 14px;
  }
  
  .recommendation-item {
    margin-bottom: 8px;
    padding: 8px 12px;
    background-color: var(--background-color, #fff);
    border-left: 3px solid var(--primary-color, #3498db);
    border-radius: 0 4px 4px 0;
  }
  
  .no-recommendations {
    color: var(--secondary-text, #666);
    font-style: italic;
    padding: 8px 0;
  }
`;

@customElement({
  name: "recommendations-component",
  template,
  styles
})
export class RecommendationsComponent extends FASTElement {
  @observable recommendations: string[] = [];
}
