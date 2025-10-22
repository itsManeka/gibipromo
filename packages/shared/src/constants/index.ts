/**
 * Constantes globais do GibiPromo Platform
 */

/**
 * Origem do usuário no sistema
 * Define de onde o usuário foi criado e como deve ser notificado
 */
export enum UserOrigin {
	/** Usuário criado via bot do Telegram */
	TELEGRAM = 'TELEGRAM',
	/** Usuário criado via website */
	SITE = 'SITE',
	/** Usuário utiliza ambas as plataformas (recebe notificações em ambos) */
	BOTH = 'BOTH'
}

/**
 * Origem da ação no sistema
 * Define de onde a ação foi criada (qual plataforma)
 */
export enum ActionOrigin {
	/** Ação criada via bot do Telegram */
	TELEGRAM = 'TELEGRAM',
	/** Ação criada via website */
	SITE = 'SITE'
}

/**
 * Tipos de notificação do sistema
 * Define os eventos que geram notificações para usuários do site
 */
export enum NotificationType {
	/** Produto foi adicionado com sucesso à lista de monitoramento */
	PRODUCT_ADDED = 'PRODUCT_ADDED',
	/** Preço do produto caiu */
	PRICE_DROP = 'PRICE_DROP',
	/** Conta do Telegram foi vinculada com sucesso */
	ACCOUNT_LINKED = 'ACCOUNT_LINKED'
}

/**
 * Status da notificação
 * Define se a notificação foi lida ou não pelo usuário
 */
export enum NotificationStatus {
	/** Notificação não lida */
	UNREAD = 'UNREAD',
	/** Notificação lida */
	READ = 'READ'
}

/**
 * Limite máximo de notificações por usuário
 * Quando excedido, as notificações mais antigas são deletadas
 */
export const MAX_NOTIFICATIONS_PER_USER = 100;

/**
 * Tempo de retenção de notificações em dias
 * Notificações mais antigas que este valor são deletadas automaticamente
 */
export const NOTIFICATION_RETENTION_DAYS = 30;

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
	NOTIFY_PRICE: 1, // minutos
	LINK_ACCOUNTS: 2 // minutos - processa vínculos de contas
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