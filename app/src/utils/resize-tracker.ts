/**
 * Utility class to track widget resize state and user preferences
 */
export class WidgetResizeTracker {
  private initialRowSpan: number;
  private currentRowSpan: number;
  private maxAutoRowSpan: number;
  private userSetRowSpan: number | null = null;
  private isUserResized: boolean = false;
  
  constructor(initialRowSpan: number = 2) {
    this.initialRowSpan = initialRowSpan;
    this.currentRowSpan = initialRowSpan;
    this.maxAutoRowSpan = initialRowSpan;
  }
  
  /**
   * Records when a user manually resizes the widget
   */
  public recordUserResize(newRowSpan: number): void {
    this.userSetRowSpan = newRowSpan;
    this.currentRowSpan = newRowSpan;
    this.isUserResized = true;
  }
  
  /**
   * Determines appropriate row span when content expands
   */
  public getExpandedRowSpan(requestedRowSpan: number): number {
    // If user has manually set a size, respect that as the maximum
    if (this.isUserResized && this.userSetRowSpan !== null) {
      return Math.min(requestedRowSpan, this.userSetRowSpan);
    }
    
    // Otherwise, allow expansion and track the new maximum auto size
    const newRowSpan = Math.max(this.currentRowSpan, requestedRowSpan);
    if (newRowSpan > this.maxAutoRowSpan) {
      this.maxAutoRowSpan = newRowSpan;
    }
    
    this.currentRowSpan = newRowSpan;
    return newRowSpan;
  }
  
  /**
   * Determines appropriate row span when content shrinks
   */
  public getShrunkRowSpan(contentHeight: number, rowHeight: number): number {
    // If user has manually set a size, don't auto-shrink
    if (this.isUserResized && this.userSetRowSpan !== null) {
      return this.userSetRowSpan;
    }
    
    // Calculate needed rows and don't go below initial size
    const neededRows = Math.ceil(contentHeight / rowHeight);
    const newRowSpan = Math.max(neededRows, this.initialRowSpan);
    
    // Update current size
    this.currentRowSpan = newRowSpan;
    return newRowSpan;
  }
  
  /**
   * Resets user resize preferences
   */
  public resetUserPreference(): void {
    this.isUserResized = false;
    this.userSetRowSpan = null;
  }
  
  /**
   * Gets current state information
   */
  public getState(): {
    currentRowSpan: number;
    maxAutoRowSpan: number;
    isUserResized: boolean;
    userSetRowSpan: number | null;
  } {
    return {
      currentRowSpan: this.currentRowSpan,
      maxAutoRowSpan: this.maxAutoRowSpan,
      isUserResized: this.isUserResized,
      userSetRowSpan: this.userSetRowSpan
    };
  }
  
  /**
   * Check if the widget has been manually resized by the user
   */
  public hasUserResized(): boolean {
    return this.isUserResized;
  }
  
  /**
   * Get the maximum row span the widget has reached through auto-sizing
   */
  public getMaxAutoSize(): number {
    return this.maxAutoRowSpan;
  }
}
