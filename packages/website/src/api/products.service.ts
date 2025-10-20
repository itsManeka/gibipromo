import { apiClient } from './client';

/**
 * Resposta padrão da API
 */
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Produto da Amazon
 */
export interface Product {
	id: string; // ASIN
	title: string;
	price: number;
	full_price: number;
	old_price?: number;
	lowest_price: number;
	url: string;
	image: string;
	in_stock: boolean;
	preorder: boolean;
	offer_id: string;
	store: string;
	category?: string;
	format?: string;
	genre?: string;
	publisher?: string;
	contributors?: string[];
	product_group?: string;
	created_at: string;
	updated_at: string;
}

/**
 * Filtros para busca de promoções
 */
export interface PromotionFilters {
	query?: string;
	category?: string;
	publisher?: string;
	genre?: string;
	format?: string;
	contributors?: string[];
	preorder?: boolean;
	inStock?: boolean;
	onlyMyProducts?: boolean;
}

/**
 * Opções de ordenação para promoções
 */
export type PromotionSortType = 'discount' | 'price-low' | 'price-high' | 'name' | 'updated' | 'created';

/**
 * Opções de filtros disponíveis
 */
export interface FilterOptions {
	categories: string[];
	publishers: string[];
	genres: string[];
	formats: string[];
	contributors: string[];
}

/**
 * Resultado paginado
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
 * Relação entre usuário e produto
 */
export interface ProductUser {
	id: string;
	user_id: string;
	product_id: string;
	desired_price?: number;
	created_at: string;
	updated_at: string;
	product?: Product; // Produto populado
}

/**
 * Requisição para adicionar produto
 */
export interface AddProductRequest {
	url: string;
	desired_price?: number;
}

/**
 * Resposta ao adicionar produto via URL
 */
export interface AddProductResponse {
	action_id: string;
	message: string;
	estimated_time: string;
}

/**
 * Resposta da validação de URL
 */
export interface ValidateUrlResponse {
	valid: boolean;
	message: string;
}

/**
 * Estatísticas de preço do produto
 */
export interface ProductStats {
	id: string;
	product_id: string;
	price: number;
	old_price: number;
	percentage_change: number;
	created_at: string;
}

/**
 * Serviço de produtos
 * Responsável por gerenciar produtos monitorados pelo usuário
 */
