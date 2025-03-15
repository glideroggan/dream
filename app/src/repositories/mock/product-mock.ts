import { Product, ProductCategory, ProductEntityType } from '../models/product-models';

export function generateMockProducts(): Product[] {
  const now = new Date().toISOString();

  return [
    // Banking products
    {
      id: 'checking-account',
      name: 'Everyday Checking Account',
      category: 'banking',
      type: 'account',
      description: 'A flexible everyday checking account for your daily banking needs',
      features: [
        'No minimum balance requirements',
        'Free online and mobile banking',
        'Contactless debit card',
        'ATM access'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        },
        {
          type: 'age',
          value: 18,
          description: 'Must be at least 18 years old'
        }
      ],
      relatedProductIds: ['savings-account', 'overdraft-protection'],
    },
    {
      id: 'savings-account',
      name: 'High-Yield Savings Account',
      category: 'banking',
      type: 'account',
      description: 'Earn competitive interest on your savings',
      features: [
        'Competitive interest rates',
        'No monthly maintenance fees',
        'FDIC insured',
        'Automatic savings options'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        }
      ],
      relatedProductIds: ['checking-account', 'cd-account'],
    },
    {
      id: 'isk-account',
      name: 'ISK Investment Account',
      category: 'investing',
      type: 'account',
      description: 'Investment Savings Account with tax benefits',
      features: [
        'Tax-advantaged investing',
        'Access to stocks, bonds, and funds',
        'No tax declaration for individual securities',
        'Simplified tax calculation'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'isk-account',
          description: 'Standard identity verification'
        },
        {
          type: 'residency',
          value: 'Sweden',
          description: 'Must be a resident of Sweden'
        }
      ],
    },
    {
      id: 'pension-account',
      name: 'Pension Savings Account',
      category: 'investing',
      type: 'account',
      description: 'Long-term retirement savings with tax advantages',
      features: [
        'Tax-deferred growth',
        'Diverse investment options',
        'Retirement planning tools',
        'Regular contribution options'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'pension-account',
          description: 'Standard identity verification'
        },
        {
          type: 'age',
          value: 18,
          description: 'Must be at least 18 years old'
        }
      ],
    },

    // Lending products
    {
      id: 'personal-loan',
      name: 'Personal Loan',
      category: 'lending',
      type: 'loan',
      description: 'Flexible financing for your personal needs',
      features: [
        'Competitive fixed rates',
        'Loan amounts from $1,000 to $50,000',
        'Terms from 12 to 60 months',
        'No prepayment penalties'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        },
        {
          type: 'creditScore',
          value: 650,
          description: 'Minimum credit score of 650'
        }
      ],
      relatedProductIds: ['debt-consolidation-loan', 'home-improvement-loan'],
      metadata: {
        minAmount: 1000,
        maxAmount: 50000,
        minTerm: 12,
        maxTerm: 60,
        baseInterestRate: 5.99
      },
    },
    {
      id: 'home-loan',
      name: 'Home Mortgage',
      category: 'lending',
      type: 'loan',
      description: 'Finance your dream home with competitive mortgage rates',
      features: [
        'Competitive interest rates',
        'Fixed and adjustable rate options',
        'Terms from 10 to 30 years',
        'First-time homebuyer programs available'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'enhanced-customer',
          description: 'Enhanced identity verification'
        },
        {
          type: 'creditScore',
          value: 680,
          description: 'Minimum credit score of 680'
        },
        {
          type: 'income',
          value: true,
          description: 'Verified income source'
        }
      ],
      metadata: {
        minAmount: 50000,
        maxAmount: 1000000,
        minTerm: 120, // 10 years
        maxTerm: 360, // 30 years
        baseInterestRate: 3.49
      },
    },
    {
      id: 'vehicle-loan',
      name: 'Vehicle Loan',
      category: 'lending',
      type: 'loan',
      description: 'Affordable financing for your new or used vehicle purchase',
      features: [
        'Competitive rates for new and used vehicles',
        'Loan amounts from $5,000 to $100,000',
        'Terms from 24 to 84 months',
        'Quick approval process'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        },
        {
          type: 'creditScore',
          value: 620,
          description: 'Minimum credit score of 620'
        }
      ],
      metadata: {
        minAmount: 5000,
        maxAmount: 100000,
        minTerm: 24,
        maxTerm: 84,
        baseInterestRate: 4.25
      },
    },
    {
      id: 'education-loan',
      name: 'Education Loan',
      category: 'lending',
      type: 'loan',
      description: 'Fund your education with flexible student loans',
      features: [
        'Competitive interest rates',
        'Flexible repayment options',
        'Defer payments while in school',
        'No application fees'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        },
        {
          type: 'age',
          value: 18,
          description: 'Must be at least 18 years old'
        }
      ],
      metadata: {
        minAmount: 1000,
        maxAmount: 100000,
        minTerm: 60,
        maxTerm: 180,
        baseInterestRate: 3.99
      },
    },
    {
      id: 'business-loan',
      name: 'Business Loan',
      category: 'lending',
      type: 'loan',
      description: 'Financing solutions for your business needs',
      features: [
        'Flexible funding for businesses',
        'Loan amounts from $10,000 to $500,000',
        'Terms from 12 to 120 months',
        'Support for expansion, equipment, or working capital'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'business-customer',
          description: 'Business identity verification'
        },
        {
          type: 'age',
          value: 18,
          description: 'Must be at least 18 years old'
        }
      ],
      metadata: {
        minAmount: 10000,
        maxAmount: 500000,
        minTerm: 12,
        maxTerm: 120,
        baseInterestRate: 6.5
      },
    },

    // Payment products
    {
      id: 'credit-card',
      name: 'Rewards Credit Card',
      category: 'payments',
      type: 'credit',
      description: 'Earn rewards on everyday purchases',
      features: [
        'Earn points on every purchase',
        'No annual fee',
        'Contactless payments',
        '24/7 customer support'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'enhanced-customer',
          description: 'Enhanced identity verification'
        },
        {
          type: 'creditScore',
          value: 670,
          description: 'Minimum credit score of 670'
        }
      ],
    },
    {
      id: 'debit-card',
      name: 'Standard Debit Card',
      category: 'payments',
      type: 'debit',
      description: 'Convenient access to your funds with our standard debit card',
      features: [
        'Direct access to your account funds',
        'Contactless payments',
        'Online purchase capability',
        'ATM withdrawals worldwide',
        'Real-time transaction alerts'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        },
        {
          type: 'hasAccount',
          value: true,
          description: 'Must have a compatible account'
        }
      ],
    },
    {
      id: "swish-standard",
      name: "Swish Premium",
      type: "service",
      category: "payments",
      description: "Swish is a modern payment solution that enables instant transfers between accounts with enhanced security features.",
      features: [
        "Instant transfers 24/7",
        "No transaction fees",
        "Enhanced security with biometric authentication",
        "Transaction history and insights",
        "Scheduled payments",
      ],
    },

    // Services
    {
      id: 'overdraft-protection',
      name: 'Overdraft Protection',
      category: 'services',
      type: 'service',
      description: 'Protect your account from overdraft fees',
      features: [
        'Link to a savings account or credit line',
        'Automatic transfers when needed',
        'Avoid declined transactions',
        'Reduce overdraft fees'
      ],
      requirements: [
        {
          type: 'kyc',
          value: 'basic-customer',
          description: 'Basic identity verification'
        }
      ],
      relatedProductIds: ['checking-account'],
    }
  ];
}
