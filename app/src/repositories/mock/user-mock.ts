import { UserProfile } from '../models/user-models';

/**
 * Generate mock users for development and testing
 */
export function generateMockUsers(): UserProfile[] {
  const now = new Date().toISOString();
  const mockUsers: UserProfile[] = [];
  
  // Demo user - has all products and full history
  mockUsers.push({
    id: 'demo-user',
    username: 'demo',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    phoneNumber: '555-123-4567',
    dateOfBirth: '1985-10-15',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '90210',
      country: 'United States'
    },
    type: 'demo',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    },
    kycLevel: 'standard',
    verified: true,
    createdAt: '2020-01-01T00:00:00Z',
    lastLogin: now,
    products: [
      'checking-account',
      'savings-account', 
      'credit-card',
      'debit-card',
      'overdraft-protection'
    ]
  });
  
  // New user - no accounts or products yet
  mockUsers.push({
    id: 'new-user',
    username: 'newuser',
    email: 'new@example.com',
    firstName: 'New',
    lastName: 'Customer',
    phoneNumber: '555-987-6543',
    type: 'new',
    verified: true,
    createdAt: now,
    lastLogin: now,
    products: [] // Empty array to indicate no products yet
  });
  
  // Established user - has some accounts and products
  mockUsers.push({
    id: 'established-user',
    username: 'established',
    email: 'established@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phoneNumber: '555-456-7890',
    dateOfBirth: '1990-05-22',
    address: {
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      postalCode: '10001',
      country: 'United States'
    },
    type: 'established',
    preferences: {
      theme: 'system',
      language: 'en',
      notifications: true
    },
    kycLevel: 'basic',
    verified: true,
    createdAt: '2022-06-15T00:00:00Z',
    lastLogin: now,
    products: [
      'checking-account',
      'savings-account',
      'debit-card'
    ]
  });
  
  // Premium user - has many products and large balances
  mockUsers.push({
    id: 'premium-user',
    username: 'premium',
    email: 'premium@example.com',
    firstName: 'Alex',
    lastName: 'Thompson',
    phoneNumber: '555-789-0123',
    dateOfBirth: '1975-12-03',
    address: {
      street: '789 Wealth Way',
      city: 'Richville',
      state: 'CA',
      postalCode: '94301',
      country: 'United States'
    },
    type: 'premium',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: false
    },
    kycLevel: 'enhanced',
    verified: true,
    createdAt: '2015-03-10T00:00:00Z',
    lastLogin: now,
    products: [
      'checking-account',
      'savings-account',
      'isk-account',
      'pension-account',
      'credit-card',
      'debit-card',
      'overdraft-protection'
    ]
  });
  
  return mockUsers;
}

/**
 * Create a template for a new user with minimal initial data
 * This is used when creating or initializing a new user
 * 
 * @param userData Basic user information to include
 * @returns A minimal new user profile
 */
export function createNewUserTemplate(userData: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}): UserProfile {
  const now = new Date().toISOString();
  
  return {
    id: userData.id,
    username: userData.email.split('@')[0], // Generate a username from email
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    type: 'new',
    verified: false, // New users start unverified
    createdAt: now,
    lastLogin: now,
    // Minimal preferences with defaults
    preferences: {
      theme: 'system',
      language: 'en',
      notifications: true
    },
    products: [] // Initialize with empty products array
  };
}

/**
 * Get initial products recommended for a new user
 * Returns array of product IDs that should be highlighted for new users
 */
export function getNewUserRecommendedProducts(): string[] {
  // Return IDs of basic products appropriate for new users
  return [
    'checking-account',
    'savings-account',
    'credit-card'
  ];
}
