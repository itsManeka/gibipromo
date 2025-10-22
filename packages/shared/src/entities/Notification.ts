import { Entity } from './Entity';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType, NotificationStatus } from '../constants';

/**
 * Metadata opcional para notificações
 * Armazena informações adicionais específicas por tipo de notificação
 */
export interface NotificationMetadata {
	/** ID do produto relacionado */
	product_id?: string;
	/** Preço antigo (para PRICE_DROP) */
	old_price?: number;
	/** Preço novo (para PRICE_DROP) */
	new_price?: number;
	/** URL do produto na Amazon */
	url?: string;
}

/**
 * Representa uma notificação no sistema
 * Usada para notificar usuários do site sobre eventos importantes
 * 
 * Tipos de notificação:
 * - PRODUCT_ADDED: Produto foi adicionado com sucesso à lista de monitoramento
 * - PRICE_DROP: Preço do produto caiu
 */
export interface Notification extends Entity {
	/** UUID da notificação */
	id: string;
	/** ID do usuário que receberá a notificação (FK -> Users) */
	user_id: string;
	/** Tipo da notificação */
	type: NotificationType;
	/** Título curto da notificação */
	title: string;
	/** Mensagem completa da notificação */
	message: string;
	/** Status da notificação (lida ou não lida) */
	status: NotificationStatus;
	/** Dados adicionais em formato JSON */
	metadata?: NotificationMetadata;
	/** 
	 * Canais pelos quais a notificação foi/será enviada
	 * Preparado para futuro suporte a email
	 */
	sent_via?: ('SITE' | 'EMAIL')[];
	/** Data de criação (ISO 8601) */
	created_at: string;
	/** Data em que foi marcada como lida (ISO 8601) */
	read_at?: string;
}

/**
 * Factory para criar notificação de produto adicionado
 * 
 * @param userId ID do usuário que receberá a notificação
 * @param productTitle Título do produto
 * @param productId ID do produto (ASIN)
 * @param productUrl URL do produto na Amazon
 * @returns Notificação do tipo PRODUCT_ADDED
 * 
 * @example
 * ```typescript
 * const notification = createProductAddedNotification(
 *   'user-123',
 *   'Batman: Ano Um',
 *   'B08X123456',
 *   'https://amazon.com.br/dp/B08X123456'
 * );
 * ```
 */
export function createProductAddedNotification(
	userId: string,
	productTitle: string,
	productId: string,
	productUrl: string
): Notification {
	const now = new Date().toISOString();
	
	return {
		id: uuidv4(),
		user_id: userId,
		type: NotificationType.PRODUCT_ADDED,
		title: 'Produto adicionado!',
		message: `O produto "${productTitle}" foi adicionado à sua lista de monitoramento com sucesso.`,
		status: NotificationStatus.UNREAD,
		metadata: {
			product_id: productId,
			url: productUrl
		},
		sent_via: ['SITE'],
		created_at: now
	};
}

/**
 * Factory para criar notificação de queda de preço
 * 
 * @param userId ID do usuário que receberá a notificação
 * @param productTitle Título do produto
 * @param productId ID do produto (ASIN)
 * @param productUrl URL do produto na Amazon
 * @param oldPrice Preço antigo
 * @param newPrice Preço novo (atual)
 * @returns Notificação do tipo PRICE_DROP
 * 
 * @example
 * ```typescript
 * const notification = createPriceDropNotification(
 *   'user-123',
 *   'Batman: Ano Um',
 *   'B08X123456',
 *   'https://amazon.com.br/dp/B08X123456',
 *   89.90,
 *   59.90
 * );
 * ```
 */
export function createPriceDropNotification(
	userId: string,
	productTitle: string,
	productId: string,
	productUrl: string,
	oldPrice: number,
	newPrice: number
): Notification {
	const now = new Date().toISOString();
	const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
	
	return {
		id: uuidv4(),
		user_id: userId,
		type: NotificationType.PRICE_DROP,
		title: `Promoção: ${productTitle}`,
		message: `O preço caiu de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)} (${discount}% de desconto)!`,
		status: NotificationStatus.UNREAD,
		metadata: {
			product_id: productId,
			old_price: oldPrice,
			new_price: newPrice,
			url: productUrl
		},
		sent_via: ['SITE'],
		created_at: now
	};
}

/**
 * Helper para verificar se uma notificação está lida
 */
export function isNotificationRead(notification: Notification): boolean {
	return notification.status === NotificationStatus.READ;
}

/**
 * Helper para verificar se uma notificação está não lida
 */
export function isNotificationUnread(notification: Notification): boolean {
	return notification.status === NotificationStatus.UNREAD;
}

/**
 * Helper para marcar notificação como lida
 * Retorna uma nova notificação com status atualizado
 */
export function markNotificationAsRead(notification: Notification): Notification {
	return {
		...notification,
		status: NotificationStatus.READ,
		read_at: new Date().toISOString()
	};
}

/**
 * Factory para criar notificação de conta vinculada
 * 
 * @param userId ID do usuário que receberá a notificação
 * @returns Notificação do tipo ACCOUNT_LINKED
 * 
 * @example
 * ```typescript
 * const notification = createAccountLinkedNotification('user-123');
 * ```
 */
export function createAccountLinkedNotification(userId: string): Notification {
	const now = new Date().toISOString();

	return {
		id: uuidv4(),
		user_id: userId,
		type: NotificationType.ACCOUNT_LINKED,
		title: 'Contas vinculadas!',
		message: 'Sua conta do Telegram foi vinculada com sucesso. Agora você receberá notificações em ambas as plataformas.',
		status: NotificationStatus.UNREAD,
		sent_via: ['SITE'],
		created_at: now
	};
}