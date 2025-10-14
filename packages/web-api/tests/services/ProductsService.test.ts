/**
 * ProductsService Tests
 *
 * Tests for product service business logic
 */

import { ProductsService, PaginationOptions, ProductSearchFilters } from '../../src/services/ProductsService';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ProductRepository } from '@gibipromo/shared';

// Mock do ProductRepository
class MockProductRepository implements ProductRepository {
	private products: Product[] = [];

	constructor(initialProducts: Product[] = []) {
		this.products = initialProducts;
	}

	async create(entity: Product): Promise<Product> {
		this.products.push(entity);
		return entity;
	}

	async findById(id: string): Promise<Product | null> {
		return this.products.find(p => p.id === id) || null;
	}

	async update(entity: Product): Promise<Product> {
		const index = this.products.findIndex(p => p.id === entity.id);
		if (index !== -1) {
			this.products[index] = entity;
		}
		return entity;
	}

	async delete(id: string): Promise<void> {
		this.products = this.products.filter(p => p.id !== id);
	}

	async findByLink(link: string): Promise<Product | null> {
		return this.products.find(p => p.url === link) || null;
	}

	async getNextProductsToCheck(limit: number): Promise<Product[]> {
		return this.products.slice(0, limit);
	}

	// Método auxiliar para testes
	setProducts(products: Product[]): void {
		this.products = products;
	}
}

