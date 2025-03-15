import { Product } from "./product-models";

// TODO: we need different states for different products, but this is for the actual service
// when it comes to card for example, you can have a card that is inactive, frozen, but the 
// service is still active

export interface UserProduct extends Product {
    active: boolean;
    addedDate: string;
    lastUpdated: string;
}

/**
 * Event types for product changes
 */
export type ChangeEventType = 'add' | 'remove' | 'update';

/**
 * Event interface for product changes
 */
export interface UserProductChangeEvent {
  type: ChangeEventType;
  productId: string;
  product?: UserProduct;
}

/**
 * Listener type for product changes
 */
export type UserProductChangeListener = (event: UserProductChangeEvent) => void;