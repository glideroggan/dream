import { Transaction } from "../../repositories/transaction-repository";
import { TransactionViewModel } from "./transaction-list-component";
import { TransactionStatus, TransactionType } from "../../services/repository-service";

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
      case TransactionType.DEPOSIT:
        isIncoming = true;
        break;
      case TransactionType.WITHDRAWAL:
        isIncoming = false;
        break;
      case TransactionType.PAYMENT:
        isIncoming = false;
        break;
      case TransactionType.TRANSFER:
        // For transfers, it depends on whether we're the source or destination
        isIncoming = transaction.toAccountId === accountId;
        break;
      case TransactionType.FEE:
        isIncoming = false;
        break;
      case TransactionType.INTEREST:
        isIncoming = true;
        break;
      default:
        // Default behavior - positive amount is incoming
        isIncoming = transaction.amount >= 0;
    }
    
    // For upcoming transactions, we'll show the absolute amount with sign
    const amount = transaction.status === TransactionStatus.UPCOMING 
      ? Math.abs(transaction.amount) 
      : transaction.amount;
    
    const relevantBalance = isIncoming ? transaction.toAccountBalance : transaction.fromAccountBalance;
    
    // Create view model with display properties
    return {
      ...transaction,
      amount,
      isIncoming,
      amountClass: isIncoming ? 'incoming' : 'outgoing',
      formattedAmount: `${Math.abs(amount).toFixed(2)} ${transaction.currency}`,
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
