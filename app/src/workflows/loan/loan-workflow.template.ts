import { html, repeat } from "@microsoft/fast-element";
import { LoanWorkflow } from "./loan-workflow";
import { when } from "@microsoft/fast-element";
import { getProductIcon, getInterestRateDisplay } from "./loan-workflow.helper";
import { ProductEntity } from "../../repositories/models/product-models";
import { Account } from "../../repositories/models/account-models";

// Step 1: Choose loan product
const step1Template = html<LoanWorkflow>/*html*/`
  <div class="loan-content">
    <p>What type of loan are you interested in?</p>
    
    <div class="loan-options">
      ${when(x => x.availableLoanProducts.length === 0, html<LoanWorkflow>/*html*/`
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading loan products...</p>
        </div>
      `)}
      
      ${when(x => x.availableLoanProducts.length > 0, html<LoanWorkflow>/*html*/`
        ${repeat(x => x.availableLoanProducts, html<ProductEntity, LoanWorkflow>/*html*/`
          <div class="loan-option ${(product, c) => c.parent.selectedProduct?.id === product.id ? 'selected' : ''}"
              @click="${(product, c) => c.parent.selectProduct(product)}">
            <div class="loan-option-icon">${product => getProductIcon(product)}</div>
            <div class="loan-option-content">
              <h3>${product => product.name}</h3>
              <p>${product => product.description || 'Apply now for competitive rates'}</p>
              <div class="loan-option-details">
                ${product => getInterestRateDisplay(product)}
              </div>
            </div>
          </div>
        `)}
      `)}
    </div>
    
    <div class="loan-navigation">
      <button @click="${x => x.cancel('Loan application cancelled')}" class="secondary-button">Cancel</button>
      <button ?disabled="${x => !x.selectedProduct}" @click="${x => x.checkEligibility()}" class="primary-button">
        Continue
      </button>
    </div>
  </div>
`;

// Step 2: Eligibility and loan amount
const step2Template = html<LoanWorkflow>/*html*/`
  <div class="loan-content">
    ${when(x => x.isLoading, html<LoanWorkflow>/*html*/`
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Checking eligibility...</p>
      </div>
    `)}
    
    ${when(x => !x.isLoading && x.eligibilityResult !== null && !x.eligibilityResult.eligible, html<LoanWorkflow>/*html*/`
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>Not Eligible</h3>
        <p>${x => x.eligibilityResult?.reason || 'You are not eligible for this loan type at this time.'}</p>
        <button @click="${x => x.goToStep('select-product')}" class="primary-button">Choose Another Loan</button>
      </div>
    `)}
    
    ${when(x => !x.isLoading && x.eligibilityResult !== null && x.eligibilityResult.eligible, html<LoanWorkflow>/*html*/`
      <div class="eligibility-result">
        <!-- Pre-approval header section (top left) -->
        <div class="approval-header">
          <div class="approval-content">
            <div class="success-icon">✅</div>
            <h3>You're pre-approved!</h3>
            <p>Based on your profile, you're eligible for a ${x => LoanWorkflow.getLoanTypeLabel(x.selectedLoanType)}</p>
          </div>
        </div>
        
        <!-- Loan summary (right side, full height) -->
        <div class="loan-summary-container">
          <div class="live-summary">
            <h3>Loan Summary</h3>
            <div class="summary-card">
              <div class="summary-row">
                <div class="summary-label">Estimated Interest Rate</div>
                <div class="summary-value">${x => x.estimatedDetails?.interestRate?.toFixed(2) || '—'}% APR</div>
              </div>
              
              <div class="summary-row highlight">
                <div class="summary-label">Est. Monthly Payment</div>
                <div class="summary-value">$${x => x.formatNumber(x.estimatedDetails?.monthlyPayment || 0)}</div>
              </div>
              
              <div class="summary-row">
                <div class="summary-label">Total Principal</div>
                <div class="summary-value">$${x => x.formatNumber(x.loanAmount)}</div>
              </div>
              
              <div class="summary-row">
                <div class="summary-label">Total Interest</div>
                <div class="summary-value">$${x => x.formatNumber(x.estimatedDetails?.totalInterest || 0)}</div>
              </div>
              
              <div class="summary-row total">
                <div class="summary-label">Total to Repay</div>
                <div class="summary-value">$${x => x.formatNumber((x.estimatedDetails?.totalInterest || 0) + x.loanAmount)}</div>
              </div>
            </div>
            
            <div class="note">
              <p>These are estimated values. Final terms may vary based on approval.</p>
            </div>
          </div>
        </div>
        
        <!-- Loan form (bottom left) -->
        <div class="loan-form">
          <div class="loan-amount-section">
            <label for="loanAmount">Loan Amount</label>
            <div class="loan-amount-container">
              <div class="currency-symbol">$</div>
              <input id="loanAmount" type="number" 
                    min="${x => x.eligibilityResult?.minAmount}" 
                    max="${x => x.eligibilityResult?.maxAmount}" 
                    value="${x => x.loanAmount}"
                    @input="${(x, c) => x.updateLoanAmountAndCalculate(c.event)}"/>
            </div>
            <div class="range-limits">
              <span>Min: $${x => x.formatNumber(x.eligibilityResult?.minAmount || 0)}</span>
              <span>Max: $${x => x.formatNumber(x.eligibilityResult?.maxAmount || 0)}</span>
            </div>
          </div>
          
          <div class="loan-term-section">
            <label for="loanTerm">Loan Term (months)</label>
            <div class="term-options">
              <div class="term-option ${x => x.loanTerm === 12 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(12)}">12</div>
              <div class="term-option ${x => x.loanTerm === 24 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(24)}">24</div>
              <div class="term-option ${x => x.loanTerm === 36 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(36)}">36</div>
              <div class="term-option ${x => x.loanTerm === 48 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(48)}">48</div>
              <div class="term-option ${x => x.loanTerm === 60 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(60)}">60</div>
              <div class="term-option ${x => x.loanTerm === 72 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(72)}">72</div>
              <div class="term-option ${x => x.loanTerm === 84 ? 'selected' : ''}" @click="${x => x.updateLoanTermAndCalculate(84)}">84</div>
            </div>
          </div>

          <div class="loan-purpose-section">
            <label for="loanPurpose">Loan Purpose</label>
            <select id="loanPurpose" @change="${(x, c) => x.updateLoanPurpose(c.event)}">
              ${x => x.getLoanPurposeOptions().map(purpose => html<LoanWorkflow>`
                <option value="${purpose}" ?selected="${purpose === x.loanPurpose}">${purpose}</option>
              `)}
            </select>
            <div class="field-hint">Please select the primary purpose for this loan</div>
          </div>
        </div>
        
        <!-- Footer navigation -->
        <div class="loan-navigation">
          <button @click="${x => x.goToStep('select-product')}" class="secondary-button">Back</button>
          <button @click="${x => x.createDraftLoan(x.estimatedDetails)}" class="primary-button">Continue</button>
        </div>
      </div>
    `)}
  </div>
`;

