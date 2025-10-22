import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

// Componente de teste para usar o hook
function TestComponent() {
	const { theme, toggleTheme, setTheme } = useTheme()

	return (
		<div>
			<span data-testid="theme">{theme}</span>
			<button data-testid="toggle" onClick={toggleTheme}>
				Toggle
			</button>
			<button data-testid="set-light" onClick={() => setTheme('light')}>
				Light
			</button>
			<button data-testid="set-dark" onClick={() => setTheme('dark')}>
				Dark
			</button>
		</div>
	)
}

describe('ThemeContext', () => {
	beforeEach(() => {
		localStorage.clear()
		document.documentElement.className = ''
	})

	it('deve inicializar com tema escuro por padrão', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		expect(screen.getByTestId('theme')).toHaveTextContent('dark')
	})

	it('deve alternar entre temas', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		const toggleButton = screen.getByTestId('toggle')
		const themeDisplay = screen.getByTestId('theme')

		expect(themeDisplay).toHaveTextContent('dark')

		fireEvent.click(toggleButton)
		expect(themeDisplay).toHaveTextContent('light')

		fireEvent.click(toggleButton)
		expect(themeDisplay).toHaveTextContent('dark')
	})

	it('deve definir tema específico', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		const lightButton = screen.getByTestId('set-light')
		const darkButton = screen.getByTestId('set-dark')
		const themeDisplay = screen.getByTestId('theme')

		fireEvent.click(lightButton)
		expect(themeDisplay).toHaveTextContent('light')

		fireEvent.click(darkButton)
		expect(themeDisplay).toHaveTextContent('dark')
	})

	it('deve aplicar classe ao documentElement', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		expect(document.documentElement.classList.contains('dark')).toBe(true)

		fireEvent.click(screen.getByTestId('toggle'))
		expect(document.documentElement.classList.contains('light')).toBe(true)
		expect(document.documentElement.classList.contains('dark')).toBe(false)
	})

	it('deve lançar erro quando usado fora do provider', () => {
		// Suprimir console.error para este teste
		const originalError = console.error
		console.error = jest.fn()

		expect(() => {
			render(<TestComponent />)
		}).toThrow('useTheme must be used within a ThemeProvider')

		console.error = originalError
	})
})