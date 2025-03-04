import { FASTElement, customElement, html, css, observable, repeat } from "@microsoft/fast-element";

export interface CategoryItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const template = html<CategoryChart>/*html*/ `
  <div class="category-chart">
    ${repeat(x => x.categories.slice(0, x.maxCategories), html<CategoryItem>/*html*/`
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
`;

const styles = css`
  .category-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
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
    transition: width 0.5s ease;
  }
`;

@customElement({
  name: "category-chart",
  template,
  styles
})
export class CategoryChart extends FASTElement {
  @observable categories: CategoryItem[] = [];
  @observable maxCategories: number = 5;
  
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
