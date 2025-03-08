import { StorageService, storageService } from './storage-service';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isLoggedIn: boolean;
  age?: number;
  residency?: string;
}

/**
 * Service for managing current user
 */
export class UserService {
  private static instance: UserService;
  private currentUser: User | null = null;
  private readonly USER_STORAGE_KEY = 'dream_current_user';
  
  private constructor(private storage: StorageService) {
    this.loadUser();
    console.debug('User service initialized');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(storageService);
    }
    return UserService.instance;
  }
  
  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  /**
   * Get the current user ID, or use a default for demo
   */
  getCurrentUserId(): string {
    return this.currentUser?.id || 'demo-user';
  }
  
  /**
   * Check if a user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.currentUser?.isLoggedIn;
  }
  
  /**
   * Get the user's age
   * @returns The user's age or 0 if not available
   */
  getUserAge(): number {
    return this.currentUser?.age || 0;
  }
  
  /**
   * Get the user's country of residency
   * @returns The user's residency or empty string if not available
   */
  getUserResidency(): string {
    return this.currentUser?.residency || '';
  }
  
  /**
   * Load user from storage
   */
  private loadUser(): void {
    this.currentUser = this.storage.getItem<User>(this.USER_STORAGE_KEY);
    
    // If no user in storage, create a demo user for convenience
    if (!this.currentUser) {
      this.currentUser = this.createDemoUser();
      this.saveUser();
    }
    
    console.debug('Loaded user:', this.currentUser?.username);
  }
  
  /**
   * Create a demo user
   */
  private createDemoUser(): User {
    return {
      id: 'demo-user',
      username: 'demo',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      isLoggedIn: true, // Auto-login for demo
      age: 30,
      residency: 'Sweden'
    };
  }
  
  /**
   * Save the current user to storage
   */
  private saveUser(): void {
    if (this.currentUser) {
      this.storage.setItem(this.USER_STORAGE_KEY, this.currentUser);
    }
  }
  
  /**
   * Login a user
   */
  login(username: string, password: string): boolean {
    // Demo login - just accept any credentials for now
    this.currentUser = {
      id: 'user-' + Date.now(),
      username,
      email: `${username}@example.com`,
      firstName: username,
      lastName: 'User',
      isLoggedIn: true,
      age: 30,
      residency: 'Sweden'
    };
    
    this.saveUser();
    return true;
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    if (this.currentUser) {
      this.currentUser.isLoggedIn = false;
      this.saveUser();
    }
    
    // Reset to demo user
    this.currentUser = this.createDemoUser();
    this.saveUser();
  }
  
  /**
   * Update user information
   */
  updateUser(updates: Partial<User>): User {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    this.currentUser = {
      ...this.currentUser,
      ...updates
    };
    
    this.saveUser();
    return this.currentUser;
  }
}

export const userService = UserService.getInstance();
