import { StorageService } from "../services/storage-service";
import { UserService } from "../services/user-service";
import { LoanStatus, LoanType } from "../services/loan-service";
import { Entity, LocalStorageRepository } from "./base-repository";
import { generateMockLoans } from "./mock/loan-mock";

export interface Loan extends Entity {
  id: string;
  productId: string; // Reference to the product
  type: LoanType;
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  purpose: string;
  createdAt: string;
  updatedAt: string;
  status: LoanStatus;
  accountId: string;
  signatureId?: string;
  applicationData?: Record<string, any>;
}

export class LoanRepository extends LocalStorageRepository<Loan> {
  constructor(storage: StorageService, userService: UserService) {
    super('loans', storage, userService);
  }

  /**
   * Initialize with mock data
   */
  protected initializeMockData(): void {
    const mockLoans = generateMockLoans();
    
    mockLoans.forEach(loan => {
      this.createForMocks(loan);
    });
    
    this.saveToStorage();
  }

  /**
   * Create a new loan with proper timestamps
   */
  async createAccount(loan: Omit<Loan, "id" | "createdAt" | "updatedAt">): Promise<Loan> {
    const now = new Date().toISOString();
    const loanData = {
      ...loan,
      createdAt: now,
      updatedAt: now
    };
    
    return super.create(loanData);
  }

  /**
   * Update a loan with proper timestamps
   */
  async update(id: string, updates: Partial<Omit<Loan, "id" | "createdAt">>): Promise<Loan | undefined> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return super.update(id, updatedData);
  }

  /**
   * Create a new loan application with initial data
   */
  async createLoanApplication(data: {
    type: LoanType;
    amount: number;
    term: number;
    interestRate: number;
    monthlyPayment: number;
    totalInterest: number;
    purpose?: string;
    status: LoanStatus;
    productId?: string;
  }): Promise<Loan> {
    // Set default product ID based on loan type if not provided
    const productId = data.productId || `${data.type}-loan`;
    
    const loan: Omit<Loan, "id" | "createdAt" | "updatedAt"> = {
      productId,
      type: data.type,
      amount: data.amount,
      term: data.term,
      interestRate: data.interestRate,
      monthlyPayment: data.monthlyPayment,
      totalInterest: data.totalInterest,
      purpose: data.purpose || 'Not specified',
      status: data.status,
      accountId: 'pending' // Will be assigned when approved
    };
    
    return this.createAccount(loan);
  }

  /**
   * Update the loan status
   */
  async updateLoanStatus(id: string, status: LoanStatus): Promise<Loan | undefined> {
    const loan = await this.getById(id);
    if (!loan) {
      throw new Error(`Loan with ID ${id} not found`);
    }
    
    return this.update(id, { status });
  }

  /**
   * Update the loan's account ID
   */
  async updateLoanAccount(id: string, accountId: string): Promise<Loan | undefined> {
    const loan = await this.getById(id);
    if (!loan) {
      throw new Error(`Loan with ID ${id} not found`);
    }
    
    return this.update(id, { accountId });
  }

  /**
   * Update loan with signature ID after signing
   */
  async updateWithSignature(id: string, signatureId: string): Promise<Loan | undefined> {
    const loan = await this.getById(id);
    if (!loan) {
      throw new Error(`Loan with ID ${id} not found`);
    }
    
    return this.update(id, { signatureId });
  }

  /**
   * Get loans by account ID
   */
  async getByAccountId(accountId: string): Promise<Loan[]> {
    const loans = await this.getAll();
    return loans.filter(loan => loan.accountId === accountId);
  }

  /**
   * Get loans by status
   */
  async getByStatus(status: LoanStatus): Promise<Loan[]> {
    const loans = await this.getAll();
    return loans.filter(loan => loan.status === status);
  }

  /**
   * Get active loans
   */
  async getActiveLoans(): Promise<Loan[]> {
    return this.getByStatus(LoanStatus.ACTIVE);
  }

  /**
   * Get pending approval loans
   */
  async getPendingLoans(): Promise<Loan[]> {
    return this.getByStatus(LoanStatus.PENDING_APPROVAL);
  }

  /**
   * Get loans by product ID
   */
  async getByProductId(productId: string): Promise<Loan[]> {
    const loans = await this.getAll();
    return loans.filter(loan => loan.productId === productId);
  }
}
