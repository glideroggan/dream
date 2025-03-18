import { generateUUID } from "../../utilities/id-generator";
import { TransactionDirections, TransactionStatuses, TransactionTypes, UpcomingTransaction } from "../models/transaction-models";


export function getMockUpcomingTransactionsByUserType(userType: string): UpcomingTransaction[] {
    switch (userType) {
        case 'new':
            return newUserTransactions;
        case 'established':
            return generateEstablishedUserTransactions();
        case 'premium':
        case 'demo':
        default:
            return generateDemoUserTransactions();
    }
}
const newUserTransactions: UpcomingTransaction[] = [];
const getCompletedDate = (baseDate: Date, dayOffset: number): Date => {
    const date = getRelativeDate(baseDate, dayOffset);
    if (date > baseDate) {
        return getRelativeDate(baseDate, -1);
    }
    return date;
};
const getRelativeDate = (baseDate: Date, dayOffset: number): Date => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + dayOffset);
    return date;
};
function generateEstablishedUserTransactions(): UpcomingTransaction[] {
    const transactions: UpcomingTransaction[] = [];
    // Account IDs for established user
    const accountIds = {
        checking: 'est-checking',
        savings: 'est-savings',
        credit: 'est-credit'
    };
    const now = new Date();
    // Add upcoming transactions
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: 'external-landlord',
        amount: 1200.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Upcoming Rent Payment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: now.toISOString(),
        scheduledDate: getRelativeDate(now, 10).toISOString(),
        category: 'Housing'
    });

    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: 'credit card provider',
        amount: 35.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Credit Card Minimum Payment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: now.toISOString(),
        scheduledDate: getRelativeDate(now, 7).toISOString(),
        category: 'Debt Payment'
    });
    return transactions.sort((a, b) => {
        // Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

function generateDemoUserTransactions(): UpcomingTransaction[] {
    const transactions: UpcomingTransaction[] = [];
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
    const now = new Date();
    // Add a few upcoming transactions
    transactions.push({
        id: 'txn-upcoming-1',
        fromAccountId: 'acc-1',
        toAccountId: 'external-landlord',
        amount: 1200,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Rent payment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: now.toISOString(),
        scheduledDate: getRelativeDate(now, 15).toISOString(),
        category: 'Housing'
    });

    transactions.push({
        id: 'txn-upcoming-2',
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: 500,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Monthly savings transfer',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.TRANSFER,
        createdAt: now.toISOString(),
        scheduledDate: getRelativeDate(now, 16).toISOString(),
        category: 'Savings'
    });
    // Add upcoming transactions that will cause an overdraft for acc-1 (balance $2549.23)
    transactions.push(
        // Large car repair in 2 days
        {
            id: generateUUID(),
            fromAccountId: accountIds.checking,
            toAccountId: 'ext-auto-repair',
            amount: 1850.00,
            direction: TransactionDirections.DEBIT,
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
            amount: 420.75,
            direction: TransactionDirections.DEBIT,
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
            amount: 350.00,
            direction: TransactionDirections.DEBIT,
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
    // Credit Card #1 - Upcoming minimum payment
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: accountIds.creditCard,
        amount: 85.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Credit Card Minimum Payment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(now, -5).toISOString(),
        scheduledDate: getRelativeDate(now, 10).toISOString(), // 10 days from now
        category: 'Debt Payment'
    });
    // Add upcoming/scheduled transactions with better distribution
    transactions.push(
        // Tomorrow
        {
            id: generateUUID(),
            fromAccountId: accountIds.checking,
            toAccountId: "ext-account-4",
            amount: 50.00,
            direction: TransactionDirections.DEBIT,
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
            amount: 35.99,
            direction: TransactionDirections.DEBIT,
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
            direction: TransactionDirections.DEBIT,
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
            direction: TransactionDirections.CREDIT,
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
            amount: 120.00,
            direction: TransactionDirections.DEBIT,
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
            amount: 1200.00,
            direction: TransactionDirections.DEBIT,
            currency: "USD",
            description: "Monthly Rent",
            status: TransactionStatuses.UPCOMING,
            type: TransactionTypes.PAYMENT,
            createdAt: now.toISOString(),
            scheduledDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Housing"
        }
    );
    // Credit Card #2 - Overdue payment (payment due date is 2 days ago)
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: accountIds.secondaryCreditCard,
        amount: 30.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Credit Card Minimum Payment (Overdue)',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(now, -10).toISOString(),
        scheduledDate: getCompletedDate(now, -2).toISOString(), // 2 days ago (overdue)
        category: 'Debt Payment'
    });
    // Car Loan - Upcoming payment
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: accountIds.carLoan,
        amount: 450.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Car Loan Monthly Payment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(now, -10).toISOString(),
        scheduledDate: getRelativeDate(now, 5).toISOString(), // 5 days from now
        category: 'Debt Payment'
    });
    // Mortgage - Upcoming payment
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: accountIds.mortgage,
        amount: 1850.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Mortgage Monthly Payment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.PAYMENT,
        createdAt: getCompletedDate(now, -5).toISOString(),
        scheduledDate: getRelativeDate(now, 15).toISOString(), // 15 days from now
        category: 'Housing'
    });

    // Add upcoming transfers between accounts

    // Upcoming transfer to vacation fund
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: accountIds.vacationFund,
        amount: 250.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Vacation Fund Contribution',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.TRANSFER,
        createdAt: getCompletedDate(now, -2).toISOString(),
        scheduledDate: getRelativeDate(now, 4).toISOString(), // 4 days from now
        category: 'Savings'
    });

    // Upcoming transfer to investment
    transactions.push({
        id: generateUUID(),
        fromAccountId: accountIds.checking,
        toAccountId: accountIds.stockPortfolio,
        amount: 500.00,
        direction: TransactionDirections.DEBIT,
        currency: 'USD',
        description: 'Monthly Investment',
        status: TransactionStatuses.UPCOMING,
        type: TransactionTypes.TRANSFER,
        createdAt: getCompletedDate(now, -3).toISOString(),
        scheduledDate: getRelativeDate(now, 8).toISOString(), // 8 days from now
        category: 'Investment'
    });
    return transactions.sort((a, b) => {
        // Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}