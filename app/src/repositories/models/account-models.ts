import { Entity } from "../base-repository";

// Interface for transfer results
export interface TransferResult {
  success: boolean;
  message?: string;
  transactionId?: string;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'pension' | 'mortgage' | 'isk';

export interface Account extends Entity {
  name: string;
  balance: number;
  currency: string;
  type: AccountType;
  accountNumber: string;
  interestRate?: number;
  isActive: boolean;
  createdAt: string; // ISO date string
  goal?: number; // Optional savings goal amount
  targetDate?: string; // Target date to reach goal

  // Credit card specific properties
  creditLimit?: number;
  availableCredit?: number; 
  paymentDueDate?: string;
  minimumPaymentDue?: number;
  
  // Savings specific properties
  savingsGoal?: number;
  
  // Checking/Current account
  averageBalance?: number;
  hasOverdraftProtection?: boolean;
  
  // Loan specific
  originalLoanAmount?: number;
  interestRateLoan?: number;
  nextPaymentAmount?: number;
  nextPaymentDueDate?: string;
  
  // Investment account
  performanceYTD?: number;
  lastUpdated?: string;
}
