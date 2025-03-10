import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// Mock repository-service to avoid circular dependencies
vi.mock('../../src/services/repository-service', () => ({
    repositoryService: {
        getCardRepository: vi.fn(),
        getAccountRepository: vi.fn()
    }
}));

// Import after mocks
import { CardRepository } from '../../src/repositories/card-repository';
import { StorageService } from '../../src/services/storage-service';
import { UserService } from '../../src/services/user-service';
import { Card, CardStatus, CardType } from '../../src/repositories/models/card-models';
import { repositoryService } from '../../src/services/repository-service';

// Mock the card mock generator
vi.mock('../../src/repositories/mock/card-mock', () => ({
    generateMockCards: vi.fn((userType) => {
        if (userType === 'premium') {
            return [
                {
                    id: 'card-premium-1',
                    cardNumber: '**** **** **** 1234',
                    lastFourDigits: '1234',
                    type: 'credit',
                    accountId: 'acc-premium-1',
                    expiryDate: '05/27',
                    cardholderName: 'Premium User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 5000,
                    monthlyLimit: 50000,
                    creditLimit: 20000,
                    cashAdvanceLimit: 5000
                },
                {
                    id: 'card-premium-2',
                    cardNumber: '**** **** **** 5678',
                    lastFourDigits: '5678',
                    type: 'debit',
                    accountId: 'acc-premium-2',
                    expiryDate: '07/27',
                    cardholderName: 'Premium User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'mastercard',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 3000,
                    monthlyLimit: 30000
                }
            ];
        }

        return [
            {
                id: 'card-standard-1',
                cardNumber: '**** **** **** 9876',
                lastFourDigits: '9876',
                type: 'debit',
                accountId: 'acc-standard-1',
                expiryDate: '12/26',
                cardholderName: 'Standard User',
                status: 'active',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            }
        ];
    })
}));

// Import our test helpers
import { setupDateAndRandomMocks, cleanupDateAndRandomMocks } from '../utils/test-helpers';

