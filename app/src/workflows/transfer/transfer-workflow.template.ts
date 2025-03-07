import { html, repeat, when } from "@microsoft/fast-element";
import { TransferWorkflow } from "./transfer-workflow";

export const template = html<TransferWorkflow>/*html*/`
  <div class="transfer-workflow">
    <div class="transfer-form">
      <div class="form-group">
        <label for="fromAccount">From Account</label>
        <select id="fromAccount" @change="${(x, c) => x.handleFromAccountChange(c.event)}">
          <option value="">-- Select Account --</option>
          ${repeat(x => x.accounts, html`
            <option value="${x => x.id}" ?selected="${(x, c) => x.id === c.parent.fromAccountId}">
              ${x => x.name} (${x => x.balance.toFixed(2)} ${x => x.currency})
            </option>
          `)}
        </select>
      </div>
      
      <to-account-field
        :accounts="${x => x.accounts}"
        :paymentContacts="${x => x.paymentContacts}"
        :fromAccountId="${x => x.fromAccountId}"
        :toAccountId="${x => x.toAccountId}"
        required="true"
        @valueChanged="${(x, c) => x.handleToAccountValueChanged(c.event)}"
        @validationError="${(x, c) => x.handleToAccountValidationError(c.event)}"
      ></to-account-field>
      
      <div class="form-group">
        <label for="amount">Amount</label>
        <div class="amount-input-group">
          <input type="number" id="amount" placeholder="0.00" step="0.01" min="0.01"
                 value="${x => x.amount}" 
                 @input="${(x, c) => x.handleAmountChange(c.event)}" />
          <span class="currency">${x => x.currency}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="description">Description (Optional)</label>
        <input type="text" id="description" placeholder="Enter a description" 
               value="${x => x.description}"
               @input="${(x, c) => x.handleDescriptionChange(c.event)}" />
      </div>
      
      ${when(x => x.errorMessage, html`
        <div class="error-message">${x => x.errorMessage}</div>
      `)}
    </div>
  </div>
`;