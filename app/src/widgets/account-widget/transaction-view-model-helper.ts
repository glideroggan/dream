import { Transaction } from "../../repositories/transaction-repository";
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
    const isIncoming = transaction.toAccountId === accountId;
    const relevantBalance = isIncoming ? transaction.toAccountBalance : transaction.fromAccountBalance;
    
    // Create view model with display properties
    return {
      ...transaction,
      isIncoming,
      amountClass: isIncoming ? 'incoming' : 'outgoing',
      formattedAmount: `${isIncoming ? '+' : '-'}${transaction.amount.toFixed(2)} ${transaction.currency}`,
      formattedBalance: relevantBalance ? `${relevantBalance.toFixed(2)} ${transaction.currency}` : undefined
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
