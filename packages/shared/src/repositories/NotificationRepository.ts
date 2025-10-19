import { Repository } from './Repository';
import { Notification } from '../entities';
import { NotificationStatus } from '../constants';

/**
 * Opções para busca paginada de notificações
 */
export interface FindNotificationOptions {
	/** Número máximo de itens a retornar */
	limit?: number;
	/** Chave da última notificação (para paginação cursor-based) */
	lastKey?: string;
	/** Filtrar por status (UNREAD | READ) */
	status?: NotificationStatus;
}

/**
 * Resultado paginado de notificações
 */
export interface PaginatedNotifications {
	/** Lista de notificações */
	items: Notification[];
	/** Chave para próxima página (cursor) */
	lastKey?: string;
	/** Indica se há mais itens */
	hasMore: boolean;
}

/**
 * Repository interface para gerenciar notificações no DynamoDB
 * 
 * Funções principais:
 * - CRUD básico de notificações
 * - Busca por usuário com paginação cursor-based
 * - Filtros por status (lida/não lida)
 * - Contagem de não lidas
 * - Limpeza automática de notificações antigas
 * - Gerenciamento de limite por usuário
 * 
 * @example
 * ```typescript
 * const repo = new DynamoDBNotificationRepository();
 * 
 * // Buscar notificações não lidas
 * const unread = await repo.findUnreadByUserId('user-123');
 * 
 * // Buscar com paginação
 * const result = await repo.findByUserId('user-123', { limit: 20 });
 * console.log(result.items, result.hasMore, result.lastKey);
 * ```
 */
export interface NotificationRepository extends Repository<Notification> {
	/**
	 * Busca notificações de um usuário com paginação cursor-based
	 * 
	 * @param userId ID do usuário
	 * @param options Opções de paginação e filtro
	 * @returns Lista paginada de notificações ordenadas por data (mais recentes primeiro)
	 * 
	 * @example
	 * ```typescript
	 * // Primeira página (20 notificações)
	 * const page1 = await repo.findByUserId('user-123', { limit: 20 });
	 * 
	 * // Segunda página
	 * const page2 = await repo.findByUserId('user-123', { 
	 *   limit: 20, 
	 *   lastKey: page1.lastKey 
	 * });
	 * 
	 * // Apenas não lidas
	 * const unread = await repo.findByUserId('user-123', { 
	 *   status: NotificationStatus.UNREAD 
	 * });
	 * ```
	 */
	findByUserId(
		userId: string,
		options?: FindNotificationOptions
	): Promise<PaginatedNotifications>;

	/**
	 * Busca todas as notificações não lidas de um usuário
	 * Útil para exibir contador de notificações
	 * 
	 * @param userId ID do usuário
	 * @returns Array de notificações não lidas
	 */
	findUnreadByUserId(userId: string): Promise<Notification[]>;

	/**
	 * Marca uma notificação como lida
	 * Atualiza status para READ e define read_at
	 * 
	 * @param notificationId ID da notificação
	 * @returns Notificação atualizada
	 */
	markAsRead(notificationId: string): Promise<Notification>;

	/**
	 * Marca todas as notificações de um usuário como lidas
	 * Operação em batch para performance
	 * 
	 * @param userId ID do usuário
	 * @returns Número de notificações atualizadas
	 */
	markAllAsRead(userId: string): Promise<number>;

	/**
	 * Conta notificações não lidas de um usuário
	 * Mais eficiente que buscar todas e contar
	 * 
	 * @param userId ID do usuário
	 * @returns Número de notificações não lidas
	 */
	countUnreadByUserId(userId: string): Promise<number>;

	/**
	 * Deleta notificações mais antigas que X dias
	 * Usado para limpeza automática (cron job)
	 * 
	 * @param daysOld Número de dias (ex: 30 para deletar notificações > 1 mês)
	 * @returns Número de notificações deletadas
	 * 
	 * @example
	 * ```typescript
	 * // Deletar notificações com mais de 30 dias
	 * const deleted = await repo.deleteOldNotifications(30);
	 * console.log(`${deleted} notificações antigas deletadas`);
	 * ```
	 */
	deleteOldNotifications(daysOld: number): Promise<number>;

	/**
	 * Garante que usuário não exceda limite de notificações
	 * Deleta as mais antigas se necessário
	 * 
	 * @param userId ID do usuário
	 * @param maxNotifications Limite máximo (ex: 100)
	 * @returns Número de notificações deletadas
	 * 
	 * @example
	 * ```typescript
	 * // Antes de criar nova notificação
	 * await repo.enforceUserLimit('user-123', 100);
	 * await repo.create(newNotification);
	 * ```
	 */
	enforceUserLimit(userId: string, maxNotifications: number): Promise<number>;
}
