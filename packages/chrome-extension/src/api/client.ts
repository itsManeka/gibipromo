/**
 * API Client para extensão Chrome
 * Adaptado do website para usar fetch e chrome.storage
 */

import * as storage from '../utils/storage';
import { logger } from '../utils/logger';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

interface RequestConfig {
	method: string;
	headers: Record<string, string>;
	body?: string;
}

/**
 * Cliente HTTP baseado em fetch
 */
class ApiClient {
	private baseURL: string;
	private timeout: number;

	constructor() {
		this.baseURL = API_URL;
		this.timeout = 10000; // 10 segundos
	}

	/**
	 * Adiciona token de autenticação ao header
	 */
	private async getAuthHeaders(): Promise<Record<string, string>> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		const token = await storage.get('gibipromo_token');
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		return headers;
	}

	/**
	 * Faz requisição com timeout
	 */
	private async fetchWithTimeout(url: string, config: RequestConfig): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				...config,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	/**
	 * Trata erro de autenticação
	 */
	private async handleAuthError(): Promise<void> {
		logger.warn('Token inválido ou expirado, fazendo logout');
		await storage.clear();

		// Notificar background script
		chrome.runtime.sendMessage({ action: 'AUTH_ERROR' });
	}

	/**
	 * GET request
	 */
	async get<T>(endpoint: string): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const headers = await this.getAuthHeaders();

		try {
			const response = await this.fetchWithTimeout(url, {
				method: 'GET',
				headers,
			});

			if (response.status === 401) {
				await this.handleAuthError();
				throw new Error('Não autenticado');
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const error = new Error(errorData.error || `HTTP error ${response.status}`);
				
				// Adicionar status code ao erro para tratamento específico
				(error as any).status = response.status;
				
				// Logar apenas erros que não são 404 (recurso não encontrado é esperado)
				if (response.status !== 404) {
					logger.error(`GET ${endpoint} falhou:`, error);
				}
				
				throw error;
			}

			return await response.json();
		} catch (error) {
			// Se já logamos acima, não logar novamente
			if (!(error instanceof Error) || !(error as any).status) {
				logger.error(`GET ${endpoint} falhou:`, error);
			}
			throw error;
		}
	}

	/**
	 * POST request
	 */
	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const headers = await this.getAuthHeaders();

		try {
			const response = await this.fetchWithTimeout(url, {
				method: 'POST',
				headers,
				body: data ? JSON.stringify(data) : undefined,
			});

			if (response.status === 401) {
				await this.handleAuthError();
				throw new Error('Não autenticado');
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP error ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			logger.error(`POST ${endpoint} falhou:`, error);
			throw error;
		}
	}

	/**
	 * DELETE request
	 */
	async delete<T>(endpoint: string): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const headers = await this.getAuthHeaders();

		try {
			const response = await this.fetchWithTimeout(url, {
				method: 'DELETE',
				headers,
			});

			if (response.status === 401) {
				await this.handleAuthError();
				throw new Error('Não autenticado');
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP error ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			logger.error(`DELETE ${endpoint} falhou:`, error);
			throw error;
		}
	}

	/**
	 * PATCH request
	 */
	async patch<T>(endpoint: string, data?: unknown): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const headers = await this.getAuthHeaders();

		try {
			const response = await this.fetchWithTimeout(url, {
				method: 'PATCH',
				headers,
				body: data ? JSON.stringify(data) : undefined,
			});

			if (response.status === 401) {
				await this.handleAuthError();
				throw new Error('Não autenticado');
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP error ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			logger.error(`PATCH ${endpoint} falhou:`, error);
			throw error;
		}
	}
}

export const apiClient = new ApiClient();

