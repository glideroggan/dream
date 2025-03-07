import { Loan } from '../loan-repository';
import { LoanStatus, LoanType } from '../../services/loan-service';
import { generateUUID } from '../../utilities/id-generator';

export function generateMockLoans(): Loan[] {
  const now = new Date();
  const mockLoans: Loan[] = [];
  
  // Personal loan - active
  mockLoans.push({
    id: 'loan_1',
    type: LoanType.PERSONAL,
    amount: 10000,
    term: 36,
    interestRate: 5.99,
    monthlyPayment: 304.17,
    totalInterest: 950.12,
    purpose: 'Debt consolidation',
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updatedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    status: LoanStatus.ACTIVE,
    accountId: 'acc-1', // Main Checking account from account-mock.ts
    signatureId: generateUUID()
  });
  
  // Home loan - active - connected to home down payment savings account
  mockLoans.push({
    id: 'loan_2',
    type: LoanType.HOME,
    amount: 250000,
    term: 360, // 30 years
    interestRate: 3.49,
    monthlyPayment: 1120.54,
    totalInterest: 153394.40,
    purpose: 'Home purchase',
    createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    updatedAt: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000).toISOString(), // 85 days ago
    status: LoanStatus.ACTIVE,
    accountId: 'acc-7', // Home Down Payment account from account-mock.ts
    signatureId: generateUUID()
  });
  
  // Vehicle loan - pending approval
  mockLoans.push({
    id: 'loan_3',
    type: LoanType.VEHICLE,
    amount: 35000,
    term: 60,
    interestRate: 4.25,
    monthlyPayment: 648.42,
    totalInterest: 3905.20,
    purpose: 'New car purchase',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: LoanStatus.PENDING_APPROVAL,
    accountId: 'acc-1', // Main Checking account from account-mock.ts
    signatureId: generateUUID()
  });
  
  // Education loan - draft
  mockLoans.push({
    id: 'loan_4',
    type: LoanType.EDUCATION,
    amount: 15000,
    term: 120,
    interestRate: 3.99,
    monthlyPayment: 151.23,
    totalInterest: 3147.60,
    purpose: 'Graduate program tuition',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    status: LoanStatus.DRAFT,
    accountId: 'acc-1', // Main Checking account from account-mock.ts
  });
  
  // Personal loan - rejected
  mockLoans.push({
    id: 'loan_5',
    type: LoanType.PERSONAL,
    amount: 75000, // High amount for personal loan
    term: 60,
    interestRate: 8.99,
    monthlyPayment: 1555.21,
    totalInterest: 18312.60,
    purpose: 'Business startup',
    createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    updatedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    status: LoanStatus.REJECTED,
    accountId: 'acc-2', // Emergency Fund account from account-mock.ts
    signatureId: generateUUID(),
    applicationData: {
      // Additional data explaining rejection
      rejectionReason: 'Requested amount exceeds maximum for personal loan'
    }
  });
  
  // Connected to car loan from account-mock.ts (acc-6)
  // This is the original loan that created the car loan account
  mockLoans.push({
    id: 'loan_6',
    type: LoanType.VEHICLE,
    amount: 25000,
    term: 48,
    interestRate: 4.5,
    monthlyPayment: 573.15,
    totalInterest: 2511.20,
    purpose: 'Previous car purchase',
    createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
    updatedAt: new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000).toISOString(),
    status: LoanStatus.ACTIVE,
    accountId: 'acc-6', // Car Loan account from account-mock.ts
    signatureId: generateUUID()
  });
  
  // Connected to mortgage from account-mock.ts (acc-8)
  // This is the original loan that created the mortgage account
  mockLoans.push({
    id: 'loan_7',
    type: LoanType.HOME,
    amount: 400000,
    term: 360, // 30 years
    interestRate: 3.5,
    monthlyPayment: 1796.18,
    totalInterest: 246625.80,
    purpose: 'Home mortgage',
    createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString(), // 2 years ago
    updatedAt: new Date(now.getTime() - 725 * 24 * 60 * 60 * 1000).toISOString(),
    status: LoanStatus.ACTIVE,
    accountId: 'acc-8', // Mortgage account from account-mock.ts
    signatureId: generateUUID()
  });
  
  return mockLoans;
}