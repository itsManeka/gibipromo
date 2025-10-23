/**
 * Testes para Storage Wrapper
 */

import * as storage from '../../src/utils/storage';

describe('Storage Wrapper', () => {
	beforeEach(() => {
		// Limpar todos os mocks
		jest.clearAllMocks();
	});

	describe('get', () => {
		it('deve buscar valor do storage', async () => {
			const mockValue = 'test-token';
			(chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
				callback({ gibipromo_token: mockValue });
			});

			const result = await storage.get('gibipromo_token');
			expect(result).toBe(mockValue);
			expect(chrome.storage.sync.get).toHaveBeenCalledWith(
				['gibipromo_token'],
				expect.any(Function)
			);
		});

		it('deve retornar null se valor não existir', async () => {
			(chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
				callback({});
			});

			const result = await storage.get('gibipromo_token');
			expect(result).toBeNull();
		});
	});

	describe('set', () => {
		it('deve salvar valor no storage', async () => {
			(chrome.storage.sync.set as jest.Mock).mockImplementation((items, callback) => {
				callback();
			});

			await storage.set('gibipromo_token', 'new-token');

			expect(chrome.storage.sync.set).toHaveBeenCalledWith(
				{ gibipromo_token: 'new-token' },
				expect.any(Function)
			);
		});

		it('deve rejeitar se houver erro', async () => {
			const mockError = { message: 'Storage error' };
			chrome.runtime.lastError = mockError;

			(chrome.storage.sync.set as jest.Mock).mockImplementation((items, callback) => {
				callback();
			});

			await expect(storage.set('gibipromo_token', 'token')).rejects.toEqual(mockError);

			chrome.runtime.lastError = undefined;
		});
	});

	describe('remove', () => {
		it('deve remover valor do storage', async () => {
			(chrome.storage.sync.remove as jest.Mock).mockImplementation((keys, callback) => {
				callback();
			});

			await storage.remove('gibipromo_token');

			expect(chrome.storage.sync.remove).toHaveBeenCalledWith(
				'gibipromo_token',
				expect.any(Function)
			);
		});
	});

	describe('clear', () => {
		it('deve limpar todo o storage', async () => {
			(chrome.storage.sync.clear as jest.Mock).mockImplementation((callback) => {
				callback();
			});

			await storage.clear();

			expect(chrome.storage.sync.clear).toHaveBeenCalled();
		});
	});

	describe('getMultiple', () => {
		it('deve buscar múltiplos valores', async () => {
			const mockData = {
				gibipromo_token: 'token',
				gibipromo_user: 'user-data',
			};

			(chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
				callback(mockData);
			});

			const result = await storage.getMultiple(['gibipromo_token', 'gibipromo_user']);

			expect(result).toEqual(mockData);
			expect(chrome.storage.sync.get).toHaveBeenCalledWith(
				['gibipromo_token', 'gibipromo_user'],
				expect.any(Function)
			);
		});
	});
});

