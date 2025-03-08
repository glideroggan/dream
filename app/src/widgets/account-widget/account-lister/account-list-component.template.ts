import { html, when, repeat } from "@microsoft/fast-element";
import { AccountInsight } from "../../../helpers/account-insights-helper";
import { AccountListComponent } from "./account-list-component";
import { Account } from "../../../repositories/models/account-models";

export const template = html<AccountListComponent>/*html*/ `
  <div class="accounts-list">
    ${when(x => x.isLoading, html<AccountListComponent>/*html*/`
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading accounts...</p>
      </div>
    `)}
    
    ${when(x => x.hasError, html<AccountListComponent>/*html*/`
      <div class="error-state">
        <p class="error-message">${x => x.errorMessage}</p>
        <button class="retry-button" @click="${x => x.loadData()}">Retry</button>
      </div>
    `)}
    
    ${when(x => !x.isLoading && !x.hasError && x.accounts.length === 0, html<AccountListComponent>/*html*/`
      <div class="no-accounts">
        <p>No accounts found</p>
      </div>
    `)}
    
    ${when(x => !x.isLoading && !x.hasError && x.accounts.length > 0, html<AccountListComponent>/*html*/`
      <div class="accounts">
        ${repeat(x => x.accounts, html<Account, AccountListComponent>/*html*/`
          <div class="account-item ${(x, c) => x.id === c.parent.expandedAccountId ? 'expanded' : ''}" 
               id="account-${x => x.id}">
            <div class="account-header" 
              @click="${(x, c) => c.parent.handleAccountClick(x)}">
              <div class="account-info">
                <div class="account-name-container">
                  <div class="account-name">${x => x.name}</div>
                  ${when((x, c) => c.parent.hasCard(x.id), html<Account, AccountListComponent>/*html*/`
                    <div class="account-card-indicator" 
                         title="Click to view card details" 
                         @click="${(x, c) => c.parent.handleCardClick(x, c.event)}">
                      💳
                    </div>
                  `)}
                </div>
                <div class="account-type">${x => x.type}</div>
                
                <div class="account-insights">
                  <!-- Account insights including transaction insights -->
                  ${repeat((x, c) => c.parent.getInsightsForAccount(x), html<AccountInsight>/*html*/`
                    <div class="insight-item ${x => x.colorClass || 'neutral'}">
                      ${when(x => x.icon, html<AccountInsight>/*html*/`
                        <span class="insight-icon">${x => x.icon}</span>
                      `)}
                      <span class="insight-label">${x => x.label}:</span>
                      <span class="insight-value">${x => x.value}</span>
                    </div>
                  `)}
                </div>
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
                :accountId="${x => x.id}">
              </transaction-list>
            `)}
          </div>
        `)}
      </div>
    `)}
  </div>
`;