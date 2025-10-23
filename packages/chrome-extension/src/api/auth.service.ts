/**
 * Serviço de autenticação
 * Adaptado do website
 */

import { apiClient } from './client';
import * as storage from '../utils/storage';

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
		created_at: string;
		updated_at: string;
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
 */
export const authService = {
	/**
	 * Realiza login do usuário
	 */
	async login(data: LoginRequest): Promise<AuthResponse> {
		const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);

		if (!response.success || !response.data) {
			throw new Error(response.error || 'Falha ao fazer login');
		}

		// Salvar token e usuário no storage
		await storage.set('gibipromo_token', response.data.token);
		await storage.set('gibipromo_user', JSON.stringify(response.data.user));

		return response.data;
	},

	/**
	 * Registra novo usuário
	 */
	async register(data: RegisterRequest): Promise<AuthResponse> {
		const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);

		if (!response.success || !response.data) {
			throw new Error(response.error || 'Falha ao criar conta');
		}

		// Salvar token e usuário no storage
		await storage.set('gibipromo_token', response.data.token);
		await storage.set('gibipromo_user', JSON.stringify(response.data.user));

		return response.data;
	},

	/**
	 * Valida se o token JWT ainda é válido
	 */
	async validateToken(token: string): Promise<boolean> {
		try {
			const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(
				'/auth/validate',
				{ token }
			);

			return response.success && response.data?.valid === true;
		} catch {
			return false;
		}
	},

	/**
	 * Busca dados do usuário autenticado
	 */
	async me(): Promise<AuthResponse['user']> {
		const response = await apiClient.get<ApiResponse<AuthResponse['user']>>('/auth/me');

		if (!response.success || !response.data) {
			throw new Error(response.error || 'Falha ao buscar dados do usuário');
		}

		return response.data;
	},

	/**
	 * Verifica se usuário está autenticado
	 */
	async isAuthenticated(): Promise<boolean> {
		const token = await storage.get('gibipromo_token');
		if (!token) {
			return false;
		}

		return await this.validateToken(token);
	},

	/**
	 * Faz logout do usuário
	 */
	async logout(): Promise<void> {
		await storage.clear();
	},
};

