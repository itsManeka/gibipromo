/**
 * Serviço de perfil de usuário
 */

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
 * Interface de perfil do usuário
 */
export interface UserProfile {
	id: string;
	user_id: string;
	nick: string;
	created_at: string;
	updated_at: string;
}

/**
 * Serviço de perfil
 */
export const profileService = {
	/**
	 * Busca perfil do usuário autenticado
	 */
	async getProfile(): Promise<UserProfile> {
		const response = await apiClient.get<ApiResponse<UserProfile>>('/users/profile');

		if (!response.success || !response.data) {
			throw new Error(response.error || 'Falha ao buscar perfil');
		}

		return response.data;
	},
};

