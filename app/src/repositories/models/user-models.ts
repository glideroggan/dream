import { Entity } from "../base-repository";

// Convert from enum to union type
export type UserType = 'new' | 'established' | 'premium' | 'demo';

// Constants for UserType values (for backwards compatibility with enum usage)
export const UserTypes = {
  NEW: 'new' as UserType,
  ESTABLISHED: 'established' as UserType,
  PREMIUM: 'premium' as UserType,
  DEMO: 'demo' as UserType
};

export interface UserProfile extends Entity {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  type: UserType;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
  kycLevel?: string;
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
  products?: string[]; // Array of product IDs that the user has
}
