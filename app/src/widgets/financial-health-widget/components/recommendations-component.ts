import { FASTElement, customElement, html, css, observable, when } from "@microsoft/fast-element";

const template = html<RecommendationsComponent>/*html*/ `
  <div class="recommendations-container">
    ${when(x => x.recommendations.length > 0, html<RecommendationsComponent>`
      <div class="recommendations-list">
        <div class="recommendation-item">${x => x.recommendations[0]}</div>
        ${when(x => x.recommendations.length > 1, html<RecommendationsComponent>`
          <div class="more-recommendations">
            +${x => x.recommendations.length - 1} more recommendation${x => x.recommendations.length > 2 ? 's' : ''}
          </div>
        `)}
      </div>
    `)}
    
    ${when(x => x.recommendations.length === 0, html<RecommendationsComponent>`
      <div class="no-recommendations">No recommendations at this time. Keep up the good work!</div>
    `)}
  </div>
`;

const styles = css`
  .recommendations-container {
    width: 100%;
  }
  
  .recommendations-list {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .recommendation-item {
    font-size: 13px;
    flex-grow: 1;
    padding: 4px 0;
  }
  
  .more-recommendations {
    font-size: 12px;
    color: var(--accent-color, #3498db);
    background-color: color-mix(in srgb, var(--background-color) 80%, var(--accent-color) 20%);
    border: 1px solid var(--border-color, #e0e0e0);
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .no-recommendations {
    color: var(--secondary-text-color, #666);
    font-style: italic;
    padding: 4px 0;
    font-size: 13px;
  }
  
  @media (max-width: 600px) {
    .recommendations-list {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    
    .recommendation-item {
      width: 100%;
    }
    
    .more-recommendations {
      align-self: flex-end;
    }
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
