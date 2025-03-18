import { Entity } from "../base-repository";

// TODO: probably better to have them as union types
// Loan types available
export enum LoanType {
  PERSONAL = 'personal',
  MORTGAGE = 'mortgage',
  AUTO = 'auto',
  EDUCATION = 'education',
  BUSINESS = 'business',
  LINE_OF_CREDIT = 'line_of_credit',
  VEHICLE = 'vehicle',  // For backward compatibility with mock data
  HOME = 'home'         // For backward compatibility with mock data
}

// Loan status values
export enum LoanStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  PAID_OFF = 'paid_off',
  DEFAULTED = 'defaulted'
}

/**
 * Returns the next loan status in the standard workflow,
 * or null if there is no valid next state or the status is terminal
 */
export function getNextLoanStatus(currentStatus: LoanStatus): LoanStatus | null {
  // Define the standard progression of loan statuses
  const statusProgression: Record<LoanStatus, LoanStatus | null> = {
    [LoanStatus.DRAFT]: LoanStatus.PENDING_APPROVAL,
    [LoanStatus.PENDING_APPROVAL]: LoanStatus.APPROVED,
    [LoanStatus.APPROVED]: LoanStatus.ACTIVE,
    [LoanStatus.ACTIVE]: LoanStatus.PAID_OFF,
    [LoanStatus.PAID_OFF]: null,
    [LoanStatus.REJECTED]: null,
    [LoanStatus.DEFAULTED]: null
  };
  
  return statusProgression[currentStatus];
}

export function getStateDelay(status: LoanStatus, entity: 'loan'): number {
  switch (status) {
    case LoanStatus.DRAFT:
      return 0;
    case LoanStatus.PENDING_APPROVAL:
      return 5000;
    case LoanStatus.APPROVED:
      return 5000;
    case LoanStatus.ACTIVE:
      // TODO: this should be quite high, as it will probably take some time to pay off the loan
      return 50000;
    case LoanStatus.PAID_OFF:
      return 5000;
    case LoanStatus.REJECTED:
      return 5000;
    case LoanStatus.DEFAULTED:
      return 5000;
    default:
      return 0;
  }
}

// Loan entity interface
export interface Loan extends Entity {
  productId: string; // Reference to the product
  name:string
  type: LoanType;
  remainingAmount: number;
  nextPaymentDate: string
  nextPaymentAmount: number
  progress: number
  paymentsMade: number
  paymentsRemaining: number
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
  metadata?: Record<string, any>;
}

// Export Loan type as LoanDetails for convenience (used in loan-workflow)
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

// Loan application interface
export interface LoanApplication {
  productId: string;
  type: LoanType;
  amount: number;
  term: number;
  purpose: string;
  applicantData?: Record<string, any>;
}

// Loan calculation result interface
export interface LoanCalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  interestRate: number;
  amortizationSchedule?: Array<{
    paymentNumber: number;
    paymentAmount: number;
    principalAmount: number;
    interestAmount: number;
    remainingBalance: number;
  }>;
}
