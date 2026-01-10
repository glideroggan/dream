import { customElement, FASTElement, html, css, observable, when } from "@microsoft/fast-element";
import "@primitives/button";
import { SwishProduct } from "../workflows/swish-workflow";
import { BaseWidget } from "../components/base-widget";
import { userProductService, UserProductService } from "../services/user-product-service";

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
            <dream-button variant="primary" @click="${x => x.startSwishTransfer()}">
              <span class="button-icon">↗</span>
              Send Money
            </dream-button>
            <dream-button variant="ghost" @click="${x => x.viewTransactionHistory()}">
              <span class="button-icon">⏱</span>
              History
            </dream-button>
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
          <dream-button variant="secondary" full-width @click="${x => x.manageSubscription()}">
            Manage Subscription
          </dream-button>
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
    background: var(--bg-gradient-widget, var(--widget-background, #ffffff));
    color: var(--widget-text-color, #333333);
    
    /* Elevation 2: widget containers */
    box-shadow: var(--elevation-2, 0 2px 8px rgba(0, 0, 0, 0.1));
    border: 1px solid rgba(30, 58, 76, 0.08);
    border-radius: 8px;
    
    /* Smooth hover lift */
    transition: box-shadow var(--duration-normal, 180ms) var(--easing-default, ease),
                transform var(--duration-normal, 180ms) var(--easing-default, ease);
  }
  
  .swish-widget:hover {
    box-shadow: var(--elevation-2-hover, 0 4px 12px rgba(0, 0, 0, 0.15));
    transform: translateY(-2px);
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

  .button-icon {
    font-size: 16px;
  }

  .quick-stats {
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
    
    /* Elevation 1 for internal cards */
    box-shadow: var(--elevation-1, 0 1px 3px rgba(0, 0, 0, 0.05));
    border: 1px solid rgba(30, 58, 76, 0.05);
    background: linear-gradient(
      135deg,
      rgba(247, 249, 247, 0.5) 0%,
      rgba(242, 246, 244, 0.3) 100%
    );
    
    transition: all var(--duration-normal, 180ms) var(--easing-default, ease);
  }
  
  .quick-stats:hover {
    box-shadow: var(--elevation-1-hover, 0 2px 6px rgba(0, 0, 0, 0.1));
    transform: translateY(-1px);
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
    
    /* 3D border highlight effect */
    box-shadow: var(--border-3d-highlight, inset 0 1px 0 rgba(255, 255, 255, 0.5));
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
      const swishProduct = await userProductService.getProduct<SwishProduct>("swish-standard");

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
