import { Account } from '../account-repository';

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Main Checking',
    balance: 2549.23,
    currency: 'USD',
    type: 'checking', // lowercase, use a type
    accountNumber: '**** **** **** 1234',
    createdAt: new Date('2020-01-15').toISOString(),
    isActive: true,
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
    interestRate: 0.75,
    goal: 25000, // Goal of $25,000
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
    interestRate: 0.60,
    goal: 5000, // Goal of $5,000
    targetDate: new Date('2023-07-01').toISOString()
  },
  {
    id: 'acc-5',
    name: 'Credit Card',
    balance: -3450.75,
    currency: 'USD',
    type: 'credit',
    accountNumber: '**** **** **** 7890',
    createdAt: new Date('2021-08-15').toISOString(),
    isActive: true,
  },
  {
    id: 'acc-6',
    name: 'Car Loan',
    balance: -15600.00,
    currency: 'USD',
    type: 'loan',
    accountNumber: '**** **** **** 2468',
    createdAt: new Date('2022-01-10').toISOString(),
    isActive: true,
    interestRate: 4.25,
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
    interestRate: 0.85,
    goal: 60000, // Goal of $60,000
    targetDate: new Date('2024-06-30').toISOString()
  }
];
