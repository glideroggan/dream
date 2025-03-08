import { Transaction } from "../../repositories/models/transaction-models";
import { TransactionViewModel } from "./transaction-list-component";

/**
 * Helper class for processing transactions into view models
 * This provides a consistent way to convert transactions for display
 */
export class TransactionViewModelHelper {
  /**
   * Convert a transaction to a display-ready view model
   * @param transaction The raw transaction from the repository
   * @param accountId The ID of the account we're viewing from
   * @returns A TransactionViewModel with display properties
   */
  static processTransaction(transaction: Transaction, accountId: string): TransactionViewModel {
    // Determine if this is an incoming or outgoing transaction relative to the account
    let isIncoming: boolean;
    
    // Handle different transaction types
    switch(transaction.type) {
      case 'deposit':
        isIncoming = true;
        break;
      case 'withdrawal':
        isIncoming = false;
        break;
      case 'payment':
        isIncoming = false;
        break;
      case 'transfer':
        // For transfers, it depends on whether we're the source or destination
        isIncoming = transaction.toAccountId === accountId;
        break;
      case 'fee':
        isIncoming = false;
        break;
      case 'interest':
        isIncoming = true;
        break;
      default:
        // Default behavior - positive amount is incoming
        isIncoming = transaction.amount >= 0;
    }
    
    // For upcoming transactions, we'll show the absolute amount with sign
    const amount = transaction.status === 'upcoming' 
      ? Math.abs(transaction.amount) 
      : transaction.amount;
    
    const relevantBalance = isIncoming ? transaction.toAccountBalance : transaction.fromAccountBalance;
    
    // Format the amount for display
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: transaction.currency || 'USD',
    });
    
    const formattedAmount = formatter.format(amount);
    
    // Determine the appropriate CSS class
    const amountClass = isIncoming ? 'incoming' : 'outgoing';
    
    // Format account balance if available
    let formattedBalance: string | undefined;
    if (isIncoming && transaction.toAccountBalance !== undefined) {
      formattedBalance = formatter.format(transaction.toAccountBalance);
    } else if (!isIncoming && transaction.fromAccountBalance !== undefined) {
      formattedBalance = formatter.format(transaction.fromAccountBalance);
    }
    
    // Create view model with display properties
    return {
      ...transaction,
      amount,
      isIncoming,
      amountClass,
      formattedAmount,
      formattedBalance
    };
  }
  
  /**
   * Process an array of transactions into view models
   * @param transactions Array of raw transactions
   * @param accountId The ID of the account we're viewing from
   * @returns Array of TransactionViewModels
   */
  static processTransactions(transactions: Transaction[], accountId: string): TransactionViewModel[] {
    return transactions.map(txn => this.processTransaction(txn, accountId));
  }
}
