import { Transaction } from '../transaction-repository';
import { TransactionStatus, TransactionType } from '../../services/repository-service';
import { generateUUID } from '../../utilities/id-generator';


export function generateMockTransactions(): Transaction[] {
  const now = new Date();
  const transactions: Transaction[] = [];
  
  // Mock account IDs
  const accountIds = [
    "acc-001", "acc-002", "acc-003"
  ];
  
  // Helper to create date objects relative to current date
  const getRelativeDate = (dayOffset: number): Date => {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);
    return date;
  };
  
  // Generate transaction history for the last 6 months
  for (let i = 180; i >= 0; i -= 3) { // Every ~3 days
    // Salary deposits - monthly
    if (i % 30 <= 2) {
      transactions.push({
        id: `txn-salary-${i}`,
        fromAccountId: 'external-employer',
        toAccountId: 'acc-1', // Main checking
        amount: 3800,
        currency: 'USD',
        description: 'Payroll Deposit',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.DEPOSIT,
        createdAt: getRelativeDate(-i).toISOString(),
        completedDate: getRelativeDate(-i).toISOString(),
        toAccountBalance: 2500 + Math.random() * 1500, // Simulate varying balance
        category: 'Income'
      });
    }
    
    // Transfers to savings - monthly
    if (i % 30 <= 2 && i > 0) {
      transactions.push({
        id: `txn-savings-${i}`,
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2', // Emergency Fund
        amount: 500,
        currency: 'USD',
        description: 'Monthly savings transfer',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        createdAt: getRelativeDate(-i + 1).toISOString(),
        completedDate: getRelativeDate(-i + 1).toISOString(),
        fromAccountBalance: 2000 + Math.random() * 1000,
        toAccountBalance: 15000 + (6 - Math.floor(i / 30)) * 500 + Math.random() * 300,
        category: 'Savings'
      });
      
      // Also transfer to vacation fund occasionally
      if (i % 60 <= 2) {
        transactions.push({
          id: `txn-vacation-${i}`,
          fromAccountId: 'acc-1',
          toAccountId: 'acc-4', // Vacation Fund
          amount: 300,
          currency: 'USD',
          description: 'Vacation fund contribution',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.TRANSFER,
          createdAt: getRelativeDate(-i + 1).toISOString(),
          completedDate: getRelativeDate(-i + 1).toISOString(),
          fromAccountBalance: 1700 + Math.random() * 1000,
          toAccountBalance: 3000 + (6 - Math.floor(i / 30)) * 200 + Math.random() * 100,
          category: 'Savings'
        });
      }
      
      // Home down payment savings
      if (i % 30 <= 2 && i >= 30) {
        transactions.push({
          id: `txn-home-${i}`,
          fromAccountId: 'acc-1',
          toAccountId: 'acc-7', // Home Down Payment
          amount: 1000,
          currency: 'USD',
          description: 'Home down payment savings',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.TRANSFER,
          createdAt: getRelativeDate(-i + 2).toISOString(),
          completedDate: getRelativeDate(-i + 2).toISOString(),
          fromAccountBalance: 1000 + Math.random() * 800,
          toAccountBalance: 23000 + (6 - Math.floor(i / 30)) * 1000 + Math.random() * 200,
          category: 'Savings'
        });
      }
    }
    
    // Rent payment - monthly
    if (i % 30 <= 2) {
      transactions.push({
        id: `txn-rent-${i}`,
        fromAccountId: 'acc-1',
        toAccountId: 'external-landlord',
        amount: -1200,
        currency: 'USD',
        description: 'Rent payment',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i + 3).toISOString(),
        completedDate: getRelativeDate(-i + 3).toISOString(),
        fromAccountBalance: 3300 + Math.random() * 800 - 1200,
        category: 'Housing'
      });
    }
    
    // Utility bills - monthly
    if (i % 30 <= 4) {
      transactions.push({
        id: `txn-utilities-${i}`,
        fromAccountId: 'acc-1',
        amount: -180 - Math.random() * 40, // Varying utility bill
        currency: 'USD',
        description: 'Utilities payment',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i + 5).toISOString(),
        completedDate: getRelativeDate(-i + 5).toISOString(),
        fromAccountBalance: 2000 + Math.random() * 800,
        category: 'Utilities'
      });
    }
    
    // Groceries - weekly
    if (i % 7 <= 1) {
      transactions.push({
        id: `txn-groceries-${i}`,
        fromAccountId: 'acc-1',
        amount: -85 - Math.random() * 30, // Varying grocery costs
        currency: 'USD',
        description: 'Grocery shopping',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i).toISOString(),
        completedDate: getRelativeDate(-i).toISOString(),
        fromAccountBalance: 1900 + Math.random() * 700,
        category: 'Groceries'
      });
    }
    
    // Dining out - semi-weekly
    if (i % 14 <= 2) {
      transactions.push({
        id: `txn-dining-${i}`,
        fromAccountId: 'acc-1',
        amount: -45 - Math.random() * 25, // Varying dining costs
        currency: 'USD',
        description: 'Dining out',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i).toISOString(),
        completedDate: getRelativeDate(-i).toISOString(),
        fromAccountBalance: 1850 + Math.random() * 650,
        category: 'Dining'
      });
    }
    
    // Credit card payments - monthly
    if (i % 30 <= 2) {
      const paymentAmount = 300 + Math.random() * 150;
      transactions.push({
        id: `txn-cc-payment-${i}`,
        fromAccountId: 'acc-1',
        toAccountId: 'acc-5',
        amount: -paymentAmount,
        currency: 'USD',
        description: 'Credit card payment',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i + 10).toISOString(),
        completedDate: getRelativeDate(-i + 10).toISOString(),
        fromAccountBalance: 1800 - paymentAmount + Math.random() * 600,
        toAccountBalance: -3500 + paymentAmount + Math.random() * 200,
        category: 'Debt Payment'
      });
    }
    
    // Car loan payment - monthly
    if (i % 30 <= 2) {
      transactions.push({
        id: `txn-car-payment-${i}`,
        fromAccountId: 'acc-1',
        toAccountId: 'acc-6',
        amount: -350,
        currency: 'USD',
        description: 'Car loan payment',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i + 15).toISOString(),
        completedDate: getRelativeDate(-i + 15).toISOString(),
        fromAccountBalance: 1450 + Math.random() * 550,
        toAccountBalance: -16000 + (6 - Math.floor(i / 30)) * 350 + Math.random() * 100,
        category: 'Debt Payment'
      });
    }
    
    // Entertainment expenses - randomly
    if (i % 10 <= 2) {
      transactions.push({
        id: `txn-entertainment-${i}`,
        fromAccountId: 'acc-1',
        amount: -25 - Math.random() * 35,
        currency: 'USD',
        description: 'Entertainment expense',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i).toISOString(),
        completedDate: getRelativeDate(-i).toISOString(),
        fromAccountBalance: 1400 + Math.random() * 500,
        category: 'Entertainment'
      });
    }
    
    // Subscription services - monthly
    if (i % 30 <= 4) {
      transactions.push({
        id: `txn-subscription-${i}`,
        fromAccountId: 'acc-1',
        amount: -15.99,
        currency: 'USD',
        description: 'Streaming service subscription',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i + 7).toISOString(),
        completedDate: getRelativeDate(-i + 7).toISOString(),
        fromAccountBalance: 1385 + Math.random() * 480,
        category: 'Subscriptions'
      });
    }
    
    // Phone/Internet bill - monthly
    if (i % 30 <= 3) {
      transactions.push({
        id: `txn-phone-${i}`,
        fromAccountId: 'acc-1',
        amount: -110,
        currency: 'USD',
        description: 'Phone and Internet bill',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i + 8).toISOString(),
        completedDate: getRelativeDate(-i + 8).toISOString(),
        fromAccountBalance: 1270 + Math.random() * 450,
        category: 'Utilities'
      });
    }
    
    // Occasional large purchases
    if (i === 45 || i === 110) {
      transactions.push({
        id: `txn-large-purchase-${i}`,
        fromAccountId: 'acc-1',
        amount: -299,
        currency: 'USD',
        description: 'Electronics purchase',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        createdAt: getRelativeDate(-i).toISOString(),
        completedDate: getRelativeDate(-i).toISOString(),
        fromAccountBalance: 1000 + Math.random() * 400,
        category: 'Shopping'
      });
    }
  }

  // Add a few upcoming transactions
  transactions.push({
    id: 'txn-upcoming-1',
    fromAccountId: 'acc-1',
    toAccountId: 'external-landlord',
    amount: -1200,
    currency: 'USD',
    description: 'Rent payment',
    status: TransactionStatus.UPCOMING,
    type: TransactionType.PAYMENT,
    createdAt: now.toISOString(),
    scheduledDate: getRelativeDate(15).toISOString(),
    category: 'Housing'
  });
  
  transactions.push({
    id: 'txn-upcoming-2',
    fromAccountId: 'acc-1',
    toAccountId: 'acc-2',
    amount: 500,
    currency: 'USD',
    description: 'Monthly savings transfer',
    status: TransactionStatus.UPCOMING,
    type: TransactionType.TRANSFER,
    createdAt: now.toISOString(),
    scheduledDate: getRelativeDate(16).toISOString(),
    category: 'Savings'
  });

  // Add regular completed transactions
  transactions.push(
    // Account 1 transactions
    {
      id: generateUUID(),
      fromAccountId: accountIds[0],
      toAccountId: "ext-account-1",
      amount: -250.00,
      currency: "USD",
      description: "Monthly Rent Payment",
      status: TransactionStatus.COMPLETED,
      type: TransactionType.PAYMENT,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      completedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fromAccountBalance: 3750.00,
      category: "Housing"
    },
    {
      id: generateUUID(),
      fromAccountId: "ext-account-2",
      toAccountId: accountIds[0],
      amount: 1200.00,
      currency: "USD",
      description: "Salary Deposit",
      status: TransactionStatus.COMPLETED,
      type: TransactionType.DEPOSIT,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      completedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      toAccountBalance: 4000.00,
      category: "Income"
    },
    
    // Account 2 transactions
    {
      id: generateUUID(),
      fromAccountId: accountIds[1],
      toAccountId: "ext-account-3",
      amount: -85.75,
      currency: "USD",
      description: "Grocery Shopping",
      status: TransactionStatus.COMPLETED,
      type: TransactionType.PAYMENT,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      completedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      fromAccountBalance: 914.25,
      category: "Groceries"
    },
    {
      id: generateUUID(),
      fromAccountId: accountIds[0],
      toAccountId: accountIds[1],
      amount: 200.00,
      currency: "USD",
      description: "Transfer to Savings",
      status: TransactionStatus.COMPLETED,
      type: TransactionType.TRANSFER,
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      completedDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      fromAccountBalance: 3550.00,
      toAccountBalance: 1000.00,
      category: "Transfer"
    }
  );
  
  // Add upcoming/scheduled transactions with better distribution
  transactions.push(
    // Tomorrow
    {
      id: generateUUID(),
      fromAccountId: accountIds[0],
      toAccountId: "ext-account-4",
      amount: -50.00,
      currency: "USD",
      description: "Internet Bill",
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // created 1 day ago
      scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // scheduled for tomorrow
      category: "Utilities"
    },
    // Tomorrow also
    {
      id: generateUUID(),
      fromAccountId: accountIds[0],
      toAccountId: "ext-account-5",
      amount: -35.99,
      currency: "USD",
      description: "Streaming Service",
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Entertainment"
    },
    // In 3 days
    {
      id: generateUUID(),
      fromAccountId: accountIds[1],
      toAccountId: accountIds[2],
      amount: 300.00,
      currency: "USD",
      description: "Monthly Savings Transfer",
      status: TransactionStatus.UPCOMING,
      type: TransactionType.TRANSFER,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Savings"
    },
    // In 5 days
    {
      id: generateUUID(),
      fromAccountId: "ext-account-2",
      toAccountId: accountIds[0],
      amount: 1200.00,
      currency: "USD",
      description: "Upcoming Salary",
      status: TransactionStatus.UPCOMING,
      type: TransactionType.DEPOSIT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Income"
    },
    // In 7 days
    {
      id: generateUUID(),
      fromAccountId: accountIds[0],
      toAccountId: "ext-account-6",
      amount: -120.00,
      currency: "USD",
      description: "Phone Bill",
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Utilities"
    },
    // In 12 days
    {
      id: generateUUID(),
      fromAccountId: accountIds[0],
      toAccountId: "ext-account-7",
      amount: -1200.00,
      currency: "USD",
      description: "Monthly Rent",
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Housing"
    }
  );
  
  // Add upcoming transactions that will cause an overdraft for acc-1 (balance $2549.23)
  transactions.push(
    // Large car repair in 2 days
    {
      id: generateUUID(),
      fromAccountId: 'acc-1',
      toAccountId: 'ext-auto-repair',
      amount: -1850.00,
      currency: 'USD',
      description: 'Emergency Car Repair',
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Auto'
    },
    // Insurance payment in 3 days
    {
      id: generateUUID(),
      fromAccountId: 'acc-1',
      toAccountId: 'ext-insurance',
      amount: -420.75,
      currency: 'USD',
      description: 'Quarterly Insurance Premium',
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Insurance'
    },
    // Medical bill in 5 days
    {
      id: generateUUID(),
      fromAccountId: 'acc-1',
      toAccountId: 'ext-medical',
      amount: -350.00,
      currency: 'USD',
      description: 'Medical Specialist Visit',
      status: TransactionStatus.UPCOMING,
      type: TransactionType.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Healthcare'
    }
    // Total upcoming payments: $2620.75, which exceeds the current balance of $2549.23
  );
  
  return transactions.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt
    ).getTime();
  });
}
