import { css, customElement, html, Observable, observable, repeat, when } from "@microsoft/fast-element";
import { BaseWidget } from "../../components/base-widget";
import { Loan, LoanStatus, LoanType } from "../../repositories/models/loan-models";
import { mockLoans } from "../../repositories/mock/loan-mock";
import { loanService } from "../../services/loan-service";
import { repositoryService } from "../../services/repository-service";

const template = html<LoansWidget>/*html*/`
    <div class="loans-widget">
        <div class="widget-content">
            ${when(x => x.isLoading, html`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading loans...</p>
                </div>
            `, html`
                <div class="loans-header">
                    <h3>My Loans</h3>
                    <div class="loan-count">${x => x.activeLoans} Active</div>
                </div>

                <div class="loans-list">
                    ${repeat(x => x.loans, html<Loan>/*html*/`
                        <div class="loan-item ${x => x.status.toLowerCase()}" id="${x => x.id}">
                            <div class="loan-header" @click="${(x, c) => c.parent.toggleLoanDetails(x.id)}">
                                <div class="loan-info-main">
                                    <div class="loan-type">${x => x.type}</div>
                                    <div class="loan-name">${x => x.name}</div>
                                    <div class="loan-status-badge">${x => x.status}</div>
                                </div>
                                <div class="loan-summary">
                                    <div class="loan-amount">$${x => x.remainingAmount.toLocaleString()}</div>
                                    <div class="expand-icon ${(x,c) => c.parent.getExpandIconClass(x.id)}">▼</div>
                                </div>
                            </div>
                            <div class="loan-details ${(x,c) => c.parent.getLoanDetailsClass(x.id)}">
                                <div class="loan-progress">
                                    <div class="progress-label">Repayment progress</div>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" style="width: ${x => x.progress || 0}%"></div>
                                    </div>
                                    <div class="progress-stats">
                                        <span>${x => x.paymentsMade || 0} payments made</span>
                                        <span>${x => x.paymentsRemaining || 0} remaining</span>
                                    </div>
                                </div>
                                
                                <div class="loan-detail-grid">
                                    <div class="detail-row">
                                        <div class="detail-label">Original Amount:</div>
                                        <div class="detail-value">$${x => x.amount.toLocaleString()}</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Interest Rate:</div>
                                        <div class="detail-value">${x => x.interestRate}%</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Monthly Payment:</div>
                                        <div class="detail-value">$${x => x.monthlyPayment.toLocaleString()}</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Term:</div>
                                        <div class="detail-value">${x => x.term} months</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Next Payment:</div>
                                        <div class="detail-value">$${x => x.nextPaymentAmount.toLocaleString()}</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Due Date:</div>
                                        <div class="detail-value">${x => x.nextPaymentDate}</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Total Interest:</div>
                                        <div class="detail-value">$${x => x.totalInterest.toLocaleString()}</div>
                                    </div>
                                    <div class="detail-row">
                                        <div class="detail-label">Purpose:</div>
                                        <div class="detail-value">${x => x.purpose}</div>
                                    </div>
                                </div>
                                <div class="loan-actions">
                                    ${when(x => ['current', 'late', 'active', LoanStatus.ACTIVE].includes(x.status), html`
                                        <button class="action-button payment-button" @click="${(x, c) => c.parent.makePayment(x.id)}">Make Payment</button>
                                    `)}
                                    <button class="action-button details-button" @click="${(x, c) => c.parent.viewLoanDetails(x.id)}">Full Details</button>
                                </div>
                            </div>
                        </div>
                    `)}
                </div>
                
                ${when(x => x.loans.length === 0, html`
                    <div class="no-loans">
                        <p>You don't have any active loans.</p>
                        <button class="new-loan-button" @click="${x => x.exploreLoans()}">Explore Loan Options</button>
                    </div>
                `)}
            `)}
        </div>
    </div>
`;

