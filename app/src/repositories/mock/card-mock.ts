import { Card, CardType, CardNetwork } from "../models/card-models";

/**
 * Mock cards for demo/premium users - full range of card products
 */
export const fullFeaturedCards: Card[] = [
  {
    id: 'card-1',
    cardNumber: '**** **** **** 1234',
    lastFourDigits: '1234',
    type: 'debit',
    accountId: 'acc-1', // Matches demo main checking account
    expiryDate: '05/25',
    cardholderName: 'JOHN DOE',
    status: 'active',
    issueDate: '2022-01-15T10:30:00Z',
    network: 'visa',
    contactless: true,
    frozen: false,
    dailyLimit: 1000,
    monthlyLimit: 10000,
    digitalWalletEnabled: true
  },
  {
    id: 'card-2',
    cardNumber: '**** **** **** 5678',
    lastFourDigits: '5678',
    type: 'credit',
    accountId: 'acc-5', // Matches demo credit card account
    expiryDate: '11/26',
    cardholderName: 'JOHN DOE',
    status: 'active',
    issueDate: '2022-05-20T14:45:00Z',
    network: 'mastercard',
    contactless: true,
    frozen: false,
    dailyLimit: 2000,
    monthlyLimit: 15000,
    digitalWalletEnabled: true
  },
  {
    id: 'card-3',
    cardNumber: '**** **** **** 9012',
    lastFourDigits: '9012',
    type: 'credit',
    accountId: 'acc-10', // Matches demo secondary credit card
    expiryDate: '08/27',
    cardholderName: 'JOHN DOE',
    status: 'blocked',
    issueDate: '2021-11-05T09:15:00Z',
    network: 'amex',
    contactless: false,
    frozen: true,
    dailyLimit: 5000,
    monthlyLimit: 25000,
    digitalWalletEnabled: false
  },
  {
    id: 'card-4',
    cardNumber: '**** **** **** 3456',
    lastFourDigits: '3456',
    type: 'debit',
    accountId: 'acc-2', // Matches emergency fund account
    expiryDate: '09/26',
    cardholderName: 'JOHN DOE',
    status: 'active',
    issueDate: '2022-09-10T08:20:00Z',
    network: 'visa',
    contactless: true,
    frozen: false,
    dailyLimit: 500,
    monthlyLimit: 5000,
    digitalWalletEnabled: false
  },
  {
    id: 'card-5',
    cardNumber: '**** **** **** 7890',
    lastFourDigits: '7890',
    type: 'debit',
    accountId: 'acc-1', // Second card for main checking (virtual)
    expiryDate: '03/27',
    cardholderName: 'JOHN DOE',
    status: 'active',
    issueDate: '2023-03-22T14:30:00Z',
    network: 'visa',
    contactless: true,
    frozen: false,
    dailyLimit: 200,
    monthlyLimit: 1000,
    digitalWalletEnabled: true,
    securityCode: '***' // Virtual card with hidden security code
  }
];

/**
 * Mock cards for established users - basic set of cards
 */
export const establishedUserCards: Card[] = [
  {
    id: 'est-card-1',
    cardNumber: '**** **** **** 4321',
    lastFourDigits: '4321',
    type: 'debit',
    accountId: 'est-checking', // Matches established checking account
    expiryDate: '10/26',
    cardholderName: 'JANE SMITH',
    status: 'active',
    issueDate: '2022-10-05T09:15:00Z',
    network: 'visa',
    contactless: true,
    frozen: false,
    dailyLimit: 800,
    monthlyLimit: 8000,
    digitalWalletEnabled: true
  },
  {
    id: 'est-card-2',
    cardNumber: '**** **** **** 8765',
    lastFourDigits: '8765',
    type: 'credit',
    accountId: 'est-credit', // Matches established credit account
    expiryDate: '12/25',
    cardholderName: 'JANE SMITH',
    status: 'active',
    issueDate: '2021-12-10T11:30:00Z',
    network: 'mastercard',
    contactless: true,
    frozen: false,
    dailyLimit: 1500,
    monthlyLimit: 5000,
    digitalWalletEnabled: false
  }
];

/**
 * No mock cards for new users - they'll need to apply for one
 */
export const newUserCards: Card[] = [];

/**
 * Get mock cards based on user type
 */
export function generateMockCards(userType?: string): Card[] {
  switch(userType) {
    case 'new':
      return newUserCards;
    case 'established':
      return establishedUserCards;
    case 'premium':
    case 'demo':
    default:
      return fullFeaturedCards;
  }
}

/**
 * Generate custom mock card for testing
 */
export function generateMockCard(
  accountId: string, 
  type: CardType = 'debit',
  network: CardNetwork = 'visa'
): Card {
  const now = new Date();
  const lastFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
  const expiryDate = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${(now.getFullYear() + 4) % 100}`;
  
  return {
    id: `card-${Date.now()}`,
    cardNumber: `**** **** **** ${lastFourDigits}`,
    lastFourDigits,
    type,
    accountId,
    expiryDate,
    cardholderName: 'TEST USER',
    status: 'active',
    issueDate: now.toISOString(),
    network,
    contactless: true,
    frozen: false,
    dailyLimit: 1000,
    monthlyLimit: 10000,
    digitalWalletEnabled: false
  };
}
