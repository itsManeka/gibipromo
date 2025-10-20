import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Header } from '../Header'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { ProfileProvider } from '../../contexts/ProfileContext'

// Mock dos ícones lucide-react
jest.mock('lucide-react', () => ({
	Menu: () => <div data-testid="menu-icon" />,
	X: () => <div data-testid="x-icon" />,
	BookOpen: () => <div data-testid="book-icon" />,
	Settings: () => <div data-testid="settings-icon" />,
	User: () => <div data-testid="user-icon" />,
	Home: () => <div data-testid="home-icon" />,
	Tag: () => <div data-testid="tag-icon" />,
	LogOut: () => <div data-testid="logout-icon" />,
	ChevronDown: () => <div data-testid="chevron-down-icon" />,
}))

const HeaderWithProviders = () => (
	<BrowserRouter>
		<AuthProvider>
			<ProfileProvider>
				<ThemeProvider>
					<Header />
				</ThemeProvider>
			</ProfileProvider>
		</AuthProvider>
	</BrowserRouter>
)

describe('Header', () => {
	it('deve renderizar o logo e navegação para usuário não autenticado', () => {
		render(<HeaderWithProviders />)

		// Logo e nome do site
		expect(screen.getByText('GibiPromo')).toBeInTheDocument()
		
		// Links públicos visíveis quando NÃO está logado
		expect(screen.getByText('Início')).toBeInTheDocument()
		expect(screen.getByText('Promoções')).toBeInTheDocument() // Agora é público
		expect(screen.getByText('Entrar')).toBeInTheDocument()
		expect(screen.getByText('Cadastrar')).toBeInTheDocument()

		// Links privados NÃO devem aparecer quando não está logado
		expect(screen.queryByText('Adicionar Produtos')).not.toBeInTheDocument()
	})

	it('deve abrir/fechar menu mobile', () => {
		render(<HeaderWithProviders />)

		// Buscar botão pelo testid do ícone (já que o botão não tem nome acessível)
		const menuIcon = screen.getByTestId('menu-icon')
		const menuButton = menuIcon.parentElement as HTMLElement

		// Verificar que o menu está fechado inicialmente
		expect(screen.queryByText('Conectado como')).not.toBeInTheDocument()

		// Abrir o menu
		fireEvent.click(menuButton)

		// Verificar se os links mobile estão visíveis
		const inicioLinks = screen.getAllByText('Início')
		expect(inicioLinks.length).toBeGreaterThan(1) // Desktop + mobile
	})

	it('deve alternar tema', () => {
		render(<HeaderWithProviders />)

		// Buscar botão de tema pelo emoji ou título
		const themeButtons = screen.getAllByRole('button')
		const themeButton = themeButtons.find(button =>
			button.textContent?.includes('🌞') || button.textContent?.includes('🌙')
		)

		expect(themeButton).toBeInTheDocument()

		if (themeButton) {
			fireEvent.click(themeButton)
			// Verificar se o tema mudou (seria necessário verificar o contexto)
		}
	})

	it('deve ter links corretos na navegação pública', () => {
		render(<HeaderWithProviders />)

		// Links que aparecem quando NÃO está logado
		expect(screen.getByRole('link', { name: /gibipromo/i })).toHaveAttribute('href', '/')
		expect(screen.getByRole('link', { name: /início/i })).toHaveAttribute('href', '/')
		expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
		expect(screen.getByRole('link', { name: /cadastrar/i })).toHaveAttribute('href', '/registro')
	})
})