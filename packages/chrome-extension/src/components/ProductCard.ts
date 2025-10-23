/**
 * ProductCard Component
 * Quadro injetado na página da Amazon
 */

import type { ProductCardData } from '../content/injector';

/**
 * Formata preço para BRL
 */
function formatPrice(price: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(price);
}

/**
 * Calcula percentual de desconto
 */
function calculateDiscount(oldPrice: number, currentPrice: number): number {
	if (oldPrice <= 0 || currentPrice >= oldPrice) return 0;
	return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
}

/**
 * Cria HTML do card de produto
 */
export function createProductCard(data: ProductCardData): string {
	const {
		oldPrice,
		lowestPrice,
		isMonitoring,
		desiredPrice,
		isAuthenticated,
		productExists,
	} = data;

	const hasPrice = lowestPrice || oldPrice || desiredPrice;

	return `
		<div id="gibipromo-card-container" class="gibipromo-card">
			${createHeader()}
			<div class="gibipromo-card-body">
				${hasPrice ? createPriceSection(oldPrice, lowestPrice, desiredPrice) : createNoDataSection()}
				${hasPrice ? createHistorySection() : ''}
				${createMonitoringSection(isAuthenticated, isMonitoring, productExists)}
			</div>
		</div>
	`;
}

/**
 * Cria header do card
 */
function createHeader(): string {
	return `
		<div class="gibipromo-card-header">
			<div class="gibipromo-logo">
				<span class="gibipromo-title">GibiPromo</span>
			</div>
			<a href="https://gibipromo.com" target="_blank" class="gibipromo-link" title="Visitar GibiPromo">
				Saiba mais
			</a>
		</div>
	`;
}

/**
 * Cria seção de preços
 */
function createPriceSection(
	oldPrice: number | undefined,
	lowestPrice: number,
	desiredPrice: number | undefined
): string {
	return `
		<div class="gibipromo-price-section">
			<div class="gibipromo-price-row">
				${
					oldPrice
						? `
					<div class="gibipromo-price-item">
						<span class="gibipromo-price-label">Preço anterior:</span>
						<span class="gibipromo-price-value gibipromo-old">${formatPrice(oldPrice)}</span>
					</div>
				`
						: ''
				}
				${
					lowestPrice
						? `
					<div class="gibipromo-price-item">
						<span class="gibipromo-price-label">Preço mais baixo:</span>
						<span class="gibipromo-price-value gibipromo-lowest">${formatPrice(lowestPrice)}</span>
					</div>
				`
						: ''
				}
				${
					desiredPrice
						? `
					<div class="gibipromo-price-item">
						<span class="gibipromo-price-label">Preço desejado:</span>
						<span class="gibipromo-price-value gibipromo-desired">${formatPrice(desiredPrice)}</span>
					</div>
				`
						: ''
				}
			</div>
		</div>
	`;
}

/**
 * Cria seção de "sem dados"
 */
function createNoDataSection(): string {
	return `
		<div class="gibipromo-no-data-section">
			<p class="gibipromo-no-data-text">
				Este produto ainda não está sendo rastreado pelo GibiPromo.
			</p>
			<p class="gibipromo-no-data-subtext">
				Inicie a monitoria para começar a acompanhar o histórico de preços!
			</p>
		</div>
	`;
}

/**
 * Cria seção de histórico (colapsável)
 */
function createHistorySection(): string {
	return `
		<div class="gibipromo-history-section">
			<button id="gibipromo-toggle-history" class="gibipromo-toggle-btn" aria-label="Ver histórico de preços">
				▼ Ver Histórico de Preços
			</button>
			<div id="gibipromo-history-container" class="gibipromo-history-container"></div>
		</div>
	`;
}

/**
 * Cria seção de monitoria
 */
function createMonitoringSection(
	isAuthenticated: boolean,
	isMonitoring: boolean,
	productExists: boolean
): string {
	if (!isAuthenticated) {
		return `
			<div class="gibipromo-monitoring-section">
				<div class="gibipromo-auth-required">
					<p>Faça login para monitorar este produto e receber alertas de preço!</p>
				</div>
			</div>
		`;
	}

	// Se produto não existe, mostrar botão "Criar Monitoria"
	if (!productExists) {
		return `
			<div class="gibipromo-monitoring-section">
				<div class="gibipromo-monitoring-status">
					<span class="gibipromo-status-text">ⓘ Este produto ainda não possui rastreio</span>
				</div>
				<button 
					id="gibipromo-monitor-btn" 
					class="gibipromo-btn gibipromo-btn-primary"
					aria-label="Criar monitoria para este produto"
				>
					Criar Monitoria
				</button>
			</div>
			<div id="gibipromo-status-message" class="gibipromo-status-message" style="display: none;"></div>
		`;
	}

	// Produto existe - fluxo normal
	return `
		<div class="gibipromo-monitoring-section">
			<div class="gibipromo-monitoring-status">
				<span class="gibipromo-status-text">
					${isMonitoring ? '✓ Você está monitorando este produto' : '✗ Você não está monitorando este produto'}
				</span>
			</div>
			<button 
				id="gibipromo-monitor-btn" 
				class="gibipromo-btn ${isMonitoring ? 'gibipromo-btn-secondary' : 'gibipromo-btn-primary'}"
				aria-label="${isMonitoring ? 'Parar monitoria' : 'Iniciar monitoria'}"
			>
				${isMonitoring ? 'Parar Monitoria' : 'Iniciar Monitoria'}
			</button>
		</div>
	`;
}

