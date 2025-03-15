import { UserType } from "../models/user-models";
import { UserProduct } from "../models/user-product-models";
import { productRepository } from "../product-repository";

export async function generateProductsForUsers(userType: UserType): Promise<UserProduct[]> {
    // For demo purposes, we'll create a few user products
    // const baseProducts = generateMockProducts();
    const baseProducts = await productRepository.getAll();
    const now = new Date().toISOString();

    switch (userType) {
        case 'demo':
        case 'established':
        case 'premium':
            // Transform some of the base products into user products
            const userProducts: UserProduct[] = [
                // Checking account product for demo user
                {
                    ...baseProducts.find(p => p.id === 'checking-account')!,
                    id: 'user-checking-account',
                    active: true,
                    addedDate: now,
                    lastUpdated: now,
                    metadata: {
                        accountId: 'acc-1',
                        status: 'active'
                    }
                },

                // Credit card product for demo user
                {
                    ...baseProducts.find(p => p.id === 'credit-card')!,
                    id: 'user-credit-card',
                    active: true,
                    addedDate: now,
                    lastUpdated: now,
                    metadata: {
                        cardId: 'card-2',
                        status: 'active',
                        cardType: 'credit'
                    }
                }
            ];
        default:
            return [];
    }

    return []
}