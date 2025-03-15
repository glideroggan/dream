import { customElement, FASTElement, html, css, observable, when } from "@microsoft/fast-element";
import { getProductService } from "../services/user-product-service";
import { SwishProduct } from "../workflows/swish-workflow";
import { BaseWidget } from "../components/base-widget";

const template = html<SwishWidget>/*html*/`
  <div class="swish-widget">
    <div class="widget-content">
      ${when(x => x.isLoading, html`
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading Swish...</p>
        </div>
      `, html`
        <div class="swish-info">
          <div class="subscription-info">
            <div class="subscription-badge">Premium</div>
          </div>
          
          <div class="swish-actions">
            <button class="transfer-button" @click="${x => x.startSwishTransfer()}">
              <span class="button-icon">↗</span>
              Send Money
            </button>
            <button class="history-button" @click="${x => x.viewTransactionHistory()}">
              <span class="button-icon">⏱</span>
              History
            </button>
          </div>
          
          <div class="quick-stats">
            <div class="stat">
              <div class="stat-label">Last Transfer</div>
              <div class="stat-value">${x => x.lastTransferAmount}</div>
              <div class="stat-date">${x => x.lastTransferDate}</div>
            </div>
          </div>
        </div>
        
        <div class="widget-footer">
          <button class="manage-button" @click="${x => x.manageSubscription()}">
            Manage Subscription
          </button>
        </div>
      `)}
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    border-radius: inherit;
    overflow: hidden;
    --widget-accent-color: #4a90e2;
    --widget-accent-hover: #3a80d2;
  }

  .swish-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--widget-background, #ffffff);
    color: var(--widget-text-color, #333333);
  }

  .widget-content {
    flex: 1;
    padding: var(--widget-content-padding, 16px);
    display: flex;
    flex-direction: column;
  }
  
  .subscription-info {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }

  .subscription-badge {
    background-color: var(--widget-accent-color, #4a90e2);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100px;
    color: var(--widget-subtle-text, #666);
  }
  
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--widget-accent-color, #4a90e2);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .swish-info {
    flex: 1;
  }

  .swish-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
  }

  .transfer-button {
    background-color: var(--widget-accent-color, #4a90e2);
    color: white;
    flex: 1;
  }

  .transfer-button:hover {
    background-color: var(--widget-accent-hover, #3a80d2);
  }

  .history-button {
    background-color: var(--widget-secondary-color, #f0f0f0);
    color: var(--widget-secondary-text, #333);
    flex: 1;
  }

  .history-button:hover {
    background-color: var(--widget-secondary-hover, #e0e0e0);
  }

  .button-icon {
    font-size: 16px;
  }

  .quick-stats {
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
    padding: 12px;
    margin-top: 12px;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat-label {
    font-size: 12px;
    color: var(--widget-subtle-text, #666);
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    margin: 4px 0;
  }

  .stat-date {
    font-size: 12px;
    color: var(--widget-subtle-text, #666);
  }

  .widget-footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--widget-divider-color, #eee);
    text-align: center;
  }

  .manage-button {
    background: transparent;
    color: var(--widget-accent-color, #4a90e2);
    border: 1px solid var(--widget-accent-color, #4a90e2);
    width: 100%;
    justify-content: center;
  }

  .manage-button:hover {
    background-color: rgba(74, 144, 226, 0.05);
  }
`;

@customElement({
  name: "swish-widget",
  template,
  styles
})
export class SwishWidget extends BaseWidget {
  @observable swishProduct: SwishProduct | null = null;
  @observable lastTransferAmount: string = "$0.00";
  @observable lastTransferDate: string = "No transfers yet";

  connectedCallback(): void {
    super.connectedCallback();
    this.loadProductData();

    this.lastTransferAmount = "$25.00";
    this.lastTransferDate = "Yesterday";

    this.notifyInitialized()
    setTimeout(() => this.notifyContentChanged(), 50)
  }

  private async loadProductData(): Promise<void> {
    try {
      const productService = getProductService();
      // Use the typed getProduct<T> method to get the SwishProduct
      const swishProduct = await productService.getProduct<SwishProduct>("swish-standard");

      if (swishProduct) {
        this.swishProduct = swishProduct;
      } else {
        console.warn("Swish product not found in user's products");
      }
    } catch (error) {
      this.handleError("Failed to load Swish product data");
    }
  }

  startSwishTransfer(): void {
    console.debug("Starting Swish transfer workflow");

    // Use the BaseWidget method
    this.startWorkflow("transfer", {
      service: "swish",
      source: "widget"
    });
  }

  viewTransactionHistory(): void {
    console.debug("View transaction history");
    // This would open transaction history view
    // To be implemented
  }

  manageSubscription(): void {
    console.debug("Managing Swish subscription");

    // Use the BaseWidget method
    this.startWorkflow("manage-subscription", {
      productId: "swish-standard",
      source: "widget"
    });
  }
}
