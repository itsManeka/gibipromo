/**
 * Tests for ProductsService - Product Stats functionality
 */

import { ProductsService } from '../../src/services/ProductsService';
import { ProductRepository, ProductUserRepository, ProductStatsRepository, ProductStats } from '@gibipromo/shared';

describe('ProductsService - Product Stats', () => {
	let productsService: ProductsService;
	let mockProductRepository: jest.Mocked<ProductRepository>;
	let mockProductUserRepository: jest.Mocked<ProductUserRepository>;
	let mockProductStatsRepository: jest.Mocked<ProductStatsRepository>;

	const mockProductId = 'B08XYZ1234';

	beforeEach(() => {
		// Mock repositories
		mockProductRepository = {
			findById: jest.fn(),
			getNextProductsToCheck: jest.fn(),
			findByIds: jest.fn(),
			findPromotions: jest.fn(),
			getUniqueFilterValues: jest.fn(),
		} as any;

		mockProductUserRepository = {
			findByProductAndUser: jest.fn(),
			create: jest.fn(),
			removeByProductAndUser: jest.fn(),
			findByUserId: jest.fn(),
		} as any;

		mockProductStatsRepository = {
			findByProductIdAndDateRange: jest.fn(),
			findByProductId: jest.fn(),
			findLatest: jest.fn(),
		} as any;

		productsService = new ProductsService(
			mockProductRepository,
			mockProductUserRepository,
			mockProductStatsRepository
		);
	});

	describe('getProductStats', () => {
		it('should return product stats for the given period', async () => {
			// Arrange
			const mockStats: ProductStats[] = [
				{
					id: 'stat1',
					product_id: mockProductId,
					price: 59.90,
					old_price: 79.90,
					percentage_change: 25.0,
					created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
				},
				{
					id: 'stat2',
					product_id: mockProductId,
					price: 49.90,
					old_price: 59.90,
					percentage_change: 16.7,
					created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
				},
			];

			mockProductStatsRepository.findByProductIdAndDateRange.mockResolvedValue(mockStats);

			// Act
			const result = await productsService.getProductStats(mockProductId, 30);

			// Assert
			expect(result).toEqual(mockStats);
			expect(mockProductStatsRepository.findByProductIdAndDateRange).toHaveBeenCalledWith(
				mockProductId,
				expect.any(String), // startDate
				expect.any(String)  // endDate
			);
		});

		it('should return empty array if ProductStatsRepository is not configured', async () => {
			// Arrange
			const serviceWithoutStats = new ProductsService(
				mockProductRepository,
				mockProductUserRepository,
				undefined // Sem ProductStatsRepository
			);

			// Act
			const result = await serviceWithoutStats.getProductStats(mockProductId, 30);

			// Assert
			expect(result).toEqual([]);
		});

		it('should use cache for subsequent requests', async () => {
			// Arrange
			const mockStats: ProductStats[] = [
				{
					id: 'stat1',
					product_id: mockProductId,
					price: 59.90,
					old_price: 79.90,
					percentage_change: 25.0,
					created_at: new Date().toISOString(),
				},
			];

			mockProductStatsRepository.findByProductIdAndDateRange.mockResolvedValue(mockStats);

			// Act - Primeira chamada
			await productsService.getProductStats(mockProductId, 30);

			// Act - Segunda chamada (deve usar cache)
			const result = await productsService.getProductStats(mockProductId, 30);

			// Assert
			expect(result).toEqual(mockStats);
			expect(mockProductStatsRepository.findByProductIdAndDateRange).toHaveBeenCalledTimes(1);
		});

		it('should calculate correct date range for different periods', async () => {
			// Arrange
			const mockStats: ProductStats[] = [];
			mockProductStatsRepository.findByProductIdAndDateRange.mockResolvedValue(mockStats);

			// Act
			await productsService.getProductStats(mockProductId, 90);

			// Assert
			const calls = mockProductStatsRepository.findByProductIdAndDateRange.mock.calls[0];
			const startDate = new Date(calls[1]);
			const endDate = new Date(calls[2]);
			const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

			expect(daysDiff).toBe(90);
		});
	});

	describe('isUserMonitoring', () => {
		it('should return true if user is monitoring the product', async () => {
			// Arrange
			const userId = 'user123';
			mockProductUserRepository.findByProductAndUser.mockResolvedValue({
				id: 'pu1',
				user_id: userId,
				product_id: mockProductId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			});

			// Act
			const result = await productsService.isUserMonitoring(userId, mockProductId);

			// Assert
			expect(result).toBe(true);
			expect(mockProductUserRepository.findByProductAndUser).toHaveBeenCalledWith(
				mockProductId,
				userId
			);
		});

		it('should return false if user is not monitoring the product', async () => {
			// Arrange
			const userId = 'user123';
			mockProductUserRepository.findByProductAndUser.mockResolvedValue(null);

			// Act
			const result = await productsService.isUserMonitoring(userId, mockProductId);

			// Assert
			expect(result).toBe(false);
		});

		it('should return false if ProductUserRepository is not configured', async () => {
			// Arrange
			const serviceWithoutPU = new ProductsService(
				mockProductRepository,
				undefined, // Sem ProductUserRepository
				mockProductStatsRepository
			);

			// Act
			const result = await serviceWithoutPU.isUserMonitoring('user123', mockProductId);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('monitorProduct', () => {
		it('should create ProductUser relationship', async () => {
			// Arrange
			const userId = 'user123';
			mockProductRepository.findById.mockResolvedValue({
				id: mockProductId,
				title: 'Test Product',
				price: 59.90,
				full_price: 79.90,
				lowest_price: 49.90,
				in_stock: true,
				url: 'https://amazon.com/dp/test',
				image: 'https://image.url',
				preorder: false,
				offer_id: 'offer1',
				store: 'Amazon',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			});

			mockProductUserRepository.findByProductAndUser.mockResolvedValue(null);

			// Act
			await productsService.monitorProduct(userId, mockProductId, 50.00);

			// Assert
			expect(mockProductRepository.findById).toHaveBeenCalledWith(mockProductId);
			expect(mockProductUserRepository.findByProductAndUser).toHaveBeenCalledWith(
				mockProductId,
				userId
			);
			expect(mockProductUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					user_id: userId,
					product_id: mockProductId,
					desired_price: 50.00,
				})
			);
		});

		it('should throw error if product not found', async () => {
			// Arrange
			const userId = 'user123';
			mockProductRepository.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(
				productsService.monitorProduct(userId, mockProductId)
			).rejects.toThrow('Produto não encontrado');
		});

		it('should throw error if already monitoring', async () => {
			// Arrange
			const userId = 'user123';
			mockProductRepository.findById.mockResolvedValue({
				id: mockProductId,
			} as any);

			mockProductUserRepository.findByProductAndUser.mockResolvedValue({
				id: 'pu1',
				user_id: userId,
				product_id: mockProductId,
			} as any);

			// Act & Assert
			await expect(
				productsService.monitorProduct(userId, mockProductId)
			).rejects.toThrow('Você já está monitorando este produto');
		});
	});

	describe('unmonitorProduct', () => {
		it('should remove ProductUser relationship', async () => {
			// Arrange
			const userId = 'user123';

			// Act
			await productsService.unmonitorProduct(userId, mockProductId);

			// Assert
			expect(mockProductUserRepository.removeByProductAndUser).toHaveBeenCalledWith(
				mockProductId,
				userId
			);
		});

		it('should throw error if ProductUserRepository not configured', async () => {
			// Arrange
			const serviceWithoutPU = new ProductsService(
				mockProductRepository,
				undefined,
				mockProductStatsRepository
			);

			// Act & Assert
			await expect(
				serviceWithoutPU.unmonitorProduct('user123', mockProductId)
			).rejects.toThrow('ProductUserRepository não configurado');
		});
	});
});

