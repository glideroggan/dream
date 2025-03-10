import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// Mock repository-service to avoid circular dependencies
vi.mock('../../src/services/repository-service', () => ({
    repositoryService: {
        getProductRepository: vi.fn(),
    }
}));

// Mock the product mock generator
vi.mock('../../src/repositories/mock/product-mock', () => ({
    generateMockProducts: vi.fn(() => [
        {
            id: 'checking-account',
            name: 'Checking Account',
            type: 'account',
            category: 'banking',
            description: 'Standard checking account',
            features: ['Free online banking', 'Debit card'],
            active: true,
            addedDate: '2023-01-01T00:00:00Z',
            lastUpdated: '2023-01-01T00:00:00Z'
        },
        {
            id: 'savings-account',
            name: 'Savings Account',
            type: 'account',
            category: 'banking',
            description: 'High-interest savings account',
            features: ['Competitive interest rates', 'No monthly fees'],
            active: true,
            addedDate: '2023-01-01T00:00:00Z',
            lastUpdated: '2023-01-01T00:00:00Z'
        },
        {
            id: 'credit-card-standard',
            name: 'Standard Credit Card',
            type: 'card',
            category: 'payments',
            description: 'Basic credit card with no annual fee',
            active: true,
            addedDate: '2023-01-01T00:00:00Z',
            lastUpdated: '2023-01-01T00:00:00Z'
        },
        {
            id: 'inactive-product',
            name: 'Inactive Product',
            type: 'service',
            category: 'services',
            description: 'This product is not active',
            active: false,
            addedDate: '2023-01-01T00:00:00Z',
            lastUpdated: '2023-01-01T00:00:00Z'
        }
    ])
}));

// Import after mocks
import { ProductRepository } from '../../src/repositories/product-repository';
import { StorageService } from '../../src/services/storage-service';
import { UserService } from '../../src/services/user-service';
import { ProductEntity, ProductCategory, ProductEntityType } from '../../src/repositories/models/product-models';
import { setupDateAndRandomMocks, cleanupDateAndRandomMocks } from '../utils/test-helpers';

