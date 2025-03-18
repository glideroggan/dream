import { Loan, LoanStatus, LoanType } from "../models/loan-models";

/**
 * Mock loans for testing and development
 */
export const mockLoans: Loan[] = [
    {
        id: "loan-1",
        productId: "home-loan",
        name: "Home Mortgage",
        type: LoanType.MORTGAGE,
        amount: 320000,
        remainingAmount: 275000,
        interestRate: 3.5,
        term: 360, // 30 years
        monthlyPayment: 1450,
        totalInterest: 202000,
        nextPaymentDate: "Apr 15, 2023",
        nextPaymentAmount: 1450,
        purpose: "Primary residence purchase",
        status: LoanStatus.ACTIVE,
        createdAt: "2018-06-12T10:00:00Z",
        updatedAt: "2023-01-15T08:30:00Z",
        accountId: "acc-8", // Reference to mortgage account in account-mock.ts
        progress: 14,
        paymentsMade: 50, 
        paymentsRemaining: 310,
        metadata: {
            propertyAddress: "123 Main St, Anytown, USA",
            propertyValue: 400000,
            loanToValue: 0.8
        }
    },
    {
        id: "loan-2",
        productId: "vehicle-loan",
        name: "Auto Loan",
        type: LoanType.AUTO,
        amount: 28000,
        remainingAmount: 12500,
        interestRate: 4.2,
        term: 60, // 5 years
        monthlyPayment: 518,
        totalInterest: 3080,
        nextPaymentDate: "Apr 10, 2023",
        nextPaymentAmount: 518,
        purpose: "New vehicle purchase",
        status: LoanStatus.ACTIVE,
        createdAt: "2020-08-15T14:30:00Z",
        updatedAt: "2023-01-10T09:45:00Z", 
        accountId: "acc-6", // Reference to car loan in account-mock.ts
        progress: 55,
        paymentsMade: 33,
        paymentsRemaining: 27,
        metadata: {
            vehicleMake: "Toyota",
            vehicleModel: "Camry",
            vehicleYear: 2020,
            vin: "1HGCM82633A123456"
        }
    },
    {
        id: "loan-3",
        productId: "personal-loan",
        name: "Personal Loan",
        type: LoanType.PERSONAL,
        amount: 10000,
        remainingAmount: 3800,
        interestRate: 6.8,
        term: 36, // 3 years
        monthlyPayment: 320,
        totalInterest: 1520,
        nextPaymentDate: "Apr 5, 2023",
        nextPaymentAmount: 320,
        purpose: "Debt consolidation",
        status: LoanStatus.ACTIVE,
        createdAt: "2021-01-22T09:15:00Z",
        updatedAt: "2023-02-05T11:20:00Z",
        accountId: "acc-1", // Connected to checking account for payments
        progress: 62,
        paymentsMade: 22,
        paymentsRemaining: 14,
        metadata: {
            originalCreditScore: 720
        },
        signatureId: "sig-personal-001"
    },
    {
        id: "loan-4",
        productId: "business-loan",
        name: "Business Loan",
        type: LoanType.BUSINESS,
        amount: 75000,
        remainingAmount: 0, // Paid off
        interestRate: 5.5,
        term: 60, // 5 years
        monthlyPayment: 1435,
        totalInterest: 11100,
        nextPaymentDate: "N/A",
        nextPaymentAmount: 0,
        purpose: "Business expansion",
        status: LoanStatus.PAID_OFF,
        createdAt: "2017-05-10T11:20:00Z",
        updatedAt: "2022-06-15T14:10:00Z",
        accountId: "acc-1", // Connected to checking account
        progress: 100,
        paymentsMade: 60,
        paymentsRemaining: 0,
        metadata: {
            businessName: "Acme Enterprises",
            businessType: "Sole Proprietorship"
        },
        signatureId: "sig-business-001"
    },
    {
        id: "loan-5",
        productId: "education-loan",
        name: "Education Loan",
        type: LoanType.EDUCATION,
        amount: 45000,
        remainingAmount: 45000,
        interestRate: 4.0,
        term: 120, // 10 years
        monthlyPayment: 455,
        totalInterest: 9600,
        nextPaymentDate: "Pending Approval",
        nextPaymentAmount: 455,
        purpose: "Master's degree program",
        status: LoanStatus.PENDING_APPROVAL,
        createdAt: "2023-03-01T15:45:00Z",
        updatedAt: "2023-03-01T15:45:00Z",
        accountId: "acc-1", // Will be disbursed to checking account
        progress: 0,
        paymentsMade: 0,
        paymentsRemaining: 120,
        metadata: {
            institution: "State University",
            program: "Master of Business Administration",
            startDate: "2023-09-01"
        }
    },
    {
        id: "loan-6",
        productId: "home-loan",
        name: "Home Renovation",
        type: LoanType.LINE_OF_CREDIT,
        amount: 35000,
        remainingAmount: 22000,
        interestRate: 7.2,
        term: 48, // 4 years
        monthlyPayment: 840,
        totalInterest: 5320,
        nextPaymentDate: "Mar 15, 2023", // Past due
        nextPaymentAmount: 840,
        purpose: "Kitchen and bath remodel",
        status: LoanStatus.DEFAULTED,
        createdAt: "2019-11-05T13:10:00Z",
        updatedAt: "2023-01-15T10:30:00Z",
        accountId: "acc-1", // Connected to checking account
        progress: 65,
        paymentsMade: 31,
        paymentsRemaining: 17,
        metadata: {
            propertyAddress: "123 Main St, Anytown, USA",
            contractorName: "ABC Renovations"
        },
        signatureId: "sig-heloc-001"
    },
    {
        id: "loan-7",
        productId: "personal-loan",
        name: "Wedding Loan",
        type: LoanType.PERSONAL,
        amount: 20000,
        remainingAmount: 20000,
        interestRate: 5.9,
        term: 36, // 3 years
        monthlyPayment: 608,
        totalInterest: 1888,
        nextPaymentDate: "Not Started",
        nextPaymentAmount: 608,
        purpose: "Wedding expenses",
        status: LoanStatus.APPROVED,
        createdAt: "2023-02-15T09:30:00Z",
        updatedAt: "2023-02-28T14:45:00Z",
        accountId: "acc-2", // Will be disbursed to savings account
        progress: 0,
        paymentsMade: 0,
        paymentsRemaining: 36,
        metadata: {
            weddingDate: "2023-06-15",
            cosignerPresent: false
        },
        signatureId: "sig-personal-002"
    },
    {
        id: "loan-8",
        productId: "personal-loan",
        name: "Medical Expenses",
        type: LoanType.PERSONAL,
        amount: 15000,
        remainingAmount: 15000,
        interestRate: 6.5,
        term: 24, // 2 years
        monthlyPayment: 670,
        totalInterest: 1080,
        nextPaymentDate: "Not Started",
        nextPaymentAmount: 670,
        purpose: "Medical procedure costs",
        status: LoanStatus.DRAFT,
        createdAt: "2023-03-10T11:20:00Z",
        updatedAt: "2023-03-10T11:20:00Z",
        accountId: "acc-1", // Will be disbursed to checking account
        progress: 0,
        paymentsMade: 0,
        paymentsRemaining: 24,
        metadata: {
            medicalProvider: "City Medical Center",
            procedureDate: "2023-04-15"
        }
    },
    {
        id: "loan-9",
        productId: "vehicle-loan",
        name: "Motorcycle Loan",
        type: LoanType.AUTO,
        amount: 12000,
        remainingAmount: 0,
        interestRate: 5.0,
        term: 36, // 3 years
        monthlyPayment: 360,
        totalInterest: 960,
        nextPaymentDate: "N/A",
        nextPaymentAmount: 0,
        purpose: "Motorcycle purchase",
        status: LoanStatus.REJECTED,
        createdAt: "2022-12-05T10:15:00Z",
        updatedAt: "2022-12-10T09:30:00Z",
        accountId: "acc-1",
        progress: 0,
        paymentsMade: 0,
        paymentsRemaining: 36,
        metadata: {
            rejectionReason: "Insufficient income",
            creditScoreAtApplication: 620
        }
    }
];

/**
 * Mock loans for different user types
 * @param userType The type of user to generate loans for
 * @returns Array of loans appropriate for the specified user type
 */
export function generateMockLoans(userType: string): Loan[] {
    switch (userType) {
        case 'established':
            // Return a subset of loans for established users
            return mockLoans.slice(0, 4);
        case 'premium':
        case 'demo':
            // Return all loans for premium/demo users
            return mockLoans;
        default:
            // New users have no loans
            return [];
    }
}