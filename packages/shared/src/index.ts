/**
 * Tipos compartilhados do GibiPromo Platform
 */

// Re-exporta todas as entidades
export * from './entities/Action';
export * from './entities/ActionConfig';
export * from './entities/Entity';
export * from './entities/LinkToken';
export * from './entities/Notification';
export * from './entities/Product';
export * from './entities/ProductStats';
export * from './entities/ProductUser';
export * from './entities/Session';
export * from './entities/User';
export * from './entities/UserPreferences';
export * from './entities/UserProfile';

// Re-exporta utilitários
export * from './utils/Logger';
export * from './utils/urlResolver';

// Re-exporta constantes
export * from './constants';
export {
	UserOrigin,
	ActionOrigin,
	NotificationType,
	NotificationStatus,
	TELEGRAM_COMMANDS
} from './constants/index';

// Re-exporta tipos
export * from './types/PromotionFilters';

// Re-exporta interfaces de repositórios
export * from './repositories/Repository';
export * from './repositories/ActionRepository';
export * from './repositories/ActionConfigRepository';
export * from './repositories/LinkTokenRepository';
export * from './repositories/NotificationRepository';
export * from './repositories/ProductRepository';
export * from './repositories/ProductStatsRepository';
export * from './repositories/ProductUserRepository';
export * from './repositories/SessionRepository';
export * from './repositories/UserRepository';
export * from './repositories/UserPreferencesRepository';
export * from './repositories/UserProfileRepository';

// Re-exporta implementações DynamoDB
export * from './infrastructure/dynamodb';
export * from './infrastructure/config/dynamodb';

// Tipos específicos da API
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	hasNext: boolean;
}

// Tipos de autenticação
export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	telegramId?: string;
}

export interface AuthToken {
	token: string;
	expiresAt: string;
}

// Tipos do histórico de preços
export interface PriceHistoryItem {
	date: string;
	price: number;
	change?: number;
	changePercent?: number;
}

// Tipos de notificação
export interface NotificationData {
	productId: string;
	productTitle: string;
	oldPrice: number;
	newPrice: number;
	changePercent: number;
	url: string;
}