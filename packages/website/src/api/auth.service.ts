import { apiClient } from './client';

/**
 * Tipos para requisições de autenticação
 */
export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
}

/**
 * Resposta da API de autenticação
 */
export interface AuthResponse {
	token: string;
	expiresAt: string;
	user: {
		id: string;
		email: string;
		enabled: boolean;
	};
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
 * Serviço de autenticação
 * Responsável por login, registro e validação de tokens
 */
export const authService = {
	/**
	 * Realiza login do usuário
	 * @param data - Email e senha do usuário
	 * @returns Dados de autenticação (token + usuário)
	 * @throws Error se credenciais inválidas ou conta desabilitada
	 */
	async login(data: LoginRequest): Promise<AuthResponse> {
		const response = await apiClient.post<ApiResponse<AuthResponse>>(
			'/auth/login',
			data
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao fazer login');
		}

		return response.data.data;
	},

	/**
	 * Registra novo usuário
	 * @param data - Email e senha do novo usuário
	 * @returns Dados de autenticação (token + usuário)
	 * @throws Error se email já existe ou dados inválidos
	 */
	async register(data: RegisterRequest): Promise<AuthResponse> {
		const response = await apiClient.post<ApiResponse<AuthResponse>>(
			'/auth/register',
			data
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao criar conta');
		}

		return response.data.data;
	},

	/**
	 * Valida se o token JWT ainda é válido
	 * @param token - Token JWT a ser validado
	 * @returns true se válido, false caso contrário
	 */
	async validateToken(token: string): Promise<boolean> {
		try {
			const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(
				'/auth/validate',
				{ token }
			);

			return response.data.success && response.data.data?.valid === true;
		} catch (error) {
			// Token inválido ou erro de rede
			return false;
		}
	},

	/**
	 * Busca dados do usuário autenticado
	 * @returns Dados do usuário atual
	 * @throws Error se não autenticado
	 */
	async me(): Promise<AuthResponse['user']> {
		const response = await apiClient.get<ApiResponse<AuthResponse['user']>>(
			'/auth/me'
		);

		if (!response.data.success || !response.data.data) {
			throw new Error(response.data.error || 'Falha ao buscar dados do usuário');
		}

		return response.data.data;
	},
};
