import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock dos componentes filhos
jest.mock('../layout/AppLayout', () => ({
	AppLayout: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="app-layout">{children}</div>
	)
}))

jest.mock('../routes', () => ({
	AppRoutes: () => <div data-testid="app-routes">Routes</div>
}))

jest.mock('../contexts/ThemeContext', () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="theme-provider">{children}</div>
	)
}))

jest.mock('../contexts/AuthContext', () => ({
	AuthProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="auth-provider">{children}</div>
	)
}))

jest.mock('../contexts/ProfileContext', () => ({
	ProfileProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="profile-provider">{children}</div>
	)
}))

describe('App', () => {
	it('deve renderizar sem erros', () => {
		render(<App />)

		expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
		expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
		expect(screen.getByTestId('profile-provider')).toBeInTheDocument()
		expect(screen.getByTestId('app-layout')).toBeInTheDocument()
		expect(screen.getByTestId('app-routes')).toBeInTheDocument()
	})

	it('deve ter estrutura correta de providers', () => {
		render(<App />)

		const themeProvider = screen.getByTestId('theme-provider')
		const authProvider = screen.getByTestId('auth-provider')
		const profileProvider = screen.getByTestId('profile-provider')
		const appLayout = screen.getByTestId('app-layout')
		const routes = screen.getByTestId('app-routes')

		expect(themeProvider).toContainElement(authProvider)
		expect(authProvider).toContainElement(profileProvider)
		expect(profileProvider).toContainElement(appLayout)
		expect(appLayout).toContainElement(routes)
	})
})