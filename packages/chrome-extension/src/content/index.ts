/**
 * Content Script Principal
 * Detecta produtos da Amazon e injeta o quadro do GibiPromo
 */

import { isAmazonProductPage } from '../utils/amazon-detector';
import { extractASIN } from './asin-extractor';
import { authService } from '../api/auth.service';
import { productsService } from '../api/products.service';
import { injectProductCard, isCardInjected, type ProductCardData } from './injector';
import { createProductCard } from '../components/ProductCard';
import { renderPriceChart } from '../components/PriceChart';
import { logger } from '../utils/logger';
import { Product } from '@gibipromo/shared';

/**
 * Estado da injeção
 */
let isProcessing = false;

/**
 * Processa página e injeta card se aplicável
 */
async function processPage(): Promise<void> {
	// Evitar processamento duplicado
	if (isProcessing || isCardInjected()) {
		return;
	}

	isProcessing = true;
	logger.group('Processando página');

	try {
		// 1. Verificar se é página de produto
		const currentURL = window.location.href;
		if (!isAmazonProductPage(currentURL)) {
			logger.debug('Não é página de produto Amazon');
			return;
		}

		// 2. Extrair ASIN
		const asin = extractASIN(currentURL);
		if (!asin) {
			logger.warn('ASIN não encontrado na página');
			return;
		}

		logger.info(`ASIN encontrado: ${asin}`);

		// 3. Verificar autenticação
		const isAuthenticated = await authService.isAuthenticated();
		logger.debug(`Autenticado: ${isAuthenticated}`);

		// 4. Buscar dados do produto
		let product: Product | null = null;
		let isMonitoring = false;
		let productUserId: string | undefined;
		let desiredPrice: number | undefined;

		// Tentar buscar produto (retorna null se não existe, sem erro)
		product = await productsService.getProduct(asin);
		
		if (product) {
			logger.debug('Produto encontrado:', product);

			// Verificar se está monitorando (apenas se autenticado)
			if (isAuthenticated) {
				const monitoringStatus = await productsService.isMonitoring(asin);
				isMonitoring = monitoringStatus.isMonitoring;
				productUserId = monitoringStatus.productUserId;
				desiredPrice = monitoringStatus.desiredPrice;
				logger.debug(`Monitorando: ${isMonitoring}`);
			}
		} else {
			logger.debug('Produto não encontrado na API, exibindo card básico');
		}

		// 5. Preparar dados do card
		const cardData: ProductCardData = {
			asin,
			oldPrice: product?.old_price,
			lowestPrice: product?.lowest_price || 0,
			isMonitoring,
			isAuthenticated,
			productUserId,
			desiredPrice,
			productExists: product !== null,
			productUrl: currentURL,
		};

		// 6. Criar e injetar card
		const cardHTML = createProductCard(cardData);
		const injected = injectProductCard(cardHTML);

		if (injected) {
			logger.info('Card injetado com sucesso');
			// Adicionar event listeners após injeção
			attachEventListeners(cardData);
		}
	} catch (error) {
		logger.error('Erro ao processar página:', error);
	} finally {
		isProcessing = false;
		logger.groupEnd();
	}
}

/**
 * Adiciona event listeners aos botões do card
 */
function attachEventListeners(data: ProductCardData): void {
	// Botão de monitoria
	const monitorBtn = document.getElementById('gibipromo-monitor-btn');
	if (monitorBtn) {
		monitorBtn.addEventListener('click', async () => {
			await handleMonitorToggle(data);
		});
	}

	// Botão de login (se não autenticado)
	const loginBtn = document.getElementById('gibipromo-login-btn');
	if (loginBtn) {
		loginBtn.addEventListener('click', () => {
			chrome.runtime.openOptionsPage();
		});
	}

	// Botão de expandir histórico
	const toggleHistoryBtn = document.getElementById('gibipromo-toggle-history');
	if (toggleHistoryBtn) {
		toggleHistoryBtn.addEventListener('click', () => {
			handleToggleHistory(data.asin);
		});
	}
}

/**
 * Handle toggle de monitoria
 */
async function handleMonitorToggle(data: ProductCardData): Promise<void> {
	const btn = document.getElementById('gibipromo-monitor-btn') as HTMLButtonElement;
	if (!btn) return;

	try {
		btn.textContent = 'Processando...';
		btn.setAttribute('disabled', 'true');

		// Se produto não existe, criar monitoria (adicionar produto)
		if (!data.productExists) {
			await handleCreateMonitoring(data, btn);
			return;
		}

		// Produto existe - fluxo normal de toggle
		if (data.isMonitoring) {
			await productsService.unmonitorProduct(data.asin);
			logger.info('Monitoria parada');
		} else {
			await productsService.monitorProduct(data.asin, data.desiredPrice);
			logger.info('Monitoria iniciada');
		}

		// Recarregar card
		window.location.reload();
	} catch (error) {
		logger.error('Erro ao alternar monitoria:', error);
		showStatusMessage('error', 'Erro ao processar. Tente novamente.');
		btn.removeAttribute('disabled');
		btn.textContent = data.isMonitoring ? 'Parar Monitoria' : 'Iniciar Monitoria';
	}
}

