/**
 * Tests for preferences.service.ts
 * 
 * Verifica o funcionamento do serviço de preferências do usuário
 */

import { preferencesService, UserPreferences, UpdatePreferencesRequest } from '../../api/preferences.service';

// Mock do apiClient
jest.mock('../../api/client', () => ({
	apiClient: {
		get: jest.fn(),
		put: jest.fn()
	}
}));

import { apiClient } from '../../api/client';

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('preferencesService', () => {
	// Helper para criar preferências de teste
	const createMockPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => {
		const now = new Date().toISOString();
		return {
			id: 'pref-123',
			user_id: 'user-456',
			monitor_preorders: true,
			monitor_coupons: true,
			created_at: now,
			updated_at: now,
			...overrides
		};
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getPreferences', () => {
		it('deve buscar preferências com sucesso', async () => {
			// Arrange
			const mockPreferences = createMockPreferences({
				monitor_preorders: false,
				monitor_coupons: true
			});

			mockedApiClient.get.mockResolvedValue({
				data: {
					success: true,
					data: mockPreferences
				}
			} as any);

			// Act
			const result = await preferencesService.getPreferences();

			// Assert
			expect(result).toEqual(mockPreferences);
			expect(mockedApiClient.get).toHaveBeenCalledWith('/users/preferences');
			expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
		});

		it('deve lançar erro quando API retorna sucesso falso', async () => {
			// Arrange
			mockedApiClient.get.mockResolvedValue({
				data: {
					success: false,
					error: 'User not authenticated'
				}
			} as any);

			// Act & Assert
			await expect(preferencesService.getPreferences()).rejects.toThrow('User not authenticated');
			expect(mockedApiClient.get).toHaveBeenCalledWith('/users/preferences');
		});

		it('deve lançar erro quando data é null', async () => {
			// Arrange
			mockedApiClient.get.mockResolvedValue({
				data: {
					success: true,
					data: null
				}
			} as any);

			// Act & Assert
			await expect(preferencesService.getPreferences()).rejects.toThrow('Falha ao buscar preferências');
		});

		it('deve lançar erro quando API retorna erro sem mensagem', async () => {
			// Arrange
			mockedApiClient.get.mockResolvedValue({
				data: {
					success: false
				}
			} as any);

			// Act & Assert
			await expect(preferencesService.getPreferences()).rejects.toThrow('Falha ao buscar preferências');
		});

		it('deve propagar erro de rede', async () => {
			// Arrange
			const networkError = new Error('Network error');
			mockedApiClient.get.mockRejectedValue(networkError);

			// Act & Assert
			await expect(preferencesService.getPreferences()).rejects.toThrow('Network error');
		});

		it('deve retornar preferências com todos os campos', async () => {
			// Arrange
			const mockPreferences = createMockPreferences();
			mockedApiClient.get.mockResolvedValue({
				data: {
					success: true,
					data: mockPreferences
				}
			} as any);

			// Act
			const result = await preferencesService.getPreferences();

			// Assert
			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('user_id');
			expect(result).toHaveProperty('monitor_preorders');
			expect(result).toHaveProperty('monitor_coupons');
			expect(result).toHaveProperty('created_at');
			expect(result).toHaveProperty('updated_at');
		});
	});

	describe('updatePreferences', () => {
		it('deve atualizar preferências com sucesso', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: false,
				monitor_coupons: false
			};

			const mockUpdatedPreferences = createMockPreferences(updateData);

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: true,
					data: mockUpdatedPreferences
				}
			} as any);

			// Act
			const result = await preferencesService.updatePreferences(updateData);

			// Assert
			expect(result).toEqual(mockUpdatedPreferences);
			expect(mockedApiClient.put).toHaveBeenCalledWith('/users/preferences', updateData);
			expect(mockedApiClient.put).toHaveBeenCalledTimes(1);
		});

		it('deve atualizar apenas monitor_preorders', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: true
			};

			const mockUpdatedPreferences = createMockPreferences({
				monitor_preorders: true,
				monitor_coupons: true // Mantém valor anterior
			});

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: true,
					data: mockUpdatedPreferences
				}
			} as any);

			// Act
			const result = await preferencesService.updatePreferences(updateData);

			// Assert
			expect(result.monitor_preorders).toBe(true);
			expect(mockedApiClient.put).toHaveBeenCalledWith('/users/preferences', updateData);
		});

		it('deve atualizar apenas monitor_coupons', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_coupons: false
			};

			const mockUpdatedPreferences = createMockPreferences({
				monitor_preorders: true, // Mantém valor anterior
				monitor_coupons: false
			});

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: true,
					data: mockUpdatedPreferences
				}
			} as any);

			// Act
			const result = await preferencesService.updatePreferences(updateData);

			// Assert
			expect(result.monitor_coupons).toBe(false);
			expect(mockedApiClient.put).toHaveBeenCalledWith('/users/preferences', updateData);
		});

		it('deve lançar erro quando API retorna sucesso falso', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: false
			};

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: false,
					error: 'Validation error'
				}
			} as any);

			// Act & Assert
			await expect(preferencesService.updatePreferences(updateData)).rejects.toThrow('Validation error');
		});

		it('deve lançar erro quando data é null', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: false
			};

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: true,
					data: null
				}
			} as any);

			// Act & Assert
			await expect(preferencesService.updatePreferences(updateData)).rejects.toThrow('Falha ao atualizar preferências');
		});

		it('deve lançar erro genérico quando API retorna erro sem mensagem', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: false
			};

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: false
				}
			} as any);

			// Act & Assert
			await expect(preferencesService.updatePreferences(updateData)).rejects.toThrow('Falha ao atualizar preferências');
		});

		it('deve propagar erro de rede', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: false
			};

			const networkError = new Error('Network timeout');
			mockedApiClient.put.mockRejectedValue(networkError);

			// Act & Assert
			await expect(preferencesService.updatePreferences(updateData)).rejects.toThrow('Network timeout');
		});

		it('deve enviar requisição correta com múltiplos campos', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: true,
				monitor_coupons: false
			};

			const mockUpdatedPreferences = createMockPreferences(updateData);

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: true,
					data: mockUpdatedPreferences
				}
			} as any);

			// Act
			await preferencesService.updatePreferences(updateData);

			// Assert
			expect(mockedApiClient.put).toHaveBeenCalledWith('/users/preferences', updateData);
		});

		it('deve retornar preferências atualizadas com timestamp novo', async () => {
			// Arrange
			const updateData: UpdatePreferencesRequest = {
				monitor_preorders: false
			};

			const now = new Date().toISOString();
			const mockUpdatedPreferences = createMockPreferences({
				...updateData,
				updated_at: now
			});

			mockedApiClient.put.mockResolvedValue({
				data: {
					success: true,
					data: mockUpdatedPreferences
				}
			} as any);

			// Act
			const result = await preferencesService.updatePreferences(updateData);

			// Assert
			expect(result.updated_at).toBe(now);
		});
	});
});

