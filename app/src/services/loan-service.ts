import { repositoryService } from './repository-service';
import { userService } from './user-service';
import { 
  Loan, 
  LoanType, 
  LoanStatus, 
  LoanApplication, 
  EligibilityResult} from '../repositories/models/loan-models';
import { Product } from '../repositories/models/product-models';

/**
 * Loan service to handle loan operations
 */
export class LoanService {
  private static instance: LoanService;
  
  private constructor() {
    console.debug('LoanService initialized');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): LoanService {
    if (!LoanService.instance) {
      LoanService.instance = new LoanService();
    }
    return LoanService.instance;
  }
  
  /**
   * Check user eligibility for a loan
   * @param loanType Type of loan
   * @returns Eligibility result with max amount and rate
   */
  async checkEligibility(loanType: LoanType): Promise<EligibilityResult> {
    try {
      // Get user financial data from repository
      const userId = userService.getCurrentUserId();
      
      // This would normally call the loan repository
      // For now, we'll return mock eligibility data
      console.debug(`Checking eligibility for ${loanType} loan for user ${userId}`);
      
      // Mock eligibility based on loan type
      switch (loanType) {
        case LoanType.PERSONAL:
          return {
            eligible: true,
            minAmount: 5000,
            maxAmount: 50000,
            estimatedRate: 5.99,
            recommendedTerm: 36
          };
          
        case LoanType.MORTGAGE:
        case LoanType.HOME:
          return {
            eligible: true,
            minAmount: 100000,
            maxAmount: 1000000,
            estimatedRate: 3.49,
            recommendedTerm: 360 // 30 years
          };
          
        case LoanType.AUTO:
        case LoanType.VEHICLE:
          return {
            eligible: true,
            minAmount: 10000,
            maxAmount: 75000,
            estimatedRate: 4.25,
            recommendedTerm: 60
          };
          
        case LoanType.EDUCATION:
          return {
            eligible: true,
            minAmount: 5000,
            maxAmount: 30000,
            estimatedRate: 3.99,
            recommendedTerm: 120
          };
          
        case LoanType.BUSINESS:
          return {
            eligible: false,
            minAmount: 0,
            maxAmount: 0,
            reason: "Business loans require a business profile. Please complete your business profile first."
          };
          
        case LoanType.LINE_OF_CREDIT:
          return {
            eligible: true,
            minAmount: 5000,
            maxAmount: 100000,
            estimatedRate: 6.75,
            recommendedTerm: 60
          };
          
        default:
          return {
            eligible: false,
            minAmount: 0,
            maxAmount: 0,
            reason: "Unknown loan type"
          };
      }
    } catch (error) {
      console.error("Error checking loan eligibility:", error);
      return {
        eligible: false,
        minAmount: 0,
        maxAmount: 0,
        reason: "An error occurred while checking eligibility"
      };
    }
  }
  
  /**
   * Calculate loan details based on amount, term and type
   */
  calculateLoanDetails(amount: number, term: number, loanType: LoanType): {
    monthlyPayment: number;
    totalInterest: number;
    interestRate: number;
  } {
    // Get base interest rate for loan type
    const baseRate = this.getBaseRate(loanType);
    
    // Apply term adjustment (longer terms have higher rates)
    let termAdjustment = 0;
    if (term <= 12) termAdjustment = -0.5;
    else if (term <= 36) termAdjustment = 0;
    else if (term <= 60) termAdjustment = 0.25;
    else termAdjustment = 0.5;
    
    // Apply amount adjustment (larger loans may have lower rates)
    let amountAdjustment = 0;
    if (amount >= 100000) amountAdjustment = -0.5;
    else if (amount >= 50000) amountAdjustment = -0.25;
    else if (amount >= 20000) amountAdjustment = 0;
    else amountAdjustment = 0.25;
    
    // Calculate final rate
    const interestRate = Math.max(1, baseRate + termAdjustment + amountAdjustment);
    
    // Calculate monthly interest rate
    const monthlyRate = interestRate / 100 / 12;
    
    // Calculate monthly payment using amortization formula
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                          (Math.pow(1 + monthlyRate, term) - 1);
    
    // Calculate total interest
    const totalInterest = (monthlyPayment * term) - amount;
    
    return {
      monthlyPayment,
      totalInterest,
      interestRate
    };
  }
  
