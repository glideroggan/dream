import { StorageService } from '../services/storage-service';
import { Entity } from './base-repository';
import { createNewUserTemplate, generateMockUsers } from './mock/user-mock';
import { UserProfile, UserType, UserTypes } from './models/user-models';

export class UserRepository {
  private users: Map<string, UserProfile> = new Map();
  private storageKey: string = 'users';
  
  constructor(private storage: StorageService) {
    this.loadUsers();
    
    // Initialize with default users if none exist
    if (this.users.size === 0) {
      this.initializeDefaultUsers();
    }
  }
  
  /**
   * Load users from storage
   */
  private loadUsers(): void {
    const storedUsers = this.storage.getItem<UserProfile[]>(this.storageKey);
    
    if (storedUsers) {
      this.users = new Map(storedUsers.map(user => [user.id, user]));
      console.debug(`Loaded ${this.users.size} users from storage`);
    }
  }
  
  /**
   * Save users to storage
   */
  private saveUsers(): void {
    const users = Array.from(this.users.values());
    this.storage.setItem(this.storageKey, users);
    console.debug(`Saved ${users.length} users to storage`);
  }
  
  /**
   * Initialize with default users
   */
  private initializeDefaultUsers(): void {
    const mockUsers = generateMockUsers();
    
    // Add users to map
    mockUsers.forEach(user => {
      this.users.set(user.id, user);
    });
    
    // Save to storage
    this.saveUsers();
    
    console.debug('Initialized default users');
  }
  
  /**
   * Get a user by ID
   */
  public getUserById(id: string): UserProfile | undefined {
    return this.users.get(id);
  }
  
  /**
   * Get all users
   */
  public getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }
  
  /**
   * Update a user
   */
  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const user = this.users.get(id);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    this.saveUsers();
    
    return updatedUser;
  }
  
  /**
   * Create a new user
   */
  public createUser(userData: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newUser: UserProfile = {
      ...userData,
      id,
      createdAt: now
    };
    
    this.users.set(id, newUser);
    this.saveUsers();
    
    return newUser;
  }
  
  /**
   * Create a new user with default settings
   */
  public createNewUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
  }): UserProfile {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the template to create a consistent new user
    const newUser = createNewUserTemplate({
      id,
      ...userData
    });
    
    this.users.set(id, newUser);
    this.saveUsers();
    
    console.debug(`Created new user: ${id}`);
    return newUser;
  }
  
  /**
   * Update last login time for a user
   */
  public updateLastLogin(id: string): void {
    const user = this.users.get(id);
    
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.users.set(id, user);
      this.saveUsers();
    }
  }

  /**
   * Add a product to a user's profile
   */
  public addProductToUser(userId: string, productId: string): UserProfile | undefined {
    const user = this.users.get(userId);
    
    if (!user) {
      return undefined;
    }
    
    // Initialize products array if it doesn't exist
    if (!user.products) {
      user.products = [];
    }
    
    // Add product if it's not already in the list
    if (!user.products.includes(productId)) {
      user.products.push(productId);
      this.saveUsers();
      console.debug(`Added product ${productId} to user ${userId}`);
    }
    
    return user;
  }
  
  /**
   * Remove a product from a user's profile
   */
  public removeProductFromUser(userId: string, productId: string): UserProfile | undefined {
    const user = this.users.get(userId);
    
    if (!user || !user.products) {
      return undefined;
    }
    
    // Remove product from list
    user.products = user.products.filter(id => id !== productId);
    this.saveUsers();
    console.debug(`Removed product ${productId} from user ${userId}`);
    
    return user;
  }
  
  /**
   * Check if a user has a specific product
   */
  public userHasProduct(userId: string, productId: string): boolean {
    const user = this.users.get(userId);
    
    if (!user || !user.products) {
      return false;
    }
    
    return user.products.includes(productId);
  }
  
  /**
   * Get all products for a user
   */
  public getUserProducts(userId: string): string[] {
    const user = this.users.get(userId);
    
    if (!user || !user.products) {
      return [];
    }
    
    return [...user.products]; // Return a copy of the array
  }
}
