import { kycService } from './kyc-service';
import { userProductService } from './user-product-service';
import { userService } from './user-service';
import { repositoryService } from './repository-service';
import { Account } from '../repositories/models/account-models';
import { Card, CardProduct, CardRequirement, CardRequestData, CardServiceResult, CardType } from '../repositories/models/card-models';
import { ProductRepository } from '../repositories/product-repository';
import { AccountRepository } from '../repositories/account-repository';
import { CardRepository } from '../repositories/card-repository';
import { generateUUID } from '../utilities/id-generator';
import { simulationService } from './simulation/simulation-service';

export class CardService {
    private static instance: CardService;
    private accountRepo: AccountRepository = repositoryService.getAccountRepository();
    private productRepo: ProductRepository = repositoryService.getProductRepository();
    private cardRepo: CardRepository = repositoryService.getCardRepository();
    
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
            return await userProductService.hasProduct(cardId);
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

            const availableCardProducts = await this.productRepo.getProductsByEntityType<CardProduct>(['debit','credit']);
            console.log("Fetched card products:", availableCardProducts);

            // TODO: we need to fill these in with actual data from card-model?

            return availableCardProducts;
            
            // Map products to CardProduct interface
            // return products.map(product => ({
            //     id: product.id,
            //     name: product.name,
            //     type: product.id.includes('credit') ? 'credit' : 'debit',
            //     description: product.description || '',
            //     features: product.features || [],
            //     requirements: product.requirements || [],
            //     monthlyFee: product.metadata?.monthlyFee || 0,
            //     currency: product.metadata?.currency || 'USD',
            //     imageUrl: product.metadata?.imageUrl
            // }));
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
                    // TODO:
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
        /**
         * get the template product for the product that the user is requesting
         * check if the user already have the product (if it is a product that you can only have once)
         * check if the user meets the requirements for the product
         * Create a user product with the product template and the card data
         * send data down to user product service for creation
        */
        console.debug("Requesting card with data:", requestData);
        try {
            // 1. Get the template product for the card the user is requesting
            const productTemplate = await this.productRepo.getById(requestData.productId);
            if (!productTemplate) {
                return {
                    success: false,
                    message: "Card product not found"
                };
            }
            
            console.debug("Found product template:", productTemplate);
            
            // 2. Check if user already has this card product
            const hasCard = await userProductService.hasProduct(requestData.productId);
            if (hasCard) {
                return {
                    success: false,
                    message: "You already have this card product"
                };
            }
            
            // 3. Check if the user meets requirements for the product
            if (productTemplate.requirements && productTemplate.requirements.length > 0) {
                const meetsRequirements = await this.meetsAllRequirements(productTemplate as CardProduct);
                if (!meetsRequirements) {
                    return {
                        success: false,
                        message: "You don't meet all requirements for this card"
                    };
                }
            }
            
            // 4. For debit cards, verify the linked account exists
            if (requestData.cardType === 'debit' && requestData.linkedAccountId) {
                const account = await this.accountRepo.getById(requestData.linkedAccountId);
                console.debug("Account back from accountRepo:", account);
                
                if (!account) {
                    return {
                        success: false,
                        message: "The selected account was not found"
                    };
                }
            }
            
            // 5. Get the user's full name for the card
            const user = userService.getCurrentUser();
            const cardholderName = user ? `${user.firstName} ${user.lastName}` : 'Card Holder';
            
            // 6. Create the card entity in the card repository first
            const accountId = requestData.linkedAccountId || 'default';
            
            let card: Card;
            if (requestData.cardType === 'credit') {
                card = await this.cardRepo.createCreditCard(accountId, {
                    cardholderName: cardholderName,
                    status: 'pending'
                });
            } else {
                card = await this.cardRepo.createCardForAccount(accountId, {
                    type: requestData.cardType as CardType,
                    cardholderName: cardholderName,
                    status: 'pending'
                });
            }
            
            console.debug("Created new card record:", card);
            
            const userProductId = `user-product-${generateUUID()}`;
            // 7. Create a user product based on the template
            const userProductData = {
                // Use template information
                id: userProductId,
                name: productTemplate.name,
                type: productTemplate.type,
                category: productTemplate.category,
                features: productTemplate.features,
                requirements: productTemplate.requirements,
                // Add metadata with card info and original product ID
                metadata: {
                    cardId: card.id, // Link to the created card
                    cardType: requestData.cardType,
                    linkedAccountId: requestData.linkedAccountId || null,
                    requestDate: requestData.requestDate,
                    status: 'processing', // Initial status
                    originalProductId: productTemplate.id // Store reference to original product
                }
            };
            
            console.debug("Creating user product with data:", userProductData);
            
            // 8. Send data to user product service for creation
            const userProduct = await userProductService.addProduct(userProductData);
            
            if (!userProduct) {
                console.error("Failed to create user product");
                throw new Error("Failed to create user product");
            }
            
            // 9. Create a simulation task for the card process
            simulationService.addTask(userProduct.id);
            
            return {
                success: true,
                message: `Your ${requestData.cardType} card request has been submitted successfully`,
                data: {
                    cardId: card.id,
                    productId: userProduct.id,
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
