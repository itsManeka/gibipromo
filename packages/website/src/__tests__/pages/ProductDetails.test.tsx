/**
 * Tests for ProductDetails page
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ProductDetails } from '../../pages/ProductDetails';
import { productsService, Product } from '../../api/products.service';
import { useAuth } from '../../contexts/AuthContext';

// Mock do react-router-dom
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: () => ({ id: 'B08XYZ1234' }),
	useNavigate: () => jest.fn(),
}));

// Mock do productsService
jest.mock('../../api/products.service', () => ({
	...jest.requireActual('../../api/products.service'),
	productsService: {
		getProduct: jest.fn(),
		isMonitoring: jest.fn(),
		monitorProduct: jest.fn(),
		unmonitorProduct: jest.fn(),
	},
}));

// Mock do useAuth
jest.mock('../../contexts/AuthContext', () => ({
	useAuth: jest.fn(),
}));

// Mock do PriceHistoryChart (para não precisar lidar com Recharts nos testes)
jest.mock('../../components/PriceHistoryChart', () => ({
	PriceHistoryChart: () => <div data-testid="price-history-chart">Chart</div>,
}));

describe('ProductDetails', () => {
	const mockProduct: Product = {
		id: 'B08XYZ1234',
		title: 'One Piece Vol. 100',
		price: 59.90,
		full_price: 79.90,
		lowest_price: 49.90,
		in_stock: true,
		url: 'https://amazon.com/dp/B08XYZ1234',
		image: 'https://image.url/product.jpg',
		preorder: false,
		offer_id: 'offer1',
		store: 'Amazon',
		category: 'Mangá',
		format: 'Capa comum',
		genre: 'Aventura',
		publisher: 'Panini',
		contributors: ['Eiichiro Oda'],
		product_group: 'Book',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
	});

	const renderWithRouter = (component: React.ReactElement) => {
		return render(<BrowserRouter>{component}</BrowserRouter>);
	};

	it('should display loading state initially', () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockImplementation(
			() => new Promise(() => {}) // Promise que nunca resolve
		);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		expect(screen.getByText('Carregando produto...')).toBeInTheDocument();
	});

	it('should display product details after loading', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			const titles = screen.getAllByText(mockProduct.title);
			expect(titles.length).toBeGreaterThan(0);
		});

		expect(screen.getByText(/Eiichiro Oda/)).toBeInTheDocument();
		expect(screen.getByText(/Panini/)).toBeInTheDocument();
		expect(screen.getByText(`R$ ${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
	});

	it('should display error message when product not found', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockRejectedValue(
			new Error('Produto não encontrado')
		);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			const errorTexts = screen.getAllByText('Produto não encontrado');
			expect(errorTexts.length).toBeGreaterThan(0);
		});
	});

	it('should display discount badge when product has discount', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			const discount = Math.round(
				((mockProduct.full_price - mockProduct.price) / mockProduct.full_price) * 100
			);
			expect(screen.getByText(`-${discount}%`)).toBeInTheDocument();
		});
	});

	it('should NOT show monitor button when user is not authenticated', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);
		(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			const titles = screen.getAllByText(mockProduct.title);
			expect(titles.length).toBeGreaterThan(0);
		});

		expect(screen.queryByText('Monitorar Produto')).not.toBeInTheDocument();
		expect(screen.queryByText('Monitorando')).not.toBeInTheDocument();
	});

	it('should show "Monitorar Produto" button when user is authenticated and not monitoring', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);
		(productsService.isMonitoring as jest.Mock).mockResolvedValue(false);
		(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			expect(screen.getByText('Monitorar Produto')).toBeInTheDocument();
		});
	});

	it('should show "Monitorando" button when user is authenticated and monitoring', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);
		(productsService.isMonitoring as jest.Mock).mockResolvedValue(true);
		(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			expect(screen.getByText('Monitorando')).toBeInTheDocument();
		});
	});

	it('should call monitorProduct when clicking monitor button', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);
		(productsService.isMonitoring as jest.Mock).mockResolvedValue(false);
		(productsService.monitorProduct as jest.Mock).mockResolvedValue(undefined);
		(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });

		// Act
		renderWithRouter(<ProductDetails />);

		await waitFor(() => {
			expect(screen.getByText('Monitorar Produto')).toBeInTheDocument();
		});

		const monitorButton = screen.getByText('Monitorar Produto');
		fireEvent.click(monitorButton);

		// Assert
		await waitFor(() => {
			expect(productsService.monitorProduct).toHaveBeenCalled();
		}, {timeout: 3000});
	});

	it('should toggle chart visibility when clicking on chart section', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);

		// Act
		renderWithRouter(<ProductDetails />);

		await waitFor(() => {
			const titles = screen.getAllByText(mockProduct.title);
			expect(titles.length).toBeGreaterThan(0);
		});

		// Inicialmente o gráfico não deve estar visível
		expect(screen.queryByTestId('price-history-chart')).not.toBeInTheDocument();

		// Clicar para expandir
		const chartToggle = screen.getByText('Histórico de Preços');
		fireEvent.click(chartToggle);

		// Assert - Gráfico deve aparecer
		await waitFor(() => {
			expect(screen.getByTestId('price-history-chart')).toBeInTheDocument();
		});
	});

	it('should display "Ver na Amazon" link', async () => {
		// Arrange
		(productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			const amazonLink = screen.getByText('Ver na Amazon').closest('a');
			expect(amazonLink).toHaveAttribute('href', mockProduct.url);
			expect(amazonLink).toHaveAttribute('target', '_blank');
		});
	});

	it('should display badges for product status', async () => {
		// Arrange
		const preorderProduct = { ...mockProduct, preorder: true };
		(productsService.getProduct as jest.Mock).mockResolvedValue(preorderProduct);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			expect(screen.getByText('Pré-venda')).toBeInTheDocument();
		});
	});

	it('should display "Sem Estoque" badge when product is out of stock', async () => {
		// Arrange
		const outOfStockProduct = { ...mockProduct, in_stock: false };
		(productsService.getProduct as jest.Mock).mockResolvedValue(outOfStockProduct);

		// Act
		renderWithRouter(<ProductDetails />);

		// Assert
		await waitFor(() => {
			expect(screen.getByText('Sem Estoque')).toBeInTheDocument();
		});
	});
});

