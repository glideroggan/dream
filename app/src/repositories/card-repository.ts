import { StorageService } from "../services/storage-service";
import { UserService } from "../services/user-service";
import { Entity, LocalStorageRepository } from "./base-repository";
import { Card, CardStatus, CardType } from "./models/card-models";

export class CardRepository extends LocalStorageRepository<Card> {
  constructor(storage: StorageService, userService: UserService) {
    super('cards', storage, userService);
  }

  /**
   * Initialize with mock data based on user type
   */
  protected async initializeMockData(): Promise<void> {
    const userType = this.userService.getUserType();
    const module = await import("@mocks/card")
    const mockCards = module.generateMockCards(userType);
    
    mockCards.forEach(card => {
      this.createForMocks(card);
    });
    
    this.saveToStorage();
    console.debug(`Initialized ${mockCards.length} mock cards for ${userType} user`);
  }
  
  /**
   * Get cards associated with a specific account
   */
  async getCardsByAccountId(accountId: string): Promise<Card[]> {
    const cards = await this.getAll();
    return cards.filter(card => card.accountId === accountId);
  }
  
  /**
   * Get all active cards
   */
  async getActiveCards(): Promise<Card[]> {
    const cards = await this.getAll();
    return cards.filter(card => card.status === 'active');
  }
  
  /**
   * Create a new card linked to an account
   */
  async createCardForAccount(accountId: string, data: Partial<Omit<Card, 'id' | 'accountId'>>): Promise<Card> {
    const now = new Date();
    const expiryDate = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${(now.getFullYear() + 4) % 100}`;
    
    // Generate last four digits
    const lastFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
    
    const cardData: Omit<Card, 'id'> = {
      cardNumber: `**** **** **** ${lastFourDigits}`,
      lastFourDigits,
      type: data.type || 'debit',
      accountId,
      expiryDate: data.expiryDate || expiryDate,
      cardholderName: data.cardholderName || 'Card Holder',
      status: data.status || 'pending',
      issueDate: now.toISOString(),
      network: data.network || 'visa',
      contactless: data.contactless ?? true,
      frozen: data.frozen ?? false,
      dailyLimit: data.dailyLimit || 1000,
      monthlyLimit: data.monthlyLimit || 10000,
      digitalWalletEnabled: data.digitalWalletEnabled ?? false,
    };
    
    return this.create(cardData);
  }
  
  /**
   * Create a new credit card
   */
  async createCreditCard(accountId: string, data: Partial<Omit<Card, 'id' | 'accountId' | 'type'>>): Promise<Card> {
    return this.createCardForAccount(accountId, {
      ...data,
      type: 'credit',
      creditLimit: data.creditLimit || 5000,
      cashAdvanceLimit: data.cashAdvanceLimit || 1000
    });
  }
  
  /**
   * Create a virtual card linked to a physical card
   */
  async createVirtualCard(physicalCardId: string, temporary: boolean = false): Promise<Card | undefined> {
    const physicalCard = await this.getById(physicalCardId);
    if (!physicalCard) return undefined;
    
    // Create a virtual version with more restrictions
    return this.createCardForAccount(physicalCard.accountId, {
      type: 'virtual',
      cardholderName: physicalCard.cardholderName,
      network: physicalCard.network,
      dailyLimit: physicalCard.dailyLimit * 0.5, // Lower limit
      monthlyLimit: physicalCard.monthlyLimit * 0.5,
      digitalWalletEnabled: true,
      contactless: true,
      physicalCardId: physicalCardId,
      temporary: temporary,
      expiresAfterOneUse: temporary
    });
  }
  
  /**
   * Check if a card number is valid (simple validation)
   */
  validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and non-digits
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Check if length is valid (most card networks use 16 digits, AMEX uses 15)
    if (cleanNumber.length < 15 || cleanNumber.length > 19) {
      return false;
    }
    
    // Implement Luhn algorithm for basic card number validation
    // This is the industry standard algorithm for validating card numbers
    let sum = 0;
    let double = false;
    
    // Loop from right to left
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);
      
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      double = !double;
    }
    
    return sum % 10 === 0;
  }
  
  /**
   * Get cards by type
   */
  async getCardsByType(type: CardType): Promise<Card[]> {
    const cards = await this.getAll();
    return cards.filter(card => card.type === type);
  }
  
  /**
   * Get all credit cards
   */
  async getCreditCards(): Promise<Card[]> {
    return this.getCardsByType('credit');
  }
  
  /**
   * Get all debit cards
   */
  async getDebitCards(): Promise<Card[]> {
    return this.getCardsByType('debit');
  }
  
  /**
   * Activate a pending card
   */
  async activateCard(cardId: string): Promise<Card | undefined> {
    const card = await this.getById(cardId);
    if (!card || card.status !== 'pending') return undefined;
    
    return this.update(cardId, { 
      status: 'active',
      // Add activation timestamp in metadata if needed
    });
  }
  
  /**
   * Report card as lost or stolen
   */
  async reportCardLostOrStolen(cardId: string, reason: 'lost' | 'stolen'): Promise<Card | undefined> {
    const card = await this.getById(cardId);
    if (!card) return undefined;
    
    // First block the card
    const blockedCard = await this.update(cardId, { 
      status: 'blocked',
      frozen: true 
    });
    
    // In a real application, this would trigger additional security measures
    console.info(`Card ${cardId} reported as ${reason}. Additional security measures would be triggered.`);
    
    return blockedCard;
  }
  
  /**
   * Update card status (block/unblock)
   */
  async updateCardStatus(cardId: string, status: CardStatus): Promise<Card | undefined> {
    return this.update(cardId, { status });
  }
  
  /**
   * Freeze/unfreeze card (temporary block)
   */
  async toggleCardFreeze(cardId: string): Promise<Card | undefined> {
    const card = await this.getById(cardId);
    if (!card) return undefined;
    
    return this.update(cardId, { frozen: !card.frozen });
  }
  
  /**
   * Replace a card (issue new card number)
   */
  async replaceCard(cardId: string): Promise<Card | undefined> {
    const card = await this.getById(cardId);
    if (!card) return undefined;
    
    // Generate new last four digits
    const lastFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Update expiry date
    const now = new Date();
    const expiryDate = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${(now.getFullYear() + 4) % 100}`;
    
    return this.update(cardId, {
      cardNumber: `**** **** **** ${lastFourDigits}`,
      lastFourDigits,
      status: 'pending',
      expiryDate,
      issueDate: now.toISOString()
    });
  }
  
  /**
   * Update card limits
   */
  async updateCardLimits(cardId: string, dailyLimit?: number, monthlyLimit?: number): Promise<Card | undefined> {
    const updates: Partial<Card> = {};
    if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
    if (monthlyLimit !== undefined) updates.monthlyLimit = monthlyLimit;
    
    return this.update(cardId, updates);
  }
}