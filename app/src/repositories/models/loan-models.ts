import { Entity } from "../base-repository";

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

// Loan entity interface
export interface Loan extends Entity {
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
