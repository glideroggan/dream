import { FASTElement, customElement, html, css, attr, observable, repeat } from "@microsoft/fast-element";

// Interfaces for account type visualization
export interface AccountTypeData {
  type: string;
  balance: number;
  color: string;
  percentage: number;
}

export interface AccountTypeMapItem {
  type: string;
  color: string;
}

const template = html<NetWorthComponent>/*html*/ `
  <div class="section net-worth-section">
    <h4>Net Worth Summary</h4>
    <div class="net-worth-value" style="color: ${x => x.netWorth >= 0 ? 'var(--success-color, #2ecc71)' : 'var(--error-color, #e74c3c)'}">
      ${x => x.formatCurrency(x.netWorth)} ${x => x.currency}
    </div>
    <div class="net-worth-details">
      <div class="detail-item">
        <span class="detail-label">Assets:</span>
        <span class="detail-value positive">${x => x.formatCurrency(x.totalAssets)} ${x => x.currency}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Liabilities:</span>
        <span class="detail-value negative">${x => x.formatCurrency(x.totalLiabilities)} ${x => x.currency}</span>
      </div>
    </div>
    
    <div class="accounts-summary">
      <div class="account-type-bar">
        ${repeat(x => x.accountTypeData, html<AccountTypeData>/*html*/`
          <div style="width: ${x => x.percentage}%; background-color: ${x => x.color}"></div>
        `)}
      </div>
      <div class="account-type-legend">
        ${repeat(x => x.accountTypeLegendItems, html<AccountTypeMapItem>/*html*/`
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${x => x.color}"></span>
            <span class="legend-label">${x => x.type.charAt(0).toUpperCase() + x.type.slice(1)}</span>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

const styles = css`
  .net-worth-section {
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
  
  .net-worth-value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .net-worth-details {
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  
  .detail-label {
    color: var(--secondary-text, #666);
  }
  
  .positive {
    color: var(--success-color, #2ecc71);
  }
  
  .negative {
    color: var(--error-color, #e74c3c);
  }
  
  /* Account Type Bar */
  .accounts-summary {
    margin-top: 16px;
  }
  
  .account-type-bar {
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    margin-bottom: 8px;
  }
  
  .account-type-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    margin-right: 4px;
  }
`;

@customElement({
  name: "net-worth-component",
  template,
  styles
})
export class NetWorthComponent extends FASTElement {
  @attr netWorth: number = 0;
  @attr totalAssets: number = 0;
  @attr totalLiabilities: number = 0;
  @attr currency: string = 'USD';

  @observable accountTypeData: AccountTypeData[] = [];
  @observable accountTypeLegendItems: AccountTypeMapItem[] = [];

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
