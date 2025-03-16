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

export enum TransactionDirections {
  DEBIT = 'debit',  // Money going out of the account
  CREDIT = 'credit' // Money coming into the account
}

/**
 * Request type for creating an external transaction
 * Contains only the required fields for transferring money to an external account
 */
export interface ExternalTransactionRequest {
  fromAccountId: string;
  amount: number;
  currency: string;
  fromAccountBalance: number;
  description?: string;
  dueDate?: Date;
  reference?: string;
}

export interface Transaction extends Entity {
  fromAccountId: string;
  toAccountId?: string;  // Optional for withdrawals, fees
  /**
   * Transaction amount - always stored as a positive number
   * Direction (debit/credit) is determined by transaction type and account perspective
   */ 
  amount: number;
  direction: TransactionDirections; // DEBIT or CREDIT
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
  reference?: string; // Reference to related entities (e.g., loan ID, payment ID)
}

/**
 * Determines if a transaction should be displayed as incoming or outgoing
 * from the perspective of the specified account
 * 
 * @param transaction The transaction to evaluate
 * @param accountId The ID of the account from whose perspective we're viewing
 * @returns true if this is an incoming transaction, false if outgoing
 */
export function isIncomingTransaction(transaction: Transaction, accountId: string): boolean {
  // If this is the destination account, it's incoming
  if (transaction.toAccountId === accountId) {
    return true;
  }
  
  // If this is the source account, it's outgoing
  if (transaction.fromAccountId === accountId) {
    return false;
  }
  
  // Fallback for interest or other special cases where we might not have a matching account ID
  switch (transaction.type) {
    case TransactionTypes.INTEREST:
    case TransactionTypes.DEPOSIT:
    case TransactionTypes.REFUND:
      return true;
    case TransactionTypes.FEE:
    case TransactionTypes.WITHDRAWAL:
    case TransactionTypes.PAYMENT:
      return false;
    default:
      // For any other type, default behavior
      return false;
  }
}
