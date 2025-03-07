import { customElement, html, css, observable, attr, when } from "@microsoft/fast-element";
import { WorkflowBase } from "../workflow-base";
import { signingService, SigningMethod, SigningStatus, SigningRequest } from "../../services/signing-service";

const template = html<SigningWorkflow>/*html*/`
  <div class="signing-workflow">
    <div class="header">
      <div class="bankid-logo">
        <img src="/assets/bankid-logo.svg" alt="BankID" onerror="this.src='/assets/bankid.jpg'; this.onerror=null;">
      </div>
      <h2>Sign with BankID</h2>
    </div>
    
    ${when(x => !x.message && x.step === 'init', html<SigningWorkflow>/*html*/`
      <!-- Empty state with example buttons -->
      <div class="content empty-state">
        <div class="empty-state-icon">✍️</div>
        <h3>Electronic Signing</h3>
        <p>Use this workflow to sign documents or authorize transactions using Swedish BankID.</p>
        
        <div class="example-buttons">
          <h4>Examples</h4>
          <button class="example-button" @click="${x => x.startExampleTransaction()}">
            Sign Transaction
          </button>
          <button class="example-button" @click="${x => x.startExampleDocument()}">
            Sign Document
          </button>
        </div>
      </div>
    `)}
    
    ${when(x => x.message && x.step === 'init', html<SigningWorkflow>/*html*/`
      <div class="content init-step">
        <p class="message">${x => x.message}</p>
        
        ${when(x => x.documentName, html<SigningWorkflow>/*html*/`
          <div class="document-info">
            <div class="document-icon">📄</div>
            <div class="document-details">
              <div class="document-name">${x => x.documentName}</div>
              <div class="document-hash">${x => x.documentHash ? x.documentHash.substring(0, 16) + '...' : ''}</div>
            </div>
          </div>
        `)}
        
        <div class="action-buttons">
          <button class="action-button decline-button" @click="${x => x.handleDecline()}">Cancel</button>
          <button class="action-button confirm-button" @click="${x => x.handleInitiateSigning()}">Sign</button>
        </div>
      </div>
    `)}
    
    ${when(x => x.step === 'signing', html<SigningWorkflow>/*html*/`
      <div class="content signing-step">
        <div class="bankid-animation">
          <div class="spinner"></div>
          <div class="bankid-phone"></div>
        </div>
        
        <p class="instruction">Open the BankID app on your mobile device</p>
        <p class="sub-instruction">Enter your security code to sign</p>
        
        <div class="signing-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${x => x.progress}%"></div>
          </div>
          <div class="timeout-text">The signing request will expire in ${x => x.remainingTime}</div>
        </div>
        
        ${when(x => x.errorMessage, html<SigningWorkflow>/*html*/`
          <div class="error-message">${x => x.errorMessage}</div>
        `)}
        
        <div class="action-buttons">
          <button class="action-button cancel-button" @click="${x => x.handleCancel()}">Cancel</button>
          
          <!-- Demo controls - only for testing -->
          <div class="demo-controls">
            <button class="demo-button" @click="${x => x.simulateApproval()}">Simulate Approval</button>
            <button class="demo-button" @click="${x => x.simulateRejection()}">Simulate Rejection</button>
          </div>
        </div>
      </div>
    `)}
    
    ${when(x => x.step === 'completed', html<SigningWorkflow>/*html*/`
      <div class="content completed-step">
        <div class="result-icon ${x => x.signingResult?.success ? 'success' : 'error'}">
          ${x => x.signingResult?.success ? '✓' : '✗'}
        </div>
        
        <h3 class="result-title">${x => x.signingResult?.success ? 'Signing Complete' : 'Signing Failed'}</h3>
        <p class="result-message">${x => x.signingResult?.message}</p>
        
        <div class="action-buttons">
          <button class="action-button close-button" @click="${x => x.handleClose()}">Close</button>
        </div>
      </div>
    `)}
  </div>
`;

