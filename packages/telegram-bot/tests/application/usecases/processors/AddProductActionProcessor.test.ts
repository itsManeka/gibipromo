import { AddProductActionProcessor } from '../../../../src/application/usecases/processors/AddProductActionProcessor';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { UserRepository } from '../../../../src/application/ports/UserRepository';
import { ProductUserRepository } from '../../../../src/application/ports/ProductUserRepository';
import { AmazonProduct, AmazonProductAPI } from '../../../../src/application/ports/AmazonProductAPI';
import { User } from '@gibipromo/shared/dist/entities/User';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ActionType, AddProductAction } from '@gibipromo/shared/dist/entities/Action';
import {
	createTestUser,
	createTestAction,
	createAmazonProduct,
	createProduct
} from '../../../test-helpers/factories';

jest.mock('../../../../src/application/ports/ActionRepository');
jest.mock('../../../../src/application/ports/ProductRepository');
jest.mock('../../../../src/application/ports/UserRepository');
jest.mock('../../../../src/application/ports/ProductUserRepository');
jest.mock('../../../../src/application/ports/AmazonProductAPI');

describe('AddProductActionProcessor', () => {
	const TEST_ASIN = 'B012345678';

	let mockActionRepo: jest.Mocked<ActionRepository>;
	let mockProductRepo: jest.Mocked<ProductRepository>;
	let mockUserRepo: jest.Mocked<UserRepository>;
	let mockProductUserRepo: jest.Mocked<ProductUserRepository>;
	let mockAmazonApi: jest.Mocked<AmazonProductAPI>;
	let processor: AddProductActionProcessor;

	let testUser: User;
	let testAction: AddProductAction;
	let amazonProduct: AmazonProduct;
	let existingProduct: Product;

	beforeEach(() => {
		mockActionRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByType: jest.fn(),
			findPendingByType: jest.fn(),
			markProcessed: jest.fn()
		};

		mockProductRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByLink: jest.fn(),
			getNextProductsToCheck: jest.fn()
		};

	mockUserRepo = {
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		findById: jest.fn(),
		findByUsername: jest.fn(),
		findByTelegramId: jest.fn(),
		findByEmail: jest.fn(),
		updateSessionId: jest.fn(),
		setEnabled: jest.fn()
	};		mockProductUserRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByProductAndUser: jest.fn(),
			findByProductId: jest.fn(),
			findByUserId: jest.fn(),
			upsert: jest.fn(),
			updateDesiredPrice: jest.fn(),
			removeByProductAndUser: jest.fn()
		};

		mockAmazonApi = {
			getProduct: jest.fn(),
			getProducts: jest.fn()
		};

		// Create test data
		testUser = createTestUser();
		testAction = createTestAction(TEST_ASIN);
		amazonProduct = createAmazonProduct(TEST_ASIN);
		existingProduct = createProduct(TEST_ASIN);

		processor = new AddProductActionProcessor(
			mockActionRepo,
			mockProductRepo,
			mockProductUserRepo,
			mockUserRepo,
			mockAmazonApi,
			{
				handlePriceChange: jest.fn()
			} as any
		);
	});

	describe('process', () => {
		describe('handling new products', () => {
			it('should create a new product when it does not exist', async () => {
				// Setup
				mockUserRepo.findById.mockResolvedValue(testUser);
				mockProductRepo.findById.mockResolvedValue(null);
				mockAmazonApi.getProducts.mockResolvedValue(new Map([[TEST_ASIN, amazonProduct]]));

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockProductRepo.create).toHaveBeenCalledWith(expect.objectContaining({
					id: TEST_ASIN,
					title: amazonProduct.title,
					price: amazonProduct.currentPrice,
					full_price: amazonProduct.fullPrice,
					in_stock: amazonProduct.inStock,
					image: amazonProduct.imageUrl,
					preorder: amazonProduct.isPreOrder
				}));
				expect(mockProductUserRepo.upsert).toHaveBeenCalledWith(expect.objectContaining({
					product_id: TEST_ASIN,
					user_id: testUser.id
				}));
				expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(testAction.id);
			});

			it('should handle product not found on Amazon', async () => {
				// Setup
				mockUserRepo.findById.mockResolvedValue(testUser);
				mockProductRepo.findById.mockResolvedValue(null);
				mockAmazonApi.getProducts.mockResolvedValue(new Map());

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockProductRepo.create).not.toHaveBeenCalled();
				expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(testAction.id);
			});
		});

		describe('handling existing products', () => {
			it('should update product and create notification when price decreases', async () => {
				// Setup
				mockUserRepo.findById.mockResolvedValue(testUser);
				mockProductRepo.findById.mockResolvedValue(existingProduct);
				mockAmazonApi.getProducts.mockResolvedValue(new Map([[TEST_ASIN, amazonProduct]]));

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockProductRepo.update).toHaveBeenCalledWith(expect.objectContaining({
					id: TEST_ASIN,
					price: amazonProduct.currentPrice,
					full_price: amazonProduct.fullPrice
				}));
				expect(mockActionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
					type: ActionType.NOTIFY_PRICE,
					value: TEST_ASIN
				}));
			});

			it('should update product without notification when price increases', async () => {
				// Setup
				const higherPriceProduct = createAmazonProduct(TEST_ASIN, { currentPrice: 100 });
				mockUserRepo.findById.mockResolvedValue(testUser);
				mockProductRepo.findById.mockResolvedValue(existingProduct);
				mockAmazonApi.getProducts.mockResolvedValue(new Map([[TEST_ASIN, higherPriceProduct]]));

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockProductRepo.update).toHaveBeenCalled();
				expect(mockActionRepo.create).not.toHaveBeenCalled();
			});

			it('should update product without notification when price stays the same', async () => {
				// Setup
				const samePriceProduct = createAmazonProduct(TEST_ASIN, { currentPrice: existingProduct.price });
				mockUserRepo.findById.mockResolvedValue(testUser);
				mockProductRepo.findById.mockResolvedValue(existingProduct);
				mockAmazonApi.getProducts.mockResolvedValue(new Map([[TEST_ASIN, samePriceProduct]]));

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockProductRepo.update).toHaveBeenCalled();
				expect(mockActionRepo.create).not.toHaveBeenCalled();
			});
		});

		describe('validation and error handling', () => {
			it('should mark action as processed when link is invalid', async () => {
				// Setup
				const invalidAction = createTestAction(TEST_ASIN, {
					value: 'https://amazon.com.br/invalid/link'
				});

				// Execute
				await processor.process(invalidAction);

				// Verify
				expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
				expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(invalidAction.id);
			});

			it('should mark action as processed when user does not exist', async () => {
				// Setup
				mockUserRepo.findById.mockResolvedValue(null);

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
				expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(testAction.id);
			});

			it('should mark action as processed when user is disabled', async () => {
				// Setup
				const disabledUser = createTestUser({ enabled: false });
				mockUserRepo.findById.mockResolvedValue(disabledUser);

				// Execute
				await processor.process(testAction);

				// Verify
				expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
				expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(testAction.id);
			});

			it('should handle errors from Amazon API gracefully', async () => {
				// Setup
				mockUserRepo.findById.mockResolvedValue(testUser);
				mockProductRepo.findById.mockResolvedValue(null);
				mockAmazonApi.getProducts.mockRejectedValue(new Error('API Error'));

				// Execute & Verify
				await expect(processor.process(testAction)).rejects.toThrow('API Error');
			});
		});
	});

	describe('processNext', () => {
		it('should process multiple actions in batch', async () => {
			// Setup
			const secondAction = createTestAction('B087654321');
			const secondProduct = createAmazonProduct('B087654321');

			mockActionRepo.findPendingByType.mockResolvedValue([testAction, secondAction]);
			mockUserRepo.findById.mockResolvedValue(testUser);
			mockProductRepo.findById.mockResolvedValue(null);

			const amazonProducts = new Map();
			amazonProducts.set(TEST_ASIN, amazonProduct);
			amazonProducts.set('B087654321', secondProduct);
			mockAmazonApi.getProducts.mockResolvedValue(amazonProducts);

			// Execute
			const result = await processor.processNext(10);

			// Verify
			expect(result).toBe(2);
			expect(mockAmazonApi.getProducts).toHaveBeenCalledWith([TEST_ASIN, 'B087654321']);
			expect(mockProductRepo.create).toHaveBeenCalledTimes(2);
			expect(mockActionRepo.markProcessed).toHaveBeenCalledTimes(2);
		});

		it('should return 0 when no pending actions exist', async () => {
			// Setup
			mockActionRepo.findPendingByType.mockResolvedValue([]);

			// Execute
			const result = await processor.processNext(10);

			// Verify
			expect(result).toBe(0);
			expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
		});

		it('should mark all actions as processed when no valid ASINs found', async () => {
			// Setup
			const invalidActions = [
				createTestAction(TEST_ASIN, { value: 'https://amazon.com.br/invalid/1' }),
				createTestAction(TEST_ASIN, { value: 'https://amazon.com.br/invalid/2' })
			];
			mockActionRepo.findPendingByType.mockResolvedValue(invalidActions);

			// Execute
			const result = await processor.processNext(10);

			// Verify
			expect(result).toBe(2);
			expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).toHaveBeenCalledTimes(2);
		});

		it('should handle batch processing errors gracefully', async () => {
			// Setup
			mockActionRepo.findPendingByType.mockResolvedValue([testAction]);
			mockUserRepo.findById.mockResolvedValue(testUser);
			mockProductRepo.findById.mockResolvedValue(null);
			mockAmazonApi.getProducts.mockRejectedValue(new Error('API Error'));

			// Execute
			const result = await processor.processNext(10);

			// Verify
			expect(result).toBe(1); // Should count as processed despite error
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(testAction.id);
		});
	});

	describe('Short URL Support', () => {
		beforeEach(() => {
			// Mock direto da função na instância do processor
			jest.spyOn(processor as any, 'resolveUrl').mockImplementation(async (...args: unknown[]) => {
				const url = args[0] as string;
				if (url === 'https://amzn.to/43PBc2v') {
					return 'https://www.amazon.com.br/dp/B012345678';
				}
				if (url === 'https://amzn.to/invalid') {
					return null;
				}
				if (url === 'https://amzn.to/external') {
					return null;
				}
				if (url === 'https://amzn.to/error') {
					throw new Error('Network error');
				}
				if (url === 'https://www.amazon.com.br/dp/B012345678') {
					return url;
				}
				return url;
			});
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should resolve short URLs before processing', async () => {
			// Setup
			const shortUrl = 'https://amzn.to/43PBc2v';
			const shortUrlAction = createTestAction(TEST_ASIN, { value: shortUrl });

			mockUserRepo.findById.mockResolvedValue(testUser);
			mockProductRepo.findById.mockResolvedValue(null);
			mockAmazonApi.getProducts.mockResolvedValue(new Map([[TEST_ASIN, amazonProduct]]));

			// Execute
			await processor.process(shortUrlAction);

			// Verify
			expect(mockAmazonApi.getProducts).toHaveBeenCalledWith([TEST_ASIN]);
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(shortUrlAction.id);
		});

		it('should mark action as processed when URL resolution fails', async () => {
			// Setup
			const shortUrl = 'https://amzn.to/invalid';
			const shortUrlAction = createTestAction(TEST_ASIN, { value: shortUrl });

			mockUserRepo.findById.mockResolvedValue(testUser);

			// Execute
			await processor.process(shortUrlAction);

			// Verify - should just mark as processed, no error action created
			expect(mockActionRepo.create).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(shortUrlAction.id);
			expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
		});

		it('should mark action as processed when resolved URL is not Amazon', async () => {
			// Setup
			const shortUrl = 'https://amzn.to/external';
			const shortUrlAction = createTestAction(TEST_ASIN, { value: shortUrl });

			mockUserRepo.findById.mockResolvedValue(testUser);

			// Execute
			await processor.process(shortUrlAction);

			// Verify - should just mark as processed, no error action created
			expect(mockActionRepo.create).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(shortUrlAction.id);
			expect(mockAmazonApi.getProducts).not.toHaveBeenCalled();
		});

		it('should handle URL resolution errors gracefully', async () => {
			// Setup
			const shortUrl = 'https://amzn.to/error';
			const shortUrlAction = createTestAction(TEST_ASIN, { value: shortUrl });

			mockUserRepo.findById.mockResolvedValue(testUser);

			// Execute & Verify - should throw
			await expect(processor.process(shortUrlAction)).rejects.toThrow('Network error');
		});

		it('should process regular Amazon URLs without URL resolution', async () => {
			// Setup
			const amazonUrl = 'https://www.amazon.com.br/dp/B012345678';
			const amazonUrlAction = createTestAction(TEST_ASIN, { value: amazonUrl });

			mockUserRepo.findById.mockResolvedValue(testUser);
			mockProductRepo.findById.mockResolvedValue(null);
			mockAmazonApi.getProducts.mockResolvedValue(new Map([[TEST_ASIN, amazonProduct]]));

			// Execute
			await processor.process(amazonUrlAction);

			// Verify
			expect(mockAmazonApi.getProducts).toHaveBeenCalledWith([TEST_ASIN]);
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(amazonUrlAction.id);
		});
	});
});
