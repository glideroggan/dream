import { Entity } from "../base-repository";

// Card types
export type CardType = 'debit' | 'credit' | 'prepaid' | 'virtual' | 'corporate' | 'gift';
export type CardStatus = 'active' | 'blocked' | 'expired' | 'pending' | 'suspended' | 'canceled' | 'frozen' | 'lost' | 'stolen';
export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unionpay' | 'other';

// Card entity model
export interface Card extends Entity {
  // Common card properties
  cardNumber: string; // Masked number for display (e.g. **** **** **** 1234)
  type: CardType;
  accountId: string; // Link to the associated account
  expiryDate: string; // MM/YY format
  cardholderName: string;
  status: CardStatus;
  issueDate: string; // ISO date string
  network: CardNetwork;
  contactless: boolean;
  frozen: boolean; // Temporarily disabled
  lastFourDigits: string;
  
  // Usage limits
  dailyLimit: number;
  monthlyLimit: number;
  
  // Optional properties
  securityCode?: string; // CVV/CVC (masked or not stored)
  digitalWalletEnabled?: boolean;
  fullCardNumberHash?: string; // For secure lookups without storing actual number
  
  // Credit card specific properties
  creditLimit?: number;
  cashAdvanceLimit?: number;
  linkedToApplePay?: boolean;
  linkedToGooglePay?: boolean;
  
  // Prepaid card specific properties
  initialLoadAmount?: number;
  reloadable?: boolean;
  
  // Gift card specific properties
  giftAmount?: number;
  giftSender?: string;
  
  // Corporate card specific properties
  companyName?: string;
  expensePolicyId?: string;
  
  // Virtual card specific properties
  physicalCardId?: string; // If this is a virtual version of a physical card
  temporary?: boolean;
  expiresAfterOneUse?: boolean;
}

// Card service interfaces
export interface CardRequirement {
  type: string;
  value: any;
  description: string;
}

export interface CardProduct {
  id: string;
  name: string;
  type: "credit" | "debit";
  description: string;
  features: string[];
  requirements: CardRequirement[];
  imageUrl?: string;
  monthlyFee?: number;
  currency?: string;
}

export interface CardRequestData {
  productId: string;
  cardType: "credit" | "debit";
  linkedAccountId?: string | null;
  requestDate: string;
}

export interface CardServiceResult {
  success: boolean;
  message?: string;
  data?: any;
}