const styles = css`
  .signing-workflow {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .bankid-logo {
    width: 100px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  
  .bankid-logo img {
    max-width: 100%;
    max-height: 100%;
  }
  
  .header h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
  
  .content {
    display: flex;
    flex-direction: column;
    padding: 16px 0;
  }
  
  /* Empty state styles */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
  }
  
  .empty-state-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .empty-state h3 {
    font-size: 18px;
    margin: 0 0 12px 0;
  }
  
  .empty-state p {
    color: var(--text-secondary, #666);
    margin-bottom: 24px;
  }
  
  .example-buttons {
    width: 100%;
    max-width: 300px;
  }
  
  .example-buttons h4 {
    font-size: 14px;
    margin: 0 0 12px 0;
    color: var(--text-secondary, #666);
  }
  
  .example-button {
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 10px;
    background-color: var(--background-color, #f5f5f5);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .example-button:hover {
    background-color: var(--hover-bg, #e9e9e9);
  }
  
  .message {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .document-info {
    display: flex;
    align-items: center;
    background-color: var(--background-color, #f5f5f5);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .document-icon {
    font-size: 24px;
    margin-right: 16px;
  }
  
  .document-name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .document-hash {
    font-size: 12px;
    color: var(--text-secondary, #666);
    font-family: monospace;
  }
  
  .action-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  
  .action-button {
    padding: 10px 24px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .confirm-button, .close-button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
  }
  
  .confirm-button:hover, .close-button:hover {
    background-color: var(--primary-hover, #2980b9);
  }
  
  .decline-button, .cancel-button {
    background-color: transparent;
    border: 1px solid var(--border-color, #e0e0e0);
    color: var(--text-color, #333);
  }
  
  .decline-button:hover, .cancel-button:hover {
    background-color: var(--background-color, #f5f5f5);
  }
  
  /* BankID animation styles */
  .bankid-animation {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px 0;
    position: relative;
    height: 120px;
  }
  
  .spinner {
    width: 100px;
    height: 100px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--primary-color, #3498db);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    position: absolute;
  }
  
  .bankid-phone {
    position: absolute;
    width: 40px;
    height: 70px;
    border: 2px solid #333;
    border-radius: 8px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .bankid-phone::before {
    content: '';
    width: 30px;
    height: 50px;
    background-color: var(--primary-color-light, #a9d0f5);
    border-radius: 4px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .instruction {
    font-size: 18px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 8px;
  }
  
  .sub-instruction {
    font-size: 14px;
    color: var(--text-secondary, #666);
    text-align: center;
    margin-bottom: 24px;
  }
  
  .signing-progress {
    margin-top: 20px;
  }
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: var(--background-color, #f5f5f5);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: var(--primary-color, #3498db);
    transition: width 1s linear;
  }
  
  .timeout-text {
    font-size: 12px;
    color: var(--text-secondary, #666);
    text-align: center;
    margin-top: 8px;
  }
  
  .error-message {
    padding: 12px;
    margin: 16px 0;
    background-color: var(--error-bg, rgba(231, 76, 60, 0.1));
    border-left: 4px solid var(--error-color, #e74c3c);
    color: var(--error-color, #e74c3c);
    font-size: 14px;
  }
  
  /* Result step styles */
  .result-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 32px;
  }
  
  .result-icon.success {
    background-color: var(--success-bg, rgba(46, 204, 113, 0.2));
    color: var(--success-color, #2ecc71);
  }
  
  .result-icon.error {
    background-color: var(--error-bg, rgba(231, 76, 60, 0.2));
    color: var(--error-color, #e74c3c);
  }
  
  .result-title {
    font-size: 18px;
    text-align: center;
    margin: 0 0 12px 0;
  }
  
  .result-message {
    font-size: 14px;
    text-align: center;
    margin: 0 0 24px 0;
    color: var(--text-secondary, #666);
  }
  
  /* Demo controls */
  .demo-controls {
    display: flex;
    gap: 8px;
  }
  
  .demo-button {
    padding: 6px 12px;
    font-size: 12px;
    border: 1px dashed #999;
    background-color: #f8f8f8;
    color: #666;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .demo-button:hover {
    background-color: #eee;
  }
`;

// Workflow result interface
export interface SigningResult {
  success: boolean;
  message: string;
  signature?: string;
  documentHash?: string;
}

@customElement({
  name: "signing-workflow",
  template,
  styles
})
export class SigningWorkflow extends WorkflowBase {
  @attr({ mode: "boolean" }) autoFocus: boolean = true;
  
  // Workflow parameters
  @observable message: string = "";
  @observable documentName: string = "";
  @observable documentHash: string = "";
  
  // UI state
  @observable step: 'init' | 'signing' | 'completed' = 'init';
  @observable errorMessage: string = "";
  @observable progress: number = 100;
  @observable remainingTime: string = "5:00";
  @observable signingResult: SigningResult | null = null;
  
  // Signing state
  private signingRequest: SigningRequest | null = null;
  private stopPollingCallback: (() => void) | null = null;
  private countdownInterval: number | null = null;
  private expiryTime: Date | null = null;
  
  initialize(params?: Record<string, any>): void {
    // Set initial title and hide footer (we'll use our own buttons)
    this.updateTitle("Sign with BankID");
    this.updateFooter(false);
    
    // Initialize from parameters
    if (params) {
      if (params.message) this.message = params.message;
      if (params.documentName) this.documentName = params.documentName;
      if (params.documentHash) this.documentHash = params.documentHash;
    }
    
    // Notify the host that form validation is valid (since we use our own buttons)
    this.notifyValidation(true);
  }
  
  /**
   * Start an example transaction signing
   */
  startExampleTransaction(): void {
    this.message = "Please confirm the transfer of 500 SEK to John Doe (Account: SE4550000000058398257466)";
    this.documentName = "";
    this.documentHash = "";
  }
  
