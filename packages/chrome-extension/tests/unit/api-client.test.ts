/**
 * Testes para API Client
 */

import { apiClient } from '../../src/api/client';
import * as storage from '../../src/utils/storage';

// Mock storage
jest.mock('../../src/utils/storage');

describe('API Client', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(global.fetch as jest.Mock).mockClear();
	});

	describe('GET request', () => {
		it('deve fazer requisição GET com token', async () => {
			const mockToken = 'test-token';
			const mockResponse = { success: true, data: { id: '123' } };

			(storage.get as jest.Mock).mockResolvedValue(mockToken);
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await apiClient.get('/test');

			expect(storage.get).toHaveBeenCalledWith('gibipromo_token');
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/test'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockToken}`,
					}),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it('deve fazer requisição GET sem token se não autenticado', async () => {
			(storage.get as jest.Mock).mockResolvedValue(null);
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ success: true }),
			});

			await apiClient.get('/test');

			const fetchCall = (global.fetch as jest.Mock).mock.calls[0][1];
			expect(fetchCall.headers.Authorization).toBeUndefined();
		});

		it('deve tratar erro 401', async () => {
			(storage.get as jest.Mock).mockResolvedValue('invalid-token');
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 401,
				json: () => Promise.resolve({}),
			});

			await expect(apiClient.get('/test')).rejects.toThrow('Não autenticado');
			expect(storage.clear).toHaveBeenCalled();
		});
	});

	describe('POST request', () => {
		it('deve fazer requisição POST com dados', async () => {
			const mockData = { email: 'test@test.com' };
			const mockResponse = { success: true };

			(storage.get as jest.Mock).mockResolvedValue(null);
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve(mockResponse),
			});

			await apiClient.post('/auth/login', mockData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(mockData),
				})
			);
		});
	});

	describe('DELETE request', () => {
		it('deve fazer requisição DELETE', async () => {
			(storage.get as jest.Mock).mockResolvedValue('token');
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ success: true }),
			});

			await apiClient.delete('/products/123');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'DELETE',
				})
			);
		});
	});
});

