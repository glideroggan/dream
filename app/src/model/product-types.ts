import { BaseProduct } from '../services/product-service';

/**
 * Collection of product type interfaces that extend BaseProduct
 * This file centralizes all product type definitions for the application
 */

/**
 * Basic account product type
 */
export interface AccountProduct extends BaseProduct {
  accountNumber: string;
  balance: number;
  currency: string;
  availableBalance?: number;
  accountType: 'checking' | 'savings' | 'investment' | 'credit';
  interestRate?: number;
}

/**
 * Payment service product type
 */
export interface PaymentServiceProduct extends BaseProduct {
  description: string;
  features: string[];
  price?: number;
  currency?: string;
  frequency?: 'monthly' | 'yearly' | 'one-time';
  nextPaymentDate?: string;
}

/**
 * Insurance product type
 */
export interface InsuranceProduct extends BaseProduct {
  description: string;
  coverageAmount: number;
  premium: number;
  frequency: 'monthly' | 'yearly';
  expirationDate: string;
  coverageType: string;
  policyNumber: string;
}

/**
 * Credit card product type
 */
export interface CreditCardProduct extends BaseProduct {
  cardNumber: string;
  expirationDate: string;
  creditLimit: number;
  availableCredit: number;
  apr: number;
  rewards?: string[];
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
}

/**
 * Product classification helper functions
 */

/**
 * Check if a product is an account product
 */
export function isAccountProduct(product: BaseProduct): product is AccountProduct {
  return product.type === 'account' && 'accountNumber' in product;
}

/**
 * Check if a product is a payment service product
 */
export function isPaymentServiceProduct(product: BaseProduct): product is PaymentServiceProduct {
  return product.type === 'payment-service' && 'features' in product;
}

/**
 * Check if a product is an insurance product
 */
export function isInsuranceProduct(product: BaseProduct): product is InsuranceProduct {
  return product.type === 'insurance' && 'policyNumber' in product;
}

/**
 * Check if a product is a credit card product
 */
export function isCreditCardProduct(product: BaseProduct): product is CreditCardProduct {
  return product.type === 'credit-card' && 'cardNumber' in product;
}
