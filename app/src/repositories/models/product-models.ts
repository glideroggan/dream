import { Entity } from "../base-repository";

/**
 * Represents the type of entity a product affects or creates
 */
export enum ProductEntityType {
  ACCOUNT = "account",
  LOAN = "loan",
  INVESTMENT = "investment",
  INSURANCE = "insurance",
  CARD = "card",
  SERVICE = "service"
}

/**
 * Represents a product category
 */
export enum ProductCategory {
  BANKING = "banking",
  LENDING = "lending",
  INVESTING = "investing",
  PROTECTION = "protection",
  PAYMENTS = "payments",
  SERVICES = "services"
}

/**
 * Base product interface that all product types extend
 */
export interface BaseProduct {
  id: string;
  name: string;
  type: string;
}

/**
 * Product interface representing all possible product attributes
 */
export interface Product extends BaseProduct {
  type: ProductEntityType;
  category: ProductCategory;
  description?: string;
  features?: string[];
  requirements?: ProductRequirement[];
  relatedProductIds?: string[];
  metadata?: Record<string, any>;
}

/**
 * Product entity interface
 */
// export interface ProductEntity extends Entity, Product {
//   name: string;
// }

/**
 * Product requirement interface for eligibility checks
 */
export interface ProductRequirement {
  type: "kyc" | "income" | "age" | "creditScore" | "residency" | "hasAccount" | "custom";
  value: string | number | boolean;
  description: string;
}

/**
 * Event types for product changes
 */
export type ProductChangeEventType = 'add' | 'remove' | 'update';

/**
 * Event interface for product changes
 */
export interface ProductChangeEvent {
  type: ProductChangeEventType;
  productId: string;
  product?: Product;
}

/**
 * Listener type for product changes
 */
export type ProductChangeListener = (event: ProductChangeEvent) => void;

/**
 * Specific product types
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
