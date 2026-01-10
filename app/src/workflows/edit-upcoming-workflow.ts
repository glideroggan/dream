import { css, customElement, html, observable, ref, when } from '@microsoft/fast-element'
import { WorkflowBase, WorkflowResult } from './workflow-base'
import { TransactionStatuses, UpcomingTransaction } from '../repositories/models/transaction-models'
import { repositoryService } from '../services/repository-service';
import { transactionService } from '../services/transaction-service';
import "@primitives/input";

const template = html<EditUpcomingWorkflow>/*html*/`
  <div class="edit-upcoming-workflow">
    <div class="transaction-form">
    ${when(x => x.isLoading, html<EditUpcomingWorkflow>/*html*/`
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Loading transaction details...</p>
        </div>
      `,html<EditUpcomingWorkflow>/*html*/`
        <form ${ref('form')} @submit="${(x, c) => x.handleSubmit(c.event)}">
          <div class="form-group">
            <dream-input
              type="text"
              label="Description"
              :value="${x => x.transaction.description || ''}"
              @input="${(x, c) => x.handleDescriptionChange(c.event)}"
              required
              ?disabled="${x => !x.transaction.canBeEdited}"
              ?error="${x => !!x.validationErrors.description}"
              error-message="${x => x.validationErrors.description || ''}"
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <dream-input
              type="date"
              label="Scheduled Date"
              :value="${x => x.formatDateForInput(x.transaction.scheduledDate)}"
              @input="${(x, c) => x.handleDateChange(c.event)}"
              required
              ?disabled="${x => !x.transaction.canBeEdited}"
              ?error="${x => !!x.validationErrors.scheduledDate}"
              error-message="${x => x.validationErrors.scheduledDate || ''}"
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <dream-input
              type="number"
              label="Amount"
              :value="${x => String(x.transaction.amount)}"
              @input="${(x, c) => x.handleAmountChange(c.event)}"
              required
              ?disabled="${x => !x.transaction.canBeEdited}"
              ?error="${x => !!x.validationErrors.amount}"
              error-message="${x => x.validationErrors.amount || ''}"
              full-width
            >
              <span slot="prefix">${x => x.transaction.currency}</span>
            </dream-input>
          </div>

          <div class="form-group">
            <dream-input
              type="text"
              label="Status"
              :value="${x => x.getStatusLabel(x.transaction.status)}"
              readonly
              full-width
            ></dream-input>
          </div>

          <div class="form-group">
            <dream-input
              type="text"
              label="Reference (Optional)"
              :value="${x => x.transaction.reference || ''}"
              @input="${(x, c) => x.handleReferenceChange(c.event)}"
              ?disabled="${x => !x.transaction.canBeEdited}"
              full-width
            ></dream-input>
          </div>

          ${when(x => x.errorMessage, html<EditUpcomingWorkflow>/*html*/`
            <div class="form-error-message">
              <span>${x => x.errorMessage}</span>
            </div>
          `)}
        </form>
      `)}
    </div>
  </div>
`;

const styles = css`
  .edit-upcoming-workflow {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 0;
    max-width: 500px;
    width: 100%;
  }
  
  .transaction-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 12px;
  }
  
  .spinner {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--accent-color);
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .form-error-message {
    background-color: rgba(231, 76, 60, 0.1);
    border-left: 4px solid var(--error-color);
    color: var(--error-color);
    padding: 12px;
    margin-top: 16px;
    border-radius: 4px;
    font-size: 14px;
  }
  
  @media (prefers-color-scheme: dark) {
    .spinner {
      border-color: rgba(255, 255, 255, 0.1);
      border-top-color: var(--accent-color);
    }
  }
`;

@customElement({
  name: 'edit-upcoming-workflow',
  template,
  styles,
})
class EditUpcomingWorkflow extends WorkflowBase {
  @observable transaction: UpcomingTransaction
  @observable isLoading: boolean = true
  @observable validationErrors: Record<string, string> = {}
  @observable errorMessage: string = ''
  @observable form: HTMLFormElement
  @observable transactionId: string = ''

