import { Account } from '../models/account-models';

/**
 * Mock accounts for the demo user (full featured)
 */
export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Main Checking',
    balance: 2549.23,
    currency: 'USD',
    type: 'checking', 
    accountNumber: '**** **** **** 1234',
    createdAt: new Date('2020-01-15').toISOString(),
    isActive: true,
    // Add checking-specific properties
    averageBalance: 2150.45,
    hasOverdraftProtection: true
  },
  {
    id: 'acc-2',
    name: 'Emergency Fund',
    balance: 15720.5,
    currency: 'USD',
    type: 'savings',
    accountNumber: '**** **** **** 5678',
    createdAt: new Date('2020-02-28').toISOString(),
    isActive: true,
    // Add savings-specific properties
    interestRate: 0.75,
    savingsGoal: 25000, // Goal amount
    targetDate: new Date('2023-12-31').toISOString()
  },
  {
    id: 'acc-3',
    name: 'Retirement',
    balance: 42680.75,
    currency: 'USD',
    type: 'investment',
    accountNumber: '**** **** **** 9012',
    createdAt: new Date('2020-03-10').toISOString(),
    isActive: true,
    // Add investment-specific properties
    performanceYTD: 8.75,
    lastUpdated: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
  },
  {
    id: 'acc-4',
    name: 'Vacation Fund', 
    balance: 3250.00,
    currency: 'USD',
    type: 'savings',
    accountNumber: '**** **** **** 3456',
    createdAt: new Date('2022-05-12').toISOString(),
    isActive: true,
    // Add savings-specific properties
    interestRate: 0.60,
    savingsGoal: 5000, // Goal amount
    targetDate: new Date('2023-07-01').toISOString()
  },
  {
    id: 'acc-5',
    name: 'Credit Card',
    balance: 3450.75,
    currency: 'USD',
    type: 'credit',
    accountNumber: '**** **** **** 7890',
    createdAt: new Date('2021-08-15').toISOString(),
    isActive: true,
    // Credit card-specific properties
    creditLimit: 10000,
    availableCredit: 6549.25,
    paymentDueDate: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
    minimumPaymentDue: 85.00
  },
  {
    id: 'acc-6',
    name: 'Car Loan',
    balance: 15600.00, // Loan balances are positive (amount owed)
    currency: 'USD',
    type: 'loan',
    accountNumber: '**** **** **** 2468',
    createdAt: new Date('2022-01-10').toISOString(),
    isActive: true,
    // Add loan-specific properties
    originalLoanAmount: 25000.00,
    interestRateLoan: 4.25,
    nextPaymentAmount: 450.00,
    nextPaymentDueDate: new Date(Date.now() + 86400000 * 5).toISOString() // 5 days from now
  },
  {
    id: 'acc-7',
    name: 'Home Down Payment',
    balance: 28750.50,
    currency: 'USD',
    type: 'savings',
    accountNumber: '**** **** **** 1357',
    createdAt: new Date('2021-03-20').toISOString(),
    isActive: true,
    // Add savings-specific properties
    interestRate: 0.85,
    savingsGoal: 60000,
    targetDate: new Date('2024-06-30').toISOString()
  },
  {
    id: 'acc-8',
    name: 'Mortgage',
    balance: 320000.00,
    currency: 'USD',
    type: 'mortgage',
    accountNumber: '**** **** **** 8642',
    createdAt: new Date('2019-10-05').toISOString(),
    isActive: true,
    // Add mortgage-specific properties
    originalLoanAmount: 400000.00,
    interestRateLoan: 3.5,
    nextPaymentAmount: 1850.00,
    nextPaymentDueDate: new Date(Date.now() + 86400000 * 15).toISOString() // 15 days from now
  },
  {
    id: 'acc-9',
    name: 'Stock Portfolio',
    balance: 56250.80,
    currency: 'USD',
    type: 'investment',
    accountNumber: '**** **** **** 9753',
    createdAt: new Date('2018-06-15').toISOString(),
    isActive: true,
    // Add investment-specific properties
    performanceYTD: -2.35, // Showing negative performance
    lastUpdated: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 'acc-10',
    name: 'Secondary Credit Card',
    balance: 820.32,
    currency: 'USD',
    type: 'credit',
    accountNumber: '**** **** **** 6541',
    createdAt: new Date('2022-11-28').toISOString(),
    isActive: true,
    // Credit card-specific properties
    creditLimit: 5000,
    availableCredit: 4179.68,
    paymentDueDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago (overdue)
    minimumPaymentDue: 30.00
  }
];

/**
 * Mock accounts for a new user - empty by design
 * New users should start with no accounts until they go through onboarding
 */
export const newUserAccounts: Account[] = [];

/**
 * Mock accounts for an established user
 * More accounts and higher balances than new users
 */
export const establishedUserAccounts: Account[] = [
  // Checking with moderate balance
  {
    id: 'est-checking',
    name: 'Everyday Checking',
    balance: 3750.42,
    currency: 'USD',
    type: 'checking',
    accountNumber: '**** **** **** 6543',
    isActive: true,
    createdAt: new Date('2022-06-15').toISOString(),
    hasOverdraftProtection: true,
    averageBalance: 3250.15
  },
  
  // Savings with decent balance
  {
    id: 'est-savings',
    name: 'Emergency Fund',
    balance: 8500.00,
    currency: 'USD',
    type: 'savings',
    accountNumber: '**** **** **** 6544',
    isActive: true,
    createdAt: new Date('2022-06-15').toISOString(),
    interestRate: 0.65,
    savingsGoal: 15000.00,
    targetDate: new Date('2023-12-31').toISOString()
  },
  
  // Credit card
  {
    id: 'est-credit',
    name: 'Rewards Credit Card',
    balance: 1250.75,
    currency: 'USD',
    type: 'credit',
    accountNumber: '**** **** **** 6545',
    isActive: true,
    createdAt: new Date('2022-08-10').toISOString(),
    creditLimit: 5000,
    availableCredit: 3749.25,
    paymentDueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    minimumPaymentDue: 35.00
  }
];

/**
 * Get the appropriate mock accounts based on user type
 * @param userType The type of user to get accounts for
 * @returns Array of accounts appropriate for the user type
 */
export function getMockAccountsByUserType(userType: string): Account[] {
  switch(userType) {
    case 'new':
      return newUserAccounts; // Empty array for new users
    case 'established':
      return establishedUserAccounts;
    case 'premium':
    case 'demo':
    default:
      return mockAccounts;
  }
}
