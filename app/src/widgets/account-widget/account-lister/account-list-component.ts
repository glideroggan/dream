import { FASTElement, customElement, observable } from "@microsoft/fast-element";
import { TransactionViewModel } from "../transaction-list-component";
import { repositoryService } from "../../../services/repository-service";
import { cardService } from "../../../services/card-service";
import { TransactionViewModelHelper } from "../transaction-view-model-helper";
import { AccountInsightsHelper, AccountInsight } from "../../../helpers/account-insights-helper";
import { template } from "./account-list-component.template";
import { styles } from "./account-list-component.css";
import { WorkflowIds } from "../../../workflows/workflow-registry";
import { workflowManager } from "../../../services/workflow-manager-service";
import { Account } from "../../../repositories/models/account-models";
import { Transaction } from "../../../repositories/models/transaction-models";

@customElement({
  name: "account-list",
  template,
  styles
})
export class AccountListComponent extends FASTElement {
  @observable accounts: Account[] = [];
  @observable expandedAccountId: string | null = null;
  @observable isLoading: boolean = true;
  @observable hasError: boolean = false;
  @observable errorMessage: string = '';

  // Maps for caching transaction data
  private upcomingTransactionsByAccount: Map<string, TransactionViewModel[]> = new Map();
  private upcomingSummaryCache: Map<string, string> = new Map();
  private outgoingTotalsByAccount: Map<string, number> = new Map();

  // Cache for account insights
  private accountInsightsCache: Map<string, AccountInsight[]> = new Map();

  // Track accounts with cards
  private accountsWithCards: Set<string> = new Set();

  private unsubscribe?: () => void;

