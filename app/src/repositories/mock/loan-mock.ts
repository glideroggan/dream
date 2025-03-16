import { Loan, LoanStatus, LoanType } from '../models/loan-models';
import { generateUUID } from '../../utilities/id-generator';
import { UserType } from '../models/user-models';

/**
 * Generate mock loans for development and testing
 */
export function generateMockLoans(userType:UserType): Loan[] {
  switch (userType) {
    case 'established':
    case 'premium':
    case 'demo':
      return generateSomeLoans();
    default:
      return []
  }

  
}

function generateSomeLoans(): Loan[] {
  const now = new Date();
  const mockLoans: Loan[] = [];
  
  // Personal loan - active
  mockLoans.push({
    id: 'loan-1',
    productId: 'personal-loan',
    type: LoanType.PERSONAL,
    amount: 10000,
    term: 36, // 3 years in months
    interestRate: 4.5,
    monthlyPayment: 298.58,
    totalInterest: 741.68,
    purpose: 'Home renovation',
    createdAt: '2023-05-15T10:00:00Z',
    updatedAt: '2023-05-15T10:00:00Z',
    status: LoanStatus.ACTIVE,
    accountId: 'account-1'
  });
  
  // Home loan - active - connected to home down payment savings account
  mockLoans.push({
    id: 'loan-2',
    productId: 'mortgage-loan',
    type: LoanType.MORTGAGE,
    amount: 350000,
    term: 300, // 25 years in months
    interestRate: 2.8,
    monthlyPayment: 1619.33,
    totalInterest: 135799.68,
    purpose: 'Home purchase',
    createdAt: '2022-03-10T14:30:00Z',
    updatedAt: '2022-03-10T14:30:00Z',
    status: LoanStatus.ACTIVE,
    accountId: 'account-2'
  });
  
  // Vehicle loan - pending approval
  mockLoans.push({
    id: 'loan-3',
    productId: 'car-loan',
    type: LoanType.AUTO,
    amount: 25000,
    term: 60, // 5 years in months
    interestRate: 3.9,
    monthlyPayment: 459.72,
    totalInterest: 2583.05,
    purpose: 'Car purchase',
    createdAt: '2023-01-20T09:15:00Z',
    updatedAt: '2023-01-20T09:15:00Z',
    status: LoanStatus.PENDING_APPROVAL,
    accountId: 'account-3',
    metadata: {
      vehicleModel: 'Tesla Model 3',
      vehicleYear: 2022,
      creditScore: 730
    }
  });
  
  // Education loan - draft
  mockLoans.push({
    id: 'loan-4',
    productId: 'student-loan',
    type: LoanType.EDUCATION,
    amount: 15000,
    term: 120, // 10 years in months
    interestRate: 3.2,
    monthlyPayment: 146.43,
    totalInterest: 2571.70,
    purpose: 'Education',
    createdAt: '2021-09-01T08:00:00Z',
    updatedAt: '2023-02-15T16:40:00Z',
    status: LoanStatus.ACTIVE,
    accountId: 'account-4'
  });
  
  // Personal loan - rejected
  mockLoans.push({
    id: 'loan_5',
    productId: 'personal-loan', // Reference to the product
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
    metadata: {
      // Additional data explaining rejection
      rejectionReason: 'Requested amount exceeds maximum for personal loan'
    }
  });
  
  // Connected to car loan from account-mock.ts (acc-6)
  mockLoans.push({
    id: 'loan_6',
    productId: 'vehicle-loan', // Reference to the product
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
  mockLoans.push({
    id: 'loan_7',
    productId: 'home-loan', // Reference to the product
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