// Helper para criar produtos de teste
function createTestProduct(overrides: Partial<Product> = {}): Product {
	const now = new Date().toISOString();
	return {
		id: `product-${Date.now()}-${Math.random()}`,
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

describe('ProductsService', () => {
	let service: ProductsService;
	let mockRepository: MockProductRepository;

	beforeEach(() => {
		mockRepository = new MockProductRepository();
		service = new ProductsService(mockRepository);
	});

	afterEach(() => {
		// Limpar cache entre testes
		service.clearCache();
	});

	describe('listProducts', () => {
		it('should list products with pagination', async () => {
			// Criar 25 produtos de teste
			const products: Product[] = [];
			for (let i = 0; i < 25; i++) {
				products.push(createTestProduct({
					id: `product-${i}`,
					title: `Product ${i}`,
					price: 1000 + i * 100
				}));
			}
			mockRepository.setProducts(products);

			const options: PaginationOptions = { page: 1, limit: 10 };
			const result = await service.listProducts(options);

			expect(result.data).toHaveLength(10);
			expect(result.pagination.page).toBe(1);
			expect(result.pagination.limit).toBe(10);
			expect(result.pagination.total).toBe(25);
			expect(result.pagination.totalPages).toBe(3);
			expect(result.pagination.hasNextPage).toBe(true);
			expect(result.pagination.hasPreviousPage).toBe(false);
		});

		it('should return second page correctly', async () => {
			const products: Product[] = [];
			for (let i = 0; i < 25; i++) {
				products.push(createTestProduct({
					id: `product-${i}`,
					title: `Product ${i}`
				}));
			}
			mockRepository.setProducts(products);

			const options: PaginationOptions = { page: 2, limit: 10 };
			const result = await service.listProducts(options);

			expect(result.data).toHaveLength(10);
			expect(result.pagination.page).toBe(2);
			expect(result.pagination.hasNextPage).toBe(true);
			expect(result.pagination.hasPreviousPage).toBe(true);
		});

		it('should return last page with remaining items', async () => {
			const products: Product[] = [];
			for (let i = 0; i < 25; i++) {
				products.push(createTestProduct({
					id: `product-${i}`,
					title: `Product ${i}`
				}));
			}
			mockRepository.setProducts(products);

			const options: PaginationOptions = { page: 3, limit: 10 };
			const result = await service.listProducts(options);

			expect(result.data).toHaveLength(5);
			expect(result.pagination.page).toBe(3);
			expect(result.pagination.hasNextPage).toBe(false);
			expect(result.pagination.hasPreviousPage).toBe(true);
		});

		it('should return empty array for out of range page', async () => {
			const products: Product[] = [];
			for (let i = 0; i < 10; i++) {
				products.push(createTestProduct({ id: `product-${i}` }));
			}
			mockRepository.setProducts(products);

			const options: PaginationOptions = { page: 5, limit: 10 };
			const result = await service.listProducts(options);

			expect(result.data).toHaveLength(0);
			expect(result.pagination.total).toBe(10);
		});

		it('should use cache for repeated requests', async () => {
			const products: Product[] = [
				createTestProduct({ id: 'product-1', title: 'Product 1' })
			];
			mockRepository.setProducts(products);

			const options: PaginationOptions = { page: 1, limit: 10 };

			// Primeira chamada - busca do repositório
			const result1 = await service.listProducts(options);

			// Modificar produtos no repositório
			mockRepository.setProducts([
				createTestProduct({ id: 'product-2', title: 'Product 2' })
			]);

			// Segunda chamada - deve retornar do cache (produto 1, não produto 2)
			const result2 = await service.listProducts(options);

			expect(result1.data[0].id).toBe('product-1');
			expect(result2.data[0].id).toBe('product-1'); // Do cache
		});
	});

	describe('searchProducts', () => {
		beforeEach(() => {
			const products: Product[] = [
				createTestProduct({
					id: 'manga-1',
					title: 'One Piece Vol. 1',
					price: 2990,
					category: 'Mangá',
					format: 'Capa comum',
					genre: 'Aventura',
					publisher: 'Panini'
				}),
				createTestProduct({
					id: 'manga-2',
					title: 'Naruto Vol. 1',
					price: 2590,
					category: 'Mangá',
					format: 'Capa comum',
					genre: 'Aventura',
					publisher: 'Panini'
				}),
				createTestProduct({
					id: 'hq-1',
					title: 'Batman: The Dark Knight',
					price: 5990,
					category: 'HQ',
					format: 'Capa dura',
					genre: 'Aventura',
					publisher: 'DC Comics'
				}),
				createTestProduct({
					id: 'livro-1',
					title: 'O Hobbit',
					price: 3990,
					category: 'Livro',
					format: 'Capa dura',
					genre: 'Fantasia',
					publisher: 'HarperCollins'
				}),
				createTestProduct({
					id: 'manga-3',
					title: 'One Punch Man Vol. 1',
					price: 3190,
					category: 'Mangá',
					format: 'Capa comum',
					genre: 'Ação',
					publisher: 'Panini'
				})
			];
			mockRepository.setProducts(products);
		});

		it('should search by query (title)', async () => {
			const filters: ProductSearchFilters = { query: 'One' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(2);
			expect(result.data[0].title).toContain('One');
			expect(result.data[1].title).toContain('One');
		});

		it('should filter by category', async () => {
			const filters: ProductSearchFilters = { category: 'Mangá' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(3);
			result.data.forEach(p => {
				expect(p.category).toBe('Mangá');
			});
		});

		it('should filter by price range', async () => {
			const filters: ProductSearchFilters = { minPrice: 2500, maxPrice: 3500 };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(3); // One Piece, Naruto, One Punch Man
			result.data.forEach(p => {
				expect(p.price).toBeGreaterThanOrEqual(2500);
				expect(p.price).toBeLessThanOrEqual(3500);
			});
		});

		it('should filter by multiple criteria', async () => {
			const filters: ProductSearchFilters = {
				category: 'Mangá',
				publisher: 'Panini',
				maxPrice: 3000
			};
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(2); // One Piece e Naruto
			result.data.forEach(p => {
				expect(p.category).toBe('Mangá');
				expect(p.publisher).toBe('Panini');
				expect(p.price).toBeLessThanOrEqual(3000);
			});
		});

		it('should filter by format', async () => {
			const filters: ProductSearchFilters = { format: 'Capa dura' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(2); // Batman e O Hobbit
			result.data.forEach(p => {
				expect(p.format).toBe('Capa dura');
			});
		});

		it('should filter by genre', async () => {
			const filters: ProductSearchFilters = { genre: 'Aventura' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(3); // One Piece, Naruto, Batman
			result.data.forEach(p => {
				expect(p.genre).toBe('Aventura');
			});
		});

		it('should filter by availability (in_stock)', async () => {
			// Adicionar produto fora de estoque
			mockRepository.setProducts([
				createTestProduct({ id: 'in-stock', title: 'In Stock', in_stock: true }),
				createTestProduct({ id: 'out-stock', title: 'Out of Stock', in_stock: false })
			]);

			const filters: ProductSearchFilters = { available: true };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(1);
			expect(result.data[0].in_stock).toBe(true);
		});

		it('should sort by relevance when query is provided', async () => {
			const filters: ProductSearchFilters = { query: 'One' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			// "One Piece" deve vir antes de "One Punch Man" (começa com "One")
			expect(result.data[0].title).toBe('One Piece Vol. 1');
		});

		it('should return empty result when no products match filters', async () => {
			const filters: ProductSearchFilters = { category: 'NonExistent' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			const result = await service.searchProducts(filters, options);

			expect(result.data).toHaveLength(0);
			expect(result.pagination.total).toBe(0);
		});

		it('should use cache for repeated searches', async () => {
			const filters: ProductSearchFilters = { category: 'Mangá' };
			const options: PaginationOptions = { page: 1, limit: 10 };

			// Primeira chamada
			const result1 = await service.searchProducts(filters, options);

			// Limpar produtos
			mockRepository.setProducts([]);

			// Segunda chamada - deve retornar do cache
			const result2 = await service.searchProducts(filters, options);

			expect(result2.data).toHaveLength(3); // Do cache
		});
	});

	describe('getProductById', () => {
		it('should return product by id', async () => {
			const product = createTestProduct({ id: 'test-product', title: 'Test Product' });
			mockRepository.setProducts([product]);

			const result = await service.getProductById('test-product');

			expect(result).not.toBeNull();
			expect(result?.id).toBe('test-product');
			expect(result?.title).toBe('Test Product');
		});

		it('should return null for non-existent product', async () => {
			mockRepository.setProducts([]);

			const result = await service.getProductById('non-existent');

			expect(result).toBeNull();
		});

		it('should use cache for repeated requests', async () => {
			const product = createTestProduct({ id: 'test-product', title: 'Original' });
			mockRepository.setProducts([product]);

			// Primeira chamada
			const result1 = await service.getProductById('test-product');

			// Modificar produto no repositório
			mockRepository.setProducts([
				createTestProduct({ id: 'test-product', title: 'Modified' })
			]);

			// Segunda chamada - deve retornar do cache
			const result2 = await service.getProductById('test-product');

			expect(result1?.title).toBe('Original');
			expect(result2?.title).toBe('Original'); // Do cache
		});
	});

	describe('cache management', () => {
		it('should clear specific cache key', async () => {
			const product = createTestProduct({ id: 'test', title: 'Test' });
			mockRepository.setProducts([product]);

			// Fazer request para criar cache
			await service.getProductById('test');

			// Verificar que cache existe
			let stats = service.getCacheStats();
			expect(stats.size).toBeGreaterThan(0);

			// Limpar cache específico
			service.clearCache('product:test');

			// Cache deve estar limpo
			stats = service.getCacheStats();
			const hasKey = stats.keys.includes('product:test');
			expect(hasKey).toBe(false);
		});

		it('should clear all cache', async () => {
			const products = [
				createTestProduct({ id: 'product-1' }),
				createTestProduct({ id: 'product-2' })
			];
			mockRepository.setProducts(products);

			// Fazer várias requests para criar cache
			await service.listProducts({ page: 1, limit: 10 });
			await service.getProductById('product-1');
			await service.getProductById('product-2');

			// Verificar que cache tem itens
			let stats = service.getCacheStats();
			expect(stats.size).toBeGreaterThan(0);

			// Limpar todo cache
			service.clearCache();

			// Cache deve estar vazio
			stats = service.getCacheStats();
			expect(stats.size).toBe(0);
		});

		it('should return cache statistics', async () => {
			const product = createTestProduct({ id: 'test' });
			mockRepository.setProducts([product]);

			// Fazer algumas requests
			await service.listProducts({ page: 1, limit: 10 });
			await service.getProductById('test');

			const stats = service.getCacheStats();

			expect(stats.size).toBeGreaterThan(0);
			expect(stats.keys).toBeInstanceOf(Array);
			expect(stats.keys.length).toBe(stats.size);
		});
	});

	describe('edge cases', () => {
		it('should handle empty product list', async () => {
			mockRepository.setProducts([]);

			const result = await service.listProducts({ page: 1, limit: 10 });

			expect(result.data).toHaveLength(0);
			expect(result.pagination.total).toBe(0);
			expect(result.pagination.totalPages).toBe(0);
		});

		it('should handle case-insensitive category filter', async () => {
			mockRepository.setProducts([
				createTestProduct({ id: 'p1', category: 'Mangá' }),
				createTestProduct({ id: 'p2', category: 'mangá' }),
				createTestProduct({ id: 'p3', category: 'MANGÁ' })
			]);

			const filters: ProductSearchFilters = { category: 'mangá' };
			const result = await service.searchProducts(filters, { page: 1, limit: 10 });

			expect(result.data).toHaveLength(3);
		});

		it('should handle partial word search in title', async () => {
			mockRepository.setProducts([
				createTestProduct({ id: 'p1', title: 'One Piece Vol. 1' }),
				createTestProduct({ id: 'p2', title: 'Piece of Cake' }),
				createTestProduct({ id: 'p3', title: 'Naruto' })
			]);

			const filters: ProductSearchFilters = { query: 'piece' };
			const result = await service.searchProducts(filters, { page: 1, limit: 10 });

			expect(result.data).toHaveLength(2);
		});
	});
});
