import { ProductEntity } from '../product-repository';

export function generateMockProducts(): ProductEntity[] {
  const now = new Date().toISOString();
  
  return [
    {
      id: 'checking-account',
      name: 'Checking Account',
      type: 'account',
      active: true,
      addedDate: now,
      lastUpdated: now
    },
    {
      id: 'savings-account',
      name: 'Savings Account',
      type: 'account',
      active: true,
      addedDate: now,
      lastUpdated: now
    }
  ];
}