  /**
   * Get base interest rate for a loan type
   */
  private getBaseRate(loanType: LoanType): number {
    switch (loanType) {
      case LoanType.PERSONAL: return 5.99;
      case LoanType.MORTGAGE:
      case LoanType.HOME: return 3.49;
      case LoanType.AUTO:
      case LoanType.VEHICLE: return 4.25;
      case LoanType.EDUCATION: return 3.99;
      case LoanType.BUSINESS: return 6.75;
      case LoanType.LINE_OF_CREDIT: return 6.75;
      default: return 5.99;
    }
  }
  
  /**
   * Create a draft loan application
   */
  async createDraftLoan(
    loanType: LoanType, 
    amount: number,
    term: number,
    purpose?: string,
    productId?: string
  ): Promise<Loan> {
    try {
      // Get loan repository
      const loanRepo = repositoryService.getLoanRepository();
      
      // Calculate loan details
      const { monthlyPayment, totalInterest, interestRate } = 
        this.calculateLoanDetails(amount, term, loanType);
      
      // Use the repository's dedicated method for creating loan applications
      return loanRepo.createLoanApplication({
        type: loanType,
        amount,
        term,
        interestRate,
        monthlyPayment,
        totalInterest,
        purpose,
        status: LoanStatus.DRAFT,
        productId
      });
    } catch (error) {
      console.error("Error creating draft loan:", error);
      throw new Error("Failed to create loan application");
    }
  }
  
  /**
   * Submit loan application for approval
   */
  async submitLoanApplication(loanId: string): Promise<Loan> {
    try {
      const loanRepo = repositoryService.getLoanRepository();
      const updatedLoan = await loanRepo.updateLoanStatus(loanId, LoanStatus.PENDING_APPROVAL);
      
      if (!updatedLoan) {
        throw new Error("Failed to update loan status");
      }
      
      // Here you would add any business logic related to submitting an application
      // For example: notify approvers, send confirmation email, etc.
      
      console.debug("Loan application submitted:", updatedLoan);
      return updatedLoan;
    } catch (error) {
      console.error("Error submitting loan application:", error);
      throw new Error("Failed to submit loan application");
    }
  }

