import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ProductRepository, ProductUserRepository, ProductStatsRepository, PromotionFilters, FilterOptions, ProductStats, createProductUser } from '@gibipromo/shared';
import { BaseService } from './BaseService';

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
	page: number;
	limit: number;
}

/**
 * Tipos de ordenação para promoções
 */
export type PromotionSortType = 'discount' | 'price-low' | 'price-high' | 'name' | 'updated' | 'created';

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
	private readonly PROMOTIONS_CACHE_TTL = 3 * 60 * 1000; // 3 minutos para promoções (mais dinâmico)

	constructor(
		private readonly productRepository: ProductRepository,
		private readonly productUserRepository?: ProductUserRepository,
		private readonly productStatsRepository?: ProductStatsRepository
	) {
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

	/**
	 * Get promotions with advanced filters
	 * Busca produtos em promoção (price < full_price and product_group = "Book") com filtros e ordenação
	 */
	async getPromotions(
		filters: PromotionFilters,
		options: PaginationOptions,
		sortBy: PromotionSortType = 'discount',
		userId?: string
	): Promise<PaginatedResult<Product>> {
		const cacheKey = `promotions:${JSON.stringify(filters)}:${options.page}:${options.limit}:${sortBy}:${userId || 'anon'}`;

		// Verificar cache
		const cached = this.getFromCache<PaginatedResult<Product>>(cacheKey, this.PROMOTIONS_CACHE_TTL);
		if (cached) {
			this.logAction('Cache hit for promotions', { cacheKey });
			return cached;
		}

		this.logAction('Getting promotions', { filters, options, sortBy, userId });

		try {
			let products: Product[];

			// Se filtro "Meus Produtos" estiver ativado e userId fornecido
			if (filters.onlyMyProducts && userId && this.productUserRepository) {
				// 1. Buscar produtos do usuário via ProductUser
				const { productUsers } = await this.productUserRepository.findByUserId(userId, 1, 1000);
				const productIds = productUsers.map(pu => pu.product_id);

				if (productIds.length === 0) {
					// Usuário não tem produtos monitorados
					return this.createEmptyPaginatedResult(options);
				}

				// 2. Buscar produtos por IDs
				products = await this.productRepository.findByIds(productIds);

				// 3. Filtrar apenas promoções (price < full_price e product_group = "Book")
				products = products.filter(p => p.price < p.full_price && p.product_group === "Book");

				// 4. Aplicar filtros adicionais manualmente (query, contributors, etc)
				products = this.applyPromotionFilters(products, filters);
			} else {
				// Buscar todas as promoções com filtros
				products = await this.productRepository.findPromotions(filters, 1000);
			}

			// Ordenar produtos
			products = this.sortPromotions(products, sortBy);

			// Aplicar paginação
			const result = this.paginate<Product>(products, options);

			// Armazenar no cache com TTL específico para promoções
			this.setCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logError(error as Error, 'getPromotions');
			throw error;
		}
	}

	/**
	 * Get latest promotions (ordenadas por updated_at)
	 * Endpoint público para exibir na home page
	 * @param limit - Número máximo de promoções (padrão: 3)
	 * @returns Lista de produtos em promoção ordenados por updated_at DESC
	 */
	async getLatestPromotions(limit: number = 3): Promise<Product[]> {
		const cacheKey = `latest-promotions:${limit}`;

		// Verificar cache (TTL de 3 minutos)
		const cached = this.getFromCache<Product[]>(cacheKey, this.PROMOTIONS_CACHE_TTL);
		if (cached) {
			this.logAction('Cache hit for latest promotions', { cacheKey });
			return cached;
		}

		this.logAction('Getting latest promotions', { limit });

		try {
			// Buscar produtos em promoção (price < full_price e in_stock)
			const allProducts = await this.productRepository.findPromotions({}, 1000);

			// Filtrar apenas produtos válidos em promoção
			const promotions = allProducts.filter(p => 
				p.price < p.full_price && 
				p.in_stock &&
				p.price > 0 &&
				p.full_price > 0
			);

			// Ordenar por updated_at (mais recente primeiro)
			promotions.sort((a, b) => {
				const dateA = new Date(a.updated_at).getTime();
				const dateB = new Date(b.updated_at).getTime();
				return dateB - dateA;
			});

			// Retornar apenas o limite solicitado
			const result = promotions.slice(0, limit);

			// Cachear resultado
			this.setCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logError(error as Error, 'getLatestPromotions');
			throw error;
		}
	}

	/**
	 * Get unique filter values for promotions
	 * Retorna valores únicos para popular dropdowns de filtros
	 */
	async getFilterOptions(): Promise<FilterOptions> {
		const cacheKey = 'filter-options';

		// Verificar cache (TTL maior pois muda menos)
		const cached = this.getFromCache<FilterOptions>(cacheKey, this.CACHE_TTL);
		if (cached) {
			this.logAction('Cache hit for filter options');
			return cached;
		}

		this.logAction('Getting filter options');

		try {
			const options = await this.productRepository.getUniqueFilterValues();

			// Armazenar no cache
			this.setCache(cacheKey, options);

			return options;
		} catch (error) {
			this.logError(error as Error, 'getFilterOptions');
			throw error;
		}
	}

	/**
	 * Get product price statistics for a given period
	 * @param productId - Product ASIN
	 * @param period - Number of days to look back (30, 90, 180, 365)
	 * @returns Array of ProductStats for the period
	 */
	async getProductStats(productId: string, period: number): Promise<ProductStats[]> {
		if (!this.productStatsRepository) {
			this.logAction('ProductStatsRepository not configured, returning empty stats');
			return [];
		}

		const cacheKey = `stats:${productId}:${period}`;

		// Verificar cache
		const cached = this.getFromCache<ProductStats[]>(cacheKey);
		if (cached) {
			this.logAction('Cache hit for product stats', { productId, period });
			return cached;
		}

		this.logAction('Getting product stats', { productId, period });

		try {
			// Calcular data de início
			const endDate = new Date().toISOString();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - period);

			const stats = await this.productStatsRepository.findByProductIdAndDateRange(
				productId,
				startDate.toISOString(),
				endDate
			);

			// Armazenar no cache
			this.setCache(cacheKey, stats);

			return stats;
		} catch (error) {
			this.logError(error as Error, 'getProductStats');
			throw error;
		}
	}

	/**
	 * Check if user is monitoring a product
	 * @param userId - User ID
	 * @param productId - Product ASIN
	 * @returns true if user is monitoring the product
	 */
	async isUserMonitoring(userId: string, productId: string): Promise<boolean> {
		if (!this.productUserRepository) {
			return false;
		}

		this.logAction('Checking if user is monitoring product', { userId, productId });

		try {
			const relation = await this.productUserRepository.findByProductAndUser(productId, userId);
			return relation !== null;
		} catch (error) {
			this.logError(error as Error, 'isUserMonitoring');
			return false;
		}
	}

	/**
	 * Start monitoring a product
	 * Creates a ProductUser relationship if it doesn't exist
	 * @param userId - User ID
	 * @param productId - Product ASIN
	 * @param desiredPrice - Optional desired price for notifications
	 */
	async monitorProduct(userId: string, productId: string, desiredPrice?: number): Promise<void> {
		if (!this.productUserRepository) {
			throw new Error('ProductUserRepository não configurado');
		}

		this.logAction('User attempting to monitor product', { userId, productId, desiredPrice });

		try {
			// Verificar se produto existe
			const product = await this.productRepository.findById(productId);
			if (!product) {
				throw new Error('Produto não encontrado');
			}

			// Verificar se já monitora
			const existing = await this.productUserRepository.findByProductAndUser(productId, userId);
			if (existing) {
				throw new Error('Você já está monitorando este produto');
			}

			// Criar relação ProductUser
			const productUser = createProductUser({
				product_id: productId,
				user_id: userId,
				desired_price: desiredPrice
			});

			await this.productUserRepository.create(productUser);
			this.logAction('User started monitoring product', { userId, productId });

			// Limpar cache relacionado
			this.clearCache(`promotions:*${userId}*`);
		} catch (error) {
			this.logError(error as Error, 'monitorProduct');
			throw error;
		}
	}

	/**
	 * Stop monitoring a product
	 * Removes the ProductUser relationship
	 * @param userId - User ID
	 * @param productId - Product ASIN
	 */
	async unmonitorProduct(userId: string, productId: string): Promise<void> {
		if (!this.productUserRepository) {
			throw new Error('ProductUserRepository não configurado');
		}

		this.logAction('User attempting to stop monitoring product', { userId, productId });

		try {
			await this.productUserRepository.removeByProductAndUser(productId, userId);
			this.logAction('User stopped monitoring product', { userId, productId });

			// Limpar cache relacionado
			this.clearCache(`promotions:*${userId}*`);
		} catch (error) {
			this.logError(error as Error, 'unmonitorProduct');
			throw error;
		}
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
	private getFromCache<T>(key: string, ttl: number = this.CACHE_TTL): T | undefined {
		const entry = this.cache.get(key);

		if (!entry) {
			return undefined;
		}

		// Verificar se expirou
		const now = Date.now();
		if (now - entry.timestamp > ttl) {
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

	/**
	 * Create empty paginated result
	 */
	private createEmptyPaginatedResult<T>(options: PaginationOptions): PaginatedResult<T> {
		return {
			data: [],
			pagination: {
				page: options.page,
				limit: options.limit,
				total: 0,
				totalPages: 0,
				hasNextPage: false,
				hasPreviousPage: false
			}
		};
	}

	/**
	 * Apply additional filters to promotions (for "Meus Produtos" flow)
	 */
	private applyPromotionFilters(products: Product[], filters: PromotionFilters): Product[] {
		let filtered = products;

		// Filtros simples
		if (filters.category) {
			filtered = filtered.filter(p => p.category === filters.category);
		}

		if (filters.publisher) {
			filtered = filtered.filter(p => p.publisher === filters.publisher);
		}

		if (filters.genre) {
			filtered = filtered.filter(p => p.genre === filters.genre);
		}

		if (filters.format) {
			filtered = filtered.filter(p => p.format === filters.format);
		}

		if (filters.inStock !== undefined) {
			filtered = filtered.filter(p => p.in_stock === filters.inStock);
		}

		if (filters.preorder !== undefined) {
			filtered = filtered.filter(p => p.preorder === filters.preorder);
		}

		// Busca textual (title + contributors)
		if (filters.query) {
			const query = filters.query.toLowerCase();
			filtered = filtered.filter(p => {
				const titleMatch = p.title.toLowerCase().includes(query);
				const contributorsMatch = p.contributors?.some(c => c.toLowerCase().includes(query));
				return titleMatch || contributorsMatch;
			});
		}

		// Filtro por contributors específicos
		if (filters.contributors && filters.contributors.length > 0) {
			filtered = filtered.filter(p => {
				if (!p.contributors) return false;
				return filters.contributors!.some(fc =>
					p.contributors!.some(pc => pc.toLowerCase() === fc.toLowerCase())
				);
			});
		}

		return filtered;
	}

	/**
	 * Sort promotions by different criteria
	 */
	private sortPromotions(products: Product[], sortBy: PromotionSortType): Product[] {
		const sorted = [...products];

		switch (sortBy) {
			case 'discount':
				// Ordenar por percentual de desconto (maior primeiro)
				return sorted.sort((a, b) => {
					const discountA = ((a.full_price - a.price) / a.full_price) * 100;
					const discountB = ((b.full_price - b.price) / b.full_price) * 100;
					return discountB - discountA;
				});

			case 'price-low':
				// Ordenar por preço (menor primeiro)
				return sorted.sort((a, b) => a.price - b.price);

			case 'price-high':
				// Ordenar por preço (maior primeiro)
				return sorted.sort((a, b) => b.price - a.price);

			case 'name':
				// Ordenar por título (A-Z)
				return sorted.sort((a, b) => a.title.localeCompare(b.title));

			case 'updated':
				// Ordenar por data de atualização (mais recente primeiro)
				return sorted.sort((a, b) => {
					const dateA = new Date(a.updated_at).getTime();
					const dateB = new Date(b.updated_at).getTime();
					return dateB - dateA;
				});

			case 'created':
				// Ordenar por data de criação (mais recente primeiro)
				return sorted.sort((a, b) => {
					const dateA = new Date(a.created_at).getTime();
					const dateB = new Date(b.created_at).getTime();
					return dateB - dateA;
				});

			default:
				// Padrão: desconto
				return sorted.sort((a, b) => {
					const discountA = ((a.full_price - a.price) / a.full_price) * 100;
					const discountB = ((b.full_price - b.price) / b.full_price) * 100;
					return discountB - discountA;
				});
		}
	}
}
