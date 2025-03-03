/**
 * Timeout handler for widget loading states
 */
export class WidgetTimeoutHandler {
  private timeoutInterval: number | null = null;
  private startTime: number = 0;
  private warningTimeoutMs: number;
  private failureTimeoutMs: number;
  
  constructor(
    private widgetId: string,
    private onWarningTimeout: () => void,
    private onFailureTimeout: () => void,
    warningTimeoutMs = 5000, 
    failureTimeoutMs = 10000
  ) {
    this.warningTimeoutMs = warningTimeoutMs;
    this.failureTimeoutMs = failureTimeoutMs;
  }
  
  /**
   * Start tracking for slow loading widgets using interval
   */
  startTracking(): void {
    // Clear any existing interval
    this.clearTracking();

    // Record the start time
    this.startTime = Date.now();

    console.debug(`Started timeout tracking for widget ${this.widgetId}: warning=${this.warningTimeoutMs}ms, failure=${this.failureTimeoutMs}ms`);

    // Start an interval that checks elapsed time
    this.timeoutInterval = window.setInterval(() => {
      this.checkTimeouts();
    }, 500); // Check every 500ms
  }
  
  /**
   * Check if timeouts have been reached
   */
  private checkTimeouts(): void {
    const elapsedTime = Date.now() - this.startTime;

    // Check for failure timeout first (more severe)
    if (elapsedTime >= this.failureTimeoutMs) {
      console.debug(`Widget ${this.widgetId} failure timeout reached after ${elapsedTime}ms`);

      // Clear the interval since we're done monitoring
      this.clearTracking();
      
      // Trigger failure callback
      this.onFailureTimeout();
      
      return;
    }

    // Check for warning timeout
    if (elapsedTime >= this.warningTimeoutMs) {
      // Trigger warning callback
      this.onWarningTimeout();
      
      // Note: We don't clear tracking here, just trigger the warning
    }
  }
  
  /**
   * Clear timeout tracking
   */
  clearTracking(): void {
    if (this.timeoutInterval !== null) {
      window.clearInterval(this.timeoutInterval);
      this.timeoutInterval = null;
    }
  }
  
  /**
   * Update timeout values
   */
  updateTimeouts(warningTimeoutMs?: number, failureTimeoutMs?: number): void {
    let changed = false;
    
    if (warningTimeoutMs !== undefined && warningTimeoutMs !== this.warningTimeoutMs) {
      this.warningTimeoutMs = warningTimeoutMs;
      changed = true;
    }
    
    if (failureTimeoutMs !== undefined && failureTimeoutMs !== this.failureTimeoutMs) {
      this.failureTimeoutMs = failureTimeoutMs;
      changed = true;
    }
    
    // Restart tracking if values changed and we're actively tracking
    if (changed && this.timeoutInterval !== null) {
      this.startTracking();
    }
  }
  
  /**
   * Get elapsed time since tracking started
   */
  getElapsedTime(): string {
    return this.startTime ? `${Date.now() - this.startTime}ms` : 'unknown';
  }
}
