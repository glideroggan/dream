import { Transaction, isIncomingTransaction } from "../../repositories/models/transaction-models";
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
    const isIncoming = isIncomingTransaction(transaction, accountId);
    
    // For display purposes, we adjust the sign based on direction
    const displayAmount = isIncoming ? transaction.amount : -transaction.amount;
    
    const relevantBalance = isIncoming ? transaction.toAccountBalance : transaction.fromAccountBalance;
    
    // Format the amount for display
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: transaction.currency || 'USD',
    });
    
    const formattedAmount = formatter.format(displayAmount);
    
    // Determine the appropriate CSS class
    const amountClass = isIncoming ? 'incoming' : 'outgoing';
    
    // Format account balance if available
    let formattedBalance: string | undefined;
    if (relevantBalance !== undefined) {
      formattedBalance = formatter.format(relevantBalance);
    }
    
    // Create view model with display properties
    return {
      ...transaction,
      amount: displayAmount, // Use the signed amount for the view model
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
