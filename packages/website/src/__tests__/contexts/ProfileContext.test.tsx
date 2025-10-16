import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../../contexts/ProfileContext';
import { profileService } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

// Mocks
jest.mock('../../api');
jest.mock('../../contexts/AuthContext');

const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProfileContext', () => {
	const mockProfile = {
		id: 'profile-1',
		user_id: 'user-1',
		nick: 'joaosilva',
		created_at: '2024-01-15T10:00:00.000Z',
		updated_at: '2024-01-15T10:00:00.000Z',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: {
				id: 'user-1',
				email: 'joao@email.com',
				enabled: true,
				created_at: '2024-01-15T10:00:00.000Z',
				updated_at: '2024-01-15T10:00:00.000Z',
			},
			token: 'mock-token',
			isLoading: false,
			login: jest.fn(),
			register: jest.fn(),
			logout: jest.fn(),
			validateSession: jest.fn(),
		});
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ProfileProvider>{children}</ProfileProvider>
	);

	it('deve inicializar com estado padrão', async () => {
		mockProfileService.getProfile.mockResolvedValueOnce(mockProfile);

		const { result } = renderHook(() => useProfile(), { wrapper })

		// Aguarda auto-fetch completar
		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		expect(result.current.error).toBeNull()
	})

	it('deve buscar perfil automaticamente quando autenticado', async () => {
		mockProfileService.getProfile.mockResolvedValueOnce(mockProfile);

		const { result } = renderHook(() => useProfile(), { wrapper });

		await waitFor(() => {
			expect(result.current.profile).toEqual(mockProfile);
		});

		expect(mockProfileService.getProfile).toHaveBeenCalledTimes(1);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('deve definir erro quando a busca falha', async () => {
		mockProfileService.getProfile.mockRejectedValueOnce(new Error('Erro ao buscar perfil'));

		const { result } = renderHook(() => useProfile(), { wrapper });

		await waitFor(() => {
			expect(result.current.error).toBe('Erro ao buscar perfil');
		});

		expect(result.current.profile).toBeNull();
		expect(result.current.isLoading).toBe(false);
	});

	it('não deve buscar perfil quando não autenticado', async () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
			token: null,
			isLoading: false,
			login: jest.fn(),
			register: jest.fn(),
			logout: jest.fn(),
			validateSession: jest.fn(),
		});

		renderHook(() => useProfile(), { wrapper });

		await waitFor(() => {
			expect(mockProfileService.getProfile).not.toHaveBeenCalled();
		});
	});

	it('deve atualizar perfil com sucesso', async () => {
		mockProfileService.getProfile.mockResolvedValueOnce(mockProfile);

		const updatedProfile = { ...mockProfile, nick: 'novonick' };
		mockProfileService.updateProfile.mockResolvedValueOnce(updatedProfile);

		const { result } = renderHook(() => useProfile(), { wrapper });

		// Aguarda carregamento inicial
		await waitFor(() => {
			expect(result.current.profile).toEqual(mockProfile);
		});

		// Atualiza perfil
		await act(async () => {
			await result.current.updateProfile('novonick');
		});

		expect(mockProfileService.updateProfile).toHaveBeenCalledWith({ nick: 'novonick' });
		expect(result.current.profile).toEqual(updatedProfile);
		expect(result.current.error).toBeNull();
	});

	it('deve definir erro quando atualização falha', async () => {
		mockProfileService.getProfile.mockResolvedValueOnce(mockProfile);
		mockProfileService.updateProfile.mockRejectedValueOnce(
			new Error('Nickname já está em uso')
		);

		const { result } = renderHook(() => useProfile(), { wrapper });

		// Aguarda carregamento inicial
		await waitFor(() => {
			expect(result.current.profile).toEqual(mockProfile);
		});

		// Tenta atualizar perfil
		await act(async () => {
			try {
				await result.current.updateProfile('novonick');
			} catch (error) {
				// Erro esperado
			}
		});

		expect(result.current.error).toBe('Nickname já está em uso');
		expect(result.current.profile).toEqual(mockProfile); // Perfil não muda
	});

	it('deve limpar perfil quando usuário desloga', async () => {
		mockProfileService.getProfile.mockResolvedValueOnce(mockProfile);

		const { result, rerender } = renderHook(() => useProfile(), { wrapper });

		// Aguarda carregamento inicial
		await waitFor(() => {
			expect(result.current.profile).toEqual(mockProfile);
		});

		// Simula logout
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
			token: null,
			isLoading: false,
			login: jest.fn(),
			register: jest.fn(),
			logout: jest.fn(),
			validateSession: jest.fn(),
		});

		rerender();

		await waitFor(() => {
			expect(result.current.profile).toBeNull();
			expect(result.current.error).toBeNull();
		});
	});

	it('deve lançar erro se usado fora do ProfileProvider', () => {
		// Suprime o erro do console para o teste
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

		expect(() => {
			renderHook(() => useProfile());
		}).toThrow('useProfile must be used within a ProfileProvider');

		consoleError.mockRestore();
	});
});
