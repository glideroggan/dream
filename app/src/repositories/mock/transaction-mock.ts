import { Transaction, TransactionStatuses, TransactionTypes } from '../transaction-repository';
import { generateUUID } from '../../utilities/id-generator';

export function generateMockTransactions(): Transaction[] {
  const now = new Date();
  const transactions: Transaction[] = [];
  
  // All account IDs from our mock data
  const accountIds = {
    checking: 'acc-1',
    emergencyFund: 'acc-2',
    retirement: 'acc-3',
    vacationFund: 'acc-4',
    creditCard: 'acc-5',
    carLoan: 'acc-6',
    homeDownPayment: 'acc-7',
    mortgage: 'acc-8',
    stockPortfolio: 'acc-9',
    secondaryCreditCard: 'acc-10'
  };
  
  // Helper to create date objects relative to current date, ensuring completed transactions are in the past
  const getRelativeDate = (dayOffset: number): Date => {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);
    return date;
  };
  
  // Helper to ensure completed transactions are always in the past
  const getCompletedDate = (dayOffset: number): Date => {
    const date = getRelativeDate(dayOffset);
    // If somehow the date is in the future, force it to yesterday
    if (date > now) {
      return getRelativeDate(-1);
    }
    return date;
  };
  
  // Helper to generate a random amount within a range
  const randomAmount = (min: number, max: number): number => {
    return +(Math.random() * (max - min) + min).toFixed(2);
  };

  // Add existing transactions
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.DEPOSIT,
        createdAt: getCompletedDate(-i).toISOString(),
        completedDate: getCompletedDate(-i).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.TRANSFER,
        createdAt: getCompletedDate(-i + 1).toISOString(),
        completedDate: getCompletedDate(-i + 1).toISOString(),
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
          status: TransactionStatuses.COMPLETED,
          type: TransactionTypes.TRANSFER,
          createdAt: getCompletedDate(-i + 1).toISOString(),
          completedDate: getCompletedDate(-i + 1).toISOString(),
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
          status: TransactionStatuses.COMPLETED,
          type: TransactionTypes.TRANSFER,
          createdAt: getCompletedDate(-i + 2).toISOString(),
          completedDate: getCompletedDate(-i + 2).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i + 3).toISOString(),
        completedDate: getCompletedDate(-i + 3).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i + 5).toISOString(),
        completedDate: getCompletedDate(-i + 5).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i).toISOString(),
        completedDate: getCompletedDate(-i).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i).toISOString(),
        completedDate: getCompletedDate(-i).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i + 10).toISOString(),
        completedDate: getCompletedDate(-i + 10).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i + 15).toISOString(),
        completedDate: getCompletedDate(-i + 15).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i).toISOString(),
        completedDate: getCompletedDate(-i).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i + 7).toISOString(),
        completedDate: getCompletedDate(-i + 7).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i + 8).toISOString(),
        completedDate: getCompletedDate(-i + 8).toISOString(),
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
        status: TransactionStatuses.COMPLETED,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(-i).toISOString(),
        completedDate: getCompletedDate(-i).toISOString(),
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
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.PAYMENT,
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
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.TRANSFER,
    createdAt: now.toISOString(),
    scheduledDate: getRelativeDate(16).toISOString(),
    category: 'Savings'
  });

  // Add regular completed transactions
  transactions.push(
    // Account 1 transactions
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: "ext-account-1",
      amount: -250.00,
      currency: "USD",
      description: "Monthly Rent Payment",
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.PAYMENT,
      createdAt: getCompletedDate(-2).toISOString(), // 2 days ago
      completedDate: getCompletedDate(-2).toISOString(),
      fromAccountBalance: 3750.00,
      category: "Housing"
    },
    {
      id: generateUUID(),
      fromAccountId: "ext-account-2",
      toAccountId: accountIds.checking,
      amount: 1200.00,
      currency: "USD",
      description: "Salary Deposit",
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.DEPOSIT,
      createdAt: getCompletedDate(-5).toISOString(), // 5 days ago
      completedDate: getCompletedDate(-5).toISOString(),
      toAccountBalance: 4000.00,
      category: "Income"
    },
    
    // Account 2 transactions
    {
      id: generateUUID(),
      fromAccountId: accountIds.emergencyFund,
      toAccountId: "ext-account-3",
      amount: -85.75,
      currency: "USD",
      description: "Grocery Shopping",
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.PAYMENT,
      createdAt: getCompletedDate(-1).toISOString(), // 1 day ago
      completedDate: getCompletedDate(-1).toISOString(),
      fromAccountBalance: 914.25,
      category: "Groceries"
    },
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.emergencyFund,
      amount: 200.00,
      currency: "USD",
      description: "Transfer to Savings",
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.TRANSFER,
      createdAt: getCompletedDate(-8).toISOString(), // 8 days ago
      completedDate: getCompletedDate(-8).toISOString(),
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
      fromAccountId: accountIds.checking,
      toAccountId: "ext-account-4",
      amount: -50.00,
      currency: "USD",
      description: "Internet Bill",
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // created 1 day ago
      scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // scheduled for tomorrow
      category: "Utilities"
    },
    // Tomorrow also
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: "ext-account-5",
      amount: -35.99,
      currency: "USD",
      description: "Streaming Service",
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Entertainment"
    },
    // In 3 days
    {
      id: generateUUID(),
      fromAccountId: accountIds.emergencyFund,
      toAccountId: accountIds.retirement,
      amount: 300.00,
      currency: "USD",
      description: "Monthly Savings Transfer",
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.TRANSFER,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Savings"
    },
    // In 5 days
    {
      id: generateUUID(),
      fromAccountId: "ext-account-2",
      toAccountId: accountIds.checking,
      amount: 1200.00,
      currency: "USD",
      description: "Upcoming Salary",
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.DEPOSIT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Income"
    },
    // In 7 days
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: "ext-account-6",
      amount: -120.00,
      currency: "USD",
      description: "Phone Bill",
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Utilities"
    },
    // In 12 days
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: "ext-account-7",
      amount: -1200.00,
      currency: "USD",
      description: "Monthly Rent",
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
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
      fromAccountId: accountIds.checking,
      toAccountId: 'ext-auto-repair',
      amount: -1850.00,
      currency: 'USD',
      description: 'Emergency Car Repair',
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Auto'
    },
    // Insurance payment in 3 days
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: 'ext-insurance',
      amount: -420.75,
      currency: 'USD',
      description: 'Quarterly Insurance Premium',
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Insurance'
    },
    // Medical bill in 5 days
    {
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: 'ext-medical',
      amount: -350.00,
      currency: 'USD',
      description: 'Medical Specialist Visit',
      status: TransactionStatuses.UPCOMING,
      type: TransactionTypes.PAYMENT,
      createdAt: now.toISOString(),
      scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Healthcare'
    }
    // Total upcoming payments: $2620.75, which exceeds the current balance of $2549.23
  );
  
  // Add transactions for Credit Card accounts (acc-5, acc-10)
  
  // Credit Card #1 (acc-5) - Credit balance is $3,450.75, limit $10,000
  // Add purchases from the last 30 days
  for (let i = 0; i < 15; i++) {
    const dayOffset = -Math.floor(Math.random() * 30);
    const amount = randomAmount(15, 200);
    const categories = ['Shopping', 'Dining', 'Entertainment', 'Travel', 'Groceries'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const merchants = [
      'Amazon', 'Target', 'Walmart', 'Best Buy', 'Starbucks', 'Uber', 'Netflix', 
      'Gas Station', 'Restaurant', 'Grocery Store'
    ];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.creditCard,
      amount: amount,
      currency: 'USD',
      description: `${merchant} Purchase`,
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.PAYMENT,
      createdAt: getCompletedDate(dayOffset).toISOString(),
      completedDate: getCompletedDate(dayOffset).toISOString(),
      fromAccountBalance: 3450.75 - (i * 100) + randomAmount(-200, 200), // Simulate varying balance
      category: category
    });
  }
  
  // Credit Card #1 - Monthly payment from checking account
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.creditCard,
    amount: -350.00,
    currency: 'USD',
    description: 'Credit Card Payment',
    status: TransactionStatuses.COMPLETED,
    type: TransactionTypes.PAYMENT,
    createdAt: getCompletedDate(-15).toISOString(),
    completedDate: getCompletedDate(-15).toISOString(),
    fromAccountBalance: 2200.00,
    toAccountBalance: 3100.00,
    category: 'Debt Payment'
  });
  
  // Credit Card #1 - Upcoming minimum payment
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.creditCard,
    amount: -85.00,
    currency: 'USD',
    description: 'Credit Card Minimum Payment',
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.PAYMENT,
    createdAt: getCompletedDate(-5).toISOString(),
    scheduledDate: getRelativeDate(10).toISOString(), // 10 days from now
    category: 'Debt Payment'
  });
  
  // Credit Card #2 (acc-10) - Balance $820.32, limit $5,000
  // Add purchases from the last 30 days
  for (let i = 0; i < 8; i++) {
    const dayOffset = -Math.floor(Math.random() * 30);
    const amount = randomAmount(10, 150);
    const categories = ['Shopping', 'Dining', 'Entertainment', 'Travel', 'Groceries'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const merchants = [
      'Amazon', 'Target', 'Walmart', 'Best Buy', 'Starbucks', 'Uber', 'Netflix', 
      'Gas Station', 'Restaurant', 'Grocery Store'
    ];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.secondaryCreditCard,
      amount: amount,
      currency: 'USD',
      description: `${merchant} Purchase`,
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.PAYMENT,
      createdAt: getCompletedDate(dayOffset).toISOString(),
      completedDate: getCompletedDate(dayOffset).toISOString(),
      fromAccountBalance: 820.32 - (i * 50) + randomAmount(-100, 100), // Simulate varying balance
      category: category
    });
  }
  
  // Credit Card #2 - Overdue payment (payment due date is 2 days ago)
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.secondaryCreditCard,
    amount: -30.00,
    currency: 'USD',
    description: 'Credit Card Minimum Payment (Overdue)',
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.PAYMENT,
    createdAt: getCompletedDate(-10).toISOString(),
    scheduledDate: getCompletedDate(-2).toISOString(), // 2 days ago (overdue)
    category: 'Debt Payment'
  });
  
  // Add transactions for Loan accounts (acc-6, acc-8)
  
  // Car Loan (acc-6) - Balance $15,600, Original $25,000
  // Add last 6 monthly payments
  for (let i = 1; i <= 6; i++) {
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.carLoan,
      amount: -450.00,
      currency: 'USD',
      description: 'Car Loan Monthly Payment',
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.PAYMENT,
      createdAt: getCompletedDate(-30 * i).toISOString(),
      completedDate: getCompletedDate(-30 * i).toISOString(),
      fromAccountBalance: 2500.00 + randomAmount(-500, 500),
      toAccountBalance: 15600.00 + (450.00 * i), // Increasing loan balance for past payments
      category: 'Debt Payment'
    });
  }
  
  // Car Loan - Upcoming payment
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.carLoan,
    amount: -450.00,
    currency: 'USD',
    description: 'Car Loan Monthly Payment',
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.PAYMENT,
    createdAt: getCompletedDate(-10).toISOString(),
    scheduledDate: getRelativeDate(5).toISOString(), // 5 days from now
    category: 'Debt Payment'
  });
  
  // Mortgage (acc-8) - Balance $320,000, Original $400,000
  // Add last 6 monthly payments
  for (let i = 1; i <= 6; i++) {
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.mortgage,
      amount: -1850.00,
      currency: 'USD',
      description: 'Mortgage Monthly Payment',
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.PAYMENT,
      createdAt: getCompletedDate(-30 * i).toISOString(),
      completedDate: getCompletedDate(-30 * i).toISOString(),
      fromAccountBalance: 3500.00 + randomAmount(-700, 700),
      toAccountBalance: 320000.00 + (1850.00 * i), // Increasing loan balance for past payments
      category: 'Housing'
    });
  }
  
  // Mortgage - Upcoming payment
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.mortgage,
    amount: -1850.00,
    currency: 'USD',
    description: 'Mortgage Monthly Payment',
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.PAYMENT,
    createdAt: getCompletedDate(-5).toISOString(),
    scheduledDate: getRelativeDate(15).toISOString(), // 15 days from now
    category: 'Housing'
  });
  
  // Add transactions for Savings accounts (acc-2, acc-4, acc-7)
  
  // Emergency Fund (acc-2) - Regular contributions
  for (let i = 1; i <= 6; i++) {
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.emergencyFund,
      amount: 500.00,
      currency: 'USD',
      description: 'Emergency Fund Contribution',
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.TRANSFER,
      createdAt: getCompletedDate(-30 * i).toISOString(),
      completedDate: getCompletedDate(-30 * i).toISOString(),
      fromAccountBalance: 3000.00 + randomAmount(-500, 500),
      toAccountBalance: 15720.50 - (500.00 * i), // Decreasing for past deposits
      category: 'Savings'
    });
  }
  
  // Vacation Fund (acc-4) - Irregular contributions
  for (let i = 1; i <= 4; i++) {
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.vacationFund,
      amount: 200.00 + randomAmount(0, 300),
      currency: 'USD',
      description: 'Vacation Fund Contribution',
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.TRANSFER,
      createdAt: getCompletedDate(-45 * i).toISOString(),
      completedDate: getCompletedDate(-45 * i).toISOString(),
      fromAccountBalance: 2800.00 + randomAmount(-500, 500),
      toAccountBalance: 3250.00 - (300.00 * i), // Decreasing for past deposits
      category: 'Savings'
    });
  }
  
  // Home Down Payment (acc-7) - Large contributions
  for (let i = 1; i <= 5; i++) {
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.homeDownPayment,
      amount: 1000.00,
      currency: 'USD',
      description: 'Home Down Payment Contribution',
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.TRANSFER,
      createdAt: getCompletedDate(-30 * i).toISOString(),
      completedDate: getCompletedDate(-30 * i).toISOString(),
      fromAccountBalance: 3500.00 + randomAmount(-700, 700),
      toAccountBalance: 28750.50 - (1000.00 * i), // Decreasing for past deposits
      category: 'Savings'
    });
  }
  
  // Add transactions for Investment accounts (acc-3, acc-9)
  
  // Retirement (acc-3)
  // Monthly contributions
  for (let i = 1; i <= 6; i++) {
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.retirement,
      amount: 400.00,
      currency: 'USD',
      description: '401(k) Contribution',
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.TRANSFER,
      createdAt: getCompletedDate(-30 * i).toISOString(),
      completedDate: getCompletedDate(-30 * i).toISOString(),
      fromAccountBalance: 2700.00 + randomAmount(-500, 500),
      toAccountBalance: 42680.75 - (400.00 * i) - randomAmount(100, 800), // Decreasing + some growth
      category: 'Investment'
    });
  }
  
  // Investment gains
  transactions.push({
    id: generateUUID(),
    toAccountId: accountIds.retirement,
    fromAccountId: 'external',
    amount: 785.25,
    currency: 'USD',
    description: 'Portfolio Appreciation',
    status: TransactionStatuses.COMPLETED,
    type: TransactionTypes.INTEREST,
    createdAt: getCompletedDate(-15).toISOString(),
    completedDate: getCompletedDate(-15).toISOString(),
    toAccountBalance: 42680.75,
    category: 'Investment'
  });
  
  // Stock Portfolio (acc-9)
  // Stock purchases
  for (let i = 1; i <= 4; i++) {
    const stockNames = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'VTI', 'VOO'];
    const stock = stockNames[Math.floor(Math.random() * stockNames.length)];
    const amount = 500.00 + randomAmount(0, 1500);
    
    transactions.push({
      id: generateUUID(),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.stockPortfolio,
      amount: amount,
      currency: 'USD',
      description: `Buy ${stock} Stock`,
      status: TransactionStatuses.COMPLETED,
      type: TransactionTypes.TRANSFER,
      createdAt: getCompletedDate(-20 * i).toISOString(),
      completedDate: getCompletedDate(-20 * i).toISOString(),
      fromAccountBalance: 3000.00 + randomAmount(-700, 700),
      toAccountBalance: 56250.80 - amount - randomAmount(1000, 5000), // Simulating varying balance
      category: 'Investment'
    });
  }
  
  // Stock sale (profit)
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.stockPortfolio,
    toAccountId: accountIds.checking,
    amount: 1240.50,
    currency: 'USD',
    description: 'Sell AAPL Stock (Gain)',
    status: TransactionStatuses.COMPLETED,
    type: TransactionTypes.TRANSFER,
    createdAt: getCompletedDate(-8).toISOString(),
    completedDate: getCompletedDate(-8).toISOString(),
    fromAccountBalance: 55010.30,
    toAccountBalance: 3789.73,
    category: 'Investment'
  });
  
  // Stock sale (loss)
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.stockPortfolio,
    toAccountId: accountIds.checking,
    amount: 780.25,
    currency: 'USD',
    description: 'Sell TSLA Stock (Loss)',
    status: TransactionStatuses.COMPLETED,
    type: TransactionTypes.TRANSFER,
    createdAt: getCompletedDate(-3).toISOString(),
    completedDate: getCompletedDate(-3).toISOString(),
    fromAccountBalance: 56250.80,
    toAccountBalance: 3329.48,
    category: 'Investment'
  });
  
  // Investment loss (market downturn)
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.stockPortfolio,
    amount: -1532.75,
    currency: 'USD',
    description: 'Market Adjustment',
    status: TransactionStatuses.COMPLETED,
    type: TransactionTypes.ADJUSTMENT,
    createdAt: getCompletedDate(-1).toISOString(),
    completedDate: getCompletedDate(-1).toISOString(),
    fromAccountBalance: 56250.80,
    category: 'Investment'
  });
  
  // Add upcoming transfers between accounts
  
  // Upcoming transfer to vacation fund
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.vacationFund,
    amount: 250.00,
    currency: 'USD',
    description: 'Vacation Fund Contribution',
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.TRANSFER,
    createdAt: getCompletedDate(-2).toISOString(),
    scheduledDate: getRelativeDate(4).toISOString(), // 4 days from now
    category: 'Savings'
  });
  
  // Upcoming transfer to investment
  transactions.push({
    id: generateUUID(),
    fromAccountId: accountIds.checking,
    toAccountId: accountIds.stockPortfolio,
    amount: 500.00,
    currency: 'USD',
    description: 'Monthly Investment',
    status: TransactionStatuses.UPCOMING,
    type: TransactionTypes.TRANSFER,
    createdAt: getCompletedDate(-3).toISOString(),
    scheduledDate: getRelativeDate(8).toISOString(), // 8 days from now
    category: 'Investment'
  });
  
  return transactions.sort((a, b) => {
    // Sort by created date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