describe('ProductRepository', () => {
    // Setup variables
    let mockStorage: Partial<StorageService>;
    let mockUserService: Partial<UserService>;
    let productRepo: ProductRepository;
    let storageData: Record<string, any> = {};
    
    // Timestamp for consistent dates in tests
    const TEST_TIMESTAMP = new Date('2023-04-01T10:30:00Z').getTime();
    const ISO_DATE_STRING = new Date(TEST_TIMESTAMP).toISOString();

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
        productRepo = new ProductRepository(
            mockStorage as StorageService,
            mockUserService as UserService
        );

        // Skip the initializeMockData by providing some test products directly
        // Only for testing methods - the actual initialization is tested separately
        vi.spyOn(productRepo as any, 'initializeMockData').mockImplementation(() => {});
    });

    afterEach(() => {
        // Use our shared cleanup helper
        cleanupDateAndRandomMocks();
    });

    describe('addOrUpdateProduct', () => {
        it('should create a new product when it does not exist', async () => {
            // Setup spy on create
            const createSpy = vi.spyOn(productRepo, 'create').mockImplementation(async (entity: any) => {
                return {
                    id: 'new-product',
                    ...entity
                };
            });

            // Call addOrUpdateProduct
            const result = await productRepo.addOrUpdateProduct({
                id: 'new-product',
                name: 'New Test Product',
                type: 'service' as ProductEntityType,
                description: 'A new test product'
            });

            // Verify result
            expect(result).toHaveProperty('id', 'new-product');
            expect(result).toHaveProperty('name', 'New Test Product');
            expect(result).toHaveProperty('type', 'service');
            expect(result).toHaveProperty('description', 'A new test product');
            expect(result).toHaveProperty('addedDate');
            expect(result).toHaveProperty('lastUpdated');

            // Verify create was called
            expect(createSpy).toHaveBeenCalled();
        });

        it('should update an existing product when it exists', async () => {
            // Setup an existing product
            const existingProduct: ProductEntity = {
                id: 'existing-product',
                name: 'Existing Product',
                type: ProductEntityType.SERVICE,
                category: ProductCategory.SERVICES,
                description: 'This is an existing product',
                active: true,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            // Mock getById to return the existing product
            vi.spyOn(productRepo, 'getById').mockResolvedValue(existingProduct);

            // Mock update
            const updateSpy = vi.spyOn(productRepo, 'update').mockImplementation(async (id, data) => {
                return {
                    ...existingProduct,
                    ...data,
                    id
                };
            });

            // Call addOrUpdateProduct with updates
            const result = await productRepo.addOrUpdateProduct({
                id: 'existing-product',
                name: 'Updated Product Name',
                description: 'Updated description',
                type: ProductEntityType.SERVICE,
            });

            // Verify result
            expect(result).toHaveProperty('id', 'existing-product');
            expect(result).toHaveProperty('name', 'Updated Product Name');
            expect(result).toHaveProperty('description', 'Updated description');
            expect(result).toHaveProperty('lastUpdated');
            
            // Original properties should be preserved
            expect(result.type).toBe(ProductEntityType.SERVICE);
            expect(result.category).toBe(ProductCategory.SERVICES);
            expect(result.active).toBe(true);
            expect(result.addedDate).toBe('2023-01-01T00:00:00Z');

            // Verify update was called
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('getActiveProducts', () => {
        it('should return only active products', async () => {
            // Setup test products
            const products: ProductEntity[] = [
                {
                    id: 'active-1',
                    name: 'Active Product 1',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'active-2',
                    name: 'Active Product 2',
                    type: ProductEntityType.CARD,
                    category: ProductCategory.PAYMENTS,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'inactive-1',
                    name: 'Inactive Product',
                    type: ProductEntityType.SERVICE,
                    category: ProductCategory.SERVICES,
                    active: false,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                }
            ];

            // Mock getAll
            vi.spyOn(productRepo, 'getAll').mockResolvedValue(products);

            // Get active products
            const result = await productRepo.getActiveProducts();

            // Verify only active products are returned
            expect(result).toHaveLength(2);
            expect(result.map(p => p.id)).toEqual(['active-1', 'active-2']);
            expect(result.every(p => p.active)).toBe(true);
        });
    });

    describe('getByCategory', () => {
        it('should return active products filtered by category', async () => {
            // Setup test products
            const products: ProductEntity[] = [
                {
                    id: 'banking-1',
                    name: 'Banking Product 1',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'banking-2',
                    name: 'Banking Product 2',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'payments-1',
                    name: 'Payments Product',
                    type: ProductEntityType.CARD,
                    category: ProductCategory.PAYMENTS,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'banking-inactive',
                    name: 'Inactive Banking Product',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: false,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                }
            ];

            // Mock getAll
            vi.spyOn(productRepo, 'getAll').mockResolvedValue(products);

            // Get products by category
            const bankingProducts = await productRepo.getByCategory(ProductCategory.BANKING);
            const paymentProducts = await productRepo.getByCategory(ProductCategory.PAYMENTS);

            // Verify banking products
            expect(bankingProducts).toHaveLength(2);
            expect(bankingProducts.map(p => p.id)).toEqual(['banking-1', 'banking-2']);
            expect(bankingProducts.every(p => p.category === ProductCategory.BANKING && p.active)).toBe(true);

            // Verify payment products
            expect(paymentProducts).toHaveLength(1);
            expect(paymentProducts[0].id).toBe('payments-1');
            expect(paymentProducts[0].category).toBe(ProductCategory.PAYMENTS);
        });
    });

    describe('getByEntityType', () => {
        it('should return active products filtered by entity type', async () => {
            // Setup test products
            const products: ProductEntity[] = [
                {
                    id: 'account-1',
                    name: 'Account 1',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'account-2',
                    name: 'Account 2',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'card-1',
                    name: 'Credit Card',
                    type: ProductEntityType.CARD,
                    category: ProductCategory.PAYMENTS,
                    active: true,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                },
                {
                    id: 'account-inactive',
                    name: 'Inactive Account',
                    type: ProductEntityType.ACCOUNT,
                    category: ProductCategory.BANKING,
                    active: false,
                    addedDate: '2023-01-01T00:00:00Z',
                    lastUpdated: '2023-01-01T00:00:00Z'
                }
            ];

            // Mock getAll
            vi.spyOn(productRepo, 'getAll').mockResolvedValue(products);

            // Get products by entity type
            const accountProducts = await productRepo.getByEntityType(ProductEntityType.ACCOUNT);
            const cardProducts = await productRepo.getByEntityType(ProductEntityType.CARD);

            // Verify account products
            expect(accountProducts).toHaveLength(2);
            expect(accountProducts.map(p => p.id)).toEqual(['account-1', 'account-2']);
            expect(accountProducts.every(p => p.type === ProductEntityType.ACCOUNT && p.active)).toBe(true);

            // Verify card products
            expect(cardProducts).toHaveLength(1);
            expect(cardProducts[0].id).toBe('card-1');
            expect(cardProducts[0].type).toBe(ProductEntityType.CARD);
        });
    });

    describe('getRelatedProducts', () => {
        it('should return related products for a given product id', async () => {
            // Setup a product with related products
            const mainProduct: ProductEntity = {
                id: 'main-product',
                name: 'Main Product',
                type: ProductEntityType.ACCOUNT,
                category: ProductCategory.BANKING,
                active: true,
                relatedProductIds: ['related-1', 'related-2', 'inactive-related'],
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            const relatedProduct1: ProductEntity = {
                id: 'related-1',
                name: 'Related Product 1',
                type: ProductEntityType.CARD,
                category: ProductCategory.PAYMENTS,
                active: true,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            const relatedProduct2: ProductEntity = {
                id: 'related-2',
                name: 'Related Product 2',
                type: ProductEntityType.SERVICE,
                category: ProductCategory.SERVICES,
                active: true,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            const inactiveRelated: ProductEntity = {
                id: 'inactive-related',
                name: 'Inactive Related Product',
                type: ProductEntityType.SERVICE,
                category: ProductCategory.SERVICES,
                active: false,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            // Mock getById to return different products
            vi.spyOn(productRepo, 'getById').mockImplementation(async (id: string) => {
                if (id === 'main-product') return mainProduct;
                if (id === 'related-1') return relatedProduct1;
                if (id === 'related-2') return relatedProduct2;
                if (id === 'inactive-related') return inactiveRelated;
                return undefined;
            });

            // Get related products
            const relatedProducts = await productRepo.getRelatedProducts('main-product');

            // Verify related products
            expect(relatedProducts).toHaveLength(2);
            expect(relatedProducts.map(p => p.id)).toContain('related-1');
            expect(relatedProducts.map(p => p.id)).toContain('related-2');
            
            // Should not include inactive products
            expect(relatedProducts.map(p => p.id)).not.toContain('inactive-related');
        });

        it('should return empty array for a product with no related products', async () => {
            // Setup a product with no related products
            const product: ProductEntity = {
                id: 'solo-product',
                name: 'Product Without Relations',
                type: ProductEntityType.ACCOUNT,
                category: ProductCategory.BANKING,
                active: true,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            // Mock getById
            vi.spyOn(productRepo, 'getById').mockResolvedValue(product);

            // Get related products
            const relatedProducts = await productRepo.getRelatedProducts('solo-product');

            // Verify empty result
            expect(relatedProducts).toEqual([]);
        });

        it('should return empty array for non-existent product', async () => {
            // Mock getById to return undefined
            vi.spyOn(productRepo, 'getById').mockResolvedValue(undefined);

            // Get related products for non-existent product
            const relatedProducts = await productRepo.getRelatedProducts('non-existent');

            // Verify empty result
            expect(relatedProducts).toEqual([]);
        });
    });

    describe('hasActiveProduct', () => {
        it('should return true if product exists and is active', async () => {
            // Load from storage spy
            vi.spyOn(productRepo as any, 'loadFromStorage').mockResolvedValue(undefined);

            // Setup an active product
            const activeProduct: ProductEntity = {
                id: 'test-product',
                name: 'Test Product',
                type: ProductEntityType.SERVICE,
                category: ProductCategory.SERVICES,
                active: true,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            // Mock getById
            vi.spyOn(productRepo, 'getById').mockResolvedValue(activeProduct);

            // Check if product is active
            const result = await productRepo.hasActiveProduct('test-product');

            // Verify result
            expect(result).toBe(true);
        });

        it('should return false if product exists but is inactive', async () => {
            // Load from storage spy
            vi.spyOn(productRepo as any, 'loadFromStorage').mockResolvedValue(undefined);

            // Setup an inactive product
            const inactiveProduct: ProductEntity = {
                id: 'inactive-product',
                name: 'Inactive Product',
                type: ProductEntityType.SERVICE,
                category: ProductCategory.SERVICES,
                active: false,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            // Mock getById
            vi.spyOn(productRepo, 'getById').mockResolvedValue(inactiveProduct);

            // Check if product is active
            const result = await productRepo.hasActiveProduct('inactive-product');

            // Verify result
            expect(result).toBe(false);
        });

        it('should return false if product does not exist', async () => {
            // Load from storage spy
            vi.spyOn(productRepo as any, 'loadFromStorage').mockResolvedValue(undefined);

            // Mock getById to return undefined
            vi.spyOn(productRepo, 'getById').mockResolvedValue(undefined);

            // Check if non-existent product is active
            const result = await productRepo.hasActiveProduct('non-existent');

            // Verify result
            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            // Load from storage spy that throws error
            vi.spyOn(productRepo as any, 'loadFromStorage').mockRejectedValue(new Error('Test error'));

            // Check if product is active
            const result = await productRepo.hasActiveProduct('error-test');

            // Verify result on error
            expect(result).toBe(false);
        });
    });

    describe('deactivateProduct', () => {
        it('should deactivate an active product', async () => {
            // Setup an active product
            const activeProduct: ProductEntity = {
                id: 'active-product',
                name: 'Active Product',
                type: ProductEntityType.SERVICE,
                category: ProductCategory.SERVICES,
                active: true,
                addedDate: '2023-01-01T00:00:00Z',
                lastUpdated: '2023-01-01T00:00:00Z'
            };

            // Mock getById
            vi.spyOn(productRepo, 'getById').mockResolvedValue(activeProduct);

            // Mock update
            const updateSpy = vi.spyOn(productRepo, 'update').mockImplementation(async (id, data) => {
                return {
                    ...activeProduct,
                    ...data,
                    id
                };
            });

            // Deactivate product
            const result = await productRepo.deactivateProduct('active-product');

            // Verify result
            expect(result).toBe(true);

            // Verify update was called with correct params
            expect(updateSpy).toHaveBeenCalledWith('active-product', {
                active: false,
                lastUpdated: expect.any(String)
            });
        });

        it('should return false if product does not exist', async () => {
            // Mock getById to return undefined
            vi.spyOn(productRepo, 'getById').mockResolvedValue(undefined);

            // Mock update
            const updateSpy = vi.spyOn(productRepo, 'update');

            // Try to deactivate non-existent product
            const result = await productRepo.deactivateProduct('non-existent');

            // Verify result
            expect(result).toBe(false);

            // Verify update was not called
            expect(updateSpy).not.toHaveBeenCalled();
        });
    });
});
