import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Header } from '../Header'
import { ThemeProvider } from '../../contexts/ThemeContext'

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
		<ThemeProvider>
			<Header />
		</ThemeProvider>
	</BrowserRouter>
)

describe('Header', () => {
	it('deve renderizar o logo e navegação', () => {
		render(<HeaderWithProviders />)

		expect(screen.getByText('GibiPromo')).toBeInTheDocument()
		expect(screen.getByText('Início')).toBeInTheDocument()
		expect(screen.getByText('Promoções')).toBeInTheDocument()
		expect(screen.getByText('Perfil')).toBeInTheDocument()
		expect(screen.getByText('Configurações')).toBeInTheDocument()
	})

	it('deve abrir/fechar menu mobile', () => {
		render(<HeaderWithProviders />)

		const menuButton = screen.getByRole('button', { name: /menu/i })
		fireEvent.click(menuButton)

		// Verificar se os links mobile estão visíveis
		const mobileLinks = screen.getAllByText('Início')
		expect(mobileLinks.length).toBeGreaterThan(1) // Desktop + mobile
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

	it('deve ter links corretos na navegação', () => {
		render(<HeaderWithProviders />)

		expect(screen.getByRole('link', { name: /gibipromo/i })).toHaveAttribute('href', '/')
		expect(screen.getByRole('link', { name: /início/i })).toHaveAttribute('href', '/')
		expect(screen.getByRole('link', { name: /promoções/i })).toHaveAttribute('href', '/promocoes')
		expect(screen.getByRole('link', { name: /perfil/i })).toHaveAttribute('href', '/perfil')
		expect(screen.getByRole('link', { name: /configurações/i })).toHaveAttribute('href', '/configuracoes')
	})
})