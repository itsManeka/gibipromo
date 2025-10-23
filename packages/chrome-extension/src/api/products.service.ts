/**
 * Serviço de produtos
 * Adaptado do website
 */

import { apiClient } from './client';
import { Product, ProductStats } from '@gibipromo/shared';

/**
 * Resposta padrão da API
 */
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Resposta de status de monitoria
 */
interface MonitoringStatusResponse {
	isMonitoring: boolean;
	productUserId?: string;
	desiredPrice?: number;
}

/**
 * Resposta ao adicionar produto via URL
 */
interface AddProductResponse {
	action_id: string;
	message: string;
}

/**
 * Serviço de produtos
 */
export const productsService = {
	/**
	 * Busca detalhes de um produto específico
	 * Retorna null se o produto não for encontrado (404)
	 */
	async getProduct(productId: string): Promise<Product | null> {
		try {
			const response = await apiClient.get<ApiResponse<Product>>(`/products/${productId}`);

			if (!response.success || !response.data) {
				return null;
			}

			return response.data;
		} catch (error: any) {
			// Se for 404, retorna null silenciosamente (produto não existe ainda)
			if (error.status === 404) {
				return null;
			}
			// Outros erros devem ser propagados
			throw error;
		}
	},

	/**
	 * Busca estatísticas de preço de um produto
	 */
	async getProductStats(productId: string, period: number = 30): Promise<ProductStats[]> {
		const response = await apiClient.get<ApiResponse<ProductStats[]>>(
			`/products/${productId}/stats?period=${period}`
		);

		if (!response.success || !response.data) {
			throw new Error(response.error || 'Falha ao buscar estatísticas');
		}

		return response.data;
	},

	/**
	 * Verifica se o usuário está monitorando um produto
	 */
	async isMonitoring(productId: string): Promise<MonitoringStatusResponse> {
		try {
			const response = await apiClient.get<ApiResponse<MonitoringStatusResponse>>(
				`/products/${productId}/monitoring-status`
			);

			if (!response.success || !response.data) {
				return { isMonitoring: false };
			}

			return response.data;
		} catch {
			return { isMonitoring: false };
		}
	},

	/**
	 * Adiciona produto ao monitoramento
	 */
	async monitorProduct(productId: string, desiredPrice?: number): Promise<void> {
		const response = await apiClient.post<ApiResponse<void>>(
			`/products/${productId}/monitor`,
			{ desired_price: desiredPrice }
		);

		if (!response.success) {
			throw new Error(response.error || 'Falha ao monitorar produto');
		}
	},

	/**
	 * Remove produto do monitoramento
	 */
	async unmonitorProduct(productId: string): Promise<void> {
		const response = await apiClient.delete<ApiResponse<void>>(
			`/products/${productId}/monitor`
		);

		if (!response.success) {
			throw new Error(response.error || 'Falha ao parar de monitorar');
		}
	},

	/**
	 * Adiciona produto para monitoramento via URL da Amazon
	 * Cria uma ação para o scheduler processar
	 */
	async addProductByUrl(url: string): Promise<AddProductResponse> {
		const response = await apiClient.post<ApiResponse<AddProductResponse>>(
			'/products/add',
			{ url }
		);

		if (!response.success || !response.data) {
			throw new Error(response.error || 'Falha ao adicionar produto');
		}

		return response.data;
	},

	/**
	 * Atualiza preço desejado de um produto
	 */
	async updateDesiredPrice(productUserId: string, desiredPrice: number): Promise<void> {
		const response = await apiClient.patch<ApiResponse<void>>(`/products/${productUserId}`, {
			desired_price: desiredPrice,
		});

		if (!response.success) {
			throw new Error(response.error || 'Falha ao atualizar preço desejado');
		}
	},
};