export const productsService = {
	/**
	 * Lista todos os produtos monitorados pelo usuário
	 * @returns Lista de produtos do usuário (não paginado)
	 */
	async getUserProducts(
		limit: number,
		sortBy: PromotionSortType = 'updated'
	): Promise<Product[]> {
		// Usa o endpoint de promoções com filtro onlyMyProducts
		// Limite alto para pegar todos os produtos do usuário
		const response = await apiClient.get<ApiResponse<PaginatedResult<Product>>>(
			`/products/promotions?onlyMyProducts=true&limit=${limit}&sortBy=${sortBy}`
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar produtos');
		}

		return response.data.data.data; // Retorna apenas o array de produtos
	},

	/**
	 * Adiciona novo produto para monitorar
	 * @param data - URL do produto e preço desejado (opcional)
	 */
	async addProduct(data: AddProductRequest): Promise<void> {
		const response = await apiClient.post<ApiResponse<void>>('/products', data);

		if (!response.data.success) {
			throw new Error(response.data.error || 'Falha ao adicionar produto');
		}
	},

	/**
	 * Remove produto da lista de monitoramento
	 * @param productUserId - ID da relação ProductUser
	 */
	async removeProduct(productUserId: string): Promise<void> {
		const response = await apiClient.delete<ApiResponse<void>>(
			`/products/${productUserId}`
		);

		if (!response.data.success) {
			throw new Error(response.data.error || 'Falha ao remover produto');
		}
	},

	/**
	 * Atualiza preço desejado de um produto
	 * @param productUserId - ID da relação ProductUser
	 * @param desiredPrice - Novo preço desejado
	 */
	async updateDesiredPrice(
		productUserId: string,
		desiredPrice: number
	): Promise<void> {
		const response = await apiClient.patch<ApiResponse<void>>(
			`/products/${productUserId}`,
			{ desired_price: desiredPrice }
		);

		if (!response.data.success) {
			throw new Error(response.data.error || 'Falha ao atualizar preço desejado');
		}
	},

	/**
	 * Busca detalhes de um produto específico
	 * @param productId - ASIN do produto
	 * @returns Dados completos do produto
	 */
	async getProduct(productId: string): Promise<Product> {
		const response = await apiClient.get<ApiResponse<Product>>(
			`/products/${productId}`
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar produto');
		}

		return response.data.data;
	},

	/**
	 * Busca promoções com filtros avançados
	 * @param filters - Filtros a serem aplicados
	 * @param page - Página atual (padrão: 1)
	 * @param limit - Itens por página (padrão: 20)
	 * @param sortBy - Tipo de ordenação (padrão: 'discount')
	 * @returns Resultado paginado com promoções
	 */
	async getPromotions(
		filters: PromotionFilters = {},
		page: number = 1,
		limit: number = 20,
		sortBy: PromotionSortType = 'discount'
	): Promise<PaginatedResult<Product>> {
		// Construir query params
		const params = new URLSearchParams();
		params.append('page', page.toString());
		params.append('limit', limit.toString());
		params.append('sortBy', sortBy);

		if (filters.query) params.append('q', filters.query);
		if (filters.category) params.append('category', filters.category);
		if (filters.publisher) params.append('publisher', filters.publisher);
		if (filters.genre) params.append('genre', filters.genre);
		if (filters.format) params.append('format', filters.format);
		
		if (filters.contributors && filters.contributors.length > 0) {
			params.append('contributors', filters.contributors.join('|'));
		}
		
		if (filters.preorder !== undefined) {
			params.append('preorder', filters.preorder.toString());
		}
		
		if (filters.inStock !== undefined) {
			params.append('inStock', filters.inStock.toString());
		}
		
		if (filters.onlyMyProducts !== undefined) {
			params.append('onlyMyProducts', filters.onlyMyProducts.toString());
		}

		const response = await apiClient.get<ApiResponse<PaginatedResult<Product>>>(
			`/products/promotions?${params.toString()}`
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar promoções');
		}

		return response.data.data;
	},

	/**
	 * Busca opções disponíveis para filtros
	 * @returns Valores únicos de cada campo filtrável
	 */
	async getFilterOptions(): Promise<FilterOptions> {
		const response = await apiClient.get<ApiResponse<FilterOptions>>(
			'/products/filter-options'
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar opções de filtros');
		}

		return response.data.data;
	},

	/**
	 * Adiciona produto para monitoramento via URL da Amazon
	 * @param url - URL do produto na Amazon
	 * @returns Dados da ação criada
	 */
	async addProductByUrl(url: string): Promise<AddProductResponse> {
		const response = await apiClient.post<ApiResponse<AddProductResponse>>(
			'/products/add',
			{ url }
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao adicionar produto');
		}

		return response.data.data;
	},

	/**
	 * Adiciona múltiplos produtos de uma vez
	 * @param urls - Array de URLs de produtos
	 * @returns Resultado com contadores de sucesso/falha
	 */
	async addMultipleProducts(urls: string[]): Promise<{
		success_count: number;
		failed_count: number;
		failed_urls: string[];
		message: string;
	}> {
		const response = await apiClient.post<ApiResponse<{
			success_count: number;
			failed_count: number;
			failed_urls: string[];
			message: string;
		}>>('/products/add-multiple', { urls });

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao adicionar produtos');
		}

		return response.data.data;
	},

	/**
	 * Valida URL da Amazon em tempo real (sem criar action)
	 * @param url - URL a ser validada
	 * @returns Resultado da validação
	 */
	async validateUrl(url: string): Promise<ValidateUrlResponse> {
		try {
			const response = await apiClient.post<ApiResponse<ValidateUrlResponse>>(
				'/products/validate-url',
				{ url }
			);

			if (!response.data.success || !response.data.data) {
				return {
					valid: false,
					message: response.data.error || 'URL inválida'
				};
			}

			return response.data.data;
		} catch (error: any) {
			return {
				valid: false,
				message: error.response?.data?.error || 'Erro ao validar URL'
			};
		}
	},

	/**
	 * Busca as últimas promoções (ordenadas por updated_at DESC)
	 * Endpoint público para exibir na home page
	 * @param limit - Número máximo de promoções (padrão: 3)
	 * @returns Lista de produtos em promoção
	 */
	async getLatestPromotions(limit: number = 3): Promise<Product[]> {
		const response = await apiClient.get<ApiResponse<Product[]>>(
			`/products/latest-promotions?limit=${limit}`
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar últimas promoções');
		}

		return response.data.data;
	},

	/**
	 * Busca estatísticas de preço de um produto
	 * @param productId - ASIN do produto
	 * @param period - Período em dias (30, 90, 180, 365)
	 * @returns Array de estatísticas de preço
	 */
	async getProductStats(productId: string, period: number = 30): Promise<ProductStats[]> {
		const response = await apiClient.get<ApiResponse<ProductStats[]>>(
			`/products/${productId}/stats?period=${period}`
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar estatísticas');
		}

		return response.data.data;
	},

	/**
	 * Verifica se o usuário está monitorando um produto
	 * Requer autenticação
	 * @param productId - ASIN do produto
	 * @returns true se estiver monitorando
	 */
	async isMonitoring(productId: string): Promise<boolean> {
		try {
			const response = await apiClient.get<ApiResponse<{ isMonitoring: boolean }>>(
				`/products/${productId}/monitoring-status`
			);

			if (!response.data.success || !response.data.data) {
				return false;
			}

			return response.data.data.isMonitoring;
		} catch (error) {
			// Se não autenticado ou erro, retornar false
			return false;
		}
	},

	/**
	 * Adiciona produto ao monitoramento
	 * Requer autenticação
	 * @param productId - ASIN do produto
	 * @param desiredPrice - Preço desejado (opcional)
	 */
	async monitorProduct(productId: string, desiredPrice?: number): Promise<void> {
		const response = await apiClient.post<ApiResponse<void>>(
			`/products/${productId}/monitor`,
			{ desired_price: desiredPrice }
		);

		if (!response.data.success) {
			throw new Error(response.data.error || 'Falha ao monitorar produto');
		}
	},

	/**
	 * Remove produto do monitoramento
	 * Requer autenticação
	 * @param productId - ASIN do produto
	 */
	async unmonitorProduct(productId: string): Promise<void> {
		const response = await apiClient.delete<ApiResponse<void>>(
			`/products/${productId}/monitor`
		);

		if (!response.data.success) {
			throw new Error(response.data.error || 'Falha ao parar de monitorar');
		}
	},
};