  constructor() {
    super();
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadData();

    // Listen for storage events to refresh data when needed
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Handle storage changes from other tabs/windows
   */
  private handleStorageChange(event: StorageEvent): void {
    // If accounts or transactions data changed, refresh
    if (event.key?.includes('accounts') || event.key?.includes('transactions') || event.key?.includes('cards')) {
      this.loadData();
    }
  }

  /**
   * Load all required data for this component
   */
  async loadData(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;

    try {
      // Get repositories
      const accountRepo = repositoryService.getAccountRepository();
      const transactionRepo = repositoryService.getTransactionRepository();

      // Load accounts
      this.accounts = await accountRepo.getAll();

      // Subscribe to account changes
      this.unsubscribe = accountRepo.subscribe((event) => {
        switch (event.type) {
          case 'create':
            this.handleAccountCreated(event.entity!);
            break;
          case 'update':
            this.handleAccountUpdated(event.entity!);
            break;
          case 'delete':
            this.handleAccountDeleted(event.entityId!);
            break;
          case 'refresh':
            this.loadData(); // Reload all data
            break;
        }
      });


      // Clear caches
      this.upcomingTransactionsByAccount.clear();
      this.upcomingSummaryCache.clear();
      this.accountInsightsCache.clear();
      this.accountsWithCards.clear();

      // Load cards data and associate with accounts
      await this.loadCardsData();

      // Pre-calculate insights for each account
      this.accounts.forEach(account => {
        this.accountInsightsCache.set(account.id, AccountInsightsHelper.getAccountInsights(account));
      });

      // Load upcoming transactions
      const upcomingTransactions = await transactionRepo.getUpcoming();

      // Process and cache upcoming transactions by account
      for (const transaction of upcomingTransactions) {
        // Handle both incoming and outgoing transactions
        if (transaction.fromAccountId) {
          this.addTransactionToAccount(transaction, transaction.fromAccountId);
        }

        if (transaction.toAccountId) {
          this.addTransactionToAccount(transaction, transaction.toAccountId);
        }
      }

      // Pre-calculate summaries for better performance
      this.preCalculateSummaries();

      this.isLoading = false;

      // Let parent know we're ready
      this.dispatchEvent(new CustomEvent('ready'));
    } catch (error) {
      console.error('Error loading account data:', error);
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Failed to load account data';
      this.isLoading = false;
    }
  }

  /**
   * Load cards data and associate with accounts
   */
  private async loadCardsData(): Promise<void> {
    try {
      // Get all cards
      const cards = await cardService.getAllCards();

      // Associate cards with accounts
      for (const card of cards) {
        if (card.accountId) {
          this.accountsWithCards.add(card.accountId);
        }
      }

      console.debug(`Found ${this.accountsWithCards.size} accounts with cards`);
    } catch (error) {
      console.error('Error loading cards data:', error);
    }
  }

  /**
   * Check if an account has any cards associated with it
   */
  hasCard(accountId: string): boolean {
    return this.accountsWithCards.has(accountId);
  }

  private handleAccountCreated(account: Account): void {
    this.accounts = [...this.accounts, account];
  }

  private handleAccountUpdated(account: Account): void {
    this.accounts = this.accounts.map(a =>
      a.id === account.id ? account : a
    );
  }

  private handleAccountDeleted(accountId: string): void {
    this.accounts = this.accounts.filter(a => a.id !== accountId);
  }

  /**
   * Add a transaction to the account's cache
   */
  private addTransactionToAccount(transaction: Transaction, accountId: string): void {
    // Skip accounts we don't know about
    if (!this.accounts.some(a => a.id === accountId)) return;

    if (!this.upcomingTransactionsByAccount.has(accountId)) {
      this.upcomingTransactionsByAccount.set(accountId, []);
    }

    const viewModel = TransactionViewModelHelper.processTransaction(transaction, accountId);
    this.upcomingTransactionsByAccount.get(accountId)!.push(viewModel);
  }

  /**
   * Pre-calculate all account summaries for better performance
   */
  private preCalculateSummaries(): void {
    this.outgoingTotalsByAccount.clear();

    for (const accountId of this.upcomingTransactionsByAccount.keys()) {
      const transactions = this.upcomingTransactionsByAccount.get(accountId)!;
      if (transactions.length > 0) {
        // Calculate and store total outgoing amount
        const outgoing = transactions.filter(t => !t.isIncoming);
        const outgoingTotal = outgoing.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        this.outgoingTotalsByAccount.set(accountId, outgoingTotal);

        // For each account that has transactions, invalidate the insights cache
        // so that it will be recalculated with transaction data
        this.accountInsightsCache.delete(accountId);
      }
    }
  }

  /**
   * Check if an account has upcoming transactions
   */
  accountHasUpcoming(accountId: string): boolean {
    return this.upcomingTransactionsByAccount.has(accountId) &&
      this.upcomingTransactionsByAccount.get(accountId)!.length > 0;
  }

  /**
   * Get the formatted summary of upcoming transactions
   */
  getUpcomingSummary(accountId: string): string {
    return this.upcomingSummaryCache.get(accountId) || '';
  }

  // /**
  //  * Calculate a human-readable summary of upcoming transactions
  //  */
  // private calculateUpcomingSummary(transactions: TransactionViewModel[]): string {
  //   // Calculate total incoming and outgoing amounts
  //   const incoming = transactions.filter(t => t.isIncoming);
  //   const outgoing = transactions.filter(t => !t.isIncoming);

  //   const incomingTotal = incoming.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  //   const outgoingTotal = outgoing.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  //   // Create a summary message
  //   const parts = [];

  //   if (outgoing.length > 0) {
  //     const closest = this.getClosestTransaction(outgoing);
  //     const timeframe = this.getTimeframeText(closest.scheduledDate!);
  //     parts.push(`${outgoing.length} out (-${outgoingTotal.toFixed(0)}) ${timeframe}`);
  //   }

  //   if (incoming.length > 0) {
  //     const closest = this.getClosestTransaction(incoming);
  //     const timeframe = this.getTimeframeText(closest.scheduledDate!);
  //     parts.push(`${incoming.length} in (+${incomingTotal.toFixed(0)}) ${timeframe}`);
  //   }

  //   return parts.join(' · ');
  // }

  /**
   * Get the closest (soonest) transaction from a list
   */
  private getClosestTransaction(transactions: TransactionViewModel[]): TransactionViewModel {
    return transactions.reduce((closest, current) => {
      if (!closest.scheduledDate) return current;
      if (!current.scheduledDate) return closest;

      const closestDate = new Date(closest.scheduledDate).getTime();
      const currentDate = new Date(current.scheduledDate).getTime();

      return currentDate < closestDate ? current : closest;
    });
  }

  /**
   * Get a human-readable timeframe description
   */
  private getTimeframeText(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    } else if (daysDiff < 7) {
      return `in ${daysDiff} days`;
    } else if (daysDiff < 30) {
      const weeks = Math.floor(daysDiff / 7);
      return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    } else {
      return 'soon';
    }
  }