const styles = css/*css*/`
    :host {
        display: block;
        border-radius: inherit;
        overflow: hidden;
        --widget-accent-color: var(--accent-color, #5c6bc0);
        --widget-accent-hover: var(--secondary-color, #3f51b5);
    }

    .loans-widget {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--widget-background, #ffffff);
        color: var(--widget-text-color, #333333);
    }

    .widget-content {
        flex: 1;
        padding: var(--widget-content-padding, 16px);
        display: flex;
        flex-direction: column;
    }

    .loans-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .loans-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
    }

    .loan-count {
        background-color: var(--widget-secondary-color, #f0f0f0);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }

    .loans-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .loan-item {
        border: 1px solid var(--widget-divider-color, #e0e0e0);
        border-radius: 6px;
        overflow: hidden;
    }

    .loan-header {
        padding: 12px;
        cursor: pointer;
        background-color: var(--background-card, #fafafa);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .loan-header:hover {
        background-color: var(--hover-bg, #f5f5f5);
    }

    .loan-info-main {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .loan-type {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--widget-text-secondary, #777);
        font-weight: 500;
        letter-spacing: 0.5px;
    }

    .loan-name {
        font-weight: 500;
    }

    .loan-status-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
    }

    .loan-item.current .loan-status-badge,
    .loan-item.active .loan-status-badge {
        background-color: var(--success-color, #4caf50);
        color: white;
    }

    .loan-item.late .loan-status-badge {
        background-color: var(--warning-color, #ff9800);
        color: white;
    }

    .loan-item.paid_off .loan-status-badge {
        background-color: var(--widget-primary-color, #2196f3);
        color: white;
    }

    .loan-item.defaulted .loan-status-badge,
    .loan-item.default .loan-status-badge {
        background-color: var(--error-color, #f44336);
        color: white;
    }
    
    .loan-item.pending_approval .loan-status-badge {
        background-color: var(--secondary-color, #6A89A7);
        color: white;
    }
    
    .loan-item.approved .loan-status-badge {
        background-color: var(--info-badge, #03a9f4);
        color: white;
    }
    
    .loan-item.draft .loan-status-badge {
        background-color: var(--inactive-color, #9e9e9e);
        color: white;
    }
    
    .loan-item.rejected .loan-status-badge {
        background-color: var(--error-badge, #e74c3c);
        color: white;
    }

    .loan-summary {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .loan-amount {
        font-weight: 600;
    }

    .expand-icon {
        font-size: 10px;
        transition: transform 0.2s;
    }

    .expand-icon.expanded {
        transform: rotate(180deg);
    }

    .loan-details {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
        background-color: var(--widget-background, #fff);
    }

    .loan-details.expanded {
        max-height: 500px; /* Increased to accommodate more content */
        padding: 16px;
        border-top: 1px solid var(--widget-divider-color, #e0e0e0);
    }

    .loan-detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
    }

    .detail-row {
        display: flex;
        flex-direction: column;
    }

    .detail-label {
        font-size: 12px;
        color: var(--widget-subtle-text, #666);
    }

    .detail-value {
        font-weight: 500;
    }

    .loan-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    .action-button {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        flex: 1;
    }

    .payment-button {
        background-color: var(--widget-primary-color, var(--accent-color, #3498db));
        color: var(--widget-primary-text, white);
    }

    .payment-button:hover {
        background-color: var(--widget-primary-hover, var(--widget-accent-hover, #2980b9));
    }

    .details-button {
        background-color: var(--widget-secondary-color, #f0f0f0);
        color: var(--widget-text-color, #333);
    }

    .details-button:hover {
        background-color: var(--widget-secondary-hover, #e0e0e0);
    }

    .no-loans {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px 20px;
        text-align: center;
        color: var(--widget-text-secondary, #777);
    }

    .new-loan-button {
        margin-top: 16px;
        padding: 8px 16px;
        background-color: var(--widget-primary-color, var(--accent-color, #3498db));
        color: var(--widget-primary-text, white);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
    }

    .new-loan-button:hover {
        background-color: var(--widget-primary-hover, var(--widget-accent-hover, #2980b9));
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
        border-top-color: var(--widget-accent-color, var(--accent-color, #3498db));
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 16px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .loan-progress {
        margin-bottom: 16px;
    }
    
    .progress-label {
        font-size: 12px;
        color: var(--widget-text-secondary, #777);
        margin-bottom: 4px;
    }
    
    .progress-bar-container {
        height: 8px;
        background-color: var(--widget-secondary-color, #f0f0f0);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-bar {
        height: 100%;
        background-color: var(--widget-accent-color);
        border-radius: 4px;
    }
    
    .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--widget-text-secondary, #777);
        margin-top: 4px;
    }

    /* Dark theme specific adjustments */
    @media (prefers-color-scheme: dark) {
        .spinner {
            border-color: rgba(255, 255, 255, 0.1);
            border-top-color: var(--widget-accent-color, var(--accent-color, #5a94d8));
        }
        
        /* Improved badge contrast for dark mode */
        .loan-item.current .loan-status-badge,
        .loan-item.active .loan-status-badge {
            background-color: var(--dark-success-color, #2e7d32);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.late .loan-status-badge {
            background-color: var(--dark-warning-color, #e67e22);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.paid_off .loan-status-badge {
            background-color: var(--dark-info-color, #0288d1);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.defaulted .loan-status-badge,
        .loan-item.default .loan-status-badge {
            background-color: var(--dark-error-color, #d32f2f);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.pending_approval .loan-status-badge {
            background-color: var(--dark-secondary-color, #546e7a);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.approved .loan-status-badge {
            background-color: var(--dark-info-color, #039be5);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.draft .loan-status-badge {
            background-color: var(--dark-inactive-color, #757575);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .loan-item.rejected .loan-status-badge {
            background-color: var(--dark-error-color, #d32f2f);
            color: var(--dark-badge-text, #ffffff);
        }
        
        .progress-bar-container {
            background-color: var(--widget-divider-color, #3a5675);
        }
    }
`;

