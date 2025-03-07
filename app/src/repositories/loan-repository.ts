import { Entity, LocalStorageRepository } from './base-repository';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/user-service';
import { LoanType, LoanStatus } from '../services/loan-service';
import { generateMockLoans } from './mock/loan-mock';

// Define the Loan entity that extends the base Entity interface
export interface Loan extends Entity {
  type: LoanType;
  amount: number;
  term: number; // In months
  interestRate: number; // Annual percentage rate
  monthlyPayment: number;
  totalInterest: number;
  purpose?: string;
  collateral?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: LoanStatus;
  accountId?: string; // Where loan funds will be deposited
  applicationData?: Record<string, any>; // Additional application data
  signatureId?: string; // Reference to signing request
}

/**
 * Repository for loan data, following the repository pattern
 */
export class LoanRepository extends LocalStorageRepository<Loan> {
  constructor(storage: StorageService, userService: UserService) {
    super('loans', storage, userService);
  }

  protected initializeMockData(): void {
    const mockLoans = generateMockLoans();

    // Add mock loans
    mockLoans.forEach(loan => {
      this.entities.set(loan.id, loan);
    });

    // Save to storage
    this.saveToStorage();
  }

  /**
   * Create a new loan application
   */
  async createLoanApplication(loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Loan> {
    const id = `loan_${Date.now()}`;
    const now = new Date().toISOString();
    
    const newLoan: Loan = {
      id,
      createdAt: now,
      updatedAt: now,
      ...loan
    };
    
    await this.create(newLoan);
    return newLoan;
  }

  /**
   * Update loan status
   */
  async updateLoanStatus(loanId: string, status: LoanStatus): Promise<Loan> {
    const loan = await this.getById(loanId);
    if (!loan) {
      throw new Error(`Loan with ID ${loanId} not found`);
    }
    
    const updatedLoan: Loan = {
      ...loan,
      status,
      updatedAt: new Date().toISOString()
    };
    
    await this.update(loanId, updatedLoan);
    return updatedLoan;
  }

  /**
   * Get loans by status
   */
  async getLoansByStatus(status: LoanStatus): Promise<Loan[]> {
    const loans = await this.getAll();
    return loans.filter(loan => loan.status === status);
  }

  /**
   * Get active loans
   */
  async getActiveLoans(): Promise<Loan[]> {
    return this.getLoansByStatus(LoanStatus.ACTIVE);
  }

  /**
   * Get pending approval loans
   */
  async getPendingLoans(): Promise<Loan[]> {
    return this.getLoansByStatus(LoanStatus.PENDING_APPROVAL);
  }

  /**
   * Get draft loans
   */
  async getDraftLoans(): Promise<Loan[]> {
    return this.getLoansByStatus(LoanStatus.DRAFT);
  }

  /**
   * Update loan with signature ID after signing
   */
  async updateWithSignature(loanId: string, signatureId: string): Promise<Loan> {
    const loan = await this.getById(loanId);
    if (!loan) {
      throw new Error(`Loan with ID ${loanId} not found`);
    }
    
    const updatedLoan: Loan = {
      ...loan,
      signatureId,
      updatedAt: new Date().toISOString()
    };
    
    await this.update(loanId, updatedLoan);
    return updatedLoan;
  }

  /**
   * Update loan account ID (where funds will be deposited)
   */
  async updateLoanAccount(loanId: string, accountId: string): Promise<Loan> {
    const loan = await this.getById(loanId);
    if (!loan) {
      throw new Error(`Loan with ID ${loanId} not found`);
    }
    
    const updatedLoan: Loan = {
      ...loan,
      accountId,
      updatedAt: new Date().toISOString()
    };
    
    await this.update(loanId, updatedLoan);
    return updatedLoan;
  }
}