  /**
   * Check if the account has insufficient funds for upcoming payments
   */
  hasInsufficientFunds(account: Account): boolean {
    const outgoingTotal = this.outgoingTotalsByAccount.get(account.id) || 0;
    return outgoingTotal > account.balance;
  }

  /**
   * Get insights for a specific account
   */
  getInsightsForAccount(account: Account): AccountInsight[] {
    // First check the cache
    const cachedInsights = this.accountInsightsCache.get(account.id);
    if (cachedInsights) {
      return cachedInsights;
    }

    // If not cached (shouldn't happen), generate on the fly
    const insights = AccountInsightsHelper.getAccountInsights(account);

    // Add transaction-based insights
    if (this.accountHasUpcoming(account.id)) {
      const transactionInsights = this.getTransactionBasedInsights(account.id);
      insights.push(...transactionInsights);
    }

    this.accountInsightsCache.set(account.id, insights);
    return insights;
  }

  /**
   * Create insights from upcoming transactions
   */
  private getTransactionBasedInsights(accountId: string): AccountInsight[] {
    const insights: AccountInsight[] = [];
    const transactions = this.upcomingTransactionsByAccount.get(accountId) || [];

    if (transactions.length === 0) return insights;

    // Group by incoming/outgoing
    const incoming = transactions.filter(t => t.isIncoming);
    const outgoing = transactions.filter(t => !t.isIncoming);

    // Add outgoing transactions insight
    if (outgoing.length > 0) {
      const outgoingTotal = outgoing.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const closest = this.getClosestTransaction(outgoing);
      const timeframe = this.getTimeframeText(closest.scheduledDate!);

      // Check for insufficient funds
      const account = this.accounts.find(a => a.id === accountId);
      const hasInsufficientFunds = account && outgoingTotal > account.balance;

      insights.push({
        type: 'upcoming-out',
        label: 'Out',
        value: `${outgoing.length} (-${outgoingTotal.toFixed(0)}) ${timeframe}`,
        colorClass: hasInsufficientFunds ? 'warning' : 'neutral',
        icon: hasInsufficientFunds ? '⚠️' : '📅'
      });
    }

    // Add incoming transactions insight
    if (incoming.length > 0) {
      const incomingTotal = incoming.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const closest = this.getClosestTransaction(incoming);
      const timeframe = this.getTimeframeText(closest.scheduledDate!);

      insights.push({
        type: 'upcoming-in',
        label: 'In',
        value: `${incoming.length} (+${incomingTotal.toFixed(0)}) ${timeframe}`,
        colorClass: 'success',
        icon: '💰'
      });
    }

    return insights;
  }

  /**
   * Handle account click to expand/collapse
   */
  handleAccountClick(account: Account) {
    // Toggle expanded state
    this.expandedAccountId = this.expandedAccountId === account.id ? null : account.id;
    setTimeout(() => this.$emit('content-change'), 50);
    
  }

  /**
   * Handle more/options button click
   */
  handleMoreClick(account: Account, event: Event) {
    event.stopPropagation();

    this.dispatchEvent(new CustomEvent('account-actions', {
      detail: { account }
    }));
  }

  /**
   * Handle card icon click to show card details
   */
  async handleCardClick(account: Account, event: Event) {
    // Stop event propagation to prevent triggering the account click
    event.stopPropagation();

    console.debug('Card clicked for account:', account.id);
    // get the associated card
    const cards = await cardService.getCardsByAccountId(account.id);
    if (cards.length === 0) {
      console.warn('No cards found for account:', account.id);
      return;
    } else {
      const result = await workflowManager.startWorkflow(WorkflowIds.CARD_DETAIL, { card: cards[0] });
    }

  }
}
