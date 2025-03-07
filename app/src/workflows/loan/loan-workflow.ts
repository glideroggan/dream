import { customElement, html, css, observable, when } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "../workflow-base";
import { loanService, LoanType, LoanDetails, EligibilityResult, LoanStatus } from "../../services/loan-service";
import { repositoryService } from "../../services/repository-service";
import { WorkflowIds } from "../workflow-registry";
import { Account } from "../../repositories/account-repository";

// Include template and styles
import { template } from "./loan-workflow.template";
import { styles } from "./loan-workflow.styles";

@customElement({
  name: "loan-workflow",
  template,
  styles
})
export class LoanWorkflow extends WorkflowBase {
  // Step tracking
  @observable step: 'select-type' | 'eligibility' | 'loan-details' | 'terms' | 'result' = 'select-type';
  @observable headerTitle: string = "Apply for a Loan";
  
  // Loan type selection
  @observable selectedLoanType: LoanType | null = null;
  
  // Loan amount and term
  @observable loanAmount: number = 0;
  @observable loanTerm: number = 36; // Default term
  
  // Loading states
  @observable isLoading: boolean = false;
  @observable eligibilityResult: EligibilityResult | null = null;
  
  // Estimated details for live calculation on step 2
  @observable estimatedDetails: {
    monthlyPayment: number;
    totalInterest: number;
    interestRate: number;
  } | null = null;
  
  // Loan details
  @observable loanDetails: LoanDetails | null = null;
  @observable loanPurpose: string = "";
  
  // Account selection
  @observable accounts: Account[] = [];
  @observable selectedAccountId: string = "";
  
  // Terms agreement
  @observable agreedToTerms: boolean = false;
  
  // Application result
  @observable applicationSuccess: boolean = false;
  @observable errorMessage: string = "";
  
  /**
   * Initialize workflow
   */
  initialize(params?: Record<string, any>): void {
    // Set a wider modal width for this workflow to accommodate the two-column layout
    this.setModalWidth("800px");
    
    // Don't use the modal's primary button, we'll handle navigation in our template
    this.updateFooter(false);
    
    // Load accounts
    this.loadAccounts();
    
    // Pre-select loan type if provided
    if (params?.loanType && Object.values(LoanType).includes(params.loanType)) {
      this.selectedLoanType = params.loanType;
      
      // If we have a loan type, go directly to eligibility check
      if (this.selectedLoanType) {
        this.checkEligibility();
      }
    }
  }
  
  /**
   * Set the modal width via CSS variable
   */
  protected setModalWidth(width: string): void {
    if (this.host && typeof (this.host as any).setWidth === 'function') {
      (this.host as any).setWidth(width);
    } else {
      console.warn("Host does not support setting width");
    }
  }
  
  /**
   * Load user accounts for deposit selection
   */
  async loadAccounts(): Promise<void> {
    try {
      const accountRepo = repositoryService.getAccountRepository();
      const allAccounts = await accountRepo.getAll();
      
      // Filter for checking and savings accounts only
      this.accounts = allAccounts.filter(acc => 
        acc.isActive && (acc.type === 'checking' || acc.type === 'savings')
      );
      
      // Default to first checking account if available
      const defaultAccount = this.accounts.find(acc => acc.type === 'checking') || this.accounts[0];
      
      if (defaultAccount) {
        this.selectedAccountId = defaultAccount.id;
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      this.errorMessage = "Could not load accounts. Please try again.";
    }
  }
  
  /**
   * Select a loan type
   */
  selectLoanType(type: LoanType): void {
    this.selectedLoanType = type;
    this.updateHeaderTitle();
  }
  
  /**
   * Update header title based on current step
   */
  updateHeaderTitle(): void {
    if (!this.selectedLoanType) {
      this.headerTitle = "Apply for a Loan";
      return;
    }
    
    const loanTypeLabel = LoanWorkflow.getLoanTypeLabel(this.selectedLoanType);
    
    switch (this.step) {
      case 'select-type':
        this.headerTitle = `Apply for a ${loanTypeLabel}`;
        break;
      case 'eligibility':
        this.headerTitle = `${loanTypeLabel} Eligibility`;
        break;
      case 'loan-details':
        this.headerTitle = `${loanTypeLabel} Details`;
        break;
      case 'terms':
        this.headerTitle = `${loanTypeLabel} Terms`;
        break;
      case 'result':
        this.headerTitle = this.applicationSuccess 
          ? `${loanTypeLabel} Application Submitted` 
          : `${loanTypeLabel} Application Failed`;
        break;
    }
  }
  
  /**
   * Start eligibility check
   */
  async checkEligibility(): Promise<void> {
    if (!this.selectedLoanType) return;
    
    this.step = 'eligibility';
    this.isLoading = true;
    this.updateHeaderTitle();
    this.errorMessage = ""; // Clear any previous error messages
    
    try {
      // Check eligibility with loan service
      this.eligibilityResult = await loanService.checkEligibility(this.selectedLoanType);
      
      if (this.eligibilityResult && this.eligibilityResult.eligible) {
        // Set initial values based on recommended values
        this.loanAmount = this.eligibilityResult.minAmount + 
          ((this.eligibilityResult.maxAmount - this.eligibilityResult.minAmount) / 2);
        
        if (this.eligibilityResult.recommendedTerm) {
          this.loanTerm = this.eligibilityResult.recommendedTerm;
        }
        
        // Set default loan purpose based on loan type
        this.setDefaultLoanPurpose();
        
        // Calculate estimated payment details
        this.calculateEstimatedDetails();
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      this.errorMessage = "An error occurred while checking eligibility. Please try again.";
      this.eligibilityResult = null;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Set a default loan purpose based on loan type
   */
  private setDefaultLoanPurpose(): void {
    const purposes = this.getLoanPurposeOptions();
    if (purposes.length > 0) {
      this.loanPurpose = purposes[0];
    }
  }
  
  /**
   * Update loan amount from input and recalculate details
   */
  updateLoanAmountAndCalculate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
      this.loanAmount = value;
      this.calculateEstimatedDetails();
    }
  }
  
  /**
   * Update loan term and recalculate details
   */
  updateLoanTermAndCalculate(term: number): void {
    this.loanTerm = term;
    this.calculateEstimatedDetails();
  }
  
  /**
   * Update loan amount from input
   */
  updateLoanAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
      this.loanAmount = value;
    }
  }
  