// Step 3: Loan details review
const step3Template = html<LoanWorkflow>/*html*/`
  <div class="loan-content">
    <div class="loan-summary">
      <h3>Loan Summary</h3>
      
      <div class="summary-row">
        <div class="summary-label">Loan Type</div>
        <div class="summary-value">${x => LoanWorkflow.getLoanTypeLabel(x.selectedLoanType)}</div>
      </div>
      
      <div class="summary-row">
        <div class="summary-label">Loan Amount</div>
        <div class="summary-value">$${x => x.formatNumber(x.loanAmount)}</div>
      </div>
      
      <div class="summary-row">
        <div class="summary-label">Loan Term</div>
        <div class="summary-value">${x => x.loanTerm} months</div>
      </div>
      
      <div class="summary-row">
        <div class="summary-label">Loan Purpose</div>
        <div class="summary-value">${x => x.loanPurpose || 'Not specified'}</div>
      </div>
      
      <div class="summary-row highlight">
        <div class="summary-label">Interest Rate</div>
        <div class="summary-value">${x => x.loanDetails?.interestRate.toFixed(2)}% APR</div>
      </div>
      
      <div class="summary-row highlight">
        <div class="summary-label">Monthly Payment</div>
        <div class="summary-value">$${x => x.formatNumber(x.loanDetails?.monthlyPayment || 0)}</div>
      </div>
      
      <div class="summary-row">
        <div class="summary-label">Total Interest</div>
        <div class="summary-value">$${x => x.formatNumber(x.loanDetails?.totalInterest || 0)}</div>
      </div>
      
      <div class="summary-row">
        <div class="summary-label">Total to Repay</div>
        <div class="summary-value">$${x => x.formatNumber((x.loanDetails?.totalInterest || 0) + x.loanAmount)}</div>
      </div>
    </div>
    
    <div class="account-select-section">
      <label for="accountSelect">Deposit Account</label>
      <select id="accountSelect" @change="${(x, c) => x.updateSelectedAccount(c.event)}">
        ${when(x => x.accounts.length === 0, html<LoanWorkflow>/*html*/`
          <option value="">No eligible accounts found</option>
        `)}
        ${repeat(x => x.accounts, html<Account, LoanWorkflow>/*html*/`
          <option value="${x => x.id}" ?selected="${(x, c) => x.id === c.parent.selectedAccountId}">
            ${x => x.name} - $${(x, c) => c.parent.formatNumber(x.balance)}
          </option>
        `)}
      </select>
      <div class="field-hint">The approved loan amount will be deposited to this account</div>
    </div>
    
    <div class="loan-navigation">
      <button @click="${x => x.goToStep('eligibility')}" class="secondary-button">Back</button>
      <button ?disabled="${x => !x.selectedAccountId}" @click="${x => x.goToStep('terms')}" class="primary-button">Continue</button>
    </div>
  </div>
`;

