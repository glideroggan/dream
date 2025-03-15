
export type ChangeType = 'add' | 'update' | 'remove';
/**
 * Event interface for product changes
 */
export interface ContactChangeEvent {
  type: ChangeType;
  contactId:string
  contact?: PaymentContact;
}

/**
 * Listener type for product changes
 */
export type PaymentContactChangeListener = (event: ContactChangeEvent) => void;

export interface PaymentContact {
  id: string;
  name: string;
  accountNumber: string;
  bankCode?: string;
  bankName?: string;
  alias?: string;
  notes?: string;
  lastUsed?: Date;
  isFavorite?: boolean;
}