  /**
   * Update loan term
   */
  updateLoanTerm(term: number): void {
    this.loanTerm = term;
  }
  
  /**
   * Calculate estimated loan details for live preview
   */
  calculateEstimatedDetails(): void {
    if (!this.selectedLoanType) return;
    
    try {
      // Get estimated details without creating a draft loan
      this.estimatedDetails = loanService.calculateLoanDetails(
        this.loanAmount,
        this.loanTerm,
        this.selectedLoanType
      );
    } catch (error) {
      console.error("Error calculating estimated details:", error);
      this.estimatedDetails = null;
    }
  }
  
  /**
   * Go to a specific step
   */
  goToStep(step: 'select-type' | 'eligibility' | 'loan-details' | 'terms' | 'result'): void {
    this.step = step;
    this.updateHeaderTitle();
    this.errorMessage = ""; // Clear any error messages when changing steps
  }
  
  /**
   * Create draft loan and move to next step
   */
  async createDraftLoan(calculatedDetails: {
    monthlyPayment: number;
    totalInterest: number;
    interestRate: number;
  } | null): Promise<void> {
    if (!this.selectedLoanType || !calculatedDetails) return;
    
    try {
      this.isLoading = true;
      
      // Create draft loan
      const loan = await loanService.createDraftLoan(
        this.selectedLoanType,
        this.loanAmount,
        this.loanTerm,
        this.loanPurpose
      );
      
      this.loanDetails = loan;
      this.step = 'loan-details';
      this.updateHeaderTitle();
    } catch (error) {
      console.error("Error creating draft loan:", error);
      this.errorMessage = "An error occurred while calculating loan details. Please try again.";
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Update loan purpose
   */
  updateLoanPurpose(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.loanPurpose = select.value;
    
    // Update draft loan if it exists
    if (this.loanDetails) {
      loanService.updateLoanApplication(this.loanDetails.id, {
        purpose: this.loanPurpose
      }).catch(error => {
        console.error("Error updating loan purpose:", error);
      });
    }
  }
  
  /**
   * Update selected account
   */
  updateSelectedAccount(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedAccountId = select.value;
    
    // Update draft loan if it exists
    if (this.loanDetails) {
      loanService.updateLoanAccount(this.loanDetails.id, this.selectedAccountId)
        .catch(error => {
          console.error("Error updating loan account:", error);
        });
    }
  }
  
  /**
   * Update terms agreement checkbox
   */
  updateAgreedToTerms(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.agreedToTerms = checkbox.checked;
  }
  
  /**
   * Proceed to signing the loan agreement
   */
  async proceedToSigning(): Promise<void> {
    if (!this.loanDetails || !this.selectedAccountId || !this.agreedToTerms) {
      this.errorMessage = "Please complete all required fields and agree to the terms.";
      return;
    }
    
    try {
      // Update loan with selected account if needed
      if (this.loanDetails.accountId !== this.selectedAccountId) {
        await loanService.updateLoanAccount(
          this.loanDetails.id,
          this.selectedAccountId
        );
      }
      
      // Format the agreement document text
      const documentContent = this.formatLoanDocument();
      
      // Start the signing workflow
      const signingResult = await this.startNestedWorkflow(
        WorkflowIds.SIGNING,
        {
          message: "Please sign the loan agreement to complete your application.",
          documentName: `${LoanWorkflow.getLoanTypeLabel(this.selectedLoanType)} Agreement`,
          documentContent: documentContent
        }
      );
      
      if (signingResult.success) {
        // Store signature ID with loan
        await loanService.updateWithSignature(
          this.loanDetails.id,
          signingResult.data?.signature || "signed"
        );
        
        // Submit the loan application
        await loanService.submitLoanApplication(this.loanDetails.id);
        
        // Show success result
        this.applicationSuccess = true;
        this.step = 'result';
        this.updateHeaderTitle();
      } else {
        // Signing was cancelled or failed
        this.errorMessage = signingResult.message || "Signing was not completed.";
      }
    } catch (error) {
      console.error("Error during signing process:", error);
      this.errorMessage = "An error occurred during the signing process.";
    }
  }
  
  /**
   * Format loan agreement document
   */
  private formatLoanDocument(): string {
    if (!this.loanDetails || !this.selectedLoanType) return "";
    
    const loanTypeLabel = LoanWorkflow.getLoanTypeLabel(this.selectedLoanType);
    const formattedAmount = this.formatNumber(this.loanAmount);
    const formattedMonthly = this.formatNumber(this.loanDetails.monthlyPayment);
    const formattedTotal = this.formatNumber(this.loanAmount + this.loanDetails.totalInterest);
    
    return `
      ${loanTypeLabel.toUpperCase()} AGREEMENT
      
      Principal Amount: $${formattedAmount}
      Interest Rate: ${this.loanDetails.interestRate.toFixed(2)}% APR
      Loan Term: ${this.loanTerm} months
      Monthly Payment: $${formattedMonthly}
      Total Repayment: $${formattedTotal}
      
      This agreement is between the borrower and Dream Bank, dated ${new Date().toLocaleDateString()}.
      The loan will be disbursed to account ${this.selectedAccountId} upon approval.
    `;
  }
  
  /**
   * Handle completion of the workflow
   */
  handleComplete(): void {
    this.complete(
      this.applicationSuccess,
      this.applicationSuccess ? { loanId: this.loanDetails?.id } : undefined,
      this.applicationSuccess ? "Loan application submitted successfully." : "Loan application was not completed."
    );
  }
  
  /**
   * Get purpose options based on selected loan type
   */
  getLoanPurposeOptions(): string[] {
    if (!this.selectedLoanType) return [];
    
    switch (this.selectedLoanType) {
      case LoanType.PERSONAL:
        return [
          "Debt Consolidation", 
          "Home Improvement", 
          "Major Purchase", 
          "Medical Expenses",
          "Vacation", 
          "Wedding", 
          "Other Personal Expense"
        ];
      case LoanType.HOME:
        return [
          "Home Purchase", 
          "Refinance", 
          "Home Equity", 
          "Construction",
          "Renovation"
        ];
      case LoanType.VEHICLE:
        return [
          "New Car Purchase", 
          "Used Car Purchase", 
          "Refinance Auto Loan", 
          "Motorcycle Purchase",
          "Boat Purchase", 
          "RV Purchase"
        ];
      case LoanType.EDUCATION:
        return [
          "Undergraduate Tuition", 
          "Graduate Tuition", 
          "Books and Supplies", 
          "Living Expenses",
          "Student Loan Refinancing"
        ];
      case LoanType.BUSINESS:
        return [
          "Business Startup", 
          "Equipment Purchase", 
          "Inventory Financing", 
          "Working Capital",
          "Business Expansion", 
          "Commercial Real Estate"
        ];
      default:
        return ["Other"];
    }
  }
  
  /**
   * Format a number for display
   */
  formatNumber(value: number): string {
    if (isNaN(value) || value === null || value === undefined) {
      return "0.00";
    }
    
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  /**
   * Get friendly label for loan type
   */
  static getLoanTypeLabel(type: LoanType | null): string {
    if (!type) return "Loan";
    
    switch (type) {
      case LoanType.PERSONAL: return "Personal Loan";
      case LoanType.HOME: return "Home Loan";
      case LoanType.VEHICLE: return "Vehicle Loan";
      case LoanType.EDUCATION: return "Education Loan";
      case LoanType.BUSINESS: return "Business Loan";
      default: return "Loan";
    }
  }
  
  /**
   * Handle primary button action
   */
  public handlePrimaryAction(): void {
    // This is a placeholder for the WorkflowBase interface - we're using our own buttons
    // so this method won't be called
  }
  
  /**
   * Cancel the loan application with a message
   */
  cancel(message: string = "Loan application cancelled by user"): void {
    super.cancel(message);
  }
}