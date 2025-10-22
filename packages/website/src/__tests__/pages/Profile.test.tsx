import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from '../../pages/Profile';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { formatDate } from '../../utils/date';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/ProfileContext');
jest.mock('../../utils/date');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;

describe('Profile', () => {
	const mockUser = {
		id: 'user-1',
		email: 'joao@email.com',
		enabled: true,
		created_at: '2024-01-15T10:00:00.000Z',
		updated_at: '2024-01-15T10:00:00.000Z',
	};

	const mockProfile = {
		id: 'profile-1',
		user_id: 'user-1',
		nick: 'joaosilva',
		created_at: '2024-01-15T10:00:00.000Z',
		updated_at: '2024-01-15T10:00:00.000Z',
	};

	const mockUpdateProfile = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseAuth.mockReturnValue({
			user: mockUser,
			token: 'mock-token',
			isAuthenticated: true,
			isLoading: false,
			login: jest.fn(),
			register: jest.fn(),
			logout: jest.fn(),
			validateSession: jest.fn(),
		});

		mockUseProfile.mockReturnValue({
			profile: mockProfile,
			isLoading: false,
			error: null,
			fetchProfile: jest.fn(),
			updateProfile: mockUpdateProfile,
		});

		mockFormatDate.mockReturnValue('15/01/2024');
	});

	const renderProfile = () => {
		return render(
			<BrowserRouter>
				<Profile />
			</BrowserRouter>
		);
	};

	it('deve renderizar o perfil do usuário corretamente', () => {
		renderProfile();

		expect(screen.getByText('👤 Meu Perfil')).toBeInTheDocument();
		expect(screen.getByText('joaosilva')).toBeInTheDocument();
		expect(screen.getByText('joao@email.com')).toBeInTheDocument();
	});

	it('deve exibir o campo "Membro desde" com a data formatada', () => {
		renderProfile();

		expect(screen.getByText('Membro desde')).toBeInTheDocument();
		expect(screen.getByText('15/01/2024')).toBeInTheDocument();
		expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15T10:00:00.000Z');
	});

	it('deve exibir "Não definido" quando o nick não está configurado', () => {
		mockUseProfile.mockReturnValue({
			profile: { ...mockProfile, nick: '' },
			isLoading: false,
			error: null,
			fetchProfile: jest.fn(),
			updateProfile: mockUpdateProfile,
		});

		renderProfile();

		expect(screen.getByText('Não definido')).toBeInTheDocument();
	});

	it('deve exibir "Data não disponível" quando created_at não existe', () => {
		mockUseAuth.mockReturnValue({
			user: { ...mockUser, created_at: '' },
			token: 'mock-token',
			isAuthenticated: true,
			isLoading: false,
			login: jest.fn(),
			register: jest.fn(),
			logout: jest.fn(),
			validateSession: jest.fn(),
		});

		renderProfile();

		expect(screen.getByText('Data não disponível')).toBeInTheDocument();
	});

	it('deve entrar em modo de edição ao clicar em "Editar"', () => {
		renderProfile();

		const editButton = screen.getByRole('button', { name: /editar/i });
		fireEvent.click(editButton);

		expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Digite seu nickname')).toBeInTheDocument();
	});

	it('deve atualizar o nickname ao salvar', async () => {
		mockUpdateProfile.mockResolvedValueOnce(undefined);

		renderProfile();

		// Entra em modo de edição
		const editButton = screen.getByRole('button', { name: /editar/i });
		fireEvent.click(editButton);

		// Altera o nickname
		const input = screen.getByPlaceholderText('Digite seu nickname');
		fireEvent.change(input, { target: { value: 'novonick' } });

		// Salva
		const saveButton = screen.getByRole('button', { name: /salvar/i });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockUpdateProfile).toHaveBeenCalledWith('novonick');
		});
	});

	it('deve exibir erro quando o nickname está vazio ao salvar', async () => {
		renderProfile();

		// Entra em modo de edição
		const editButton = screen.getByRole('button', { name: /editar/i });
		fireEvent.click(editButton);

		// Limpa o nickname
		const input = screen.getByPlaceholderText('Digite seu nickname');
		fireEvent.change(input, { target: { value: '   ' } });

		// Tenta salvar
		const saveButton = screen.getByRole('button', { name: /salvar/i });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(screen.getByText('O nickname não pode estar vazio')).toBeInTheDocument();
		});

		expect(mockUpdateProfile).not.toHaveBeenCalled();
	});

	it('deve exibir erro quando a atualização falha', async () => {
		mockUpdateProfile.mockRejectedValueOnce(new Error('Nickname já está em uso'));

		renderProfile();

		// Entra em modo de edição
		const editButton = screen.getByRole('button', { name: /editar/i });
		fireEvent.click(editButton);

		// Altera o nickname
		const input = screen.getByPlaceholderText('Digite seu nickname');
		fireEvent.change(input, { target: { value: 'novonick' } });

		// Salva
		const saveButton = screen.getByRole('button', { name: /salvar/i });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(screen.getByText('Nickname já está em uso')).toBeInTheDocument();
		});
	});

	it('deve cancelar edição e restaurar valor original', () => {
		renderProfile();

		// Entra em modo de edição
		const editButton = screen.getByRole('button', { name: /editar/i });
		fireEvent.click(editButton);

		// Altera o nickname
		const input = screen.getByPlaceholderText('Digite seu nickname');
		fireEvent.change(input, { target: { value: 'novonick' } });

		// Cancela
		const cancelButton = screen.getByRole('button', { name: /cancelar/i });
		fireEvent.click(cancelButton);

		// Verifica que voltou ao modo de visualização
		expect(screen.queryByPlaceholderText('Digite seu nickname')).not.toBeInTheDocument();
		expect(screen.getByText('joaosilva')).toBeInTheDocument();
	});

	it('deve exibir loading enquanto carrega o perfil', () => {
		mockUseProfile.mockReturnValue({
			profile: null,
			isLoading: true,
			error: null,
			fetchProfile: jest.fn(),
			updateProfile: mockUpdateProfile,
		});

		renderProfile();

		expect(screen.getByText('Carregando perfil...')).toBeInTheDocument();
	});

	it('deve exibir erro quando falha ao carregar o perfil', () => {
		mockUseProfile.mockReturnValue({
			profile: null,
			isLoading: false,
			error: 'Erro ao carregar perfil',
			fetchProfile: jest.fn(),
			updateProfile: mockUpdateProfile,
	});

	renderProfile();

	expect(screen.getAllByText('Erro ao carregar perfil').length).toBeGreaterThan(0);
	expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
});	it('deve ter link para página de promoções', () => {
		renderProfile();

		const links = screen.getAllByText(/ver todas as promoções/i);
		expect(links.length).toBeGreaterThan(0);
		expect(links[0].closest('a')).toHaveAttribute('href', '/promocoes');
	});
});
