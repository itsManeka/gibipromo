import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Home } from '../Home'

// Mock dos ícones lucide-react
jest.mock('lucide-react', () => ({
	ArrowRight: () => <div data-testid="arrow-right-icon" />,
	TrendingDown: () => <div data-testid="trending-down-icon" />,
	Bell: () => <div data-testid="bell-icon" />,
	Star: () => <div data-testid="star-icon" />,
	BookOpen: () => <div data-testid="book-icon" />,
	Sparkles: () => <div data-testid="sparkles-icon" />,
}))

const HomeWithRouter = () => (
	<BrowserRouter>
		<Home />
	</BrowserRouter>
)

describe('Home Page', () => {
	it('deve renderizar o hero section', () => {
		render(<HomeWithRouter />)

		expect(screen.getByText(/descubra as melhores/i)).toBeInTheDocument()
		expect(screen.getByText(/promoções/i)).toBeInTheDocument()
		expect(screen.getByText(/de quadrinhos e mangás/i)).toBeInTheDocument()
	})

	it('deve renderizar botões de ação principais', () => {
		render(<HomeWithRouter />)

		expect(screen.getByRole('link', { name: /explorar promoções/i })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /bot no telegram/i })).toBeInTheDocument()
	})

	it('deve renderizar seção de como funciona', () => {
		render(<HomeWithRouter />)

		expect(screen.getByText(/como funciona/i)).toBeInTheDocument()
		expect(screen.getByText(/configure alertas/i)).toBeInTheDocument()
		expect(screen.getByText(/monitoramento 24\/7/i)).toBeInTheDocument()
		expect(screen.getByText(/notificação instantânea/i)).toBeInTheDocument()
	})

	it('deve renderizar seção de promoções', () => {
		render(<HomeWithRouter />)

		expect(screen.getByText(/últimas promoções/i)).toBeInTheDocument()
		expect(screen.getByText(/one piece/i)).toBeInTheDocument()
		expect(screen.getByText(/attack on titan/i)).toBeInTheDocument()
		expect(screen.getByText(/batman/i)).toBeInTheDocument()
	})

	it('deve ter link para ver todas as promoções', () => {
		render(<HomeWithRouter />)

		const verTodasLink = screen.getByRole('link', { name: /ver todas/i })
		expect(verTodasLink).toHaveAttribute('href', '/promocoes')
	})

	it('deve renderizar CTA final', () => {
		render(<HomeWithRouter />)

		expect(screen.getByText(/pronto para economizar/i)).toBeInTheDocument()
		expect(screen.getByText(/começar no telegram/i)).toBeInTheDocument()
	})

	it('deve mostrar preços dos produtos mockados', () => {
		render(<HomeWithRouter />)

		// Verificar se os preços estão sendo exibidos
		expect(screen.getByText('R$ 19,90')).toBeInTheDocument()
		expect(screen.getByText('R$ 22,45')).toBeInTheDocument()
		expect(screen.getByText('R$ 35,50')).toBeInTheDocument()
	})

	it('deve mostrar descontos dos produtos', () => {
		render(<HomeWithRouter />)

		expect(screen.getByText('-33%')).toBeInTheDocument()
		expect(screen.getByText('-36%')).toBeInTheDocument()
		expect(screen.getByText('-29%')).toBeInTheDocument()
	})
})