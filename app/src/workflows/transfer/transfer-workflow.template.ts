import { html, repeat, when } from "@microsoft/fast-element";
import { TransferWorkflow } from "./transfer-workflow";
import "@primitives/input";
import "@primitives/select";

export const template = html<TransferWorkflow>/*html*/`
  <div class="transfer-workflow">
    <div class="transfer-form">
      <dream-select 
        id="fromAccount"
        label="From Account"
        placeholder="-- Select Account --"
        :value="${x => x.fromAccountId}"
        full-width
        @change="${(x, c) => x.handleFromAccountChange(c.event)}"
      >
        ${repeat(x => x.accounts, html`
          <option value="${x => x.id}">
            ${x => x.name} (${x => x.balance.toFixed(2)} ${x => x.currency})
          </option>
        `)}
      </dream-select>
      
      <to-account-field
        :accounts="${x => x.accounts}"
        :paymentContacts="${x => x.paymentContacts}"
        :fromAccountId="${x => x.fromAccountId}"
        :toAccountId="${x => x.toAccountId}"
        required="true"
        @valueChanged="${(x, c) => x.handleToAccountValueChanged(c.event)}"
        @validationError="${(x, c) => x.handleToAccountValidationError(c.event)}"
      ></to-account-field>
      
      <dream-input
        id="amount"
        type="number"
        label="Amount"
        placeholder="0.00"
        :value="${x => x.amount ? String(x.amount) : ''}"
        full-width
        @input="${(x, c) => x.handleAmountChange(c.event)}"
      >
        <span slot="suffix">${x => x.currency}</span>
      </dream-input>
      
      <dream-input
        id="description"
        type="text"
        label="Description (Optional)"
        placeholder="Enter a description"
        :value="${x => x.description}"
        full-width
        @input="${(x, c) => x.handleDescriptionChange(c.event)}"
      ></dream-input>
      
      <!-- Scheduling Option -->
      <div class="form-group schedule-section">
        <div class="schedule-toggle">
            <dream-checkbox 
              id="scheduleToggle"
              ?checked="${x => x.isScheduled}"
              @change="${(x, c) => x.handleScheduleToggle(c.event)}">
              <label for="scheduleToggle">Schedule for later</label>
            </dream-checkbox>
        </div>
        
        ${when(x => x.isScheduled, html`
          <div class="schedule-details">
            <div class="schedule-inputs">
              <dream-input
                id="scheduleDate"
                type="date"
                label="Date"
                :value="${x => x.scheduleDate}"
                @change="${(x, c) => x.handleScheduleDateChange(c.event)}"
              ></dream-input>
              
              <dream-input
                id="scheduleTime"
                type="time"
                label="Time"
                :value="${x => x.scheduleTime}"
                @change="${(x, c) => x.handleScheduleTimeChange(c.event)}"
              ></dream-input>
            </div>
          </div>
        `)}
      </div>
      
      ${when(x => x.errorMessage, html`
        <div class="error-message">${x => x.errorMessage}</div>
      `)}
    </div>
  </div>
`;