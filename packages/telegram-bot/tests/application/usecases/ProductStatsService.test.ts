import { ProductStatsService } from '../../../src/application/usecases/ProductStatsService';
import { ProductStatsRepository } from '../../../src/application/ports/ProductStatsRepository';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ProductStats } from '@gibipromo/shared/dist/entities/ProductStats';

describe('ProductStatsService', () => {
	let service: ProductStatsService;
	let mockRepository: jest.Mocked<ProductStatsRepository>;

	beforeEach(() => {
		mockRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findByProductId: jest.fn(),
			findLatest: jest.fn(),
			findByProductIdAndDateRange: jest.fn()
		};
		service = new ProductStatsService(mockRepository);
	});

	describe('createInitialStats', () => {
		it('should create initial statistics for a newly added product', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'New Product',
				full_price: 100,
				price: 89.90,
				old_price: 89.90,
				lowest_price: 89.90,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const expectedStats: ProductStats = {
				id: 'stats123',
				product_id: 'prod123',
				price: 89.90,
				old_price: 89.90, // Same as price for initial entry
				percentage_change: 0, // No change on initial entry
				created_at: '2023-01-01T00:00:00.000Z'
			};

			mockRepository.create.mockResolvedValue(expectedStats);

			const result = await service.createInitialStats(product);

			expect(result).toBeDefined();
			expect(result.product_id).toBe('prod123');
			expect(result.price).toBe(89.90);
			expect(result.old_price).toBe(89.90);
			expect(result.percentage_change).toBe(0);
			expect(mockRepository.create).toHaveBeenCalledTimes(1);
			expect(mockRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					product_id: 'prod123',
					price: 89.90,
					old_price: 89.90,
					percentage_change: 0
				})
			);
		});

		it('should create initial statistics even when product has zero price', async () => {
			const product: Product = {
				id: 'prod456',
				offer_id: 'offer456',
				title: 'Free Product',
				full_price: 0,
				price: 0,
				old_price: 0,
				lowest_price: 0,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const expectedStats: ProductStats = {
				id: 'stats456',
				product_id: 'prod456',
				price: 0,
				old_price: 0,
				percentage_change: 0,
				created_at: '2023-01-01T00:00:00.000Z'
			};

			mockRepository.create.mockResolvedValue(expectedStats);

			const result = await service.createInitialStats(product);

			expect(result).toBeDefined();
			expect(result.price).toBe(0);
			expect(result.old_price).toBe(0);
			expect(result.percentage_change).toBe(0);
		});
	});

	describe('handlePriceChange', () => {
		it('should create statistics for 5% price reduction', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'Test Product',
				full_price: 100,
				price: 95,
				old_price: 100,
				lowest_price: 95,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const expectedStats: ProductStats = {
				id: 'stats123',
				product_id: 'prod123',
				price: 95,
				old_price: 100,
				percentage_change: 5,
				created_at: '2023-01-01T00:00:00.000Z'
			};

			mockRepository.create.mockResolvedValue(expectedStats);

			const result = await service.handlePriceChange(product);

			expect(result).toBeDefined();
			expect(result?.product_id).toBe('prod123');
			expect(result?.price).toBe(95);
			expect(result?.old_price).toBe(100);
			expect(result?.percentage_change).toBe(5);
			expect(mockRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should create statistics for more than 5% price reduction', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'Test Product',
				full_price: 100,
				price: 80,
				old_price: 100,
				lowest_price: 80,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const expectedStats: ProductStats = {
				id: 'stats123',
				product_id: 'prod123',
				price: 80,
				old_price: 100,
				percentage_change: 20,
				created_at: '2023-01-01T00:00:00.000Z'
			};

			mockRepository.create.mockResolvedValue(expectedStats);

			const result = await service.handlePriceChange(product);

			expect(result).toBeDefined();
			expect(result?.percentage_change).toBe(20);
			expect(mockRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should not create statistics for less than 5% price reduction', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'Test Product',
				full_price: 100,
				price: 96,
				old_price: 100,
				lowest_price: 96,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const result = await service.handlePriceChange(product);

			expect(result).toBeNull();
			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it('should not create statistics for price increase', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'Test Product',
				full_price: 120,
				price: 120,
				old_price: 100,
				lowest_price: 100,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const result = await service.handlePriceChange(product);

			expect(result).toBeNull();
			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it('should not create statistics when old_price is missing', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'Test Product',
				full_price: 100,
				price: 80,
				old_price: undefined,
				lowest_price: 80,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const result = await service.handlePriceChange(product);

			expect(result).toBeNull();
			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it('should not create statistics when old_price is zero', async () => {
			const product: Product = {
				id: 'prod123',
				offer_id: 'offer123',
				title: 'Test Product',
				full_price: 100,
				price: 80,
				old_price: 0,
				lowest_price: 80,
				in_stock: true,
				url: 'https://amazon.com/test',
				image: 'https://amazon.com/image.jpg',
				preorder: false,
				store: 'Amazon',
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const result = await service.handlePriceChange(product);

			expect(result).toBeNull();
			expect(mockRepository.create).not.toHaveBeenCalled();
		});
	});

	describe('getProductStatistics', () => {
		it('should return statistics for a specific product', async () => {
			const expectedStats: ProductStats[] = [
				{
					id: 'stats1',
					product_id: 'prod123',
					price: 80,
					old_price: 100,
					percentage_change: 20,
					created_at: '2023-01-01T00:00:00.000Z'
				}
			];

			mockRepository.findByProductId.mockResolvedValue(expectedStats);

			const result = await service.getProductStatistics('prod123');

			expect(result).toEqual(expectedStats);
			expect(mockRepository.findByProductId).toHaveBeenCalledWith('prod123');
		});
	});

	describe('getLatestStatistics', () => {
		it('should return latest statistics with default limit', async () => {
			const expectedStats: ProductStats[] = [
				{
					id: 'stats1',
					product_id: 'prod123',
					price: 80,
					old_price: 100,
					percentage_change: 20,
					created_at: '2023-01-01T00:00:00.000Z'
				}
			];

			mockRepository.findLatest.mockResolvedValue(expectedStats);

			const result = await service.getLatestStatistics();

			expect(result).toEqual(expectedStats);
			expect(mockRepository.findLatest).toHaveBeenCalledWith(10);
		});

		it('should return latest statistics with custom limit', async () => {
			const expectedStats: ProductStats[] = [];

			mockRepository.findLatest.mockResolvedValue(expectedStats);

			const result = await service.getLatestStatistics(5);

			expect(result).toEqual(expectedStats);
			expect(mockRepository.findLatest).toHaveBeenCalledWith(5);
		});
	});

	describe('getProductStatisticsInDateRange', () => {
		it('should return statistics for product in date range', async () => {
			const expectedStats: ProductStats[] = [
				{
					id: 'stats1',
					product_id: 'prod123',
					price: 80,
					old_price: 100,
					percentage_change: 20,
					created_at: '2023-01-01T00:00:00.000Z'
				}
			];

			mockRepository.findByProductIdAndDateRange.mockResolvedValue(expectedStats);

			const result = await service.getProductStatisticsInDateRange(
				'prod123',
				'2023-01-01T00:00:00.000Z',
				'2023-01-31T23:59:59.999Z'
			);

			expect(result).toEqual(expectedStats);
			expect(mockRepository.findByProductIdAndDateRange).toHaveBeenCalledWith(
				'prod123',
				'2023-01-01T00:00:00.000Z',
				'2023-01-31T23:59:59.999Z'
			);
		});
	});
});
