import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1'; // Mock da URL

/**
 * API Client singleton com interceptors para autenticação (MOCK para testes)
 */
class ApiClient {
	private client: any;

	constructor() {
		this.client = axios.create({
			baseURL: API_URL,
			headers: {
				'Content-Type': 'application/json',
			},
			timeout: 10000,
		});

		// Request interceptor - adiciona token JWT automaticamente
		this.client.interceptors.request.use(
			(config: any) => {
				const token = localStorage.getItem('auth_token');
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error: any) => {
				return Promise.reject(error);
			}
		);

		// Response interceptor - trata erros globalmente
		this.client.interceptors.response.use(
			(response: any) => response,
			async (error: any) => {
				if (error.response?.status === 401) {
					localStorage.removeItem('auth_token');
					localStorage.removeItem('user_id');
					window.location.href = '/login';
				}
				return Promise.reject(error);
			}
		);
	}

	getClient() {
		return this.client;
	}
}

export const apiClient = new ApiClient().getClient();
