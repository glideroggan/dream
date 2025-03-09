import { html, ref, when } from "@microsoft/fast-element";
import { AccountInfoWorkflow } from "./account-info-workflow";

export const template = html<AccountInfoWorkflow>/*html*/ `
  ${when(
    (x) => !x.account,
    html<AccountInfoWorkflow>/*html*/ `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No Account Selected</h3>
        <p>Please select an account to view its details</p>
      </div>
    `
  )}

  ${when(
    (x) => x.account,
    html<AccountInfoWorkflow>/*html*/ `
      <div class="account-info">
        <div class="info-section">
          <div class="account-header">
            <div class="account-icon ${(x) => x.account?.type.toLowerCase() || ''}">
              ${(x) => x.account?.type.substring(0, 1) || ''}
            </div>
            <div class="account-title">
              ${when(
                (x) => x.isRenaming,
                html<AccountInfoWorkflow>/*html*/ `
                  <div class="rename-container">
                    <input 
                      type="text" 
                      ${ref('nameInput')}
                      :value="${(x) => x.account?.name || ''}" 
                      class="rename-input"
                      @keyup="${(x, c) => x.accountNameChanged(c.event)}"
                    />
                    <div class="rename-actions">
                      <button @click="${(x) => x.saveRename()}" class="rename-btn save">Save</button>
                      <button @click="${(x) => x.cancelRename()}" class="rename-btn cancel">Cancel</button>
                    </div>
                  </div>
                `
              )}
              ${when(
                (x) => !x.isRenaming,
                html<AccountInfoWorkflow>/*html*/ `
                  <h3>${(x) => x.account?.name || 'Account'}</h3>
                  <div class="account-title-actions">
                    <span class="account-type">${(x) => x.account?.type || ''}</span>
                    <button @click="${(x) => x.startRename()}" class="rename-icon" title="Rename account">✏️</button>
                  </div>
                `
              )}
            </div>
          </div>

          <div class="account-balance">
            <span class="balance-label">Current Balance</span>
            <span
              class="balance-amount ${(x) =>
                (x.account?.balance || 0) < 0 ? 'negative' : ''}"
            >
              $${(x) => x.formatCurrency(x.account?.balance || 0)}
            </span>
          </div>
        </div>

        <div class="info-section details-section">
          <h4>Account Details</h4>
          <div class="detail-row">
            <span class="detail-label">Account Number</span>
            <span class="detail-value"
              >${(x) => x.formatAccountNumber(x.account?.accountNumber || '')}</span
            >
          </div>
          <div class="detail-row">
            <span class="detail-label">Created</span>
            <span class="detail-value"
              >${(x) => x.formatDate(x.account?.createdAt || '')}</span
            >
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span
              class="detail-value status ${(x) =>
                x.account?.isActive ? 'active' : 'inactive'}"
            >
              ${(x) => (x.account?.isActive ? 'Active' : 'Inactive')}
            </span>
          </div>
          ${when(
            (x) => x.hasInterestRate,
            html<AccountInfoWorkflow>/*html*/ `
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value"
                  >${(x) =>
                    x.account?.interestRate
                      ? x.account.interestRate + '%'
                      : 'N/A'}</span
                >
              </div>
            `
          )}
        </div>

        ${when(
          (x) => x.account?.type === 'credit',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Credit Card Details</h4>
              <div class="credit-card-visual">
                <div class="credit-card">
                  <div class="card-chip">⬜</div>
                  <div class="card-number">${(x) => x.formatAccountNumber(x.account?.accountNumber || '')}</div>
                  <div class="card-name">${(x) => x.account?.name}</div>
                  <div class="card-expiry">Valid thru: ${(x) => x.getFutureDate(3)}</div>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Credit Limit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.creditLimit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Available Credit</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.availableCredit || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Due Date</span>
                <span class="detail-value">${(x) => x.formatDate(x.account?.paymentDueDate || '')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Minimum Payment</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.minimumPaymentDue || 0)}</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'savings',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Savings Details</h4>
              <div class="savings-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${(x) => x.calculateGoalProgress()}%"></div>
                </div>
                <div class="progress-info">
                  <span>Goal: $${(x) => x.formatCurrency(x.account?.savingsGoal || 0)}</span>
                  <span>${(x) => x.calculateGoalProgress()}%</span>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRate}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Earned YTD</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.calculateInterestEarned())}</span>
              </div>
              ${when(
                (x) => x.account?.targetDate,
                html<AccountInfoWorkflow>/*html*/ `
                  <div class="detail-row">
                    <span class="detail-label">Target Date</span>
                    <span class="detail-value">${(x) => x.formatDate(x.account?.targetDate || '')}</span>
                  </div>
                `
              )}
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'pension',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Pension Details</h4>
              <div class="chart-placeholder">
                <div class="pension-projection">
                  <h5>Projected Monthly Pension</h5>
                  <div class="projection-amount">$${(x) => x.formatCurrency(x.calculateProjectedPension())}</div>
                  <p class="projection-note">at retirement age 65</p>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Annual Contribution</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.calculateAnnualContribution())}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Return Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRate || 4}%</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'loan',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Loan Details</h4>
              <div class="detail-row">
                <span class="detail-label">Original Amount</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.originalLoanAmount || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRateLoan || x.account?.interestRate || 0}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Payment</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.nextPaymentAmount || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date</span>
                <span class="detail-value">${(x) => x.formatDate(x.account?.nextPaymentDueDate || '')}</span>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'mortgage',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Mortgage Details</h4>
              <div class="detail-row">
                <span class="detail-label">Original Amount</span>
                <span class="detail-value">$${(x) => x.formatCurrency(x.account?.originalLoanAmount || 0)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${(x) => x.account?.interestRateLoan || x.account?.interestRate || 0}%</span>
              </div>
              <div class="payment-breakdown">
                <h5>Next Payment Breakdown</h5>
                <div class="breakdown-chart">
                  <div class="chart-bar">
                    <div class="interest-portion" style="width: ${(x) => x.calculateInterestPortion()}%"></div>
                    <div class="principal-portion" style="width: ${(x) => 100 - x.calculateInterestPortion()}%"></div>
                  </div>
                  <div class="chart-legend">
                    <div class="legend-item">
                      <span class="legend-color interest"></span>
                      <span>Interest: $${(x) => x.formatCurrency(x.calculateInterestAmount())}</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color principal"></span>
                      <span>Principal: $${(x) => x.formatCurrency(x.calculatePrincipalAmount())}</span>
                    </div>
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value">${(x) => x.formatDate(x.account?.nextPaymentDueDate || '')}</span>
                </div>
              </div>
            </div>
          `
        )}

        ${when(
          (x) => x.account?.type === 'investment',
          html<AccountInfoWorkflow>/*html*/ `
            <div class="info-section type-specific-section">
              <h4>Investment Details</h4>
              <div class="detail-row">
                <span class="detail-label">Risk Level</span>
                <span class="detail-value risk-level">${(x) => x.getRiskLevel()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Performance YTD</span>
                <span class="detail-value ${(x) => (x.account?.performanceYTD || 0) >= 0 ? 'positive' : 'negative'}">
                  ${(x) => (x.account?.performanceYTD || 0) >= 0 ? '+' : ''}${(x) => x.account?.performanceYTD || 0}%
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Updated</span>
                <span class="detail-value">${(x) => x.formatDate(x.account?.lastUpdated || '')}</span>
              </div>
            </div>
          `
        )}

        <div class="actions-section">
          <slot name="actions"></slot>
        </div>
      </div>
    `
  )}
`