/**
 * Background Service Worker
 * Gerencia autenticação e validação periódica de token
 */

import { authService } from '../api/auth.service';
import * as storage from '../utils/storage';
import { logger } from '../utils/logger';

// Interval para validação de token (30 minutos)
const TOKEN_VALIDATION_INTERVAL = 30 * 60 * 1000;

/**
 * Valida token periodicamente
 */
async function validateTokenPeriodically(): Promise<void> {
	const token = await storage.get('gibipromo_token');

	if (!token) {
		logger.debug('Nenhum token encontrado, pulando validação');
		return;
	}

	try {
		const isValid = await authService.validateToken(token);

		if (!isValid) {
			logger.warn('Token inválido, fazendo logout');
			await storage.clear();

			// Notificar todas as tabs abertas
			chrome.tabs.query({}, (tabs) => {
				tabs.forEach((tab) => {
					if (tab.id) {
						chrome.tabs.sendMessage(tab.id, { action: 'TOKEN_EXPIRED' });
					}
				});
			});
		} else {
			logger.debug('Token válido');
		}
	} catch (error) {
		logger.error('Erro ao validar token:', error);
	}
}

/**
 * Handler de mensagens de outros scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	logger.debug('Mensagem recebida:', message);

	switch (message.action) {
		case 'AUTH_ERROR':
			storage.clear().then(() => {
				logger.info('Storage limpo após erro de auth');
				sendResponse({ success: true });
			});
			return true; // Indica resposta assíncrona

		case 'LOGIN_SUCCESS':
			logger.info('Login bem sucedido');
			// Validar token imediatamente após login
			validateTokenPeriodically();
			sendResponse({ success: true });
			return true;

		case 'LOGOUT':
			storage.clear().then(() => {
				logger.info('Logout realizado');
				sendResponse({ success: true });
			});
			return true;

		case 'CHECK_AUTH':
			authService.isAuthenticated().then((isAuth) => {
				sendResponse({ isAuthenticated: isAuth });
			});
			return true;

		default:
			sendResponse({ success: false, error: 'Ação desconhecida' });
			return false;
	}
});

/**
 * Inicializa service worker
 */
logger.info('Service Worker inicializado');

// Iniciar validação periódica
setInterval(validateTokenPeriodically, TOKEN_VALIDATION_INTERVAL);

// Validar token ao iniciar
validateTokenPeriodically();

// Manter service worker ativo
chrome.runtime.onInstalled.addListener(() => {
	logger.info('Extensão instalada/atualizada');
});