  async initialize(params?: Record<string, any>): Promise<void> {
    console.debug("Initializing EditUpcomingWorkflow with params:", params);
    
    this.setModalWidth("500px");
    this.updateTitle("Edit Upcoming Transaction");
    this.updateFooter(true, "Save Changes");
    
    // Validate parameters
    if (!params?.transactionId) {
    this.errorMessage = "No transaction ID provided";
    this.isLoading = false;
    this.notifyValidation(false, "Missing transaction ID");
    return;
    }
    
    this.transactionId = params.transactionId;
    
    try {
    // Load transaction data
    const upcomingRepo = repositoryService.getUpcomingTransactionRepository();
    const transaction = await upcomingRepo.getById(this.transactionId) as UpcomingTransaction;
    
    if (!transaction) {
        throw new Error("Transaction not found");
    }
    
    // Initialize the transaction object
    this.transaction = { ...transaction };
    
    // Initial validation
    this.validateForm();
    
    if (!transaction.canBeEdited) {
        this.notifyValidation(false, "Transaction cannot be edited");
    }
    
    } catch (error) {
    console.error("Error loading transaction:", error);
    this.errorMessage = "Failed to load transaction details";
    this.notifyValidation(false, "Failed to load transaction");
    } finally {
    this.isLoading = false;
    }
}
    
    connectedCallback(): void {
      super.connectedCallback?.();
      console.debug("EditUpcomingWorkflow connected to DOM");
    }
    
    // Format date from ISO string to YYYY-MM-DD for input elements
    formatDateForInput(dateString: string): string {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    }
    
    handleDescriptionChange(event: Event): void {
      const customEvent = event as CustomEvent;
      this.transaction.description = customEvent.detail?.value ?? (event.target as HTMLInputElement).value;
      delete this.validationErrors.description;
      this.validateForm();
    }
    
    handleDateChange(event: Event): void {
      const customEvent = event as CustomEvent;
      this.transaction.scheduledDate = customEvent.detail?.value ?? (event.target as HTMLInputElement).value;
      delete this.validationErrors.scheduledDate;
      this.validateForm();
    }
    
    handleAmountChange(event: Event): void {
      const customEvent = event as CustomEvent;
      const value = customEvent.detail?.value ?? (event.target as HTMLInputElement).value;
      const amount = parseFloat(value);
      
      if (!isNaN(amount)) {
        this.transaction.amount = amount;
        delete this.validationErrors.amount;
      } else {
        this.validationErrors.amount = "Please enter a valid amount";
      }
      
      this.validateForm();
    }
    
    handleStatusChange(event: Event): void {
      // This method can be removed since status is no longer editable
      // But keeping it for compatibility with existing code
      console.debug("Status editing disabled");
    }
    
    handleReferenceChange(event: Event): void {
      const customEvent = event as CustomEvent;
      this.transaction.reference = customEvent.detail?.value ?? (event.target as HTMLInputElement).value;
      this.validateForm();
    }
    
    handleSubmit(event:Event): void {
      // Prevent actual form submission
      event.preventDefault();
      
      if (this.validateForm()) {
        this.saveTransaction();
      }
    }
    
    validateForm(): boolean {
      this.validationErrors = {};
      let isValid = true;
      
      // Description validation
      if (!this.transaction?.description) {
        this.validationErrors.description = "Description is required";
        isValid = false;
      }
      
      // Date validation
      if (!this.transaction?.scheduledDate) {
        this.validationErrors.scheduledDate = "Scheduled date is required";
        isValid = false;
      }
      
      // Amount validation
      if (!this.transaction?.amount || this.transaction.amount <= 0) {
        this.validationErrors.amount = "Amount must be greater than zero";
        isValid = false;
      }
      
      // Status validation not needed anymore
      
      this.notifyValidation(isValid && this.transaction.canBeEdited);
      return isValid;
    }
    
    async saveTransaction(): Promise<void> {
      try {
        const transactionRepo = repositoryService.getTransactionRepository();
        await transactionRepo.update(this.transaction.id, this.transaction);
        
        // Complete the workflow
        this.complete(true, {
          transactionId: this.transaction.id,
          updated: true
        }, "Transaction updated successfully");
        
      } catch (error) {
        console.error("Failed to update transaction:", error);
        this.errorMessage = "Failed to save changes. Please try again.";
        this.notifyValidation(true); // Keep button enabled to try again
      }
    }
    
    public handlePrimaryAction(): void {
      if (this.validateForm()) {
        this.saveTransaction();
      }
    }
    
    /**
     * Handle resuming after a nested workflow completes
     */
    public resume(result?: WorkflowResult): void {
      console.debug("Edit upcoming workflow resumed after nested workflow", result);
      
      // Restore the original UI state
      this.updateTitle("Edit Upcoming Transaction");
      
      if (result?.success) {
        // Handle successful completion of the nested workflow
        console.debug("Nested workflow completed successfully:", result);
      } else {
        console.debug("Nested workflow was cancelled or failed");
      }
    }
    
    getStatusLabel(status: string): string {
      switch(status) {
        case TransactionStatuses.UPCOMING:
          return "Upcoming";
        case TransactionStatuses.PENDING:
          return "Pending";
        case TransactionStatuses.CANCELLED:
          return "Cancelled";
        default:
          return status;
      }
    }
}