@customElement({
    name: "loans-widget",
    template,
    styles
})
export class LoansWidget extends BaseWidget {
    @observable loans: Loan[] = [];
    @observable expandedLoanIds: Set<string> = new Set();

    private unsubscribe: () => void;
    
    // Computed property for active loans count
    get activeLoans(): number {
        return this.loans.filter(loan => 
            ['current', 'late', 'active', LoanStatus.ACTIVE].includes(loan.status)
        ).length;
    }

    async connectedCallback() {
        super.connectedCallback();
        const loansRepo = repositoryService.getLoanRepository();
        this.unsubscribe = loansRepo.subscribe(() => this.loadLoans());
        await this.loadLoans();
        this.notifyInitialized();
        setTimeout(() => this.notifyContentChanged(), 50);
    }

    async disconnectedCallback() {
        super.disconnectedCallback();
        // Clean up any subscriptions if needed
        this.unsubscribe();
    }

    private async loadLoans(): Promise<void> {
        try {
            this.isLoading = true;
            
            // Simulate loading data from a service
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            
            this.loans = await loanService.getAllLoans();
            
            console.debug(`Loaded ${this.loans.length} loans`);
            
            // In a real implementation, you would fetch loan data from a service
            // const loanService = await getLoanService();
            // this.loans = await loanService.getUserLoans();
            
            this.isLoading = false;
        } catch (error) {
            this.handleError("Failed to load loan data");
            console.error(error);
        }
    }

    toggleLoanDetails(loanId: string): void {
        console.log(`Toggling loan details for loan ${loanId}`);
        if (this.expandedLoanIds.has(loanId)) {
            this.expandedLoanIds.delete(loanId);
        } else {
            this.expandedLoanIds.add(loanId);
            console.log(`Expanded loans: ${Array.from(this.expandedLoanIds)}`);
        }
        Observable.notify(this, 'expandedLoanIds');

        // Notify widget that content layout has changed
        setTimeout(() => this.notifyContentChanged(), 300);
    }

    isLoanExpanded(loanId: string): boolean {
        return this.expandedLoanIds.has(loanId);
    }
    
    // Add these getter methods for class computation
    getLoanDetailsClass(loanId: string): string {
        return this.expandedLoanIds.has(loanId) ? 'expanded' : '';
    }
    
    getExpandIconClass(loanId: string): string {
        return this.expandedLoanIds.has(loanId) ? 'expanded' : '';
    }

    makePayment(loanId: string): void {
        // Start payment workflow
        console.debug(`Starting payment workflow for loan ${loanId}`);
        this.startWorkflow("loan-payment", {
            loanId,
            source: "widget"
        });
    }

    viewLoanDetails(loanId: string): void {
        // View detailed loan information
        console.debug(`Viewing detailed information for loan ${loanId}`);
        this.startWorkflow("loan-details", {
            loanId,
            source: "widget"
        });
    }

    exploreLoans(): void {
        // Start new loan exploration workflow
        console.debug("Exploring new loan options");
        this.startWorkflow("loan", {
            source: "widget"
        });
    }
}