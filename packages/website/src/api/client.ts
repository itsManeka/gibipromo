import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * API Client singleton com interceptors para autenticação
 */
class ApiClient {
	private client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: API_URL,
			headers: {
				'Content-Type': 'application/json',
			},
			timeout: 10000, // 10 segundos
		});

		// Request interceptor - adiciona token JWT automaticamente
		this.client.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem('gibipromo_token');
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		// Response interceptor - trata erros globalmente
		this.client.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => {
				// Token expirado ou inválido - limpar autenticação
				if (error.response?.status === 401) {
					this.clearAuth();

					// Redirecionar para login se não estiver na página de login
					if (window.location.pathname !== '/login') {
						window.location.href = '/login';
					}
				}

				return Promise.reject(error);
			}
		);
	}

	/**
	 * Limpa dados de autenticação do localStorage
	 */
	private clearAuth(): void {
		localStorage.removeItem('gibipromo_token');
		localStorage.removeItem('gibipromo_user');
	}

	/**
	 * Retorna a instância do cliente Axios
	 */
	public getClient(): AxiosInstance {
		return this.client;
	}
}

// Exportar instância única do cliente
export const apiClient = new ApiClient().getClient();
