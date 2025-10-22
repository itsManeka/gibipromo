import { apiClient } from './client';

/**
 * Interface do perfil do usuário
 */
export interface UserProfile {
	id: string;
	user_id: string;
	nick: string;
	created_at: string;
	updated_at: string;
}

/**
 * Request para atualizar perfil
 */
export interface UpdateProfileRequest {
	nick: string;
}

/**
 * Resposta padrão da API
 */
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Serviço de perfil do usuário
 * Responsável por buscar e atualizar dados do perfil
 */
export const profileService = {
	/**
	 * Busca o perfil do usuário autenticado
	 * @returns Dados do perfil do usuário
	 * @throws Error se usuário não autenticado ou perfil não encontrado
	 */
	async getProfile(): Promise<UserProfile> {
		const response = await apiClient.get<ApiResponse<UserProfile>>(
			'/users/profile'
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar perfil');
		}

		return response.data.data;
	},

	/**
	 * Atualiza o nickname do usuário
	 * @param data - Novo nickname do usuário
	 * @returns Perfil atualizado
	 * @throws Error se dados inválidos ou falha na atualização
	 */
	async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
		const response = await apiClient.put<ApiResponse<UserProfile>>(
			'/users/profile',
			data
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao atualizar perfil');
		}

		return response.data.data;
	},
};
