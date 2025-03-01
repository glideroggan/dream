import { FASTElement, customElement, html, css, observable, repeat, when, attr } from "@microsoft/fast-element";
import { Account } from "../../services/repository-service";
import { TransactionViewModel } from "./transaction-list-component";
import "./transaction-list-component";

const template = html<AccountListComponent>/*html*/ `
  <div class="accounts-list">
    ${repeat(x => x.accounts, html<Account, AccountListComponent>/*html*/`
      <div class="account-item ${(x, c) => x.id === c.parent.expandedAccountId ? 'expanded' : ''}" 
           id="account-${x => x.id}">
        <div class="account-header" @click="${(x, c) => c.parent.handleAccountClick(x)}">
          <div class="account-info">
            <div class="account-name">${x => x.name}</div>
            <div class="account-type">${x => x.type}</div>
          </div>
          <div class="account-balance">
            <div class="balance-amount">${x => x.balance.toFixed(2)}</div>
            <div class="balance-currency">${x => x.currency}</div>
          </div>
          <div class="account-actions">
            <button class="more-button" @click="${(x, c) => c.parent.handleMoreClick(x, c.event)}" title="More Options">
              ⋮
            </button>
          </div>
        </div>
        
        ${when((x, c) => x.id === c.parent.expandedAccountId, html<Account, AccountListComponent>/*html*/`
          <transaction-list
            :accountId="${x => x.id}"
            :isLoading="${(x, c) => c.parent.isLoadingTransactions}"
            :transactions="${(x, c) => c.parent.accountTransactions}"
            :maxToShow="${(x, c) => c.parent.maxTransactionsToShow}"
            @show-more="${(x, c) => c.parent.handleShowMore()}">
          </transaction-list>
        `)}
      </div>
    `)}
  </div>
`;

const styles = css`
  .accounts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  }
  
  .account-item {
    border: 1px solid var(--divider-color, #eaeaea);
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .account-item.expanded {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .account-header {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    background-color: var(--background-light, #f9f9f9);
    transition: background-color 0.2s;
    align-items: center;
  }
  
  .account-header:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  }
  
  .account-info {
    flex: 1;
  }
  
  .account-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .account-type {
    font-size: 12px;
    color: var(--tertiary-text, #999);
  }
  
  .account-balance {
    text-align: right;
    margin: 0 16px;
  }
  
  .balance-amount {
    font-weight: 600;
    font-size: 16px;
  }
  
  .balance-currency {
    font-size: 12px;
    color: var(--tertiary-text, #999);
  }
  
  .account-actions {
    display: flex;
  }
  
  .more-button {
    background: transparent;
    border: none;
    font-size: 18px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    color: var(--secondary-text, #666);
  }
  
  .more-button:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .expanded .account-header {
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
`;

@customElement({
  name: "account-list",
  template,
  styles
})
export class AccountListComponent extends FASTElement {
  @observable accounts: Account[] = [];
  @observable expandedAccountId: string | null = null;
  @observable isLoadingTransactions: boolean = false;
  @observable accountTransactions: TransactionViewModel[] = [];
  @observable maxTransactionsToShow: number = 3;
  
  handleAccountClick(account: Account) {
    this.dispatchEvent(new CustomEvent('account-toggle', {
      detail: { accountId: account.id }
    }));
  }
  
  handleMoreClick(account: Account, event: Event) {
    // Stop click event from bubbling up to avoid toggling the account
    event.stopPropagation();
    
    this.dispatchEvent(new CustomEvent('account-actions', {
      detail: { account }
    }));
  }
  
  handleShowMore() {
    this.dispatchEvent(new CustomEvent('show-more-transactions'));
  }
}