  /**
   * Start an example document signing
   */
  startExampleDocument(): void {
    this.message = "Please sign the following document:";
    this.documentName = "Loan Agreement.pdf";
    this.documentHash = "SHA256:f4b3c7d8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8";
  }
  
  /**
   * Clean up any resources when the workflow disconnects
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanupResources();
  }
  
  /**
   * Clean up timers and polling
   */
  private cleanupResources(): void {
    // Stop polling for status updates
    if (this.stopPollingCallback) {
      this.stopPollingCallback();
      this.stopPollingCallback = null;
    }
    
    // Clear countdown timer
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
  
  /**
   * Handle the "Sign" button click - initiate signing process
   */
  handleInitiateSigning(): void {
    // Initiate the signing process
    this.signingRequest = signingService.initiateSigning(
      this.message, 
      this.documentHash
    );
    
    // Update UI
    this.step = 'signing';
    this.errorMessage = "";
    this.progress = 100;
    
    // Start expiry countdown
    this.expiryTime = this.signingRequest.expiresAt;
    this.updateRemainingTime();
    this.startCountdown();
    
    // Start polling for status updates
    this.stopPollingCallback = signingService.pollSigningStatus(
      this.signingRequest.id,
      (request) => this.handleSigningStatusUpdate(request)
    );
  }
  
  /**
   * Handle status updates from the signing service
   */
  private handleSigningStatusUpdate(request: SigningRequest): void {
    // Update UI based on status
    switch (request.status) {
      case SigningStatus.APPROVED:
        this.signingResult = {
          success: true,
          message: "The document was successfully signed",
          signature: request.signature,
          documentHash: request.documentHash
        };
        this.step = 'completed';
        this.cleanupResources();
        break;
        
      case SigningStatus.REJECTED:
        this.signingResult = {
          success: false,
          message: "The signing request was rejected"
        };
        this.step = 'completed';
        this.cleanupResources();
        break;
        
      case SigningStatus.EXPIRED:
        this.signingResult = {
          success: false,
          message: "The signing request expired"
        };
        this.step = 'completed';
        this.cleanupResources();
        break;
        
      case SigningStatus.CANCELLED:
        this.signingResult = {
          success: false,
          message: "The signing request was cancelled"
        };
        this.step = 'completed';
        this.cleanupResources();
        break;
    }
  }
  
  /**
   * Start the countdown timer for request expiry
   */
  private startCountdown(): void {
    // Clear any existing interval
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
    }
    
    // Update every second
    this.countdownInterval = window.setInterval(() => {
      const expired = this.updateRemainingTime();
      if (expired && this.signingRequest) {
        // Handle expiration
        signingService.cancelSigningRequest(this.signingRequest.id);
        this.errorMessage = "The signing request has expired.";
        this.cleanupResources();
      }
    }, 1000);
  }
  
  /**
   * Update the countdown display
   * @returns True if the request has expired
   */
  private updateRemainingTime(): boolean {
    if (!this.expiryTime) return false;
    
    const now = new Date();
    const difference = this.expiryTime.getTime() - now.getTime();
    
    if (difference <= 0) {
      this.remainingTime = "0:00";
      this.progress = 0;
      return true;
    }
    
    // Calculate minutes and seconds remaining
    const minutes = Math.floor(difference / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);
    this.remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate progress as percentage of time remaining
    // Assuming the initial timeout was 5 minutes
    this.progress = Math.min(100, Math.max(0, difference / (5 * 60000) * 100));
    
    return false;
  }
  
  /**
   * Handle the decline button click in the init step
   */
  handleDecline(): void {
    this.cancel("Signing cancelled by user");
  }
  
  /**
   * Handle the cancel button click in the signing step
   */
  handleCancel(): void {
    if (this.signingRequest) {
      signingService.cancelSigningRequest(this.signingRequest.id);
    }
    this.cancel("Signing cancelled by user");
  }
  
  /**
   * Handle the close button click in the completed step
   */
  handleClose(): void {
    if (this.signingResult) {
      this.complete(
        this.signingResult.success, 
        {
          signature: this.signingResult.signature,
          documentHash: this.signingResult.documentHash
        }, 
        this.signingResult.message
      );
    } else {
      this.cancel("Signing process was closed");
    }
  }
  
  /**
   * Demo function to simulate approval (for testing only)
   */
  simulateApproval(): void {
    if (this.signingRequest) {
      signingService.simulateApproval(this.signingRequest.id);
    }
  }
  
  /**
   * Demo function to simulate rejection (for testing only)
   */
  simulateRejection(): void {
    if (this.signingRequest) {
      signingService.simulateRejection(this.signingRequest.id);
    }
  }
  
  /**
   * Handle primary action from modal footer
   * (not used since we hide the footer)
   */
  public handlePrimaryAction(): void {
    // Not used
  }
}
