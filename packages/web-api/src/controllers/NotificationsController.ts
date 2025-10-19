/**
 * Notifications Controller
 *
 * Handles HTTP requests for notification-related endpoints.
 *
 * @module controllers/NotificationsController
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { NotificationsService } from '../services/NotificationsService';
import { ApiResponse, NotificationStatus } from '@gibipromo/shared';

/**
 * Notifications Controller
 * Provides REST endpoints for user notifications management
 */
export class NotificationsController extends BaseController {
	constructor(private readonly notificationsService: NotificationsService) {
		super();
	}

	/**
	 * GET /notifications
	 * Lista notificações do usuário com paginação cursor-based
	 * 
	 * Query params:
	 * - limit: número de itens por página (default: 20, max: 100)
	 * - lastKey: cursor para próxima página
	 * - status: filtro por status (UNREAD | READ)
	 */
	getNotifications = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		const limitParam = req.query.limit as string;
		const lastKey = req.query.lastKey as string;
		const status = req.query.status as NotificationStatus | undefined;

		// Validar limit
		const limit = limitParam ? parseInt(limitParam, 10) : 20;
		if (isNaN(limit) || limit < 1 || limit > 100) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Limit must be between 1 and 100'
			};
			return this.sendBadRequest(res, response);
		}

		// Validar status
		if (status && !['UNREAD', 'READ'].includes(status)) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Status must be UNREAD or READ'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const result = await this.notificationsService.getUserNotifications(userId, {
				limit,
				lastKey,
				status
			});

			const response: ApiResponse<typeof result> = {
				success: true,
				data: result
			};

			this.sendSuccess(res, response);
		} catch (error) {
			this.handleError(res, error);
		}
	});

	/**
	 * GET /notifications/unread-count
	 * Retorna contagem de notificações não lidas do usuário
	 */
	getUnreadCount = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		try {
			const count = await this.notificationsService.getUnreadCount(userId);

			const response: ApiResponse<{ count: number }> = {
				success: true,
				data: { count }
			};

			this.sendSuccess(res, response);
		} catch (error) {
			this.handleError(res, error);
		}
	});

	/**
	 * GET /notifications/:notificationId
	 * Busca uma notificação específica por ID
	 */
	getNotificationById = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		const { notificationId } = req.params;

		if (!notificationId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Notification ID is required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const notification = await this.notificationsService.getNotificationById(userId, notificationId);

			const response: ApiResponse<typeof notification> = {
				success: true,
				data: notification
			};

			this.sendSuccess(res, response);
		} catch (error) {
			this.handleError(res, error);
		}
	});

	/**
	 * PATCH /notifications/:notificationId/read
	 * Marca uma notificação como lida
	 */
	markAsRead = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		const { notificationId } = req.params;

		if (!notificationId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Notification ID is required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			await this.notificationsService.markAsRead(userId, notificationId);

			const response: ApiResponse<{ message: string }> = {
				success: true,
				data: { message: 'Notification marked as read' }
			};

			this.sendSuccess(res, response);
		} catch (error) {
			this.handleError(res, error);
		}
	});

	/**
	 * PATCH /notifications/read-all
	 * Marca todas as notificações do usuário como lidas
	 */
	markAllAsRead = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		try {
			await this.notificationsService.markAllAsRead(userId);

			const response: ApiResponse<{ message: string }> = {
				success: true,
				data: { message: 'All notifications marked as read' }
			};

			this.sendSuccess(res, response);
		} catch (error) {
			this.handleError(res, error);
		}
	});

	/**
	 * DELETE /notifications/:notificationId
	 * Deleta uma notificação
	 */
	deleteNotification = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		const { notificationId } = req.params;

		if (!notificationId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Notification ID is required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			await this.notificationsService.deleteNotification(userId, notificationId);

			const response: ApiResponse<{ message: string }> = {
				success: true,
				data: { message: 'Notification deleted successfully' }
			};

			this.sendSuccess(res, response);
		} catch (error) {
			this.handleError(res, error);
		}
	});

	/**
	 * Trata erros do service e retorna resposta apropriada
	 */
	private handleError(res: Response, error: unknown): void {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		if (errorMessage === 'Usuário não encontrado') {
			const response: ApiResponse<null> = {
				success: false,
				error: errorMessage
			};
			return this.sendNotFound(res, response);
		}

		if (errorMessage === 'Notificação não encontrada') {
			const response: ApiResponse<null> = {
				success: false,
				error: errorMessage
			};
			return this.sendNotFound(res, response);
		}

		if (errorMessage.includes('permissão')) {
			const response: ApiResponse<null> = {
				success: false,
				error: errorMessage
			};
			return this.sendForbidden(res, response);
		}

		// Erro genérico (500)
		this.sendError(res, errorMessage, 500);
	}
}
