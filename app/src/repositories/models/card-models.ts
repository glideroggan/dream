import { Entity } from "../base-repository";
import { BaseRequirement, Product } from "./product-models";

// Card types
export type CardType = 'debit' | 'credit' | 'prepaid' | 'virtual' | 'corporate' | 'gift';
export type CardStatus = 'active' | 'blocked' | 'expired' | 'pending' | 'suspended' | 'canceled' | 'frozen' | 'lost' | 'stolen';
export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unionpay' | 'other';

export interface CreditCard extends Card {
  dueDate?:string 
  paymentReferenceId?:string
  creditLimit: number;
}

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
export interface CardRequirement extends BaseRequirement {
  type: 'kyc' | 'income' | 'age' | 'creditScore' | 'hasAccount'
}

export interface CardProduct extends Product {
  type: 'credit' | 'debit';
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
