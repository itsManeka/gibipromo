import { AddProductActionProcessor } from '../../../../src/application/usecases/processors/AddProductActionProcessor';
import { ActionType, AddProductAction } from '@gibipromo/shared/dist/entities/Action';
import { User } from '@gibipromo/shared/dist/entities/User';
import {
	createTestUser,
	createTestAction,
} from '../../../test-helpers/factories';

// Mock the Logger
jest.mock('@gibipromo/shared', () => ({
	createLogger: jest.fn(() => ({
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
	})),
}));

describe('AddProductActionProcessor - New Fields', () => {
	let processor: AddProductActionProcessor;
	let mockActionRepository: any;
	let mockProductRepository: any;
	let mockProductUserRepository: any;
	let mockUserRepository: any;
	let mockAmazonApi: any;
	let mockProductStatsService: any;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock repositories
		mockActionRepository = {
			markProcessed: jest.fn().mockResolvedValue(undefined),
		};

		mockProductRepository = {
			findById: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue(undefined),
			update: jest.fn().mockResolvedValue(undefined),
		};

		mockProductUserRepository = {
			findByProductAndUser: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue(undefined),
			upsert: jest.fn().mockResolvedValue(undefined),
		};

		mockUserRepository = {
			findById: jest.fn().mockResolvedValue({
				id: 'user-1',
				telegram_id: '123456789',
				enabled: true,
				username: 'testuser',
				name: 'Test User',
				language: 'pt-BR',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			} as User),
		};

		mockAmazonApi = {
			getProducts: jest.fn(),
		};

		mockProductStatsService = {
			createProductStats: jest.fn().mockResolvedValue(undefined),
		};

		processor = new AddProductActionProcessor(
			mockActionRepository,
			mockProductRepository,
			mockProductUserRepository,
			mockUserRepository,
			mockAmazonApi,
			mockProductStatsService
		);
	});

	it('should create product with all new fields (category, format, genre, publisher, contributors, productGroup)', async () => {
		// Arrange
		const amazonProduct = {
			offerId: 'AMAZON',
			title: 'One Piece Vol. 1',
			fullPrice: 3500,
			currentPrice: 2990,
			inStock: true,
			imageUrl: 'https://example.com/image.jpg',
			isPreOrder: false,
			url: 'https://amazon.com.br/dp/B012345678',
			category: 'Mangá',
			format: 'Capa comum',
			genre: 'Aventura',
			publisher: 'Panini',
			contributors: ['Eiichiro Oda'],
			productGroup: 'Book'
		};

		const action: AddProductAction = createTestAction('B012345678', {
			id: 'action-1',
			value: 'https://amazon.com.br/dp/B012345678',
			user_id: 'user-1',
		});

		const products = new Map();
		products.set('B012345678', amazonProduct);
		mockAmazonApi.getProducts.mockResolvedValue(products);

		// Capture the product created
		let createdProduct: any;
		mockProductRepository.create.mockImplementation((product: any) => {
			createdProduct = product;
			return Promise.resolve();
		});

		// Act
		await processor.process(action);

		// Assert
		expect(mockProductRepository.create).toHaveBeenCalled();
		expect(createdProduct).toBeDefined();
		
		// Verify all fields are present
		expect(createdProduct.id).toBe('B012345678');
		expect(createdProduct.title).toBe('One Piece Vol. 1');
		expect(createdProduct.offer_id).toBe('AMAZON');
		expect(createdProduct.full_price).toBe(3500);
		expect(createdProduct.price).toBe(2990);
		expect(createdProduct.in_stock).toBe(true);
		expect(createdProduct.url).toBe('https://amazon.com.br/dp/B012345678');
		expect(createdProduct.image).toBe('https://example.com/image.jpg');
		expect(createdProduct.preorder).toBe(false);
		
		// Verify new fields
		expect(createdProduct.category).toBe('Mangá');
		expect(createdProduct.format).toBe('Capa comum');
		expect(createdProduct.genre).toBe('Aventura');
		expect(createdProduct.publisher).toBe('Panini');
		expect(createdProduct.contributors).toEqual(['Eiichiro Oda']);
		expect(createdProduct.product_group).toBe('Book');
		expect(createdProduct.store).toBe('Amazon');
		
		// Verify timestamps
		expect(createdProduct.created_at).toBeDefined();
		expect(createdProduct.updated_at).toBeDefined();
		expect(createdProduct.lowest_price).toBe(2990);
	});

	it('should create product with undefined new fields when not provided by Amazon API', async () => {
		// Arrange
		const amazonProduct = {
			offerId: 'AMAZON',
			title: 'Generic Product',
			fullPrice: 1000,
			currentPrice: 990,
			inStock: true,
			imageUrl: 'https://example.com/image.jpg',
			isPreOrder: false,
			url: 'https://amazon.com.br/dp/B012345679',
			// No category, format, genre, publisher, contributors, productGroup
		};

		const action: AddProductAction = createTestAction('B012345679', {
			id: 'action-1',
			value: 'https://amazon.com.br/dp/B012345679',
			user_id: 'user-1',
		});

		const products = new Map();
		products.set('B012345679', amazonProduct);
		mockAmazonApi.getProducts.mockResolvedValue(products);

		// Capture the product created
		let createdProduct: any;
		mockProductRepository.create.mockImplementation((product: any) => {
			createdProduct = product;
			return Promise.resolve();
		});

		// Act
		await processor.process(action);

		// Assert
		expect(mockProductRepository.create).toHaveBeenCalled();
		expect(createdProduct).toBeDefined();
		
		// Verify basic fields
		expect(createdProduct.id).toBe('B012345679');
		expect(createdProduct.title).toBe('Generic Product');
		
		// Verify new fields are undefined when not provided
		expect(createdProduct.category).toBeUndefined();
		expect(createdProduct.format).toBeUndefined();
		expect(createdProduct.genre).toBeUndefined();
		expect(createdProduct.publisher).toBeUndefined();
		expect(createdProduct.contributors).toBeUndefined();
		expect(createdProduct.product_group).toBeUndefined();
		expect(createdProduct.store).toBe('Amazon'); // Default value
	});
});