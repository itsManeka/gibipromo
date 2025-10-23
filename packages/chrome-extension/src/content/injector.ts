/**
 * Injector - responsável por injetar o quadro na página da Amazon
 */

import { logger } from '../utils/logger';

/**
 * Dados para o card do produto
 */
export interface ProductCardData {
	asin: string;
	oldPrice?: number;
	lowestPrice: number;
	isMonitoring: boolean;
	isAuthenticated: boolean;
	productUserId?: string;
	desiredPrice?: number;
	productExists: boolean; // Indica se o produto já existe no GibiPromo
	productUrl: string; // URL completa do produto na Amazon
}

/**
 * Encontra ponto de injeção na página
 * Tenta inserir acima de "Frequentemente comprados juntos"
 */
export function findInjectionPoint(): HTMLElement | null {
	// Seletores para "Frequentemente comprados juntos"
	const selectors = [
		'#sims-productBundle_feature_div_01'
	];

	for (const selector of selectors) {
		const element = document.querySelector<HTMLElement>(selector);
		if (element) {
			logger.debug(`Ponto de injeção encontrado: ${selector}`);
			return element;
		}
	}

	// Fallback: inserir após container principal do produto
	const fallbackSelectors = [
		'#dp-container',
		'#centerCol',
		'#dp',
		'#ppd',
		'[data-feature-name="desktop_buybox"]',
	];

	for (const selector of fallbackSelectors) {
		const element = document.querySelector<HTMLElement>(selector);
		if (element) {
			logger.debug(`Usando fallback para injeção: ${selector}`);
			return element;
		}
	}

	logger.warn('Nenhum ponto de injeção encontrado');
	return null;
}

/**
 * Remove card existente se houver
 */
export function removeExistingCard(): void {
	const existing = document.getElementById('gibipromo-card-container');
	if (existing) {
		existing.remove();
	}
}

/**
 * Injeta card do produto na página
 */
export function injectProductCard(html: string): boolean {
	try {
		const injectionPoint = findInjectionPoint();
		if (!injectionPoint) {
			logger.error('Não foi possível encontrar ponto de injeção');
			return false;
		}

		// Remover card existente
		removeExistingCard();

		// Inserir antes do ponto de injeção
		injectionPoint.insertAdjacentHTML('beforebegin', html);

		logger.info('Card injetado com sucesso');
		return true;
	} catch (error) {
		logger.error('Erro ao injetar card:', error);
		return false;
	}
}

/**
 * Verifica se o card já foi injetado
 */
export function isCardInjected(): boolean {
	return document.getElementById('gibipromo-card-container') !== null;
}