  /**
   * Generate amortization schedule for a loan
   */
  generateAmortizationSchedule(amount: number, termMonths: number, interestRate: number) {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = amount * (
      monthlyRate * Math.pow(1 + monthlyRate, termMonths)
    ) / (
      Math.pow(1 + monthlyRate, termMonths) - 1
    );
    
    let remainingBalance = amount;
    const schedule = [];
    
    for (let i = 1; i <= termMonths; i++) {
      const interest = remainingBalance * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;
      
      schedule.push({
        paymentNumber: i,
        paymentAmount: parseFloat(monthlyPayment.toFixed(2)),
        principalAmount: parseFloat(principal.toFixed(2)),
        interestAmount: parseFloat(interest.toFixed(2)),
        remainingBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2))
      });
    }
    
    return schedule;
  }

  /**
   * Apply for a new loan
   */
  async applyForLoan(application: LoanApplication): Promise<Loan> {
    const loanRepo = repositoryService.getLoanRepository();
    const productRepo = repositoryService.getUserProductRepository();
    
    // Verify the product exists
    const product = await productRepo.getById(application.productId);
    if (!product) {
      throw new Error('Loan product not found');
    }
    
    // Calculate loan details
    const { interestRate, monthlyPayment, totalInterest } = 
      this.calculateLoanDetails(application.amount, application.term, application.type);
    
    // Create loan application using repository
    return loanRepo.createLoanApplication({
      type: application.type,
      amount: application.amount,
      term: application.term,
      interestRate,
      monthlyPayment,
      totalInterest,
      purpose: application.purpose,
      status: LoanStatus.PENDING_APPROVAL,
      productId: application.productId
    });
  }
  
  /**
   * Get a specific loan
   */
  async getLoan(loanId: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getById(loanId);
  }
  
  /**
   * Get all loans of the current user
   */
  async getAllLoans(): Promise<Loan[]> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getAll();
  }
  
  /**
   * Get active loans
   */
  async getActiveLoans(): Promise<Loan[]> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getActiveLoans();
  }
  
  /**
   * Get pending loans
   */
  async getPendingLoans(): Promise<Loan[]> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getPendingLoans();
  }
  
  /**
   * Approve a loan application
   */
  async approveLoan(loanId: string, accountId: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    const loan = await loanRepo.getById(loanId);
    
    if (!loan) {
      throw new Error('Loan not found');
    }
    
    if (loan.status !== LoanStatus.PENDING_APPROVAL) {
      throw new Error(`Loan cannot be approved. Current status: ${loan.status}`);
    }
    
    // First update the account ID
    await loanRepo.updateLoanAccount(loanId, accountId);
    
    // Then update the status to approved
    return loanRepo.updateLoanStatus(loanId, LoanStatus.APPROVED);
  }
  
  /**
   * Reject a loan application
   */
  async rejectLoan(loanId: string, reason?: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    const loan = await loanRepo.getById(loanId);
    
    if (!loan) {
      throw new Error('Loan not found');
    }
    
    // Add rejection reason to application data
    const applicationData = {
      ...loan.applicationData,
      rejectionReason: reason || 'Application did not meet approval criteria'
    };
    
    // Update application data
    await loanRepo.update(loanId, { applicationData });
    
    // Update status to rejected
    return loanRepo.updateLoanStatus(loanId, LoanStatus.REJECTED);
  }
  
  /**
   * Activate an approved loan
   */
  async activateLoan(loanId: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    const loan = await loanRepo.getById(loanId);
    
    if (!loan) {
      throw new Error('Loan not found');
    }
    
    if (loan.status !== LoanStatus.APPROVED) {
      throw new Error(`Loan cannot be activated. Current status: ${loan.status}`);
    }
    
    // Business logic for activating a loan would go here
    // For example: transfer funds to the account, create payment schedule, etc.
    
    return loanRepo.updateLoanStatus(loanId, LoanStatus.ACTIVE);
  }
  
  /**
   * Mark a loan as paid off
   */
  async markLoanAsPaidOff(loanId: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    const loan = await loanRepo.getById(loanId);
    
    if (!loan) {
      throw new Error('Loan not found');
    }
    
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new Error(`Loan cannot be marked as paid off. Current status: ${loan.status}`);
    }
    
    return loanRepo.updateLoanStatus(loanId, LoanStatus.PAID_OFF);
  }
  
  /**
   * Get available loan products
   */
  async getLoanProducts(): Promise<Product[]> {
    const productRepo = repositoryService.getUserProductRepository();
    return productRepo.getByEntityType('loan');
  }
  
  /**
   * Check if a user has active loans
   */
  async hasActiveLoans(): Promise<boolean> {
    const activeLoans = await this.getActiveLoans();
    return activeLoans.length > 0;
  }
  
  /**
   * Get total active loan balance
   */
  async getTotalLoanBalance(): Promise<number> {
    const activeLoans = await this.getActiveLoans();
    return activeLoans.reduce((total, loan) => total + loan.amount, 0);
  }

  /**
   * Update loan application details
   * Added to support workflow
   */
  async updateLoanApplication(loanId: string, updates: Record<string, any>): Promise<Loan | undefined> {
    try {
      const loanRepo = repositoryService.getLoanRepository();
      const loan = await loanRepo.getById(loanId);
      
      if (!loan) {
        throw new Error(`Loan with ID ${loanId} not found`);
      }
      
      return loanRepo.update(loanId, updates);
    } catch (error) {
      console.error("Error updating loan application:", error);
      throw new Error("Failed to update loan application");
    }
  }
  
  /**
   * Update loan account
   * Renamed to better match the repository method
   */
  async updateLoanAccount(loanId: string, accountId: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.updateLoanAccount(loanId, accountId);
  }
  
  /**
   * Update loan with signature
   * Added to support workflow
   */
  async updateWithSignature(loanId: string, signatureId: string): Promise<Loan | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.updateWithSignature(loanId, signatureId);
  }
}

export const loanService = LoanService.getInstance();
