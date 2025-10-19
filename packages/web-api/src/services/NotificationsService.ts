import { Notification, NotificationRepository, NotificationStatus, UserRepository } from '@gibipromo/shared';
import { BaseService } from './BaseService';

/**
 * Interface para opções de busca de notificações
 */
export interface FindNotificationOptions {
	limit?: number;
	lastKey?: string;
	status?: NotificationStatus;
}

/**
 * Interface para resultado paginado de notificações
 */
export interface PaginatedNotifications {
	items: Notification[];
	lastKey?: string;
	hasMore: boolean;
}

/**
 * Service para gerenciar notificações de usuários
 * 
 * Responsabilidades:
 * - Buscar notificações com paginação cursor-based
 * - Marcar como lida/não lida
 * - Deletar notificações
 * - Validar permissões (usuário só acessa suas notificações)
 */
export class NotificationsService extends BaseService {
	constructor(
		private notificationRepository: NotificationRepository,
		private userRepository: UserRepository
	) {
		super('NotificationsService');
	}

	/**
	 * Busca notificações do usuário com paginação cursor-based
	 * 
	 * @param userId ID do usuário
	 * @param options Opções de paginação e filtro
	 * @returns Lista paginada de notificações
	 */
	async getUserNotifications(
		userId: string,
		options: FindNotificationOptions = {}
	): Promise<PaginatedNotifications> {
		this.logAction('Buscando notificações', { userId, options });

		// Validar usuário
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error('Usuário não encontrado');
		}

		// Buscar notificações com paginação
		const result = await this.notificationRepository.findByUserId(userId, {
			limit: options.limit || 20,
			lastKey: options.lastKey,
			status: options.status
		});

		this.logAction('Notificações encontradas', {
			userId,
			count: result.items.length,
			hasMore: result.hasMore
		});

		return result;
	}

	/**
	 * Conta notificações não lidas do usuário
	 * 
	 * @param userId ID do usuário
	 * @returns Número de notificações não lidas
	 */
	async getUnreadCount(userId: string): Promise<number> {
		this.logAction('Contando notificações não lidas', { userId });

		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error('Usuário não encontrado');
		}

		const count = await this.notificationRepository.countUnreadByUserId(userId);

		this.logAction('Notificações não lidas contadas', { userId, count });

		return count;
	}

	/**
	 * Marca notificação como lida
	 * 
	 * @param userId ID do usuário (para validação de permissão)
	 * @param notificationId ID da notificação
	 */
	async markAsRead(userId: string, notificationId: string): Promise<void> {
		this.logAction('Marcando notificação como lida', { userId, notificationId });

		// Buscar notificação para validar permissão
		const notification = await this.notificationRepository.findById(notificationId);
		if (!notification) {
			throw new Error('Notificação não encontrada');
		}

		// Validar que a notificação pertence ao usuário
		if (notification.user_id !== userId) {
			throw new Error('Você não tem permissão para acessar esta notificação');
		}

		// Marcar como lida
		await this.notificationRepository.markAsRead(notificationId);

		this.logAction('Notificação marcada como lida', { userId, notificationId });
	}

	/**
	 * Marca todas as notificações do usuário como lidas
	 * 
	 * @param userId ID do usuário
	 */
	async markAllAsRead(userId: string): Promise<void> {
		this.logAction('Marcando todas as notificações como lidas', { userId });

		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error('Usuário não encontrado');
		}

		await this.notificationRepository.markAllAsRead(userId);

		this.logAction('Todas as notificações marcadas como lidas', { userId });
	}

	/**
	 * Deleta uma notificação
	 * 
	 * @param userId ID do usuário (para validação de permissão)
	 * @param notificationId ID da notificação
	 */
	async deleteNotification(userId: string, notificationId: string): Promise<void> {
		this.logAction('Deletando notificação', { userId, notificationId });

		// Buscar notificação para validar permissão
		const notification = await this.notificationRepository.findById(notificationId);
		if (!notification) {
			throw new Error('Notificação não encontrada');
		}

		// Validar que a notificação pertence ao usuário
		if (notification.user_id !== userId) {
			throw new Error('Você não tem permissão para deletar esta notificação');
		}

		// Deletar notificação
		await this.notificationRepository.delete(notificationId);

		this.logAction('Notificação deletada', { userId, notificationId });
	}

	/**
	 * Busca uma notificação específica (validando permissão)
	 * 
	 * @param userId ID do usuário
	 * @param notificationId ID da notificação
	 * @returns Notificação encontrada
	 */
	async getNotificationById(userId: string, notificationId: string): Promise<Notification> {
		this.logAction('Buscando notificação por ID', { userId, notificationId });

		const notification = await this.notificationRepository.findById(notificationId);
		if (!notification) {
			throw new Error('Notificação não encontrada');
		}

		// Validar que a notificação pertence ao usuário
		if (notification.user_id !== userId) {
			throw new Error('Você não tem permissão para acessar esta notificação');
		}

		return notification;
	}
}
