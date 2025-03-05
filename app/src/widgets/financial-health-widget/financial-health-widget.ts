import { FASTElement, customElement, html, css, observable, when } from "@microsoft/fast-element";
import { repositoryService } from "../../services/repository-service";
import { workflowManager } from "../../services/workflow-manager-service";
import { WorkflowIds } from "../../workflows/workflow-registry";
import { Account } from "../../repositories/account-repository";
import { Transaction } from "../../repositories/transaction-repository";

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


const template = html<FinancialHealthWidget>/*html*/ `
  <div class="financial-health-widget">
    <div class="widget-header">
      <h3>Financial Health</h3>
      <div class="health-score">
        <div class="score-pill" style="background-color: ${x => x.getHealthScoreColor()}">
          ${x => x.healthScore}/100
        </div>
      </div>
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
        <button class="retry-button" @click="${x => x.fetchFinancialData()}">Retry</button>
      </div>
    `)}
    
    ${when(x => !x.loading && !x.error, html<FinancialHealthWidget>/*html*/`
      <div class="health-content">
        <div class="section net-worth-section">
          <h4>Net Worth Summary</h4>
          <div class="net-worth-value" style="color: ${x => x.netWorth >= 0 ? 'var(--success-color, #2ecc71)' : 'var(--error-color, #e74c3c)'}">
            ${x => x.formatCurrency(x.netWorth)} ${x => x.primaryCurrency}
          </div>
          <div class="net-worth-details">
            <div class="detail-item">
              <span class="detail-label">Assets:</span>
              <span class="detail-value positive">${x => x.formatCurrency(x.totalAssets)} ${x => x.primaryCurrency}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Liabilities:</span>
              <span class="detail-value negative">${x => x.formatCurrency(x.totalLiabilities)} ${x => x.primaryCurrency}</span>
            </div>
          </div>
          
          <!-- Use the simplified net-worth-component -->
          <net-worth-component 
            totalAssets="${x => x.totalAssets}"
            totalLiabilities="${x => x.totalLiabilities}"
            :accountTypeData="${x => x.accountTypeData}"
            ?showChart="${x => x.accountTypeData.length > 1}">
          </net-worth-component>
        </div>
        
        <div class="section">
          <h4>Monthly Spending</h4>
          <monthly-spending-chart 
            :dataPoints="${x => x.monthlySpendingDataPoints}"
            trend="${x => x.spendingTrend}"
            trendMessage="${x => x.spendingTrendText}">
          </monthly-spending-chart>
          
          <h5>Top Expense Categories</h5>
          <expense-categories-chart :categories="${x => x.expenseCategories}"></expense-categories-chart>
        </div>
        
        <div class="section">
          <h4>Savings Rate</h4>
          <savings-rate-component 
            rate="${x => x.savingsRate}" 
            :goals="${x => x.savingsGoals}">
          </savings-rate-component>
        </div>
        
        <recommendations-component :recommendations="${x => x.recommendations}"></recommendations-component>
      </div>
      
      <div class="widget-footer">
        <button class="primary-button" @click="${x => x.openFinancialDetailWorkflow()}">View Financial Details</button>
      </div>
    `)}
  </div>
`;

const styles = css`
  .financial-health-widget {
    background: var(--background-color, #ffffff);
    color: var(--text-color, #333333);
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .widget-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--divider-color, #eaeaea);
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
  }
  
  h4, h5 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: var(--secondary-text, #555);
  }
  
  h5 {
    margin: 16px 0 8px 0;
    font-size: 14px;
  }
  
  .health-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .section {
    padding: 16px;
    background-color: var(--background-light, #f9f9f9);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  /* Loading and Error States */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    flex: 1;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #3498db);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    flex: 1;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    text-align: center;
    margin-bottom: 16px;
  }
  
  .retry-button {
    background-color: var(--error-color, #e74c3c);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .retry-button:hover {
    background-color: #c0392b;
  }
  
  /* Widget Footer */
  .widget-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--divider-color, #eaeaea);
    text-align: right;
  }
  
  .primary-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .primary-button:hover {
    background-color: var(--primary-color-hover, #2980b9);
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
    
    // For simplicity, we'll consider accounts with positive balances as assets
    // and accounts with negative balances as liabilities
    for (const account of this.accounts) {
      if (account.balance >= 0) {
        this.totalAssets += account.balance;
      } else {
        this.totalLiabilities -= account.balance; // Convert to positive number for display
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
    
    // Define essential categories
    const essentialCategories = ['Rent', 'Mortgage', 'Utilities', 'Groceries', 'Insurance', 'Medical', 'Transportation'];
    
    // Initialize with zero values for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      spendingByMonth.set(monthKey, { essential: 0, discretionary: 0 });
    }
    
    // Calculate spending (only outgoing transactions)
    for (const transaction of this.transactions) {
      if (transaction.amount < 0) { // Outgoing transaction
        const date = new Date(transaction.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (spendingByMonth.has(monthKey)) {
          const spendingData = spendingByMonth.get(monthKey)!;
          const amount = Math.abs(transaction.amount);
          
          // Categorize as essential or discretionary
          if (transaction.category && essentialCategories.includes(transaction.category)) {
            spendingData.essential += amount;
          } else {
            spendingData.discretionary += amount;
          }
          
          spendingByMonth.set(monthKey, spendingData);
        }
      }
    }
    
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
        // Count all income
        if (transaction.amount > 0) {
          this.monthlyIncome += transaction.amount;
        } else {
          this.monthlyExpenses += Math.abs(transaction.amount);
          
          // If this is a transfer to a savings account, count it as savings
          if (transaction.toAccountId && savingsAccountIds.includes(transaction.toAccountId)) {
            savingsTransfers += Math.abs(transaction.amount);
          }
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
      if (transaction.amount < 0 && new Date(transaction.createdAt) >= lastMonth) {
        const category = transaction.category || 'Other';
        const amount = Math.abs(transaction.amount);
        
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category)! + amount);
        } else {
          categoryMap.set(category, amount);
        }
      }
    }
    
    // Calculate total expenses
    const totalExpenses = Array.from(categoryMap.values())
      .reduce((sum, amount) => sum + amount, 0);
    
    // Generate category data for visualization with percentages based on total expenses
    this.expenseCategories = Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: this.getCategoryColor(index)
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
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

      console.log('accountBalances', accountBalances.entries());
    
    // Generate account type data for visualization
    this.accountTypeData = Array.from(accountBalances.entries())
      .map(([type, balance]) => ({
        type,
        balance,
        color: accountTypeColorMap.get(type) || '#95a5a6', // Default to gray
        percentage: totalBalance > 0 ? (balance / totalBalance) * 100 : 0
      }))
      .sort((a, b) => b.balance - a.balance); // Sort by balance descending
    console.log('accountTypeData', this.accountTypeData);
    
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
      return 'var(--success-color, #2ecc71)';
    } else if (this.healthScore >= 60) {
      return 'var(--warning-color, #f39c12)';
    } else {
      return 'var(--error-color, #e74c3c)';
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
