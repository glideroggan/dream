/**
 * A service that handles cryptographic signing operations.
 * Currently contains stub implementations for simulation purposes.
 * Will need to be replaced with actual cryptographic implementations later.
 */

export enum SigningMethod {
  BANK_ID = 'bankid',
  DOKOBIT = 'dokobit',
  SMART_ID = 'smartid'
}

export enum SigningStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface SigningRequest {
  id: string;
  method: SigningMethod;
  createdAt: Date;
  expiresAt: Date;
  status: SigningStatus;
  message: string;
  documentHash?: string;
  signature?: string;
}

class SigningService {
  private activeRequests: Map<string, SigningRequest> = new Map();
  private mockPollingIntervals: Map<string, number> = new Map();

  /**
   * Initialize a new signing request
   * @param message The message to sign
   * @param documentHash Optional hash of a document to sign
   * @param method The signing method to use
   * @returns The created signing request
   */
  public initiateSigning(
    message: string, 
    documentHash?: string, 
    method: SigningMethod = SigningMethod.BANK_ID
  ): SigningRequest {
    // Generate a random ID for the request
    const id = Math.random().toString(36).substring(2, 15);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000); // Expires in 5 minutes
    
    const request: SigningRequest = {
      id,
      method,
      createdAt: now,
      expiresAt,
      status: SigningStatus.PENDING,
      message,
      documentHash
    };
    
    this.activeRequests.set(id, request);
    return request;
  }
  
  /**
   * Poll for status updates of a signing request
   * @param requestId The ID of the request to poll
   * @param onStatusChange Callback when the status changes
   * @returns A function to stop polling
   */
  public pollSigningStatus(
    requestId: string, 
    onStatusChange: (request: SigningRequest) => void
  ): () => void {
    // If there's already a polling interval for this request, clear it
    if (this.mockPollingIntervals.has(requestId)) {
      clearInterval(this.mockPollingIntervals.get(requestId));
    }
    
    // Create a new polling interval
    const intervalId = window.setInterval(() => {
      const request = this.activeRequests.get(requestId);
      if (!request) {
        clearInterval(intervalId);
        return;
      }
      
      // Call the callback with the current request
      onStatusChange(request);
      
      // If the request is no longer pending, stop polling
      if (request.status !== SigningStatus.PENDING) {
        clearInterval(intervalId);
        this.mockPollingIntervals.delete(requestId);
      }
    }, 1000); // Poll every second
    
    this.mockPollingIntervals.set(requestId, intervalId);
    
    // Return a function to stop polling
    return () => {
      clearInterval(intervalId);
      this.mockPollingIntervals.delete(requestId);
    };
  }
  
  /**
   * Simulate approval of a signing request (for demo purposes)
   * @param requestId The ID of the request to approve
   */
  public simulateApproval(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;
    
    // Generate a mock signature
    const mockSignature = `SIG_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    
    // Update the request with the signature and approved status
    request.status = SigningStatus.APPROVED;
    request.signature = mockSignature;
    this.activeRequests.set(requestId, request);
  }
  
  /**
   * Simulate rejection of a signing request (for demo purposes)
   * @param requestId The ID of the request to reject
   */
  public simulateRejection(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;
    
    request.status = SigningStatus.REJECTED;
    this.activeRequests.set(requestId, request);
  }
  
  /**
   * Cancel a signing request
   * @param requestId The ID of the request to cancel
   */
  public cancelSigningRequest(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;
    
    request.status = SigningStatus.CANCELLED;
    this.activeRequests.set(requestId, request);
  }
  
  /**
   * Verify a signature (stub implementation)
   * @param signature The signature to verify
   * @param message The message that was signed
   * @param documentHash Optional document hash that was signed
   * @returns True if the signature is valid
   */
  public verifySignature(signature: string, message: string, documentHash?: string): boolean {
    // This is a stub implementation that always returns true
    // In a real implementation, this would verify the signature cryptographically
    return true;
  }
}

// Export a singleton instance
export const signingService = new SigningService();
