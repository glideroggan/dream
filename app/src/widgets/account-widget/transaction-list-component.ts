import { FASTElement, customElement, html, css, observable, repeat, when } from "@microsoft/fast-element";
import { Transaction } from "../../services/repository-service";
import { TransactionViewModelHelper } from "./transaction-view-model-helper";

// The enhanced transaction interface to hold display properties
export interface TransactionViewModel extends Transaction {
  amountClass: string;
  formattedAmount: string;
  formattedBalance?: string;
  isIncoming: boolean;
}

const template = html<TransactionListComponent>/*html*/ `
  <div class="transactions-container">
    <div class="transactions-header">
      <h4>Recent Transactions</h4>
    </div>

    ${when(x => x.isLoading, html<TransactionListComponent>/*html*/`
      <div class="transactions-loading">
        <div class="mini-spinner"></div>
        <span>Loading transactions...</span>
      </div>
    `)}

    ${when(x => !x.isLoading && x.transactions.length === 0, html<TransactionListComponent>/*html*/`
      <div class="no-transactions">
        <p>No transactions found for this account.</p>
      </div>
    `)}

    ${when(x => !x.isLoading && x.transactions.length > 0, html<TransactionListComponent>/*html*/`
      <div class="transactions-list">
        ${repeat(x => x.transactions.slice(0, x.maxToShow), html<TransactionViewModel, TransactionListComponent>/*html*/`
          <div class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-description">${x => x.description || 'Transaction'}</div>
              <div class="transaction-date">${x => new Date(x.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="transaction-details">
              <div class="transaction-amount ${x => x.amountClass}">
                ${x => x.formattedAmount}
              </div>
              ${when(x => x.formattedBalance, html<TransactionViewModel>/*html*/`
                <div class="transaction-balance">
                  Balance: ${x => x.formattedBalance}
                </div>
              `)}
            </div>
          </div>
        `)}
        
        ${when(x => x.transactions.length > x.maxToShow, html<TransactionListComponent>/*html*/`
          <div class="show-more">
            <button class="show-more-button" @click="${x => x.handleShowMore()}">Show more</button>
          </div>
        `)}
      </div>
    `)}
  </div>
`;

const styles = css`
  .transactions-container {
    overflow: hidden;
    background-color: var(--background-light, #f9f9f9);
    animation: slideDown 0.3s forwards;
  }
  
  @keyframes slideDown {
    from { max-height: 0; opacity: 0; }
    to { max-height: 500px; opacity: 1; }
  }
  
  .transactions-header {
    padding: 8px 16px;
    background-color: var(--background-secondary, #f5f5f5);
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  .transactions-header h4 {
    margin: 0;
    font-size: 14px;
    color: var(--secondary-text, #666);
  }
  
  .transactions-list {
    padding: 0 8px;
  }
  
  .transaction-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 8px;
    border-bottom: 1px solid var(--divider-light, #f0f0f0);
  }
  
  .transaction-item:last-child {
    border-bottom: none;
  }
  
  .transaction-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .transaction-description {
    font-size: 13px;
    margin-bottom: 2px;
  }
  
  .transaction-date {
    font-size: 12px;
    color: var(--tertiary-text, #999);
  }
  
  .transaction-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .transaction-amount {
    font-weight: 500;
  }
  
  .transaction-amount.incoming {
    color: var(--success-color, #2ecc71);
  }
  
  .transaction-amount.outgoing {
    color: var(--warning-color, #e67e22);
  }
  
  .transaction-balance {
    font-size: 11px;
    color: var(--tertiary-text, #777);
    margin-top: 2px;
  }
  
  .transactions-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  
  .mini-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .no-transactions {
    padding: 16px;
    text-align: center;
    color: var(--tertiary-text, #999);
    font-style: italic;
    font-size: 13px;
  }
  
  .show-more {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }
  
  .show-more-button {
    background: transparent;
    border: none;
    color: var(--primary-color, #3498db);
    cursor: pointer;
    font-size: 13px;
    text-decoration: underline;
  }
`;

@customElement({
  name: "transaction-list",
  template,
  styles
})
export class TransactionListComponent extends FASTElement {
  @observable accountId: string = "";
  @observable isLoading: boolean = false;
  @observable transactions: TransactionViewModel[] = [];
  @observable maxToShow: number = 3;
  
  handleShowMore() {
    this.dispatchEvent(new CustomEvent('show-more'));
  }
  
  /**
   * Process transactions to add display-specific properties
   * This method uses the TransactionViewModelHelper for consistency
   */
  processTransactionsForDisplay(transactions: Transaction[], accountId: string): TransactionViewModel[] {
    return TransactionViewModelHelper.processTransactions(transactions, accountId);
  }
}