describe('CardRepository', () => {
    // Setup variables
    let mockStorage: Partial<StorageService>;
    let mockUserService: Partial<UserService>;
    let cardRepo: CardRepository;
    let storageData: Record<string, any> = {};

    const TEST_TIMESTAMP = new Date('2023-04-01T10:30:00Z').getTime();

    beforeEach(() => {
        // Clear previous mocks
        vi.clearAllMocks();

        // Setup mock functions
        mockStorage = {
            getItem: vi.fn().mockImplementation((key: string) => storageData[key] || null),
            setItem: vi.fn().mockImplementation((key: string, value: any) => {
                storageData[key] = value;
                return true;
            }),
            removeItem: vi.fn().mockReturnValue(true),
            clear: vi.fn().mockReturnValue(true),
            getKeysByPrefix: vi.fn().mockReturnValue([]),
            isStorageAvailable: vi.fn().mockReturnValue(true)
        } as unknown as StorageService;

        mockUserService = {
            getCurrentUserId: vi.fn().mockReturnValue('test-user'),
            getUserType: vi.fn().mockReturnValue('standard'),
            isNewUser: vi.fn().mockReturnValue(false)
        } as unknown as UserService;

        // Reset storage data
        storageData = {};

        // Use our shared test helper to setup date and random mocks
        setupDateAndRandomMocks(TEST_TIMESTAMP);

        // Create repository instance
        cardRepo = new CardRepository(
            mockStorage as StorageService,
            mockUserService as UserService
        );
    });

    afterEach(() => {
        // Use our shared cleanup helper
        cleanupDateAndRandomMocks();
    });

    describe('getCardsByAccountId', () => {
        it('should return cards for a specific account', async () => {
            // Setup test cards
            const cards: Card[] = [
                {
                    id: 'card1',
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 1111',
                    lastFourDigits: '1111',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                },
                {
                    id: 'card2',
                    accountId: 'acc1', // Same account
                    cardNumber: '**** **** **** 2222',
                    lastFourDigits: '2222',
                    type: 'virtual',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 500,
                    monthlyLimit: 5000
                },
                {
                    id: 'card3',
                    accountId: 'acc2', // Different account
                    cardNumber: '**** **** **** 3333',
                    lastFourDigits: '3333',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Other User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'mastercard',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                }
            ];

            // Mock getAll to return test cards
            vi.spyOn(cardRepo, 'getAll').mockResolvedValue(cards);

            // Get cards for acc1
            const acc1Cards = await cardRepo.getCardsByAccountId('acc1');

            // Verify filtered cards
            expect(acc1Cards).toHaveLength(2);
            expect(acc1Cards[0].id).toBe('card1');
            expect(acc1Cards[1].id).toBe('card2');

            // Get cards for acc2
            const acc2Cards = await cardRepo.getCardsByAccountId('acc2');

            // Verify filtered cards
            expect(acc2Cards).toHaveLength(1);
            expect(acc2Cards[0].id).toBe('card3');

            // Get cards for non-existent account
            const noCards = await cardRepo.getCardsByAccountId('acc3');

            // Verify empty array
            expect(noCards).toEqual([]);
        });
    });

    describe('getActiveCards', () => {
        it('should return only active cards', async () => {
            // Setup test cards with different statuses
            const cards: Card[] = [
                {
                    id: 'card1',
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 1111',
                    lastFourDigits: '1111',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                },
                {
                    id: 'card2',
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 2222',
                    lastFourDigits: '2222',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'pending',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                },
                {
                    id: 'card3',
                    accountId: 'acc2',
                    cardNumber: '**** **** **** 3333',
                    lastFourDigits: '3333',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Other User',
                    status: 'blocked',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'mastercard',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                },
                {
                    id: 'card4',
                    accountId: 'acc2',
                    cardNumber: '**** **** **** 4444',
                    lastFourDigits: '4444',
                    type: 'credit',
                    expiryDate: '12/25',
                    cardholderName: 'Other User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 2000,
                    monthlyLimit: 20000
                }
            ];

            // Mock getAll to return test cards
            vi.spyOn(cardRepo, 'getAll').mockResolvedValue(cards);

            // Get active cards
            const activeCards = await cardRepo.getActiveCards();

            // Verify only active cards are returned
            expect(activeCards).toHaveLength(2);
            expect(activeCards.map(c => c.id)).toEqual(['card1', 'card4']);
            expect(activeCards.every(c => c.status === 'active')).toBe(true);
        });
    });

    describe('createCardForAccount', () => {
        it('should create a debit card with correct defaults', async () => {
            // Setup spy on create method
            const createSpy = vi.spyOn(cardRepo as CardRepository, 'create').mockImplementation(async (entity: any) => {
                return {
                    ...entity
                };
            });

            // Create a card
            const card = await cardRepo.createCardForAccount('acc1', {
                type: 'debit',
                cardholderName: 'Test User'
            });

            // Verify card properties
            expect(card).toHaveProperty('accountId', 'acc1');
            expect(card).toHaveProperty('cardholderName', 'Test User');
            expect(card).toHaveProperty('type', 'debit');
            expect(card).toHaveProperty('status', 'pending');
            expect(card).toHaveProperty('lastFourDigits');
            expect(card).toHaveProperty('cardNumber');
            expect(card.cardNumber).toContain(card.lastFourDigits);
            expect(card).toHaveProperty('expiryDate');
            expect(card).toHaveProperty('issueDate');
            expect(card).toHaveProperty('network', 'visa');
            expect(card).toHaveProperty('contactless', true);
            expect(card).toHaveProperty('frozen', false);
            expect(card).toHaveProperty('dailyLimit', 1000);
            expect(card).toHaveProperty('monthlyLimit', 10000);

            // Verify create was called with the right args
            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'debit',
                accountId: 'acc1',
                cardholderName: 'Test User'
            }));
        });

        it('should respect provided property values', async () => {
            // Setup spy on create method
            vi.spyOn(cardRepo as CardRepository, 'create').mockImplementation(async (entity: any) => {
                return {
                    id: 'test-card-id',
                    ...entity
                };
            });

            // Create a card with custom properties
            const card = await cardRepo.createCardForAccount('acc1', {
                type: 'prepaid',
                cardholderName: 'Custom User',
                network: 'mastercard',
                contactless: false,
                dailyLimit: 500,
                monthlyLimit: 5000,
                expiryDate: '12/30',
                status: 'active'
            });

            // Verify custom properties were used
            expect(card.type).toBe('prepaid');
            expect(card.network).toBe('mastercard');
            expect(card.contactless).toBe(false);
            expect(card.dailyLimit).toBe(500);
            expect(card.monthlyLimit).toBe(5000);
            expect(card.expiryDate).toBe('12/30');
            expect(card.status).toBe('active');
        });
    });

    describe('createCreditCard', () => {
        it('should create a credit card with correct defaults', async () => {
            // Setup spy on createCardForAccount
            const createCardSpy = vi.spyOn(cardRepo, 'createCardForAccount').mockImplementation(
                async (accountId, data) => {
                    return {
                        id: 'test-credit-card',
                        accountId,
                        ...data
                    } as Card;
                }
            );

            // Create a credit card
            const card = await cardRepo.createCreditCard('acc1', {
                cardholderName: 'Credit Card User'
            });

            // Verify card was created with correct type
            expect(card.type).toBe('credit');
            expect(card.cardholderName).toBe('Credit Card User');
            expect(card.creditLimit).toBe(5000);
            expect(card.cashAdvanceLimit).toBe(1000);

            // Verify createCardForAccount was called with credit type
            expect(createCardSpy).toHaveBeenCalledWith('acc1', expect.objectContaining({
                type: 'credit',
                cardholderName: 'Credit Card User',
                creditLimit: 5000,
                cashAdvanceLimit: 1000
            }));
        });

        it('should respect provided credit limits', async () => {
            // Setup spy on createCardForAccount
            vi.spyOn(cardRepo, 'createCardForAccount').mockImplementation(
                async (accountId, data) => {
                    return {
                        id: 'test-credit-card',
                        accountId,
                        ...data
                    } as Card;
                }
            );

            // Create a credit card with custom limits
            const card = await cardRepo.createCreditCard('acc1', {
                cardholderName: 'High Limit User',
                creditLimit: 10000,
                cashAdvanceLimit: 2000
            });

            // Verify custom limits were used
            expect(card.creditLimit).toBe(10000);
            expect(card.cashAdvanceLimit).toBe(2000);
        });
    });

    describe('createVirtualCard', () => {
        it('should create a virtual card linked to a physical card', async () => {
            // Setup a physical card
            const physicalCard: Card = {
                id: 'physical-card-1',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '12/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById to return the physical card
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(physicalCard);

            // Mock createCardForAccount
            vi.spyOn(cardRepo, 'createCardForAccount').mockImplementation(
                async (accountId, data) => {
                    return {
                        id: 'virtual-card-1',
                        accountId,
                        ...data
                    } as Card;
                }
            );

            // Create virtual card
            const virtualCard = await cardRepo.createVirtualCard('physical-card-1');

            // Verify virtual card properties
            expect(virtualCard).toBeDefined();
            expect(virtualCard!.type).toBe('virtual');
            expect(virtualCard!.accountId).toBe('acc1'); // Inherited from physical card
            expect(virtualCard!.cardholderName).toBe('Test User');
            expect(virtualCard!.network).toBe('visa');
            expect(virtualCard!.dailyLimit).toBe(500); // Half of physical card's limit
            expect(virtualCard!.monthlyLimit).toBe(5000); // Half of physical card's limit
            expect(virtualCard!.digitalWalletEnabled).toBe(true);
            expect(virtualCard!.physicalCardId).toBe('physical-card-1');
            expect(virtualCard!.temporary).toBe(false);
        });

        it('should respect temporary flag', async () => {
            // Setup a physical card
            const physicalCard: Card = {
                id: 'physical-card-1',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '12/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById to return the physical card
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(physicalCard);

            // Mock createCardForAccount
            vi.spyOn(cardRepo, 'createCardForAccount').mockImplementation(
                async (accountId, data) => {
                    return {
                        id: 'virtual-card-1',
                        accountId,
                        ...data
                    } as Card;
                }
            );

            // Create temporary virtual card
            const virtualCard = await cardRepo.createVirtualCard('physical-card-1', true);

            // Verify temporary settings
            expect(virtualCard!.temporary).toBe(true);
            expect(virtualCard!.expiresAfterOneUse).toBe(true);
        });

        it('should return undefined for non-existent physical card', async () => {
            // Mock getById to return undefined
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(undefined);

            // Try to create virtual card for non-existent physical card
            const virtualCard = await cardRepo.createVirtualCard('non-existent-card');

            // Verify result
            expect(virtualCard).toBeUndefined();
        });
    });

    describe('validateCardNumber', () => {
        it('should validate card numbers using Luhn algorithm', () => {
            // Test valid Visa number
            expect(cardRepo.validateCardNumber('4532015112830366')).toBe(true);

            // Test valid MasterCard number
            expect(cardRepo.validateCardNumber('5555555555554444')).toBe(true);

            // Test valid AMEX number
            expect(cardRepo.validateCardNumber('371449635398431')).toBe(true);

            // Test valid number with spaces
            expect(cardRepo.validateCardNumber('4532 0151 1283 0366')).toBe(true);

            // Test valid number with dashes
            expect(cardRepo.validateCardNumber('4532-0151-1283-0366')).toBe(true);

            // Test invalid numbers
            expect(cardRepo.validateCardNumber('1234567890123456')).toBe(false); // Fails Luhn check
            expect(cardRepo.validateCardNumber('123')).toBe(false); // Too short
            expect(cardRepo.validateCardNumber('12345678901234567890')).toBe(false); // Too long
        });
    });

    describe('getCardsByType', () => {
        it('should filter cards by type', async () => {
            // Setup cards of different types
            const cards: Card[] = [
                {
                    id: 'debit1',
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 1111',
                    lastFourDigits: '1111',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                },
                {
                    id: 'credit1',
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 2222',
                    lastFourDigits: '2222',
                    type: 'credit',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 5000,
                    monthlyLimit: 50000
                },
                {
                    id: 'debit2',
                    accountId: 'acc2',
                    cardNumber: '**** **** **** 3333',
                    lastFourDigits: '3333',
                    type: 'debit',
                    expiryDate: '12/25',
                    cardholderName: 'Other User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'mastercard',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                },
                {
                    id: 'virtual1',
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 4444',
                    lastFourDigits: '4444',
                    type: 'virtual',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 500,
                    monthlyLimit: 5000
                }
            ];

            // Mock getAll
            vi.spyOn(cardRepo, 'getAll').mockResolvedValue(cards);

            // Get cards by type
            const debitCards = await cardRepo.getCardsByType('debit');
            const creditCards = await cardRepo.getCardsByType('credit');
            const virtualCards = await cardRepo.getCardsByType('virtual');
            const prepaidCards = await cardRepo.getCardsByType('prepaid');

            // Verify filtering
            expect(debitCards).toHaveLength(2);
            expect(debitCards.every(c => c.type === 'debit')).toBe(true);

            expect(creditCards).toHaveLength(1);
            expect(creditCards[0].id).toBe('credit1');

            expect(virtualCards).toHaveLength(1);
            expect(virtualCards[0].id).toBe('virtual1');

            expect(prepaidCards).toHaveLength(0);
        });
    });

    describe('card status operations', () => {
        it('should activate a pending card', async () => {
            // Setup a pending card
            const pendingCard: Card = {
                id: 'pending-card',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '12/25',
                cardholderName: 'Test User',
                status: 'pending',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(pendingCard);

            // Mock update
            const updatedCard = { ...pendingCard, status: 'active' as CardStatus };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(updatedCard);

            // Activate card
            const result = await cardRepo.activateCard('pending-card');

            // Verify result
            expect(result).toBeDefined();
            expect(result!.status).toBe('active');

            // Verify update was called correctly
            expect(cardRepo.update).toHaveBeenCalledWith('pending-card', { status: 'active' });
        });

        it('should not activate a non-pending card', async () => {
            // Setup an already active card
            const activeCard: Card = {
                id: 'active-card',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '12/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(activeCard);
            vi.spyOn(cardRepo, 'update').mockResolvedValue(activeCard);

            // Activate card
            const result = await cardRepo.activateCard('active-card');

            // Verify result is undefined
            expect(result).toBeUndefined();

            // Verify update was not called
            expect(cardRepo.update).not.toHaveBeenCalled();
        });

        it('should report card as lost or stolen', async () => {
            // Setup a card
            const card: Card = {
                id: 'test-card',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '12/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(card);

            // Mock update
            const blockedCard = { ...card, status: 'blocked' as CardStatus, frozen: true };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(blockedCard);

            // Report card as lost
            const result = await cardRepo.reportCardLostOrStolen('test-card', 'lost');

            // Verify result
            expect(result).toBeDefined();
            expect(result!.status).toBe('blocked');
            expect(result!.frozen).toBe(true);

            // Verify update was called correctly
            expect(cardRepo.update).toHaveBeenCalledWith('test-card', {
                status: 'blocked',
                frozen: true
            });
        });

        it('should toggle freeze status on a card', async () => {
            // Setup an active card
            const card: Card = {
                id: 'test-card',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '12/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2023-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,  // Initially not frozen
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(card);

            // Mock update
            const frozenCard = { ...card, frozen: true };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(frozenCard);

            // Toggle freeze
            const result = await cardRepo.toggleCardFreeze('test-card');

            // Verify result
            expect(result).toBeDefined();
            expect(result!.frozen).toBe(true);

            // Verify update was called correctly
            expect(cardRepo.update).toHaveBeenCalledWith('test-card', { frozen: true });

            // Now mock getting an already frozen card
            const frozenCardOriginal: Card = { ...card, frozen: true };
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(frozenCardOriginal);

            // Mock update for unfreezing
            const unfrozenCard = { ...frozenCardOriginal, frozen: false };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(unfrozenCard);

            // Toggle freeze again (should unfreeze)
            const unfreezeResult = await cardRepo.toggleCardFreeze('test-card');

            // Verify result
            expect(unfreezeResult).toBeDefined();
            expect(unfreezeResult!.frozen).toBe(false);

            // Verify update was called correctly
            expect(cardRepo.update).toHaveBeenCalledWith('test-card', { frozen: false });
        });
    });

    describe('replaceCard', () => {
        it('should replace a card with new card number and expiry date', async () => {
            // Setup an existing card
            const existingCard: Card = {
                id: 'old-card',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '05/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2022-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock getById
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(existingCard);

            // Mock Math.random for predictable new card number
            vi.spyOn(Math, 'random').mockReturnValue(0.5678);

            // Expected new "last 4 digits" based on our mocked Math.random
            const expectedLastFour = '5678';

            // Mock update
            const replacementCard = {
                ...existingCard,
                cardNumber: `**** **** **** ${expectedLastFour}`,
                lastFourDigits: expectedLastFour,
                status: 'pending' as CardStatus,
                expiryDate: '04/27', // 4 years from April 2023 (our mocked date)
                issueDate: new Date(TEST_TIMESTAMP).toISOString()
            };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(replacementCard);

            // Replace card
            const result = await cardRepo.replaceCard('old-card');

            // Verify result
            expect(result).toBeDefined();
            expect(result!.cardNumber).toBe(`**** **** **** ${expectedLastFour}`);
            expect(result!.lastFourDigits).toBe(expectedLastFour);
            expect(result!.status).toBe('pending');
            expect(result!.expiryDate).toBe('04/27');
            expect(result!.issueDate).toBe(new Date(TEST_TIMESTAMP).toISOString());

            // Verify original account ID and other properties were preserved
            expect(result!.accountId).toBe(existingCard.accountId);
            expect(result!.type).toBe(existingCard.type);
            expect(result!.cardholderName).toBe(existingCard.cardholderName);
        });

        it('should return undefined if card does not exist', async () => {
            // Mock getById to return undefined
            vi.spyOn(cardRepo, 'getById').mockResolvedValue(undefined);

            vi.spyOn(cardRepo, 'update');

            // Try to replace non-existent card
            const result = await cardRepo.replaceCard('non-existent-card');

            // Verify result
            expect(result).toBeUndefined();

            // Verify update was not called
            expect(cardRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('updateCardLimits', () => {
        it('should update card limits', async () => {
            // Setup an existing card
            const existingCard: Card = {
                id: 'card-id',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '05/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2022-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock update
            const updatedCard = {
                ...existingCard,
                dailyLimit: 2000,
                monthlyLimit: 20000
            };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(updatedCard);

            // Update limits
            const result = await cardRepo.updateCardLimits('card-id', 2000, 20000);

            // Verify result
            expect(result).toBeDefined();
            expect(result!.dailyLimit).toBe(2000);
            expect(result!.monthlyLimit).toBe(20000);

            // Verify update was called with only limit updates
            expect(cardRepo.update).toHaveBeenCalledWith('card-id', {
                dailyLimit: 2000,
                monthlyLimit: 20000
            });
        });

        it('should update only the provided limits', async () => {
            // Setup an existing card
            const existingCard: Card = {
                id: 'card-id',
                accountId: 'acc1',
                cardNumber: '**** **** **** 1234',
                lastFourDigits: '1234',
                type: 'debit',
                expiryDate: '05/25',
                cardholderName: 'Test User',
                status: 'active',
                issueDate: '2022-01-01T00:00:00Z',
                network: 'visa',
                contactless: true,
                frozen: false,
                dailyLimit: 1000,
                monthlyLimit: 10000
            };

            // Mock update - update only daily limit
            const updatedCard = {
                ...existingCard,
                dailyLimit: 2000
            };
            vi.spyOn(cardRepo, 'update').mockResolvedValue(updatedCard);

            // Update only daily limit
            const result = await cardRepo.updateCardLimits('card-id', 2000);

            // Verify result
            expect(result!.dailyLimit).toBe(2000);
            expect(result!.monthlyLimit).toBe(10000); // Unchanged

            // Verify update was called with only daily limit
            expect(cardRepo.update).toHaveBeenCalledWith('card-id', {
                dailyLimit: 2000
            });
        });
    });

    describe('convenience methods', () => {
        it('getCreditCards should return only credit cards', async () => {
            // Mock getCardsByType
            const mockCreditCards = [
                {
                    id: 'credit-card-1',
                    type: 'credit',
                    // ...other required props
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 1111',
                    lastFourDigits: '1111',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 5000,
                    monthlyLimit: 20000
                }
            ] as Card[];

            vi.spyOn(cardRepo, 'getCardsByType').mockResolvedValue(mockCreditCards);

            // Call getCreditCards
            const result = await cardRepo.getCreditCards();

            // Verify result
            expect(result).toEqual(mockCreditCards);

            // Verify getCardsByType was called with 'credit'
            expect(cardRepo.getCardsByType).toHaveBeenCalledWith('credit');
        });

        it('getDebitCards should return only debit cards', async () => {
            // Mock getCardsByType
            const mockDebitCards = [
                {
                    id: 'debit-card-1',
                    type: 'debit',
                    // ...other required props
                    accountId: 'acc1',
                    cardNumber: '**** **** **** 2222',
                    lastFourDigits: '2222',
                    expiryDate: '12/25',
                    cardholderName: 'Test User',
                    status: 'active',
                    issueDate: '2023-01-01T00:00:00Z',
                    network: 'visa',
                    contactless: true,
                    frozen: false,
                    dailyLimit: 1000,
                    monthlyLimit: 10000
                }
            ] as Card[];

            vi.spyOn(cardRepo, 'getCardsByType').mockResolvedValue(mockDebitCards);

            // Call getDebitCards
            const result = await cardRepo.getDebitCards();

            // Verify result
            expect(result).toEqual(mockDebitCards);

            // Verify getCardsByType was called with 'debit'
            expect(cardRepo.getCardsByType).toHaveBeenCalledWith('debit');
        });
    });
});