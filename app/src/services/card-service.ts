import { kycService } from './kyc-service';
import { productService } from './product-service';
import { userService } from './user-service';
import { repositoryService } from './repository-service';
import { Account } from '../repositories/account-repository';
import { ProductEntityType } from '../repositories/product-repository';
import { Card, CardProduct, CardRequirement, CardRequestData, CardServiceResult, CardType } from '../repositories/models/card-models';

export class CardService {
    private static instance: CardService;
    private accountRepo = repositoryService.getAccountRepository();
    
    private constructor() {
        console.debug("CardService instance created");
    }
    
    // Singleton accessor
    public static getInstance(): CardService {
        if (!CardService.instance) {
            CardService.instance = new CardService();
        }
        return CardService.instance;
    }
    
    /**
     * Check if user already has a specific card
     */
    async userHasCard(cardId: string): Promise<boolean> {
        try {
            return await productService.hasProduct(cardId);
        } catch (error) {
            console.error(`Error checking if user has card ${cardId}:`, error);
            return false;
        }
    }
    
    /**
     * Get available card products
     */
    async getCardProducts(): Promise<CardProduct[]> {
        try {
            // Using the product repository to get card type products
            const products = await productService.getProductsByEntityType(ProductEntityType.CARD);
            console.log("Fetched card products:", products);
            
            // Map products to CardProduct interface
            return products.map(product => ({
                id: product.id,
                name: product.name,
                type: product.id.includes('credit') ? 'credit' : 'debit',
                description: product.description || '',
                features: product.features || [],
                requirements: product.requirements || [],
                monthlyFee: product.metadata?.monthlyFee || 0,
                currency: product.metadata?.currency || 'USD',
                imageUrl: product.metadata?.imageUrl
            }));
        } catch (error) {
            console.error("Error fetching card products:", error);
            return []
        }
    }
    
    /**
     * Get accounts that are compatible with debit cards
     */
    async getCompatibleAccounts(): Promise<Account[]> {
        try {
            const accountRepo = repositoryService.getAccountRepository();
            const accounts = await accountRepo.getAll();
            
            // Filter accounts that are compatible with debit cards
            // In this simple implementation, checking and savings accounts are compatible
            return accounts.filter(account => 
                account.isActive && 
                (account.type === 'checking' || account.type === 'savings')
            );
        } catch (error) {
            console.error("Error fetching compatible accounts:", error);
            return [];
        }
    }
    
    /**
     * Check if a user meets a specific requirement for a card
     */
    async checkRequirement(requirement: CardRequirement): Promise<boolean> {
        try {
            switch (requirement.type) {
                case "kyc":
                    return kycService.meetsKycRequirements(requirement.value);
                
                case "age":
                    const userAge = userService.getUserAge();
                    return userAge >= requirement.value;
                
                case "creditScore":
                    // In a real app, we would query a credit service here
                    // For now, let's simulate a credit score check
                    const simulatedScore = 700; // Could be stored in user profile in a real app
                    return simulatedScore >= requirement.value;
                
                case "hasAccount":
                    const accounts = await this.getCompatibleAccounts();
                    return accounts.length > 0;
                
                default:
                    console.warn(`Unknown requirement type: ${requirement.type}`);
                    return false;
            }
        } catch (error) {
            console.error(`Error checking requirement ${requirement.type}:`, error);
            return false;
        }
    }
    
    /**
     * Check if user meets all requirements for a card
     */
    async meetsAllRequirements(cardProduct: CardProduct): Promise<boolean> {
        try {
            for (const req of cardProduct.requirements) {
                const meets = await this.checkRequirement(req);
                if (!meets) return false;
            }
            return true;
        } catch (error) {
            console.error("Error checking card requirements:", error);
            return false;
        }
    }
    
    /**
     * Request a new card
     */
    async requestCard(requestData: CardRequestData): Promise<CardServiceResult> {
        console.log("Requesting card with data:", requestData);
        try {
            console.debug("Processing card request:", requestData);
            
            // Check if user already has this card
            const hasCard = await this.userHasCard(requestData.productId);
            if (hasCard) {
                return {
                    success: false,
                    message: "You already have this card"
                };
            }
            
            // For debit cards, verify the linked account exists
            if (requestData.cardType === 'debit' && requestData.linkedAccountId) {
                const account = await this.accountRepo.getById(requestData.linkedAccountId);
                console.log("Account back from accountRepo:", account);
                
                if (!account) {
                    return {
                        success: false,
                        message: "The selected account was not found"
                    };
                }
            }
            
            // Get the user's full name for the card
            const user = userService.getCurrentUser();
            const cardholderName = user ? `${user.firstName} ${user.lastName}` : 'Card Holder';
            
            // Add the product to the user's account
            await productService.addProduct({
                id: requestData.productId,
                name: requestData.cardType === 'credit' ? 'Credit Card' : 'Debit Card',
                type: 'card',
                metadata: {
                    cardType: requestData.cardType,
                    linkedAccountId: requestData.linkedAccountId || null,
                    requestDate: requestData.requestDate,
                    status: 'processing' // Could be 'processing', 'approved', 'shipped', 'active'
                }
            });
            
            // Also create the card in the card repository
            const cardRepo = repositoryService.getCardRepository();
            const accountId = requestData.linkedAccountId || 'default';
            
            let card: Card;
            if (requestData.cardType === 'credit') {
                card = await cardRepo.createCreditCard(accountId, {
                    cardholderName: cardholderName,
                    status: 'pending'
                });
            } else {
                card = await cardRepo.createCardForAccount(accountId, {
                    type: requestData.cardType as CardType,
                    cardholderName: cardholderName,
                    status: 'pending'
                });
            }
            
            console.debug("Created new card record:", card);
            
            return {
                success: true,
                message: `Your ${requestData.cardType} card request has been submitted successfully`,
                data: {
                    cardId: card.id,
                    productId: requestData.productId,
                    requestDate: requestData.requestDate,
                    status: 'processing'
                }
            };
        } catch (error) {
            console.error("Error requesting card:", error);
            return {
                success: false,
                message: "Failed to process card request"
            };
        }
    }
    
    /**
     * Get all cards from the card repository
     */
    async getAllCards(): Promise<Card[]> {
        try {
            const cardRepo = repositoryService.getCardRepository();
            return await cardRepo.getAll();
        } catch (error) {
            console.error("Error fetching cards:", error);
            return [];
        }
    }
    
    /**
     * Get card by ID
     */
    async getCardById(cardId: string): Promise<Card | undefined> {
        try {
            const cardRepo = repositoryService.getCardRepository();
            return await cardRepo.getById(cardId);
        } catch (error) {
            console.error(`Error fetching card ${cardId}:`, error);
            return undefined;
        }
    }
    
    /**
     * Get cards by account ID
     */
    async getCardsByAccountId(accountId: string): Promise<Card[]> {
        try {
            const cardRepo = repositoryService.getCardRepository();
            return await cardRepo.getCardsByAccountId(accountId);
        } catch (error) {
            console.error(`Error fetching cards for account ${accountId}:`, error);
            return [];
        }
    }
}

// Export a singleton instance
export const cardService = CardService.getInstance();
