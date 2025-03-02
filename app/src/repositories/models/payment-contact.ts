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
