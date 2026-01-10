import { customElement, Observable, observable } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "../workflow-base";
import { loanService } from "../../services/loan-service";
import { repositoryService } from "../../services/repository-service";
import { WorkflowIds } from "../workflow-registry";
import "@primitives/button";

// Include template and styles
import { template } from "./loan-workflow.template";
import { styles } from "./loan-workflow.styles";
import { Account } from "../../repositories/models/account-models";
import { LoanType, EligibilityResult, LoanDetails } from "../../repositories/models/loan-models";
import { getProductIcon } from "./loan-workflow.helper";
import { Product } from "../../repositories/models/product-models";
import { productRepository } from "../../repositories/product-repository";

@customElement({
  name: "loan-workflow",
  template,
  styles
})
export class LoanWorkflow extends WorkflowBase {
  // Step tracking
  @observable step: 'select-product' | 'eligibility' | 'loan-details' | 'terms' | 'result' = 'select-product';
  @observable headerTitle: string = "Apply for a Loan";

  // Available loan products
  @observable availableLoanProducts: Product[] = [];
  @observable selectedProduct: Product | null = null;

  // Loan type selection (for backward compatibility)
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
  @observable agreedToTerms: boolean = false

  // Application result
  @observable applicationSuccess: boolean = false;
  @observable errorMessage: string = "";

  /**
   * Initialize workflow
   */
  async initialize(params?: Record<string, any>): Promise<void> {
    // Set a wider modal width for this workflow to accommodate the two-column layout
    this.setModalWidth("800px");

    // Don't use the modal's primary button, we'll handle navigation in our template
    this.updateFooter(false);

    this.updateTitle("Apply for a Loan");

    // Load accounts and loan products
    await Promise.all([
      this.loadAccounts(),
      this.loadLoanProducts()
    ]);

    this.goToStep(this.step)
    return

    // Pre-select product if provided
    // if (params?.productId) {
    //   this.selectProductById(params.productId);
    // }
    // // Fallback to loan type for backward compatibility
    // else if (params?.loanType) {
    //   this.selectProductByLoanType(params.loanType);
    // }

    // // If we have a product selected, go directly to eligibility check
    // if (this.selectedProduct) {
    //   await this.checkEligibility();
    // }
  }

