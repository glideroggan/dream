import { Account } from "../repositories/models/account-models";

export interface AccountInsight {
  type: string;
  label: string;
  value: string;
  colorClass?: string;
  icon?: string;
}

export class AccountInsightsHelper {
  /**
   * Generate relevant insights based on account type and data
   */
  public static getAccountInsights(account: Account): AccountInsight[] {
    const insights: AccountInsight[] = [];
    
    switch(account.type.toLowerCase()) {
      case 'credit':
        this.addCreditCardInsights(account, insights);
        break;
      case 'savings':
        this.addSavingsInsights(account, insights);
        break;
      case 'checking':
      case 'current':
        this.addCheckingInsights(account, insights);
        break;
      case 'loan':
      case 'mortgage':
        this.addLoanInsights(account, insights);
        break;
      case 'investment':
      case 'isk':
        this.addInvestmentInsights(account, insights);
        break;
    }
    
    return insights;
  }
  
  private static addCreditCardInsights(account: Account, insights: AccountInsight[]): void {
    // Credit utilization - using either creditLimit directly or availableCredit + balance
    const creditLimit = account.creditLimit || 
                       (account.availableCredit ? account.balance + account.availableCredit : null);
    
    if (creditLimit) {
      const utilization = (account.balance / creditLimit) * 100;
      const utilizationFormatted = utilization.toFixed(0) + '%';
      
      let colorClass = 'neutral';
      if (utilization > 80) colorClass = 'danger';
      else if (utilization > 50) colorClass = 'warning';
      else if (utilization < 30) colorClass = 'success';
      
      insights.push({
        type: 'utilization',
        label: 'Used',
        value: utilizationFormatted,
        colorClass
      });
      
      // Available credit
      const available = account.availableCredit || creditLimit - account.balance;
      insights.push({
        type: 'available',
        label: 'Available',
        value: available.toFixed(0),
        colorClass: 'neutral'
      });
    }
    
    // Payment due
    if (account.paymentDueDate) {
      const dueDate = new Date(account.paymentDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let dueDateText = '';
      let colorClass = 'neutral';
      
      if (daysUntilDue < 0) {
        dueDateText = 'Overdue';
        colorClass = 'danger';
      } else if (daysUntilDue === 0) {
        dueDateText = 'Due today';
        colorClass = 'warning';
      } else if (daysUntilDue <= 5) {
        dueDateText = `Due in ${daysUntilDue}d`;
        colorClass = 'warning';
      } else {
        dueDateText = `Due in ${daysUntilDue}d`;
      }
      
      const minimumPayment = account.minimumPaymentDue 
        ? `$${account.minimumPaymentDue}` 
        : 'Payment';
      
      insights.push({
        type: 'due-date',
        label: minimumPayment,
        value: dueDateText,
        colorClass,
        icon: '🗓️'
      });
    }
  }
  
  private static addSavingsInsights(account: Account, insights: AccountInsight[]): void {
    // Interest rate
    if (account.interestRate) {
      insights.push({
        type: 'interest',
        label: 'APY',
        value: account.interestRate.toFixed(2) + '%',
        colorClass: 'success',
        icon: '📈'
      });
    }
    
    // Goal progress - use either savingsGoal or goal property
    const goalAmount = account.savingsGoal || account.goal;
    if (goalAmount) {
      const progress = (account.balance / goalAmount) * 100;
      insights.push({
        type: 'goal',
        label: 'Goal',
        value: progress.toFixed(0) + '%',
        colorClass: progress >= 100 ? 'success' : 'neutral'
      });
      
      // If there's a target date, show time remaining
      if (account.targetDate) {
        const targetDate = new Date(account.targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0) {
          let timeRemaining = '';
          let colorClass = 'neutral';
          
          if (daysRemaining > 365) {
            timeRemaining = `${Math.floor(daysRemaining / 365)}y left`;
          } else if (daysRemaining > 30) {
            timeRemaining = `${Math.floor(daysRemaining / 30)}m left`;
          } else {
            timeRemaining = `${daysRemaining}d left`;
            if (daysRemaining < 7) {
              colorClass = progress >= 90 ? 'success' : 'warning';
            }
          }
          
          insights.push({
            type: 'target-date',
            label: 'Target',
            value: timeRemaining,
            colorClass
          });
        }
      }
    }
  }
  
  private static addCheckingInsights(account: Account, insights: AccountInsight[]): void {
    // Show average balance if available
    if (account.averageBalance) {
      const difference = account.balance - account.averageBalance;
      const percentChange = (difference / account.averageBalance) * 100;
      
      let colorClass = 'neutral';
      if (percentChange > 10) colorClass = 'success';
      else if (percentChange < -10) colorClass = 'warning';
      
      insights.push({
        type: 'avg-balance',
        label: 'vs Avg',
        value: percentChange > 0 ? `+${percentChange.toFixed(0)}%` : `${percentChange.toFixed(0)}%`,
        colorClass
      });
    }
    
    // Overdraft protection
    if (account.hasOverdraftProtection) {
      insights.push({
        type: 'overdraft',
        label: 'Protected',
        value: '✓',
        colorClass: 'success'
      });
    }
  }
  
  private static addLoanInsights(account: Account, insights: AccountInsight[]): void {
    // Next payment
    if (account.nextPaymentAmount && account.nextPaymentDueDate) {
      const dueDate = new Date(account.nextPaymentDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let dueDateText = '';
      let colorClass = 'neutral';
      
      if (daysUntilDue < 0) {
        dueDateText = 'Overdue';
        colorClass = 'danger';
      } else if (daysUntilDue <= 7) {
        dueDateText = `${daysUntilDue}d left`;
        colorClass = daysUntilDue <= 2 ? 'warning' : 'neutral';
      } else {
        dueDateText = `${daysUntilDue}d left`;
      }
      
      insights.push({
        type: 'payment',
        label: `$${account.nextPaymentAmount.toFixed(0)}`,
        value: dueDateText,
        colorClass
      });
    }
    
    // Loan progress / remaining balance
    if (account.originalLoanAmount) {
      const remainingPercent = Math.abs(account.balance / account.originalLoanAmount) * 100;
      const paidPercent = 100 - remainingPercent;
      insights.push({
        type: 'remaining',
        label: 'Paid',
        value: paidPercent.toFixed(0) + '%',
        colorClass: paidPercent > 50 ? 'success' : 'neutral'
      });
      
      // Interest rate if available
      if (account.interestRateLoan) {
        insights.push({
          type: 'interest',
          label: 'Rate',
          value: account.interestRateLoan.toFixed(2) + '%',
          colorClass: 'neutral'
        });
      }
    }
  }
  
  private static addInvestmentInsights(account: Account, insights: AccountInsight[]): void {
    // Performance
    if (account.performanceYTD !== undefined) {
      let colorClass = 'neutral';
      if (account.performanceYTD > 5) colorClass = 'success';
      else if (account.performanceYTD < 0) colorClass = 'danger';
      
      insights.push({
        type: 'performance',
        label: 'YTD',
        value: (account.performanceYTD >= 0 ? '+' : '') + account.performanceYTD.toFixed(2) + '%',
        colorClass,
        icon: account.performanceYTD >= 0 ? '📈' : '📉'
      });
    }
    
    // Last updated
    if (account.lastUpdated) {
      const lastUpdate = new Date(account.lastUpdated);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      
      let updateText = '';
      if (daysDiff === 0) {
        updateText = 'Today';
      } else if (daysDiff === 1) {
        updateText = 'Yesterday';
      } else {
        updateText = `${daysDiff}d ago`;
      }
      
      insights.push({
        type: 'updated',
        label: 'Updated',
        value: updateText,
        colorClass: 'neutral'
      });
    }
  }
}
