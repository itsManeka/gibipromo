import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ProductRepository } from '@gibipromo/shared';
import { BaseService } from './BaseService';

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
	page: number;
	limit: number;
}

/**
 * Interface para resultado paginado
 */
export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

/**
 * Interface para filtros de busca
 */
export interface ProductSearchFilters {
	query?: string;
	minPrice?: number;
	maxPrice?: number;
	category?: string;
	format?: string;
	genre?: string;
	publisher?: string;
	available?: boolean;
}

/**
 * Interface para cache de produtos
 */
interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

/**
 * Service for product-related business logic
 * Implements caching, pagination, and search functionality
 */
export class ProductsService extends BaseService {
	private cache: Map<string, CacheEntry<any>>;
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos em ms

	constructor(private readonly productRepository: ProductRepository) {
		super('ProductsService');
		this.cache = new Map();
	}

	/**
	 * List products with pagination
	 */
	async listProducts(options: PaginationOptions): Promise<PaginatedResult<Product>> {
		const cacheKey = `list:${options.page}:${options.limit}`;

		// Verificar cache
		const cached = this.getFromCache<PaginatedResult<Product>>(cacheKey);
		if (cached) {
			this.logAction('Cache hit for product list', { cacheKey });
			return cached;
		}

		this.logAction('Listing products', options);

		try {
			// Por enquanto, buscar próximos produtos (limitado)
			// TODO: Implementar findAll() no Repository quando necessário
			const limit = 1000; // Limite razoável para evitar scan muito grande
			const allProducts = await this.productRepository.getNextProductsToCheck(limit);

			// Ordenar por data de atualização (mais recentes primeiro)
			const sortedProducts = allProducts.sort((a: Product, b: Product) => {
				return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			});

			// Aplicar paginação
			const result = this.paginate<Product>(sortedProducts, options);

			// Armazenar no cache
			this.setCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logError(error as Error, 'listProducts');
			throw error;
		}
	}

	/**
	 * Search products with filters
	 */
	async searchProducts(
		filters: ProductSearchFilters,
		options: PaginationOptions
	): Promise<PaginatedResult<Product>> {
		const cacheKey = `search:${JSON.stringify(filters)}:${options.page}:${options.limit}`;

		// Verificar cache
		const cached = this.getFromCache<PaginatedResult<Product>>(cacheKey);
		if (cached) {
			this.logAction('Cache hit for product search', { cacheKey });
			return cached;
		}

		this.logAction('Searching products', { filters, options });

		try {
			// Por enquanto, buscar próximos produtos (limitado)
			// TODO: Implementar findAll() no Repository quando necessário
			const limit = 1000; // Limite razoável para evitar scan muito grande
			let products = await this.productRepository.getNextProductsToCheck(limit);

			// Aplicar filtros
			products = this.applyFilters(products, filters);

			// Ordenar por relevância e data
			products = this.sortByRelevance(products, filters.query);

			// Aplicar paginação
			const result = this.paginate<Product>(products, options);

			// Armazenar no cache
			this.setCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logError(error as Error, 'searchProducts');
			throw error;
		}
	}

	/**
	 * Get product by ID with cache
	 */
	async getProductById(productId: string): Promise<Product | null> {
		const cacheKey = `product:${productId}`;

		// Verificar cache
		const cached = this.getFromCache<Product | null>(cacheKey);
		if (cached !== undefined) {
			this.logAction('Cache hit for product', { productId });
			return cached;
		}

		this.logAction('Getting product by ID', { productId });

		try {
			const product = await this.productRepository.findById(productId);

			// Armazenar no cache
			this.setCache(cacheKey, product);

			return product;
		} catch (error) {
			this.logError(error as Error, 'getProductById');
			throw error;
		}
	}

