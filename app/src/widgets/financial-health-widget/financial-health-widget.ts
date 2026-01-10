import { FASTElement, customElement, html, css, observable, when } from "@microsoft/fast-element";
import { repositoryService } from "../../services/repository-service";
import { workflowManager } from "../../services/workflow-manager-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import "@primitives/button";

// Import components
import "./components/health-score-component";
import "./components/monthly-spending-chart";
import "./components/expense-categories-chart";
import "./components/net-worth-component";
import "./components/savings-rate-component";
import "./components/recommendations-component";

// Import component interfaces
import { SavingsGoal } from "./components/savings-rate-component";
import { AccountTypeData, AccountTypeMapItem } from "./components/net-worth-component";
import { DataPoint } from "./components/monthly-spending-chart";
import { CategoryExpense } from "./components/expense-categories-chart";
import { Account } from "../../repositories/models/account-models";
import { Transaction, TransactionDirections } from "../../repositories/models/transaction-models";


const template = html<FinancialHealthWidget>/*html*/ `
  <div class="financial-health-widget">
    <div class="widget-header">
      <h3>Financial Health</h3>
      <health-score-component score="${x => x.healthScore}"></health-score-component>
    </div>
    
    ${when(x => x.loading, html<FinancialHealthWidget>/*html*/`
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Analyzing your financial health...</p>
      </div>
    `)}
    
    ${when(x => x.error, html<FinancialHealthWidget>/*html*/`
      <div class="error-state">
        <p class="error-message">${x => x.errorMessage}</p>
        <dream-button variant="primary" @click="${x => x.fetchFinancialData()}">Retry</dream-button>
      </div>
    `)}
    
    ${when(x => !x.loading && !x.error, html<FinancialHealthWidget>/*html*/`
      <div class="health-content">
        <!-- Recommendations banner -->
        <div class="recommendations-banner">
          <div class="banner-header">
            <h4>Recommendations</h4>
            <span class="recommendation-count">${x => x.recommendations.length} items</span>
          </div>
          <recommendations-component :recommendations="${x => x.recommendations}"></recommendations-component>
        </div>
        
        <!-- Row 1: Net Worth and Savings Rate -->
        <div class="panel-row net-worth-savings-row">
          <div class="panel net-worth-panel">
            <h4>Net Worth</h4>
            <div class="net-worth-value" style="color: ${x => x.netWorth >= 0 ? 'var(--accent-color, #2ecc71)' : 'var(--notification-badge-bg, #e74c3c)'}">
              ${x => x.formatCurrency(x.netWorth)} ${x => x.primaryCurrency}
            </div>
            <div class="net-worth-details">
              <div class="detail-item">
                <span class="detail-label">Assets:</span>
                <span class="detail-value positive">${x => x.formatCurrency(x.totalAssets)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Liabilities:</span>
                <span class="detail-value negative">${x => x.formatCurrency(x.totalLiabilities)}</span>
              </div>
            </div>

            <div class="account-types">
              ${when(x => x.accountTypeData.length > 1, html<FinancialHealthWidget>`
                <net-worth-component 
                  totalAssets="${x => x.totalAssets}"
                  totalLiabilities="${x => x.totalLiabilities}"
                  :accountTypeData="${x => x.accountTypeData}"
                  ?showChart="${true}">
                </net-worth-component>
              `)}
            </div>
          </div>
          
          <div class="panel savings-panel">
            <h4>Savings Rate</h4>
            <savings-rate-component 
              rate="${x => x.savingsRate}" 
              :goals="${x => x.savingsGoals}">
            </savings-rate-component>
          </div>
        </div>
        
        <!-- Row 2: Monthly Spending -->
        <div class="panel spending-panel">
          <h4>Monthly Spending</h4>
          <monthly-spending-chart 
            :dataPoints="${x => x.monthlySpendingDataPoints}"
            trend="${x => x.spendingTrend}"
            trendMessage="${x => x.spendingTrendText}">
          </monthly-spending-chart>
        </div>
        
        <!-- Row 3: Top Expenses -->
        <div class="panel expenses-panel">
          <h4>Top Expenses</h4>
          <expense-categories-chart :categories="${x => x.expenseCategories}"></expense-categories-chart>
        </div>
      </div>
      
      <div class="widget-footer">
        <dream-button variant="primary" @click="${x => x.openFinancialDetailWorkflow()}">View Financial Details</dream-button>
      </div>
    `)}
  </div>
`;

const styles = css`
  .financial-health-widget {
    background: var(--background-color, #ffffff);
    color: var(--primary-text-color, #333333);
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }
  
  .widget-header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--primary-text-color, #333333);
  }
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: var(--secondary-text-color, #555);
  }
  
  .health-content {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
  }
  
  /* Recommendations banner */
  .recommendations-banner {
    background-color: var(--background-card, #f0f8ff);
    border-radius: 6px;
    padding: 10px 12px;
    border-left: 4px solid var(--primary-color, #3498db);
  }
  
  .banner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  
  .banner-header h4 {
    margin: 0;
  }
  
  .recommendation-count {
    font-size: 12px;
    color: var(--secondary-text-color, #666);
    background-color: var(--background-color, #fff);
    padding: 2px 8px;
    border-radius: 10px;
  }
  
  /* Panel row for net worth and savings */
  .panel-row {
    display: flex;
    gap: 12px;
    width: 100%;
  }
  
  .net-worth-savings-row {
  }
  
  .panel {
    background-color: var(--background-card, #f9f9f9);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    padding: 12px;
    display: flex;
    flex-direction: column;
    min-width: 0; /* For flex shrinking */
    overflow: hidden;
  }
  
  /* Net worth panel (left, row 1) */
  .net-worth-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  
  .net-worth-value {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 6px;
  }
  
  .net-worth-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
  }
  
  .detail-label {
    color: var(--secondary-text-color, #666);
  }
  
  .detail-value.positive {
    color: var(--accent-color, #2ecc71);
  }
  
  .detail-value.negative {
    color: var(--notification-badge-bg, #e74c3c);
  }
  
  .account-types {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  
  /* Savings panel (right, row 1) */
  .savings-panel {
    flex: 1;
    min-width: 0;
  }
  
  /* Spending panel (row 2) */
  .spending-panel {
    height: 180px;
  }
  
  /* Expenses panel (row 3) */
  .expenses-panel {
    height: 180px;
    display: flex;
    flex-direction: column;
  }
  
  /* Loading and Error States */
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--divider-color, #eaeaea);
    border-top-color: var(--primary-color, #3498db);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  .error-message {
    color: var(--notification-badge-bg, #e74c3c);
    margin-bottom: 16px;
  }
  
  /* Widget Footer */
  .widget-footer {
    padding: 12px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid var(--divider-color, #eaeaea);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .panel-row {
      flex-direction: column;
      height: auto;
    }
    
    .net-worth-savings-row, .net-worth-panel, .savings-panel {
      height: auto;
      min-height: 200px;
    }
    
    .spending-panel, .expenses-panel {
      height: 180px;
    }
  }
  
  @media (max-width: 480px) {
    .spending-panel, .expenses-panel {
      height: 220px;
    }
  }
`;

@customElement({
  name: "financial-health-widget",
  template,
  styles
})
export class FinancialHealthWidget extends FASTElement {
  @observable loading: boolean = true;
  @observable error: boolean = false;
  @observable errorMessage: string = '';
  
  // Financial data
  @observable accounts: Account[] = [];
  @observable transactions: Transaction[] = [];
  @observable netWorth: number = 0;
  @observable totalAssets: number = 0;
  @observable totalLiabilities: number = 0;
  @observable primaryCurrency: string = 'USD';
  
  // Spending trend data
  @observable monthlySpending: number[] = [];
  @observable spendingTrend: 'up' | 'down' | 'flat' = 'flat';
  @observable spendingTrendText: string = '';
  
  // Savings rate data
  @observable savingsRate: number = 0;
  @observable monthlyIncome: number = 0;
  @observable monthlyExpenses: number = 0;
  
  // Health score and recommendations
  @observable healthScore: number = 0;
  @observable recommendations: string[] = [];
  
  // Expense categories
  @observable expenseCategories: CategoryExpense[] = [];

  // Account type data for visualization
  @observable accountTypeData: AccountTypeData[] = [];
  @observable accountTypeLegendItems: AccountTypeMapItem[] = [];
  @observable savingsGoals: SavingsGoal[] = [];
  
  // New chart data properties
  @observable monthlySpendingDataPoints: DataPoint[] = [];
  @observable maxMonthlySpending: number = 1000;

  async connectedCallback() {
    super.connectedCallback();
    
    try {
      // Load financial data
      await this.fetchFinancialData();
      
      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Signal that the widget is initialized
      this.dispatchEvent(new CustomEvent('initialized', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error initializing financial health widget:', error);
      // Re-throw to let error handling work
      throw error;
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
  }
  
  /**
   * Handle storage changes from other tabs
   */
  handleStorageChange(event: StorageEvent) {
    if (event.key?.includes('accounts') || event.key?.includes('transactions')) {
      this.fetchFinancialData();
    }
  }
  
  /**
   * Fetches all financial data needed for the widget
   */
  async fetchFinancialData() {
    this.loading = true;
    this.error = false;
    this.errorMessage = '';
    
    try {
      const accountRepo = repositoryService.getAccountRepository();
      const transactionRepo = repositoryService.getTransactionRepository();
      
      // Fetch all accounts and transactions
      const accounts = await accountRepo.getAll();
      this.accounts = accounts;
      
      // Calculate account types distribution
      this.calculateAccountTypes();
      
      // Get primary currency from accounts
      if (this.accounts.length > 0) {
        this.primaryCurrency = this.accounts[0].currency;
      }
      
      // Calculate net worth
      this.calculateNetWorth();
      
      // Fetch transactions from the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Here we would ideally filter by date on the repository level
      // But for now, we'll fetch all and filter here
      const allTransactions = await transactionRepo.getAll();
      this.transactions = allTransactions.filter(transaction => 
        new Date(transaction.createdAt) >= sixMonthsAgo
      );
      
      // Analyze spending trends
      this.analyzeSpendingTrends();
      
      // Calculate savings rate
      this.calculateSavingsRate();
      
      // Generate health score and recommendations
      this.generateHealthScore();
      this.generateRecommendations();
      
      // Analyze expense categories
      this.analyzeExpenseCategories();
      
      // Get savings goals from accounts with goals
      this.generateSavingsGoals();

      this.loading = false;
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      this.error = true;
      this.errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load financial data. Please try again.';
      this.loading = false;
    }
  }
  
  /**
   * Calculate net worth from accounts
   */
  calculateNetWorth() {
    this.totalAssets = 0;
    this.totalLiabilities = 0;
    
    // Consider accounts based on both type and balance
    for (const account of this.accounts) {
      const accountType = account.type.toLowerCase();
      
      // Credit cards and loans are liabilities regardless of balance sign
      if (accountType === 'credit' || accountType === 'loan') {
        // For credit and loan accounts, the balance represents what you owe
        // Ensure this is added to liabilities (as a positive number)
        this.totalLiabilities += Math.abs(account.balance);
      } else {
        // For other account types (checking, savings, investment), use the balance sign
        if (account.balance >= 0) {
          this.totalAssets += account.balance;
        } else {
          // Negative balance on an asset account = overdraft = liability
          this.totalLiabilities += Math.abs(account.balance);
        }
      }
    }
    
    this.netWorth = this.totalAssets - this.totalLiabilities;
  }
  
  /**
   * Analyze spending trends from transactions
   */
  analyzeSpendingTrends() {
    // Group transactions by month and calculate total spending per month
    const spendingByMonth: Map<string, { essential: number, discretionary: number }> = new Map();
    const now = new Date();
    
    // Expanded list of essential categories for better categorization
    const essentialCategories = [
      // Housing related
      'Rent', 'rent', 'Mortgage', 'mortgage', 'Housing', 'housing', 'Lease', 'lease',
      
      // Utilities
      'Utilities', 'utilities', 'Utility', 'utility', 'Electric', 'electric', 'Water', 'water', 
      'Gas', 'gas', 'Internet', 'internet', 'Phone', 'phone',
      
      // Food necessities
      'Groceries', 'groceries', 'Grocery', 'grocery',
      
      // Insurance
      'Insurance', 'insurance', 
      
      // Healthcare
      'Medical', 'medical', 'Health', 'health', 'Healthcare', 'healthcare',
      'Doctor', 'doctor', 'Pharmacy', 'pharmacy',
      
      // Transportation
      'Transportation', 'transportation', 'Transit', 'transit', 'Gas', 'gas',
      'Fuel', 'fuel', 'Bus', 'bus', 'Train', 'train', 'Subway', 'subway',
      
      // Education
      'Education', 'education', 'Tuition', 'tuition', 'School', 'school',
      
      // Debt payments
      'Debt', 'debt', 'Loan', 'loan', 'Credit Card Payment', 'credit card payment',
      'Debt Payment', 'debt payment', 'Student Loan', 'student loan'
    ];
    
    // Initialize with zero values for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      spendingByMonth.set(monthKey, { essential: 0, discretionary: 0 });
    }
    
    // Calculate spending (only consider outgoing transactions)
    for (const transaction of this.transactions) {
      // Consider transactions outgoing from checking/savings accounts
      // This is a spending transaction if it's outgoing from a personal account to an external entity
      const isSpendingTransaction = (
        // Must be from a personal account (not marked as external)
        !transaction.fromAccountId.startsWith('ext-') && 
        !transaction.fromAccountId.startsWith('external') &&
        // And either going to an external account or no destination account (withdrawal)
        (transaction.toAccountId?.startsWith('ext-') || 
         transaction.toAccountId?.startsWith('external') ||
         !transaction.toAccountId)
      );
      
      if (isSpendingTransaction) {
        const date = new Date(transaction.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (spendingByMonth.has(monthKey)) {
          const spendingData = spendingByMonth.get(monthKey)!;
          const amount = transaction.amount; // Already positive
          
          // Log transaction for debugging
          console.debug(`Spending Transaction: ${transaction.description || 'Unnamed'}, Category: ${transaction.category || 'Uncategorized'}, Amount: ${amount}`);
          
          // Check if transaction description contains essential keywords, in addition to category
          const transactionText = [
            transaction.category || '',
            transaction.description || ''
          ].join(' ').toLowerCase();
          
          // Improved categorization - check if category or description matches any essential category
          const isEssential = essentialCategories.some(cat => 
            transactionText.includes(cat.toLowerCase())
          );
          
          // Categorize as essential or discretionary
          if (isEssential) {
            spendingData.essential += amount;
            console.debug(`Categorized as Essential`);
          } else {
            spendingData.discretionary += amount;
            console.debug(`Categorized as Discretionary`);
          }
          
          spendingByMonth.set(monthKey, spendingData);
        }
      }
    }
    
    // Log the spending breakdown for debugging
    console.debug('Monthly spending breakdown:', Object.fromEntries(spendingByMonth));
    
    // Convert to array for easier processing
    const spendingArray = Array.from(spendingByMonth.entries());
    
    // Calculate total spending for each month (essential + discretionary)
    this.monthlySpending = spendingArray.map(([_, values]) => values.essential + values.discretionary);
    
    // Find the maximum monthly spending for the chart scale
    this.maxMonthlySpending = Math.max(...this.monthlySpending, 1000); // Minimum scale of 1000
    
    // Create data points for the chart, including essential vs discretionary breakdown
    this.monthlySpendingDataPoints = spendingArray.map(([monthKey, values]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1);
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      
      return {
        month: monthLabel,
        value: values.essential + values.discretionary,
        essential: values.essential,
        discretionary: values.discretionary
      };
    });
    
    // Log the finalized data points to ensure they have essential and discretionary values
    console.debug('Monthly spending data points:', this.monthlySpendingDataPoints);
    
    // Determine spending trend based on total spending
    if (this.monthlySpending.length >= 2) {
      const lastMonth = this.monthlySpending[this.monthlySpending.length - 1];
      const secondLastMonth = this.monthlySpending[this.monthlySpending.length - 2];
      
      if (secondLastMonth === 0) {
        this.spendingTrend = 'flat';
        this.spendingTrendText = 'No spending data available for comparison';
        return;
      }
      
      const percentChange = ((lastMonth - secondLastMonth) / secondLastMonth) * 100;
      
      if (percentChange > 5) {
        this.spendingTrend = 'up';
        this.spendingTrendText = `Spending increased by ${Math.round(percentChange)}% compared to last month`;
      } else if (percentChange < -5) {
        this.spendingTrend = 'down';
        this.spendingTrendText = `Spending decreased by ${Math.round(Math.abs(percentChange))}% compared to last month`;
      } else {
        this.spendingTrend = 'flat';
        this.spendingTrendText = 'Spending is stable compared to last month';
      }
    }
  }
  
  /**
   * Calculate savings rate based on income and expenses
   */
  calculateSavingsRate() {
    // Calculate income (incoming transactions) for the last month
    // Calculate expenses (outgoing transactions) for the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    this.monthlyIncome = 0;
    this.monthlyExpenses = 0;
    let savingsTransfers = 0;
    
    // Track deposits into savings or investment accounts
    const savingsAccountIds = this.accounts
      .filter(a => a.type.toLowerCase() === 'savings' || a.type.toLowerCase() === 'investment')
      .map(a => a.id);
    
    for (const transaction of this.transactions) {
      const transactionDate = new Date(transaction.createdAt);
      
      if (transactionDate >= lastMonth) {
        // Determine if this is income (money coming into a personal account from external source)
        const isIncome = (
          !transaction.toAccountId?.startsWith('ext-') && 
          !transaction.toAccountId?.startsWith('external') &&
          (transaction.fromAccountId.startsWith('ext-') || 
           transaction.fromAccountId.startsWith('external'))
        );
        
        // Determine if this is an expense (money going out from a personal account to external)
        const isExpense = (
          !transaction.fromAccountId.startsWith('ext-') && 
          !transaction.fromAccountId.startsWith('external') &&
          (transaction.toAccountId?.startsWith('ext-') || 
           transaction.toAccountId?.startsWith('external') || 
           !transaction.toAccountId)
        );
        
        if (isIncome) {
          this.monthlyIncome += transaction.amount;
        } else if (isExpense) {
          this.monthlyExpenses += transaction.amount;
        }
        
        // If this is a transfer to a savings account, count it as savings
        if (transaction.toAccountId && 
            savingsAccountIds.includes(transaction.toAccountId) &&
            !transaction.fromAccountId.startsWith('ext-') &&
            !transaction.fromAccountId.startsWith('external')) {
          savingsTransfers += transaction.amount;
        }
      }
    }
    
    // Calculate savings rate based on income and transfers to savings
    if (this.monthlyIncome > 0) {
      // Consider both direct savings and the gap between income and expenses
      const totalSavings = savingsTransfers + Math.max(0, this.monthlyIncome - this.monthlyExpenses);
      this.savingsRate = (totalSavings / this.monthlyIncome) * 100;
      
      // Ensure the rate is between 0 and 100%
      this.savingsRate = Math.min(Math.max(this.savingsRate, 0), 100);
      
      // For demo purposes, if the rate is 0, set a small value so we can see something
      if (this.savingsRate === 0) {
        this.savingsRate = 5;
      }
    } else {
      this.savingsRate = 0;
    }
  }
  
  /**
   * Generate financial health score
   */
  generateHealthScore() {
    // This is a simplified formula for health score
    // In a real application, this would be more sophisticated
    
    let score = 50; // Base score
    
    // Net worth factor (up to +/- 20 points)
    const netWorthScore = this.netWorth > 0 ? 
      Math.min(20, this.netWorth / (this.totalAssets * 0.5) * 20) : 
      Math.max(-20, this.netWorth / (this.totalAssets || 1) * 20);
    
    // Savings rate factor (up to +25 points)
    const savingsRateScore = Math.min(25, this.savingsRate / 4);
    
    // Spending trend factor (up to +/- 5 points)
    let spendingTrendScore = 0;
    if (this.spendingTrend === 'down') {
      spendingTrendScore = 5;
    } else if (this.spendingTrend === 'up') {
      spendingTrendScore = -5;
    }
    
    // Calculate final score
    this.healthScore = Math.round(
      score + netWorthScore + savingsRateScore + spendingTrendScore
    );
    
    // Ensure score is between 0 and 100
    this.healthScore = Math.min(Math.max(this.healthScore, 0), 100);
  }
  
  /**
   * Generate personalized recommendations based on financial data
   */
  generateRecommendations() {
    this.recommendations = [];
    
    // Net worth recommendations
    if (this.netWorth < 0) {
      this.recommendations.push("Focus on paying down debt to improve your net worth.");
    }
    
    // Savings rate recommendations
    if (this.savingsRate < 10) {
      this.recommendations.push("Try to save at least 10% of your income each month.");
    } else if (this.savingsRate < 20) {
      this.recommendations.push("Great job saving! Consider increasing to 20% for faster financial growth.");
    }
    
    // Spending trend recommendations
    if (this.spendingTrend === 'up') {
      this.recommendations.push("Your spending has increased recently. Review your expenses to identify areas to cut back.");
    }
    
    // Add recommendation if no savings accounts
    const savingsAccounts = this.accounts.filter(a => a.type.toLowerCase() === 'savings');
    if (savingsAccounts.length === 0) {
      this.recommendations.push("Consider opening a savings account for your emergency fund and goals.");
    }
    
    // Diversification recommendation
    if (this.accounts.length < 3) {
      this.recommendations.push("Diversify your accounts to better manage and organize your finances.");
    }
  }
  
  /**
   * Analyze expense categories from transactions
   */
  analyzeExpenseCategories() {
    // Map to store total spent by category
    const categoryMap = new Map<string, number>();
    
    // Get last month's transactions
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Filter for expense transactions in the last month
    for (const transaction of this.transactions) {
      if (transaction.direction == TransactionDirections.DEBIT && new Date(transaction.createdAt) >= lastMonth) {
        const category = transaction.category || 'Other';
        const amount = Math.abs(transaction.amount);
        
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category)! + amount);
        } else {
          categoryMap.set(category, amount);
        }
      }
    }
    
    console.debug('categoryMap', categoryMap.entries());
    // Calculate total expenses
    const totalExpenses = Array.from(categoryMap.values())
      .reduce((sum, amount) => sum + amount, 0);
    
    console.debug('totalExpenses', totalExpenses);
    // Generate category data for visualization with percentages based on total expenses
    this.expenseCategories = Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: this.getCategoryColor(index)
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    console.debug('expenseCategories', this.expenseCategories);
  }
  
  /**
   * Calculate the distribution of accounts by type
   */
  calculateAccountTypes() {
    // Initialize a map to hold balances by account type
    const accountBalances = new Map<string, number>();
    const accountTypeColorMap = new Map<string, string>();
    
    // Define colors for account types using direct hex values instead of CSS variables
    accountTypeColorMap.set('checking', '#3498db');  // Blue
    accountTypeColorMap.set('savings', '#2ecc71');   // Green
    accountTypeColorMap.set('investment', '#f39c12'); // Yellow/Orange
    accountTypeColorMap.set('credit', '#e74c3c');    // Red
    accountTypeColorMap.set('loan', '#9b59b6');      // Purple
    accountTypeColorMap.set('other', '#95a5a6');     // Gray

    // Calculate total balance (absolute values) by account type
    for (const account of this.accounts) {
      const type = account.type.toLowerCase();
      const absBalance = Math.abs(account.balance);
      
      if (accountBalances.has(type)) {
        accountBalances.set(type, accountBalances.get(type)! + absBalance);
      } else {
        accountBalances.set(type, absBalance);
      }
    }
    
    // Calculate total balance across all account types
    const totalBalance = Array.from(accountBalances.values())
      .reduce((sum, balance) => sum + balance, 0);

      console.debug('accountBalances', accountBalances.entries());
    
    // Generate account type data for visualization
    this.accountTypeData = Array.from(accountBalances.entries())
      .map(([type, balance]) => ({
        type,
        balance,
        color: accountTypeColorMap.get(type) || '#95a5a6', // Default to gray
        percentage: totalBalance > 0 ? (balance / totalBalance) * 100 : 0
      }))
      .sort((a, b) => b.balance - a.balance); // Sort by balance descending
    console.debug('accountTypeData', this.accountTypeData);
    
    // Generate legend items based on what account types are actually present
    this.accountTypeLegendItems = Array.from(accountBalances.keys()).map(type => ({
      type,
      color: accountTypeColorMap.get(type) || 'gray'
    }));
  }
  
  /**
   * Generate savings goals from accounts with goals
   */
  generateSavingsGoals() {
    // Get accounts with goals
    const accountsWithGoals = this.accounts.filter(account => 
      account.goal !== undefined && account.goal > 0
    );
    
    // Create savings goals from accounts with goals
    this.savingsGoals = accountsWithGoals.map(account => ({
      label: account.name,
      amount: account.balance > 0 ? account.balance : 0,
      target: account.goal!,
      percentage: Math.min((account.balance / account.goal!) * 100, 100)
    }));
    
    // If no accounts have goals, show some sample goals
    if (this.savingsGoals.length === 0) {
      this.savingsGoals = [
        { label: 'Emergency Fund', amount: 3000, target: 5000, percentage: 60 },
        { label: 'Vacation', amount: 1500, target: 2000, percentage: 75 },
        { label: 'New Car', amount: 8000, target: 15000, percentage: 53.33 }
      ];
    }
  }
  
  /**
   * Get color for expense category
   */
  getCategoryColor(index: number): string {
    const colors = [
      '#3498db', // Blue
      '#2ecc71', // Green
      '#f39c12', // Yellow/Orange
      '#e74c3c', // Red
      '#9b59b6'  // Purple
    ];
    return colors[index % colors.length];
  }
  
  /**
   * Format currency numbers
   */
  formatCurrency(value: number): string {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }
  
  /**
   * Get color for health score display
   */
  getHealthScoreColor(): string {
    if (this.healthScore >= 80) {
      return 'var(--accent-color, #2ecc71)';
    } else if (this.healthScore >= 60) {
      return 'var(--secondary-color, #f39c12)';
    } else {
      return 'var(--notification-badge-bg, #e74c3c)';
    }
  }
  
  /**
   * Open financial detail workflow
   */
  async openFinancialDetailWorkflow() {
    try {
      await workflowManager.startWorkflow(WorkflowIds.FINANCIAL_DETAILS, {
        netWorth: this.netWorth,
        totalAssets: this.totalAssets,
        totalLiabilities: this.totalLiabilities,
        savingsRate: this.savingsRate,
        monthlyIncome: this.monthlyIncome,
        monthlyExpenses: this.monthlyExpenses,
        recommendations: this.recommendations,
        currency: this.primaryCurrency
      });
    } catch (error) {
      console.error('Error opening financial details workflow:', error);
    }
  }
}
