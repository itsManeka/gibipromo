/**
 * ProductsController Tests
 *
 * Tests for product controller endpoints
 */

import request from 'supertest';
import express, { Express } from 'express';
import { ProductsController } from '../../src/controllers/ProductsController';
import { ProductsService } from '../../src/services/ProductsService';
import { Product } from '@gibipromo/shared/dist/entities/Product';

// Mock do ProductsService
jest.mock('../../src/services/ProductsService');
jest.mock('@gibipromo/shared', () => ({
	...jest.requireActual('@gibipromo/shared'),
	DynamoDBProductRepository: jest.fn().mockImplementation(() => ({}))
}));

// Helper para criar produtos de teste
function createTestProduct(overrides: Partial<Product> = {}): Product {
	const now = new Date().toISOString();
	return {
		id: `product-${Date.now()}`,
		offer_id: 'AMAZON',
		title: 'Test Product',
		full_price: 10000,
		price: 9000,
		lowest_price: 9000,
		in_stock: true,
		url: 'https://amazon.com.br/dp/B012345678',
		image: 'https://m.media-amazon.com/images/I/test.jpg',
		preorder: false,
		store: 'Amazon',
		created_at: now,
		updated_at: now,
		...overrides
	};
}

describe('ProductsController', () => {
	let app: Express;
	let mockProductsService: jest.Mocked<ProductsService>;

	beforeEach(() => {
		// Criar app Express para testes
		app = express();
		app.use(express.json());

		// Criar controller
		const controller = new ProductsController();

		// Obter mock do service
		mockProductsService = (controller as any).productsService as jest.Mocked<ProductsService>;

		// Registrar rotas
		app.get('/products', controller.listProducts);
		app.get('/products/search', controller.searchProducts);
		app.get('/products/:id', controller.getProductById);
		app.delete('/products/cache', controller.clearCache);
		app.get('/products/cache/stats', controller.getCacheStats);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /products', () => {
		it('should return products with default pagination', async () => {
			const mockProducts = [
				createTestProduct({ id: 'product-1', title: 'Product 1' }),
				createTestProduct({ id: 'product-2', title: 'Product 2' })
			];

			const mockResult = {
				data: mockProducts,
				pagination: {
					page: 1,
					limit: 20,
					total: 2,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false
				}
			};

			mockProductsService.listProducts.mockResolvedValue(mockResult);

			const response = await request(app).get('/products');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.data).toHaveLength(2);
			expect(response.body.data.pagination.page).toBe(1);
			expect(mockProductsService.listProducts).toHaveBeenCalledWith({
				page: 1,
				limit: 20
			});
		});

		it('should accept custom pagination parameters', async () => {
			const mockResult = {
				data: [],
				pagination: {
					page: 2,
					limit: 10,
					total: 0,
					totalPages: 0,
					hasNextPage: false,
					hasPreviousPage: true
				}
			};

			mockProductsService.listProducts.mockResolvedValue(mockResult);

			const response = await request(app).get('/products?page=2&limit=10');

			expect(response.status).toBe(200);
			expect(mockProductsService.listProducts).toHaveBeenCalledWith({
				page: 2,
				limit: 10
			});
		});

		it('should return 400 for invalid page number', async () => {
			const response = await request(app).get('/products?page=0');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Page must be greater than 0');
		});

		it('should return 400 for invalid limit', async () => {
			const response = await request(app).get('/products?limit=0');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Limit must be between 1 and 100');
		});

		it('should return 400 for limit exceeding maximum', async () => {
			const response = await request(app).get('/products?limit=101');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Limit must be between 1 and 100');
		});
	});

	describe('GET /products/search', () => {
		it('should search products with query parameter', async () => {
			const mockResult = {
				data: [createTestProduct({ title: 'One Piece Vol. 1' })],
				pagination: {
					page: 1,
					limit: 20,
					total: 1,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false
				}
			};

			mockProductsService.searchProducts.mockResolvedValue(mockResult);

			const response = await request(app).get('/products/search?q=One Piece');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(mockProductsService.searchProducts).toHaveBeenCalledWith(
				expect.objectContaining({ query: 'One Piece' }),
				{ page: 1, limit: 20 }
			);
		});

		it('should filter by price range', async () => {
			const mockResult = {
				data: [createTestProduct({ price: 2500 })],
				pagination: {
					page: 1,
					limit: 20,
					total: 1,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false
				}
			};

			mockProductsService.searchProducts.mockResolvedValue(mockResult);

			const response = await request(app).get(
				'/products/search?minPrice=2000&maxPrice=3000'
			);

			expect(response.status).toBe(200);
			expect(mockProductsService.searchProducts).toHaveBeenCalledWith(
				expect.objectContaining({ minPrice: 2000, maxPrice: 3000 }),
				{ page: 1, limit: 20 }
			);
		});

		it('should filter by category', async () => {
			const mockResult = {
				data: [createTestProduct({ category: 'Mangá' })],
				pagination: {
					page: 1,
					limit: 20,
					total: 1,
					totalPages: 1,
					hasNextPage: false,
					hasPreviousPage: false
				}
			};

			mockProductsService.searchProducts.mockResolvedValue(mockResult);

			const category = encodeURIComponent('Mangá');
			const response = await request(app).get(`/products/search?category=${category}`);

			expect(response.status).toBe(200);
			expect(mockProductsService.searchProducts).toHaveBeenCalledWith(
				expect.objectContaining({ category: 'Mangá' }),
				{ page: 1, limit: 20 }
			);
		});

		it('should filter by multiple criteria', async () => {
			const mockResult = {
				data: [],
				pagination: {
					page: 1,
					limit: 20,
					total: 0,
					totalPages: 0,
					hasNextPage: false,
					hasPreviousPage: false
				}
			};

			mockProductsService.searchProducts.mockResolvedValue(mockResult);

			const category = encodeURIComponent('Mangá');
			const format = encodeURIComponent('Capa dura');
			const response = await request(app).get(
				`/products/search?category=${category}&format=${format}&genre=Fantasia&publisher=Panini&available=true`
			);

			expect(response.status).toBe(200);
			expect(mockProductsService.searchProducts).toHaveBeenCalledWith(
				expect.objectContaining({
					category: 'Mangá',
					format: 'Capa dura',
					genre: 'Fantasia',
					publisher: 'Panini',
					available: true
				}),
				{ page: 1, limit: 20 }
			);
		});

		it('should return 400 for negative minPrice', async () => {
			const response = await request(app).get('/products/search?minPrice=-10');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain(
				'Min price must be greater than or equal to 0'
			);
		});

		it('should return 400 for negative maxPrice', async () => {
			const response = await request(app).get('/products/search?maxPrice=-10');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain(
				'Max price must be greater than or equal to 0'
			);
		});

		it('should return 400 when minPrice > maxPrice', async () => {
			const response = await request(app).get(
				'/products/search?minPrice=5000&maxPrice=2000'
			);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain(
				'Min price cannot be greater than max price'
			);
		});
	});

	describe('GET /products/:id', () => {
		it('should return product by id', async () => {
			const mockProduct = createTestProduct({
				id: 'product-123',
				title: 'Test Product'
			});

			mockProductsService.getProductById.mockResolvedValue(mockProduct);

			const response = await request(app).get('/products/product-123');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.id).toBe('product-123');
			expect(mockProductsService.getProductById).toHaveBeenCalledWith('product-123');
		});

		it('should return 404 for non-existent product', async () => {
			mockProductsService.getProductById.mockResolvedValue(null);

			const response = await request(app).get('/products/non-existent');

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Product not found');
		});
	});

	describe('DELETE /products/cache', () => {
		it('should clear all cache', async () => {
			mockProductsService.clearCache.mockReturnValue(undefined);

			const response = await request(app).delete('/products/cache');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('All cache cleared');
			expect(mockProductsService.clearCache).toHaveBeenCalledWith(undefined);
		});

		it('should clear specific cache key', async () => {
			mockProductsService.clearCache.mockReturnValue(undefined);

			const response = await request(app).delete('/products/cache?key=test-key');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('Cache cleared for key: test-key');
			expect(mockProductsService.clearCache).toHaveBeenCalledWith('test-key');
		});
	});

	describe('GET /products/cache/stats', () => {
		it('should return cache statistics', async () => {
			const mockStats = {
				size: 5,
				keys: ['key1', 'key2', 'key3', 'key4', 'key5']
			};

			mockProductsService.getCacheStats.mockReturnValue(mockStats);

			const response = await request(app).get('/products/cache/stats');

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.size).toBe(5);
			expect(response.body.data.keys).toHaveLength(5);
		});
	});

	describe('error handling', () => {
		it('should handle service errors gracefully', async () => {
			mockProductsService.listProducts.mockRejectedValue(
				new Error('Database connection failed')
			);

			const response = await request(app).get('/products');

			expect(response.status).toBe(500);
			expect(response.body.success).toBe(false);
		});
	});
});