	/**
	 * Clear cache for a specific key or all cache
	 */
	clearCache(key?: string): void {
		if (key) {
			this.cache.delete(key);
			this.logAction('Cache cleared for key', { key });
		} else {
			this.cache.clear();
			this.logAction('All cache cleared');
		}
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys())
		};
	}

	// ===== Private Helper Methods =====

	/**
	 * Apply filters to products array
	 */
	private applyFilters(products: Product[], filters: ProductSearchFilters): Product[] {
		let filtered = [...products];

		// Filtro de texto (busca em título)
		if (filters.query) {
			const query = filters.query.toLowerCase();
			filtered = filtered.filter((p) =>
				p.title.toLowerCase().includes(query)
			);
		}

		// Filtro de preço mínimo
		if (filters.minPrice !== undefined) {
			filtered = filtered.filter((p) => p.price >= filters.minPrice!);
		}

		// Filtro de preço máximo
		if (filters.maxPrice !== undefined) {
			filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
		}

		// Filtro de categoria
		if (filters.category) {
			filtered = filtered.filter(
				(p) => p.category?.toLowerCase() === filters.category!.toLowerCase()
			);
		}

		// Filtro de formato
		if (filters.format) {
			filtered = filtered.filter(
				(p) => p.format?.toLowerCase() === filters.format!.toLowerCase()
			);
		}

		// Filtro de gênero
		if (filters.genre) {
			filtered = filtered.filter(
				(p) => p.genre?.toLowerCase() === filters.genre!.toLowerCase()
			);
		}

		// Filtro de editora
		if (filters.publisher) {
			filtered = filtered.filter(
				(p) => p.publisher?.toLowerCase() === filters.publisher!.toLowerCase()
			);
		}

		// Filtro de disponibilidade (usando in_stock como proxy)
		if (filters.available !== undefined) {
			filtered = filtered.filter((p) => p.in_stock === filters.available);
		}

		return filtered;
	}

	/**
	 * Sort products by relevance (query match score) and date
	 */
	private sortByRelevance(products: Product[], query?: string): Product[] {
		if (!query) {
			// Sem query, ordenar apenas por data
			return products.sort((a, b) => {
				return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			});
		}

		const queryLower = query.toLowerCase();

		// Calcular score de relevância para cada produto
		const scored = products.map((product) => {
			let score = 0;
			const titleLower = product.title.toLowerCase();

			// Correspondência exata no início do título
			if (titleLower.startsWith(queryLower)) {
				score += 100;
			}

			// Correspondência exata em qualquer posição
			if (titleLower.includes(queryLower)) {
				score += 50;
			}

			// Palavras individuais correspondentes
			const queryWords = queryLower.split(' ');
			queryWords.forEach((word) => {
				if (titleLower.includes(word)) {
					score += 10;
				}
			});

			return { product, score };
		});

		// Ordenar por score (maior primeiro) e depois por data
		return scored
			.sort((a, b) => {
				if (b.score !== a.score) {
					return b.score - a.score;
				}
				return (
					new Date(b.product.updated_at).getTime() -
					new Date(a.product.updated_at).getTime()
				);
			})
			.map((item) => item.product);
	}

	/**
	 * Paginate results array
	 */
	private paginate<T>(items: T[], options: PaginationOptions): PaginatedResult<T> {
		const { page, limit } = options;
		const total = items.length;
		const totalPages = Math.ceil(total / limit);
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;

		return {
			data: items.slice(startIndex, endIndex),
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1
			}
		};
	}

	/**
	 * Get item from cache if not expired
	 */
	private getFromCache<T>(key: string): T | undefined {
		const entry = this.cache.get(key);

		if (!entry) {
			return undefined;
		}

		// Verificar se expirou
		const now = Date.now();
		if (now - entry.timestamp > this.CACHE_TTL) {
			this.cache.delete(key);
			return undefined;
		}

		return entry.data as T;
	}

	/**
	 * Store item in cache with timestamp
	 */
	private setCache<T>(key: string, data: T): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now()
		});
	}
}