//   

// Step 4: Terms and Conditions
const step4Template = html<LoanWorkflow>/*html*/`
  <div class="loan-content">
    <h3>Terms and Conditions</h3>
    
    <div class="terms-container">
      <h4>Loan Agreement Summary</h4>
      <p>This document outlines the terms and conditions of your ${x => LoanWorkflow.getLoanTypeLabel(x.selectedLoanType)} agreement.</p>
      
      <h4>Key Information</h4>
      <ul>
        <li>Principal Amount: $${x => x.formatNumber(x.loanAmount)}</li>
        <li>Interest Rate: ${x => x.loanDetails?.interestRate.toFixed(2)}% APR</li>
        <li>Loan Term: ${x => x.loanTerm} months</li>
        <li>Monthly Payment: $${x => x.formatNumber(x.loanDetails?.monthlyPayment || 0)}</li>
        <li>Total Interest: $${x => x.formatNumber(x.loanDetails?.totalInterest || 0)}</li>
      </ul>
      
      <h4>Terms and Conditions</h4>
      <div class="terms-content">
        <p>By signing this agreement, you acknowledge and agree to the following terms:</p>
        <ul>
          <li>Repayment shall be made in equal monthly installments as specified above.</li>
          <li>The first payment is due 30 days from the date of disbursement.</li>
          <li>Payments made after the due date are subject to a late fee.</li>
          <li>You may repay the loan early without prepayment penalties.</li>
          <li>This loan is subject to our standard loan terms and conditions.</li>
        </ul>
      </div>
      
      <div class="consent-section">
        <div class="checkbox-container">
          <dream-checkbox 
            ?checked="${x => x.agreedToTerms}" 
            @change="${(x, c) => x.updateAgreedToTerms(c.event)}">
          
          <span class="checkbox-label">I have read and agree to the terms and conditions</span>
        </div>
      </div>
    </div>
    
    ${when(x => x.errorMessage, html<LoanWorkflow>/*html*/`
      <div class="error-message">${x => x.errorMessage}</div>
    `)}
    
    <div class="loan-navigation">
      <button @click="${x => x.goToStep('loan-details')}" class="secondary-button">Back</button>
      <button ?disabled="${x => !x.agreedToTerms}" @click="${x => x.proceedToSigning()}" class="primary-button">Continue to Signing</button>
    </div>
  </div>
`;

// Step 5: Success or Failure
const step5Template = html<LoanWorkflow>/*html*/`
  <div class="loan-content">
    ${when(x => x.applicationSuccess, html<LoanWorkflow>/*html*/`
      <div class="success-container">
        <div class="success-icon">✅</div>
        <h3>Loan Application Submitted</h3>
        <p>Your loan application has been successfully submitted for approval.</p>
        <p>Application ID: ${x => x.loanDetails?.id}</p>
        
        <div class="next-steps">
          <h4>Next Steps</h4>
          <ol>
            <li>Our team will review your application</li>
            <li>You will be notified of the decision within 1-2 business days</li>
            <li>Upon approval, funds will be deposited into your selected account</li>
          </ol>
        </div>
      </div>
    `)}
    
    ${when(x => !x.applicationSuccess, html<LoanWorkflow>/*html*/`
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>Application Failed</h3>
        <p>There was an issue with your loan application:</p>
        <p class="error-message">${x => x.errorMessage}</p>
        <button @click="${x => x.goToStep('loan-details')}" class="primary-button">Back to Loan Details</button>
      </div>
    `)}
    
    <div class="loan-navigation">
      <button @click="${x => x.handleComplete()}" class="primary-button">
        ${x => x.applicationSuccess ? 'Finish' : 'Close'}
      </button>
    </div>
  </div>
`;

// Main template combining all steps
export const template = html<LoanWorkflow>/*html*/`
  <div class="loan-workflow">
    

    <!-- Step 1: Choose loan product -->
    ${when(x => x.step === 'select-product', step1Template)}
    
    <!-- Other steps -->
    ${when(x => x.step === 'eligibility', step2Template)}
    ${when(x => x.step === 'loan-details', step3Template)}
    ${when(x => x.step === 'terms', step4Template)}
    ${when(x => x.step === 'result', step5Template)}
  </div>
`;

