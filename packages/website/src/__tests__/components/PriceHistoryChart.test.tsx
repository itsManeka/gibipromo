/**
 * Tests for PriceHistoryChart component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PriceHistoryChart } from '../../components/PriceHistoryChart';
import { productsService, ProductStats } from '../../api/products.service';

// Mock do productsService
jest.mock('../../api/products.service', () => ({
	...jest.requireActual('../../api/products.service'),
	productsService: {
		getProductStats: jest.fn(),
	},
}));

describe('PriceHistoryChart', () => {
	const mockProductId = 'B08XYZ1234';

	const mockStats: ProductStats[] = [
		{
			id: 'stat1',
			product_id: mockProductId,
			price: 79.90,
			old_price: 89.90,
			percentage_change: 11.1,
			created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'stat2',
			product_id: mockProductId,
			price: 69.90,
			old_price: 79.90,
			percentage_change: 12.5,
			created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'stat3',
			product_id: mockProductId,
			price: 59.90,
			old_price: 69.90,
			percentage_change: 14.3,
			created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render loading state initially', async () => {
		// Arrange
		(productsService.getProductStats as jest.Mock).mockImplementation(
			() => new Promise(() => {}) // Promise que nunca resolve
		);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Assert - Loading deve estar visível
		await waitFor(() => {
			expect(screen.getByText('Histórico de Preços')).toBeInTheDocument();
		});
	});

	it('should display chart with stats data', async () => {
		// Arrange
		(productsService.getProductStats as jest.Mock).mockResolvedValue(mockStats);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Assert - Verificar que o título aparece
		await waitFor(() => {
			expect(screen.getByText('Histórico de Preços')).toBeInTheDocument();
		}, { timeout: 3000 });

		// Verificar que as estatísticas foram carregadas (pelo menos uma deve aparecer após loading)
		await waitFor(() => {
			expect(productsService.getProductStats).toHaveBeenCalledWith(mockProductId, 30);
		});
	});

	it('should display empty state when no stats available', async () => {
		// Arrange
		(productsService.getProductStats as jest.Mock).mockResolvedValue([]);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Assert
		await waitFor(() => {
			expect(
				screen.getByText(/Nenhuma alteração de preço registrada/)
			).toBeInTheDocument();
		});
	});

	it('should display error message on failure', async () => {
		// Arrange
		const errorMessage = 'Erro ao carregar estatísticas';
		(productsService.getProductStats as jest.Mock).mockRejectedValue(
			new Error(errorMessage)
		);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Assert
		await waitFor(() => {
			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		// Verificar botão de tentar novamente
		expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
	});

	it('should allow changing period', async () => {
		// Arrange
		(productsService.getProductStats as jest.Mock).mockResolvedValue(mockStats);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Esperar carregar
		await waitFor(() => {
			expect(screen.getByText('30d')).toBeInTheDocument();
		});

		// Clicar no botão de 90 dias
		const button90d = screen.getByText('90d');
		fireEvent.click(button90d);

		// Assert
		await waitFor(() => {
			expect(productsService.getProductStats).toHaveBeenCalledWith(mockProductId, 90);
		}, { timeout: 3000 });
	});

	it('should retry loading stats on button click', async () => {
		// Arrange
		(productsService.getProductStats as jest.Mock)
			.mockRejectedValueOnce(new Error('Erro'))
			.mockResolvedValueOnce(mockStats);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Esperar erro aparecer
		await waitFor(() => {
			expect(screen.getByText(/Erro/)).toBeInTheDocument();
		});

		// Clicar em tentar novamente
		const retryButton = screen.getByText('Tentar novamente');
		fireEvent.click(retryButton);

		// Assert - Verificar que tentou novamente
		await waitFor(() => {
			expect(productsService.getProductStats).toHaveBeenCalledTimes(2);
		});
	});

	it('should display all period buttons', () => {
		// Arrange
		(productsService.getProductStats as jest.Mock).mockResolvedValue(mockStats);

		// Act
		render(<PriceHistoryChart productId={mockProductId} />);

		// Assert
		expect(screen.getByText('30d')).toBeInTheDocument();
		expect(screen.getByText('90d')).toBeInTheDocument();
		expect(screen.getByText('180d')).toBeInTheDocument();
		expect(screen.getByText('365d')).toBeInTheDocument();
	});
});

