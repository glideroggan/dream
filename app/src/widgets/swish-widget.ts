import { customElement, FASTElement, html, css, observable } from "@microsoft/fast-element";
import { getProductService } from "../services/product-service";
import { SwishProduct } from "../workflows/swish-workflow";

const template = html<SwishWidget>/*html*/`
  <div class="swish-widget">
    <div class="widget-header">
      <h3>Swish</h3>
      <div class="subscription-badge">Premium</div>
    </div>

    <div class="widget-content">
      ${(x) => x.isLoading ? html`
        <div class="loading">Loading...</div>
      ` : html`
        <div class="swish-info">
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
      `}
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }

  .swish-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .widget-header {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .subscription-badge {
    background-color: rgba(255,255,255,0.2);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .widget-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    color: #666;
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
    background-color: #3498db;
    color: white;
    flex: 1;
  }

  .transfer-button:hover {
    background-color: #2980b9;
  }

  .history-button {
    background-color: #f0f0f0;
    color: #333;
    flex: 1;
  }

  .history-button:hover {
    background-color: #e0e0e0;
  }

  .button-icon {
    font-size: 16px;
  }

  .quick-stats {
    background-color: #f9f9f9;
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
    color: #666;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    margin: 4px 0;
  }

  .stat-date {
    font-size: 12px;
    color: #666;
  }

  .widget-footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #eee;
    text-align: center;
  }

  .manage-button {
    background: transparent;
    color: #3498db;
    border: 1px solid #3498db;
    width: 100%;
    justify-content: center;
  }

  .manage-button:hover {
    background-color: rgba(52, 152, 219, 0.05);
  }
`;

@customElement({
  name: "swish-widget",
  template,
  styles
})
export class SwishWidget extends FASTElement {
  @observable swishProduct: SwishProduct | null = null;
  @observable isLoading: boolean = true;
  @observable lastTransferAmount: string = "$0.00";
  @observable lastTransferDate: string = "No transfers yet";

  connectedCallback(): void {
    super.connectedCallback();
    this.loadProductData();

    this.lastTransferAmount = "$25.00";
    this.lastTransferDate = "Yesterday";

    // Simulate loading with a small delay
    // setTimeout(() => {
    //   this.isLoading = false;
    //   // Set some demo data
    //   this.lastTransferAmount = "$25.00";
    //   this.lastTransferDate = "Yesterday";
    // }, 800);
    // Signal that the widget is initialized
    this.isLoading = false;
    this.dispatchEvent(new CustomEvent('initialized', {
      bubbles: true,
      composed: true
    }));

  }

  private async loadProductData(): Promise<void> {
    const productService = getProductService();
    // Use the typed getProduct<T> method to get the SwishProduct
    const swishProduct = await productService.getProduct<SwishProduct>("swish-standard");

    if (swishProduct) {
      this.swishProduct = swishProduct;
    } else {
      console.warn("Swish product not found in user's products");
    }
  }

  startSwishTransfer(): void {
    console.debug("Starting Swish transfer workflow");

    // Dispatch event to start the workflow
    const event = new CustomEvent("start-workflow", {
      bubbles: true,
      composed: true,
      detail: {
        workflowId: "transfer",
        params: {
          service: "swish",
          source: "widget"
        }
      }
    });

    this.dispatchEvent(event);
  }

  viewTransactionHistory(): void {
    console.debug("View transaction history");
    // This would open transaction history view
    // To be implemented
  }

  manageSubscription(): void {
    console.debug("Managing Swish subscription");

    // This would open a workflow to manage the subscription
    const event = new CustomEvent("start-workflow", {
      bubbles: true,
      composed: true,
      detail: {
        workflowId: "manage-subscription",
        params: {
          productId: "swish-standard",
          source: "widget"
        }
      }
    });

    this.dispatchEvent(event);
  }
}
