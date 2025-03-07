import { getSingletonManager } from './singleton-manager';
import { repositoryService } from './repository-service';
import { userService } from './user-service';
import { Loan } from '../repositories/loan-repository';

// Loan types available
export enum LoanType {
  PERSONAL = 'personal',
  HOME = 'home',
  VEHICLE = 'vehicle',
  EDUCATION = 'education',
  BUSINESS = 'business'
}

// Loan status values
export enum LoanStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  CLOSED = 'closed',
  DEFAULTED = 'defaulted'
}

// Export Loan type from repository for convenience
export type LoanDetails = Loan;

// Eligibility criteria result
export interface EligibilityResult {
  eligible: boolean;
  maxAmount: number;
  minAmount: number;
  reason?: string;
  recommendedTerm?: number;
  estimatedRate?: number;
}

/**
 * Loan service to handle loan operations
 */
export class LoanService {
  private static instance: LoanService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): LoanService {
    const singletonManager = getSingletonManager();
    const instance = singletonManager.getOrCreate<LoanService>(
      'LoanService', 
      () => new LoanService()
    );
    return instance;
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
          
        case LoanType.HOME:
          return {
            eligible: true,
            minAmount: 100000,
            maxAmount: 1000000,
            estimatedRate: 3.49,
            recommendedTerm: 360 // 30 years
          };
          
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
      case LoanType.HOME: return 3.49;
      case LoanType.VEHICLE: return 4.25;
      case LoanType.EDUCATION: return 3.99;
      case LoanType.BUSINESS: return 6.75;
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
    purpose?: string
  ): Promise<LoanDetails> {
    try {
      // Get loan repository
      const loanRepo = repositoryService.getLoanRepository();
      
      // Calculate loan details
      const { monthlyPayment, totalInterest, interestRate } = 
        this.calculateLoanDetails(amount, term, loanType);
      
      // Create loan object using repository
      const loan = await loanRepo.createLoanApplication({
        type: loanType,
        amount,
        term,
        interestRate,
        monthlyPayment,
        totalInterest,
        purpose,
        status: LoanStatus.DRAFT
      });
      
      console.debug("Draft loan created:", loan);
      return loan;
    } catch (error) {
      console.error("Error creating draft loan:", error);
      throw new Error("Failed to create loan application");
    }
  }
  
  /**
   * Update a draft loan with additional details
   */
  async updateLoanApplication(
    loanId: string, 
    updates: Partial<LoanDetails>
  ): Promise<LoanDetails> {
    try {
      // Get loan repository
      const loanRepo = repositoryService.getLoanRepository();
      
      // Get existing loan
      const existingLoan = await loanRepo.getById(loanId);
      
      if (!existingLoan) {
        throw new Error("Loan not found");
      }
      
      // Create updated loan object
      const updatedLoan: Loan = {
        ...existingLoan,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // If amount or term changed, recalculate
      if (updates.amount || updates.term) {
        const { monthlyPayment, totalInterest, interestRate } = 
          this.calculateLoanDetails(
            updatedLoan.amount, 
            updatedLoan.term, 
            updatedLoan.type
          );
        
        updatedLoan.monthlyPayment = monthlyPayment;
        updatedLoan.totalInterest = totalInterest;
        updatedLoan.interestRate = interestRate;
      }
      
      // Update loan in repository
      await loanRepo.update(loanId, updatedLoan);
      console.debug("Loan updated:", updatedLoan);
      
      return updatedLoan;
    } catch (error) {
      console.error("Error updating loan:", error);
      throw new Error("Failed to update loan application");
    }
  }
  
  /**
   * Update the destination account for a loan
   */
  async updateLoanAccount(loanId: string, accountId: string): Promise<LoanDetails> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.updateLoanAccount(loanId, accountId);
  }
  
  /**
   * Submit loan application for approval
   */
  async submitLoanApplication(loanId: string): Promise<LoanDetails> {
    try {
      // Get loan repository
      const loanRepo = repositoryService.getLoanRepository();
      
      // Update loan status to pending approval
      const updatedLoan = await loanRepo.updateLoanStatus(
        loanId, 
        LoanStatus.PENDING_APPROVAL
      );
      
      console.debug("Loan application submitted:", updatedLoan);
      return updatedLoan;
    } catch (error) {
      console.error("Error submitting loan application:", error);
      throw new Error("Failed to submit loan application");
    }
  }
  
  /**
   * Get all loans for the current user
   */
  async getAllLoans(): Promise<LoanDetails[]> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getAll();
  }
  
  /**
   * Get a specific loan by ID
   */
  async getLoanById(loanId: string): Promise<LoanDetails | undefined> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getById(loanId);
  }
  
  /**
   * Get active loans
   */
  async getActiveLoans(): Promise<LoanDetails[]> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.getActiveLoans();
  }
  
  /**
   * Update loan with signature ID after signing
   */
  async updateWithSignature(loanId: string, signatureId: string): Promise<LoanDetails> {
    const loanRepo = repositoryService.getLoanRepository();
    return loanRepo.updateWithSignature(loanId, signatureId);
  }
}

export const loanService = LoanService.getInstance();
