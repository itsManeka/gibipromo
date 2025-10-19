/**
 * Notifications API Service
 * 
 * Cliente para endpoints de notificações do usuário.
 * Gerencia busca, marcação de leitura e exclusão de notificações.
 * 
 * @module api/notifications.service
 */

import { apiClient } from './client';
import { Notification, NotificationStatus, ApiResponse } from '@gibipromo/shared';

/**
 * Interface para opções de busca de notificações
 */
export interface GetNotificationsParams {
	limit?: number;
	lastKey?: string;
	status?: NotificationStatus;
}

/**
 * Interface para resposta paginada de notificações
 */
export interface NotificationsResponse {
	items: Notification[];
	lastKey?: string;
	hasMore: boolean;
}

/**
 * Notifications API Service
 * 
 * Métodos:
 * - getAll: Lista notificações com paginação cursor-based
 * - getUnreadCount: Contador de não lidas
 * - getById: Busca notificação por ID
 * - markAsRead: Marca uma como lida
 * - markAllAsRead: Marca todas como lidas
 * - deleteNotification: Deleta uma notificação
 */
export const notificationsService = {
	/**
	 * Lista notificações do usuário com paginação cursor-based
	 * 
	 * @param params - Parâmetros de busca (limit, lastKey, status)
	 * @returns Promise com lista paginada de notificações
	 * 
	 * @example
	 * const result = await notificationsService.getAll({ limit: 20, status: 'UNREAD' });
	 * console.log(result.data.items); // Array de notificações
	 * console.log(result.data.hasMore); // Há mais itens?
	 */
	async getAll(params?: GetNotificationsParams) {
		const query = new URLSearchParams();
		
		if (params?.limit) {
			query.append('limit', params.limit.toString());
		}
		
		if (params?.lastKey) {
			query.append('lastKey', params.lastKey);
		}
		
		if (params?.status) {
			query.append('status', params.status);
		}

		const queryString = query.toString();
		const url = queryString ? `/notifications?${queryString}` : '/notifications';

		return apiClient.get<ApiResponse<NotificationsResponse>>(url);
	},

	/**
	 * Retorna contagem de notificações não lidas
	 * 
	 * @returns Promise com número de notificações não lidas
	 * 
	 * @example
	 * const result = await notificationsService.getUnreadCount();
	 * console.log(result.data.count); // 5
	 */
	async getUnreadCount() {
		return apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
	},

	/**
	 * Busca uma notificação específica por ID
	 * 
	 * @param notificationId - ID da notificação
	 * @returns Promise com a notificação
	 * 
	 * @example
	 * const result = await notificationsService.getById('notif-123');
	 * console.log(result.data); // Notification object
	 */
	async getById(notificationId: string) {
		return apiClient.get<ApiResponse<Notification>>(`/notifications/${notificationId}`);
	},

	/**
	 * Marca notificação como lida
	 * 
	 * @param notificationId - ID da notificação
	 * @returns Promise vazia
	 * 
	 * @example
	 * await notificationsService.markAsRead('notif-123');
	 */
	async markAsRead(notificationId: string) {
		return apiClient.patch<ApiResponse<{ message: string }>>(
			`/notifications/${notificationId}/read`
		);
	},

	/**
	 * Marca todas as notificações do usuário como lidas
	 * 
	 * @returns Promise vazia
	 * 
	 * @example
	 * await notificationsService.markAllAsRead();
	 */
	async markAllAsRead() {
		return apiClient.patch<ApiResponse<{ message: string }>>('/notifications/read-all');
	},

	/**
	 * Deleta uma notificação
	 * 
	 * @param notificationId - ID da notificação
	 * @returns Promise vazia
	 * 
	 * @example
	 * await notificationsService.deleteNotification('notif-123');
	 */
	async deleteNotification(notificationId: string) {
		return apiClient.delete<ApiResponse<{ message: string }>>(
			`/notifications/${notificationId}`
		);
	}
};
