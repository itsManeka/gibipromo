/**
 * Notifications Routes
 * 
 * Handles routing for notification-related endpoints.
 * All routes require authentication (authMiddleware).
 * 
 * @module routes/notifications
 */

import { Router } from 'express';
import { NotificationsController } from '../controllers/NotificationsController';
import { NotificationsService } from '../services/NotificationsService';
import { authMiddleware } from '../middleware/auth';
import { DynamoDBNotificationRepository, DynamoDBUserRepository } from '@gibipromo/shared';

const router = Router();

// Setup dependencies
const notificationRepository = new DynamoDBNotificationRepository();
const userRepository = new DynamoDBUserRepository();
const service = new NotificationsService(notificationRepository, userRepository);
const controller = new NotificationsController(service);

/**
 * GET /notifications
 * Lista notificações do usuário com paginação cursor-based
 * 
 * Query params:
 * - limit: número de itens (1-100, default: 20)
 * - lastKey: cursor para próxima página
 * - status: filtro por status (UNREAD | READ)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     items: Notification[],
 *     lastKey?: string,
 *     hasMore: boolean
 *   }
 * }
 */
router.get('/', authMiddleware, controller.getNotifications);

/**
 * GET /notifications/unread-count
 * Retorna contagem de notificações não lidas
 * 
 * Response:
 * {
 *   success: true,
 *   data: { count: number }
 * }
 */
router.get('/unread-count', authMiddleware, controller.getUnreadCount);

/**
 * GET /notifications/:notificationId
 * Busca uma notificação específica por ID
 * 
 * Params:
 * - notificationId: ID da notificação
 * 
 * Response:
 * {
 *   success: true,
 *   data: Notification
 * }
 */
router.get('/:notificationId', authMiddleware, controller.getNotificationById);

/**
 * PATCH /notifications/:notificationId/read
 * Marca notificação como lida
 * 
 * Params:
 * - notificationId: ID da notificação
 * 
 * Response:
 * {
 *   success: true,
 *   data: { message: 'Notification marked as read' }
 * }
 */
router.patch('/:notificationId/read', authMiddleware, controller.markAsRead);

/**
 * PATCH /notifications/read-all
 * Marca todas as notificações do usuário como lidas
 * 
 * Response:
 * {
 *   success: true,
 *   data: { message: 'All notifications marked as read' }
 * }
 */
router.patch('/read-all', authMiddleware, controller.markAllAsRead);

/**
 * DELETE /notifications/:notificationId
 * Deleta uma notificação
 * 
 * Params:
 * - notificationId: ID da notificação
 * 
 * Response:
 * {
 *   success: true,
 *   data: { message: 'Notification deleted successfully' }
 * }
 */
router.delete('/:notificationId', authMiddleware, controller.deleteNotification);

export default router;
