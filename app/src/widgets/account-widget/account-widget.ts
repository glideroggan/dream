import { FASTElement, customElement, html, css, observable, repeat } from "@microsoft/fast-element";

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

const template = html<AccountWidget>`
  <div class="account-widget">
    <h3>Account Balances</h3>
    <div class="accounts-list">
      ${repeat(x => x.accounts, html<Account, AccountWidget>`
        <div class="account-item">
          <div class="account-name">${x => x.name}</div>
          <div class="account-balance">${x => x.balance.toFixed(2)} ${x => x.currency}</div>
        </div>
      `)}
    </div>
  </div>
`;

const styles = css`
  .account-widget {
    background: var(--background-color);
    color: var(--text-color);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
  }
  
  .accounts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .account-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  .account-name {
    font-weight: 500;
  }
  
  .account-balance {
    font-weight: 700;
  }
`;

@customElement({
  name: "account-widget",
  template,
  styles
})
export class AccountWidget extends FASTElement {
  @observable accounts: Account[] = [
    { id: "acc1", name: "Checking Account", balance: 2543.67, currency: "USD" },
    { id: "acc2", name: "Savings Account", balance: 12750.42, currency: "USD" },
    { id: "acc3", name: "Investment Account", balance: 35621.19, currency: "USD" }
  ];

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    // Here you could fetch real account data from a service
  }
}
