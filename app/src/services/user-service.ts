import { StorageService } from './storage-service';
import { UserRepository } from '../repositories/user-repository';
import { UserProfile, UserType, UserTypes } from '../repositories/models/user-models';
import { repositoryService } from './repository-service';

export class UserService {
  private static instance: UserService;
  private currentUserId: string | null = null;
  private userRepository: UserRepository;
  
  private constructor(private storage: StorageService) {
    this.userRepository = new UserRepository(storage);
    
    // Try to load current user from storage
    this.currentUserId = this.storage.getItem<string>('currentUserId');
    console.debug("UserService initialized, current user ID:", this.currentUserId);
  }
  
  public static getInstance(storage: StorageService): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(storage);
    }
    return UserService.instance;
  }
  
  /**
   * Switch to a different user
   */
  public switchToUser(userId: string): UserProfile | undefined {
    return this.login(userId);
  }
  
  /**
   * Login a user by ID, updating their last login time
   */
  public login(userId: string): UserProfile | undefined {
    const user = this.userRepository.getUserById(userId);
    
    if (user) {
      this.currentUserId = userId;
      this.storage.setItem('currentUserId', userId);
      this.userRepository.updateLastLogin(userId);
      console.debug(`User logged in: ${userId}`);
      
      // Dispatch event for other components to react to login
      document.dispatchEvent(new CustomEvent('user-login', {
        bubbles: true,
        detail: { userId }
      }));
      
      return user;
    }
    
    return undefined;
  }
  
  /**
   * Logout the current user
   */
  public logout(): void {
    this.currentUserId = null;
    this.storage.removeItem('currentUserId');
    console.debug('User logged out');
    
    // Dispatch event for other components to react to logout
    document.dispatchEvent(new CustomEvent('user-logout', {
      bubbles: true
    }));
  }
  
  /**
   * Get current user ID
   */
  public getCurrentUserId(): string {
    // If no user is set, default to 'new-user' instead of 'demo-user'
    return this.currentUserId || 'new-user';
  }
  
  /**
   * Get current user profile
   */
  public getCurrentUser(): UserProfile | undefined {
    const userId = this.getCurrentUserId();
    return this.userRepository.getUserById(userId);
  }
  
  /**
   * Get user type of current user
   */
    public getUserType(): UserType {
    const user = this.getCurrentUser();
    return user?.type || UserTypes.NEW;
  }
  
  /**
   * Check if current user is new
   */
  public isNewUser(): boolean {
    return this.getUserType() === UserTypes.NEW;
  }
  
  /**
   * Update user profile
   */
  public updateProfile(updates: Partial<UserProfile>): UserProfile | undefined {
    const userId = this.getCurrentUserId();
    return this.userRepository.updateUser(userId, updates);
  }
  
  /**
   * Get user by ID
   */
  public getUserById(id: string): UserProfile | undefined {
    return this.userRepository.getUserById(id);
  }
  
  /**
   * Get all available users (for demo purposes)
   */
  public getAllUsers(): UserProfile[] {
    return this.userRepository.getAllUsers();
  }
  
  /**
   * Get the user's age based on their date of birth (if available)
   */
  public getUserAge(): number {
    const user = this.getCurrentUser();
    if (!user?.dateOfBirth) return 0;
    
    const birthDate = new Date(user.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust age if birthday hasn't occurred yet this year
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Get user's country of residence
   */
  public getUserResidency(): string {
    const user = this.getCurrentUser();
    return user?.address?.country || 'Unknown';
  }

  /**
   * Check if the current user has any accounts
   * Used to determine if a new user needs to go through onboarding
   */
  public async hasAccounts(): Promise<boolean> {
    try {
      const accountRepo = repositoryService.getAccountRepository();
      const accounts = await accountRepo.getAll();
      
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking user accounts:', error);
      return false;
    }
  }
  
  /**
   * Check if the current user needs account setup
   * Used to determine if onboarding should be shown
   */
  public async needsAccountSetup(): Promise<boolean> {
    // Only new users without accounts need account setup
    return this.isNewUser() && !(await this.hasAccounts());
  }
}

// Export singleton instance
export const userService = UserService.getInstance(StorageService.getInstance());
