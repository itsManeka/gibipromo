import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Login } from '../Login'

// Mock dos ícones lucide-react
jest.mock('lucide-react', () => ({
	Mail: () => <div data-testid="mail-icon" />,
	Lock: () => <div data-testid="lock-icon" />,
	Eye: () => <div data-testid="eye-icon" />,
	EyeOff: () => <div data-testid="eye-off-icon" />,
	BookOpen: () => <div data-testid="book-icon" />,
	ArrowRight: () => <div data-testid="arrow-right-icon" />,
	AlertCircle: () => <div data-testid="alert-circle-icon" />,
	MessageCircle: () => <div data-testid="message-circle-icon" />,
}))

const LoginWithRouter = () => (
	<BrowserRouter>
		<Login />
	</BrowserRouter>
)

describe('Login Page', () => {
	it('deve renderizar o formulário de login', () => {
		render(<LoginWithRouter />)

		expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument()
		expect(screen.getByLabelText('Email')).toBeInTheDocument()
		expect(screen.getByLabelText('Senha')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
	})

	it('deve mostrar erros de validação para campos obrigatórios', async () => {
		render(<LoginWithRouter />)

		const submitButton = screen.getByRole('button', { name: /entrar/i })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
			expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
		})
	})

	it('deve mostrar erro para email inválido', async () => {
		render(<LoginWithRouter />)

		const emailInput = screen.getByLabelText('Email')
		const submitButton = screen.getByRole('button', { name: /entrar/i })

		fireEvent.change(emailInput, { target: { value: 'email-invalido' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText('Email inválido')).toBeInTheDocument()
		})
	})

	it('deve mostrar erro para senha muito curta', async () => {
		render(<LoginWithRouter />)

		const passwordInput = screen.getByLabelText('Senha')
		const submitButton = screen.getByRole('button', { name: /entrar/i })

		fireEvent.change(passwordInput, { target: { value: '123' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
		})
	})

	it('deve alternar visibilidade da senha', () => {
		render(<LoginWithRouter />)

		const passwordInput = screen.getByLabelText('Senha')
		const toggleButton = screen.getByTestId('eye-icon').parentElement

		expect(passwordInput).toHaveAttribute('type', 'password')

		if (toggleButton) {
			fireEvent.click(toggleButton)
			expect(passwordInput).toHaveAttribute('type', 'text')
		}
	})

	it('deve mostrar informações do mock', () => {
		render(<LoginWithRouter />)

		expect(screen.getByText('💡 Demo - Dados para Teste')).toBeInTheDocument()
		expect(screen.getByText('usuario@exemplo.com')).toBeInTheDocument()
		expect(screen.getByText('123456')).toBeInTheDocument()
	})

	it('deve ter links para registro e telegram', () => {
		render(<LoginWithRouter />)

		expect(screen.getByRole('link', { name: /cadastre-se grátis/i })).toHaveAttribute('href', '/registro')
		expect(screen.getByRole('link', { name: /continuar com telegram/i })).toHaveAttribute('href', 'https://t.me/gibipromo_bot')
	})

	it('deve simular login bem-sucedido com dados corretos', async () => {
		render(<LoginWithRouter />)

		const emailInput = screen.getByLabelText('Email')
		const passwordInput = screen.getByLabelText('Senha')
		const submitButton = screen.getByRole('button', { name: /entrar/i })

		fireEvent.change(emailInput, { target: { value: 'usuario@exemplo.com' } })
		fireEvent.change(passwordInput, { target: { value: '123456' } })
		fireEvent.click(submitButton)

		// Verificar se o botão muda para "Entrando..."
		await waitFor(() => {
			expect(screen.getByText('Entrando...')).toBeInTheDocument()
		})
	})
})