import { Entity } from "../base-repository";

// Transaction type definitions
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'upcoming' | 'cancelled';
export type TransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'fee' | 'interest' | 'adjustment';

// Constants for status values (for backwards compatibility with enum usage)
export const TransactionStatuses = {
  COMPLETED: 'completed' as TransactionStatus,
  PENDING: 'pending' as TransactionStatus,
  FAILED: 'failed' as TransactionStatus,
  UPCOMING: 'upcoming' as TransactionStatus,
  CANCELLED: 'cancelled' as TransactionStatus
};

// Constants for type values (for backwards compatibility with enum usage)
export const TransactionTypes = {
  TRANSFER: 'transfer' as TransactionType,
  DEPOSIT: 'deposit' as TransactionType,
  WITHDRAWAL: 'withdrawal' as TransactionType,
  PAYMENT: 'payment' as TransactionType,
  REFUND: 'refund' as TransactionType,
  FEE: 'fee' as TransactionType,
  INTEREST: 'interest' as TransactionType,
  ADJUSTMENT: 'adjustment' as TransactionType
};

export interface Transaction extends Entity {
  fromAccountId: string;
  toAccountId?: string;  // Optional for withdrawals, fees
  amount: number;
  currency: string;
  description?: string;
  status: TransactionStatus;
  type: TransactionType;
  createdAt: string; // ISO date string
  scheduledDate?: string; // ISO date string for upcoming transactions
  completedDate?: string; // ISO date string for completed transactions
  // New properties for balance tracking
  fromAccountBalance?: number; // Balance of fromAccount after transaction
  toAccountBalance?: number;   // Balance of toAccount after transaction
  category?: string; // Transaction category for better analytics
}
