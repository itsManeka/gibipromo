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
	full_price?: number;
	old_price?: number;
	lowest_price?: number;
	url: string;
	image: string;
	in_stock: boolean;
	preorder: boolean;
	offer_id?: string;
	store?: string;
	created_at: string;
	updated_at: string;
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
 * Serviço de produtos
 * Responsável por gerenciar produtos monitorados pelo usuário
 */
export const productsService = {
	/**
	 * Lista todos os produtos monitorados pelo usuário
	 * @returns Lista de produtos com relação ProductUser
	 */
	async getUserProducts(): Promise<ProductUser[]> {
		const response = await apiClient.get<ApiResponse<ProductUser[]>>('/products');

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar produtos');
		}

		return response.data.data;
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
};