/**
 * Handle criar monitoria para produto novo
 */
async function handleCreateMonitoring(data: ProductCardData, btn: HTMLButtonElement): Promise<void> {
	try {
		logger.info('Criando monitoria para produto novo:', data.asin);

		// Adicionar produto via URL
		const result = await productsService.addProductByUrl(data.productUrl);
		
		logger.info('Produto adicionado à fila de processamento:', result);

		// Mostrar mensagem de sucesso
		showStatusMessage(
			'success',
			'Produto adicionado! Pode levar alguns minutos até aparecer em sua lista.'
		);

		// Desabilitar botão permanentemente
		btn.textContent = 'Monitoria Criada';
		btn.setAttribute('disabled', 'true');
		btn.classList.remove('gibipromo-btn-primary');
		btn.classList.add('gibipromo-btn-secondary');

		// Atualizar status visual
		const statusText = document.querySelector('.gibipromo-status-text');
		
		if (statusText) {
			statusText.textContent = 'Você será notificado no site quando o produto for adicionado.';
		}

	} catch (error: any) {
		logger.error('Erro ao criar monitoria:', error);
		
		let errorMessage = 'Erro ao adicionar produto. Tente novamente.';
		if (error.message?.includes('URL')) {
			errorMessage = 'URL inválida. Verifique se é um produto da Amazon.';
		}
		
		showStatusMessage('error', errorMessage);
		
		btn.removeAttribute('disabled');
		btn.textContent = 'Criar Monitoria';
	}
}

/**
 * Mostra mensagem de status
 */
function showStatusMessage(type: 'success' | 'info' | 'error', message: string): void {
	const statusDiv = document.getElementById('gibipromo-status-message');
	if (!statusDiv) return;

	statusDiv.className = `gibipromo-status-message gibipromo-${type}`;
	statusDiv.textContent = message;
	statusDiv.style.display = 'block';

	// Auto-ocultar mensagens de sucesso após 8 segundos
	if (type === 'success' || type === 'info') {
		setTimeout(() => {
			statusDiv.style.display = 'none';
		}, 8000);
	}
}

/**
 * Handle toggle de histórico
 */
async function handleToggleHistory(asin: string): Promise<void> {
	const historyContainer = document.getElementById('gibipromo-history-container');
	const toggleBtn = document.getElementById('gibipromo-toggle-history');

	if (!historyContainer || !toggleBtn) return;

	const isExpanded = historyContainer.classList.contains('gibipromo-expanded');

	if (isExpanded) {
		// Colapsar
		historyContainer.classList.remove('gibipromo-expanded');
		toggleBtn.textContent = '▼ Ver Histórico de Preços';
	} else {
		// Expandir e carregar dados
		historyContainer.classList.add('gibipromo-expanded');
		toggleBtn.textContent = '▲ Ocultar Histórico';

		// Carregar gráfico se ainda não carregado
		if (!historyContainer.dataset.loaded) {
			// Aguardar transição CSS terminar antes de renderizar gráfico
			setTimeout(async () => {
				await loadPriceHistory(asin, historyContainer);
				historyContainer.dataset.loaded = 'true';
			}, 350); // Aguardar 350ms (transição é 300ms)
		}
	}
}

/**
 * Carrega histórico de preços
 */
async function loadPriceHistory(asin: string, container: HTMLElement): Promise<void> {
	try {
		container.innerHTML = '<div class="gibipromo-loading">Carregando...</div>';

		const stats = await productsService.getProductStats(asin, 30);

		if (stats.length === 0) {
			container.innerHTML = '<div class="gibipromo-no-data">Sem dados de histórico ainda</div>';
			return;
		}

		// Renderizar gráfico
		renderPriceChart(container, stats);
	} catch (error) {
		logger.error('Erro ao carregar histórico:', error);
		container.innerHTML = '<div class="gibipromo-error">Erro ao carregar histórico</div>';
	}
}

/**
 * Escuta mudanças de URL (SPA navigation)
 */
let lastURL = window.location.href;
const observer = new MutationObserver(() => {
	const currentURL = window.location.href;
	if (currentURL !== lastURL) {
		lastURL = currentURL;
		logger.debug('URL mudou, reprocessando página');
		isProcessing = false;
		processPage();
	}
});

/**
 * Inicializa content script
 */
function init(): void {
	logger.info('Content script inicializado');

	// Processar página inicial
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', processPage);
	} else {
		processPage();
	}

	// Observar mudanças na página
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// Escutar mensagens do background
	chrome.runtime.onMessage.addListener((message) => {
		if (message.action === 'TOKEN_EXPIRED') {
			logger.warn('Token expirado, removendo card');
			const card = document.getElementById('gibipromo-card-container');
			if (card) {
				card.remove();
			}
		}
	});
}

// Inicializar
init();

