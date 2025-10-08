/**
 * Constantes globais do GibiPromo Platform
 */

export const TELEGRAM_COMMANDS = {
	START: '/start',
	HELP: '/help',
	ENABLE: '/enable',
	DISABLE: '/disable',
	ADD_LINK: '/addlink',
	LIST_PRODUCTS: '/list'
} as const;

export const DEFAULT_INTERVALS = {
	ADD_PRODUCT: 5, // minutos
	CHECK_PRODUCT: 30, // minutos
	NOTIFY_PRICE: 1 // minutos
} as const;

export const AMAZON_DOMAINS = [
	'amazon.com',
	'amazon.com.br',
	'amazon.co.uk',
	'amazon.de',
	'amazon.fr',
	'amazon.it',
	'amazon.es',
	'amazon.ca',
	'amazon.mx',
	'amazon.co.jp',
	'amazon.in',
	'amazon.com.au'
] as const;

export const URL_PATTERNS = {
	AMAZON_PRODUCT: /\/dp\/([A-Z0-9]{10})/,
	AMAZON_ASIN: /^[A-Z0-9]{10}$/,
	SHORT_URL: /^https:\/\/(amzn\.to|a\.co)\//
} as const;

export const RESPONSE_MESSAGES = {
	PRODUCT_ADDED: '✅ Produto adicionado para monitoramento!',
	MONITORING_ENABLED: '🔔 Monitoramento ativado!',
	MONITORING_DISABLED: '🔕 Monitoramento desativado!',
	INVALID_URL: '❌ URL inválida. Por favor, envie um link válido da Amazon.',
	ERROR_GENERIC: '❌ Ocorreu um erro. Tente novamente.',
	HELP_MESSAGE: `
🤖 *GibiPromo Bot*

Comandos disponíveis:
/start - Iniciar o bot
/help - Mostrar esta ajuda
/enable - Ativar monitoramento
/disable - Desativar monitoramento
/addlink - Adicionar produto para monitorar

Envie um link da Amazon para começar o monitoramento!
	`.trim()
} as const;