/**
 * PriceChart Component
 * Renderiza gráfico de histórico de preços usando Chart.js
 */

import { ProductStats } from '@gibipromo/shared';
import { Chart, registerables } from 'chart.js';

// Registrar componentes do Chart.js
Chart.register(...registerables);

/**
 * Formata data para exibição
 */
function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'short',
	}).format(date);
}

/**
 * Renderiza gráfico de preços
 */
export function renderPriceChart(container: HTMLElement, stats: ProductStats[]): void {
	// Ordenar por data
	const sortedStats = [...stats].sort(
		(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
	);

	// Preparar dados
	const labels = sortedStats.map((stat) => formatDate(stat.created_at));
	const prices = sortedStats.map((stat) => stat.price);

	// Criar wrapper para melhor controle de layout
	const wrapper = document.createElement('div');
	wrapper.style.cssText = 'width: 100%; min-height: 200px; padding: 12px; background-color: #fff; border-radius: 6px;';

	// Criar canvas
	const canvas = document.createElement('canvas');
	canvas.id = 'gibipromo-price-chart';
	canvas.setAttribute('role', 'img');
	canvas.setAttribute('aria-label', 'Gráfico de histórico de preços');
	canvas.style.cssText = 'display: block; width: 100%; height: 250px;';

	wrapper.appendChild(canvas);
	container.innerHTML = '';
	container.appendChild(wrapper);

	// Aguardar próximo frame para garantir que o canvas está no DOM com dimensões
	requestAnimationFrame(() => {
		// Criar gráfico
		new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Preço (R$)',
						data: prices,
						borderColor: '#7C3AED',
						backgroundColor: 'rgba(124, 58, 237, 0.1)',
						borderWidth: 2,
						fill: true,
						tension: 0.3,
						pointRadius: 4,
						pointHoverRadius: 6,
						pointBackgroundColor: '#7C3AED',
						pointBorderColor: '#fff',
						pointBorderWidth: 2,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false,
					},
					tooltip: {
						backgroundColor: '#1E1E2A',
						titleColor: '#F5F5F5',
						bodyColor: '#F5F5F5',
						borderColor: '#7C3AED',
						borderWidth: 1,
						padding: 12,
						displayColors: false,
						callbacks: {
							label: (context) => {
								const value = context.parsed.y;
								if (value === null || value === undefined) return '';
								return `R$ ${value.toFixed(2)}`;
							},
						},
					},
				},
				scales: {
					y: {
						beginAtZero: false,
						ticks: {
							callback: (value) => `R$ ${value}`,
							color: '#666',
							font: {
								size: 11,
							},
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)',
						},
					},
					x: {
						ticks: {
							color: '#666',
							font: {
								size: 11,
							},
							maxRotation: 45,
							minRotation: 45,
						},
						grid: {
							display: false,
						},
					},
				},
			},
		});
	});
}