  /**
   * Load available loan products
   */
  async loadLoanProducts(): Promise<void> {
    try {
      this.isLoading = true;
      this.availableLoanProducts = await productRepository.getByEntityType('loan');
      console.debug('Available loan products loaded:', this.availableLoanProducts);
    } catch (error) {
      console.error("Error loading loan products:", error);
      this.errorMessage = "Could not load loan products. Please try again.";
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Select product by ID
   */
  selectProductById(productId: string): void {
    const product = this.availableLoanProducts.find(p => p.id === productId);
    if (product) {
      this.selectedProduct = product;
      // Map to loan type for backward compatibility
      this.mapProductToLoanType(product);
      this.updateHeaderTitle();
    } else {
      console.warn(`Product with ID ${productId} not found`);
    }
  }

  /**
   * Select product by loan type (for backward compatibility)
   */
  selectProductByLoanType(loanType: LoanType): void {
    // Find first product that matches the loan type
    const product = this.availableLoanProducts.find(p => {
      const type = p.metadata?.loanType || this.inferLoanTypeFromProduct(p);
      return type === loanType;
    });

    if (product) {
      this.selectedProduct = product;
      this.selectedLoanType = loanType;
      this.updateHeaderTitle();
    } else {
      console.warn(`No product found for loan type ${loanType}`);
    }
  }

  /**
   * Map selected product to loan type
   */
  private mapProductToLoanType(product: Product): void {
    // First try to get loan type from metadata
    if (product.metadata?.loanType) {
      this.selectedLoanType = product.metadata.loanType as LoanType;
      return;
    }

    // Otherwise infer from product ID or name
    this.selectedLoanType = this.inferLoanTypeFromProduct(product);
  }

  /**
   * Infer loan type from product ID or name
   */
  private inferLoanTypeFromProduct(product: Product): LoanType {
    const id = product.id.toLowerCase();
    const name = product.name.toLowerCase();

    if (id.includes('personal') || name.includes('personal')) {
      return LoanType.PERSONAL;
    }
    if (id.includes('mortgage') || name.includes('mortgage') ||
      id.includes('home') || name.includes('home')) {
      return LoanType.HOME;
    }
    if (id.includes('auto') || name.includes('auto') ||
      id.includes('vehicle') || name.includes('vehicle') ||
      id.includes('car') || name.includes('car')) {
      return LoanType.VEHICLE;
    }
    if (id.includes('student') || name.includes('student') ||
      id.includes('education') || name.includes('education')) {
      return LoanType.EDUCATION;
    }
    if (id.includes('business') || name.includes('business')) {
      return LoanType.BUSINESS;
    }

    // Default
    return LoanType.PERSONAL;
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
      console.debug("All accounts loaded:", allAccounts);

      // Filter for checking and savings accounts only
      this.accounts = allAccounts.filter(acc =>
        acc.isActive && (acc.type === 'checking' || acc.type === 'savings')
      );

      console.debug("Checking and savings accounts loaded:", this.accounts);

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
   * Select a loan product
   */
  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.mapProductToLoanType(product);
    this.updateHeaderTitle();
  }

  /**
   * Update header title based on current step
   */
  updateHeaderTitle(): void {
    if (!this.selectedProduct) {
      this.headerTitle = "Apply for a Loan";
      return;
    }

    const productName = this.selectedProduct.name;

    switch (this.step) {
      case 'select-product':
        this.updateTitle(`${getProductIcon(this.selectedProduct)} Apply for a ${productName}`);
        // this.headerTitle = `Apply for a ${productName}`;
        break;
      case 'eligibility':
        this.updateTitle(`${getProductIcon(this.selectedProduct)} ${productName} Eligibility`);
        // this.headerTitle = `${productName} Eligibility`;
        break;
      case 'loan-details':
        this.updateTitle(`${getProductIcon(this.selectedProduct)} ${productName} Details`);
        // this.headerTitle = `${productName} Details`;
        break;
      case 'terms':
        this.updateTitle(`${getProductIcon(this.selectedProduct)} ${productName} Terms`);
        // this.headerTitle = `${productName} Terms`;
        break;
      case 'result':
        if (this.applicationSuccess) {
          this.updateTitle(`${getProductIcon(this.selectedProduct)} ${productName} Application Submitted`);
        } else {
          this.updateTitle(`${getProductIcon(this.selectedProduct)} ${productName} Application Failed`);
        }
        // this.headerTitle = this.applicationSuccess
        //   ? `${productName} Application Submitted`
        //   : `${productName} Application Failed`;
        break;
    }
  }

  /**
   * Start eligibility check
   */
  async checkEligibility(): Promise<void> {
    if (!this.selectedProduct || !this.selectedLoanType) return;

    this.goToStep('eligibility');
    // this.step = 'eligibility';
    // this.isLoading = true;

    // this.updateHeaderTitle();
    // this.errorMessage = ""; // Clear any previous error messages

    try {
      // Check eligibility with loan service using the loan type (for now)
      this.eligibilityResult = await loanService.checkEligibility(this.selectedLoanType);

      if (this.eligibilityResult && this.eligibilityResult.eligible) {
        // Set initial loan amount based on product metadata or eligibility result
        if (this.selectedProduct.metadata?.defaultAmount) {
          this.loanAmount = this.selectedProduct.metadata.defaultAmount;
        } else {
          this.loanAmount = this.eligibilityResult.minAmount +
            ((this.eligibilityResult.maxAmount - this.eligibilityResult.minAmount) / 2);
        }

        // Set loan term based on product metadata, eligibility result, or default
        if (this.selectedProduct.metadata?.defaultTerm) {
          this.loanTerm = this.selectedProduct.metadata.defaultTerm;
        } else if (this.eligibilityResult.recommendedTerm) {
          this.loanTerm = this.eligibilityResult.recommendedTerm;
        }

        // Set default loan purpose based on purposes from product or loan type
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
   * Set a default loan purpose based on product or loan type
   */
  private setDefaultLoanPurpose(): void {
    // First try to get purposes from product metadata
    if (this.selectedProduct?.metadata?.purposes &&
      Array.isArray(this.selectedProduct.metadata.purposes) &&
      this.selectedProduct.metadata.purposes.length > 0) {
      this.loanPurpose = this.selectedProduct.metadata.purposes[0];
      return;
    }

    // Fall back to purposes based on loan type
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
  goToStep(step: 'select-product' | 'eligibility' | 'loan-details' | 'terms' | 'result'): void {
    this.step = step;

    this.updateHeaderTitle();
    this.errorMessage = ""; // Clear any error messages when changing steps
    // this.notifyValidation(false);
    console.debug("Navigating to step:", step, this.selectedAccountId);

    if (step == 'loan-details' && this.selectedAccountId) {
      console.debug('validation is fine')
      // this.notifyValidation(true);
    }
  }


  /**
   * Create draft loan and move to next step
   */
  async createDraftLoan(calculatedDetails: {
    monthlyPayment: number;
    totalInterest: number;
    interestRate: number;
  } | null): Promise<void> {
    if (!this.selectedProduct || !this.selectedLoanType || !calculatedDetails) return;

    try {
      this.isLoading = true;

      // Create draft loan
      const loan = await loanService.createDraftLoan(
        this.selectedLoanType,
        this.loanAmount,
        this.loanTerm,
        this.loanPurpose,
        this.selectedProduct.id // Pass the product ID to link it
      );

      this.loanDetails = loan;
      this.goToStep('loan-details');
      // this.step = 'loan-details';
      // this.updateHeaderTitle();
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
   * Toggle terms agreement checkbox
   */
  toggleTermsAgreement(event: Event): void {
    console.debug("Terms agreement toggled:", this.agreedToTerms, "Checkbox state updated");
    // Toggle the state
    this.agreedToTerms = !this.agreedToTerms;

    // Force UI update
    Observable.notify(this, 'agreedToTerms');

    // Clear error message if applicable
    if (this.agreedToTerms && this.errorMessage === "Please agree to the terms and conditions.") {
      this.errorMessage = "";
    }
  }

  /**
   * Update terms agreement checkbox (keep for compatibility)
   */
  updateAgreedToTerms(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.agreedToTerms = checkbox.checked;
    Observable.notify(this, 'agreedToTerms');
    console.debug("updateAgreedToTerms called, new state:", this.agreedToTerms);
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
      // TODO: not sure about this
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
          documentName: `${this.selectedProduct?.name || LoanWorkflow.getLoanTypeLabel(this.selectedLoanType)} Agreement`,
          documentContent: documentContent
        }
      );
      // NOTE: we never get here?


      if (signingResult.success) {
        console.debug("Signing completed successfully:", signingResult.data);
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
        console.debug("Signing was not completed:", signingResult.message, this.step);

        this.errorMessage = signingResult.message || "Signing was not completed.";
      }
    } catch (error) {
      console.error("Error during signing process:", error);
      this.errorMessage = "An error occurred during the signing process.";
    }
  }

  override async resume(result?: WorkflowResult): Promise<void> {
    if (!result) return;
    const signingResult = (result as any).detail as WorkflowResult;
    console.debug('resume', signingResult)

    if (signingResult.success) {
      console.debug("Signing completed successfully:", signingResult.data);
      // Store signature ID with loan
      await loanService.updateWithSignature(
        this.loanDetails!.id,
        signingResult.data?.signature || "signed"
      );

      // Submit the loan application
      await loanService.submitLoanApplication(this.loanDetails!.id);

      // Show success result
      this.applicationSuccess = true;
      this.step = 'result';
      this.updateHeaderTitle();
    }
    else {
      console.debug("Signing was not completed:", signingResult.message, this.step);
    }

  }

  /**
   * Format loan agreement document
   */
  private formatLoanDocument(): string {
    if (!this.loanDetails || !this.selectedProduct) return "";

    const productName = this.selectedProduct.name;
    const formattedAmount = this.formatNumber(this.loanAmount);
    const formattedMonthly = this.formatNumber(this.loanDetails.monthlyPayment);
    const formattedTotal = this.formatNumber(this.loanAmount + this.loanDetails.totalInterest);

    return `
      ${productName.toUpperCase()} AGREEMENT
      
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
   * Get purpose options based on selected product or loan type
   */
  getLoanPurposeOptions(): string[] {
    // First try to get purposes from product metadata
    if (this.selectedProduct?.metadata?.purposes &&
      Array.isArray(this.selectedProduct.metadata.purposes)) {
      return this.selectedProduct.metadata.purposes;
    }

    // Fall back to purposes based on loan type
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
      case LoanType.MORTGAGE:
        return [
          "Home Purchase",
          "Refinance",
          "Home Equity",
          "Construction",
          "Renovation"
        ];
      case LoanType.VEHICLE:
      case LoanType.AUTO:
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