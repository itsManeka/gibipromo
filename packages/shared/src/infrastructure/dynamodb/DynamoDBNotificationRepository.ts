import { Notification } from '../../entities';
import { NotificationStatus, MAX_NOTIFICATIONS_PER_USER } from '../../constants';
import {
	NotificationRepository,
	FindNotificationOptions,
	PaginatedNotifications
} from '../../repositories/NotificationRepository.js';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../config/dynamodb.js';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of NotificationRepository
 * 
 * Usa os seguintes índices:
 * - UserIdCreatedIndex: user_id (HASH) + created_at (RANGE) - para buscar notificações por usuário ordenadas por data
 * - UserIdStatusIndex: user_id (HASH) + status (RANGE) - para filtrar por status
 */
export class DynamoDBNotificationRepository
	extends DynamoDBRepository<Notification>
	implements NotificationRepository {

	constructor() {
		super('Notifications');
	}

	/**
	 * Busca notificações de um usuário com paginação cursor-based
	 */
	async findByUserId(
		userId: string,
		options?: FindNotificationOptions
	): Promise<PaginatedNotifications> {
		const limit = options?.limit || 20;
		const status = options?.status;

		// Escolhe o índice baseado no filtro
		const indexName = status ? 'UserIdStatusIndex' : 'UserIdCreatedIndex';

		// Monta a query
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: indexName,
			KeyConditionExpression: status
				? 'user_id = :user_id AND #status = :status'
				: 'user_id = :user_id',
			ExpressionAttributeValues: status
				? {
					':user_id': userId,
					':status': status
				}
				: {
					':user_id': userId
				},
			ExpressionAttributeNames: status ? {
				'#status': 'status'
			} : undefined,
			Limit: limit + 1, // Busca 1 a mais para saber se tem próxima página
			ScanIndexForward: false, // Ordem descendente (mais recentes primeiro)
			ExclusiveStartKey: options?.lastKey ? JSON.parse(options.lastKey) : undefined
		};

		const result = await documentClient.query(params).promise();
		const items = (result.Items || []) as Notification[];

		// Verifica se tem mais páginas
		const hasMore = items.length > limit;
		const returnItems = hasMore ? items.slice(0, limit) : items;

		// Gera cursor para próxima página
		const lastKey = hasMore && result.LastEvaluatedKey
			? JSON.stringify(result.LastEvaluatedKey)
			: undefined;

		return {
			items: returnItems,
			lastKey,
			hasMore
		};
	}

	/**
	 * Busca notificações não lidas de um usuário
	 */
	async findUnreadByUserId(userId: string): Promise<Notification[]> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdStatusIndex',
			KeyConditionExpression: 'user_id = :user_id AND #status = :status',
			ExpressionAttributeValues: {
				':user_id': userId,
				':status': NotificationStatus.UNREAD
			},
			ExpressionAttributeNames: {
				'#status': 'status'
			},
			ScanIndexForward: false // Mais recentes primeiro
		};

		const result = await documentClient.query(params).promise();
		return (result.Items || []) as Notification[];
	}

	/**
	 * Marca notificação como lida
	 */
	async markAsRead(notificationId: string): Promise<Notification> {
		const now = new Date().toISOString();

		const params: DocumentClient.UpdateItemInput = {
			TableName: this.tableName,
			Key: { id: notificationId },
			UpdateExpression: 'SET #status = :status, read_at = :read_at',
			ExpressionAttributeNames: {
				'#status': 'status'
			},
			ExpressionAttributeValues: {
				':status': NotificationStatus.READ,
				':read_at': now
			},
			ReturnValues: 'ALL_NEW'
		};

		const result = await documentClient.update(params).promise();
		return result.Attributes as Notification;
	}

	/**
	 * Marca todas as notificações de um usuário como lidas
	 */
	async markAllAsRead(userId: string): Promise<number> {
		// Busca todas as notificações não lidas
		const unreadNotifications = await this.findUnreadByUserId(userId);

		if (unreadNotifications.length === 0) {
			return 0;
		}

		const now = new Date().toISOString();

		// Atualiza em batch (DynamoDB permite até 25 por batch)
		const batchSize = 25;
		let updated = 0;

		for (let i = 0; i < unreadNotifications.length; i += batchSize) {
			const batch = unreadNotifications.slice(i, i + batchSize);

			// Usa Promise.all para paralelizar as atualizações
			await Promise.all(
				batch.map(notification =>
					documentClient.update({
						TableName: this.tableName,
						Key: { id: notification.id },
						UpdateExpression: 'SET #status = :status, read_at = :read_at',
						ExpressionAttributeNames: {
							'#status': 'status'
						},
						ExpressionAttributeValues: {
							':status': NotificationStatus.READ,
							':read_at': now
						}
					}).promise()
				)
			);

			updated += batch.length;
		}

		return updated;
	}

	/**
	 * Conta notificações não lidas de um usuário
	 */
	async countUnreadByUserId(userId: string): Promise<number> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdStatusIndex',
			KeyConditionExpression: 'user_id = :user_id AND #status = :status',
			ExpressionAttributeValues: {
				':user_id': userId,
				':status': NotificationStatus.UNREAD
			},
			ExpressionAttributeNames: {
				'#status': 'status'
			},
			Select: 'COUNT'
		};

		const result = await documentClient.query(params).promise();
		return result.Count || 0;
	}

	/**
	 * Deleta notificações mais antigas que X dias
	 */
	async deleteOldNotifications(daysOld: number): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysOld);
		const cutoffTimestamp = cutoffDate.toISOString();

		// Scan para encontrar notificações antigas
		// Nota: Em produção, considere usar DynamoDB Streams + Lambda para performance
		const params: DocumentClient.ScanInput = {
			TableName: this.tableName,
			FilterExpression: 'created_at < :cutoff',
			ExpressionAttributeValues: {
				':cutoff': cutoffTimestamp
			}
		};

		const result = await documentClient.scan(params).promise();
		const oldNotifications = (result.Items || []) as Notification[];

		if (oldNotifications.length === 0) {
			return 0;
		}

		// Deleta em batch (até 25 por vez)
		const batchSize = 25;
		let deleted = 0;

		for (let i = 0; i < oldNotifications.length; i += batchSize) {
			const batch = oldNotifications.slice(i, i + batchSize);

			const deleteRequests: DocumentClient.WriteRequest[] = batch.map(notification => ({
				DeleteRequest: {
					Key: { id: notification.id }
				}
			}));

			await documentClient.batchWrite({
				RequestItems: {
					[this.tableName]: deleteRequests
				}
			}).promise();

			deleted += batch.length;
		}

		return deleted;
	}

	/**
	 * Garante que usuário não exceda limite de notificações
	 */
	async enforceUserLimit(userId: string, maxNotifications: number): Promise<number> {
		// Busca todas as notificações do usuário ordenadas por data (DESC)
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdCreatedIndex',
			KeyConditionExpression: 'user_id = :user_id',
			ExpressionAttributeValues: {
				':user_id': userId
			},
			ScanIndexForward: false // Mais recentes primeiro
		};

		const result = await documentClient.query(params).promise();
		const allNotifications = (result.Items || []) as Notification[];

		// Se não excede o limite, não faz nada
		if (allNotifications.length <= maxNotifications) {
			return 0;
		}

		// Deleta as mais antigas (após o limite)
		const toDelete = allNotifications.slice(maxNotifications);

		if (toDelete.length === 0) {
			return 0;
		}

		// Deleta em batch
		const batchSize = 25;
		let deleted = 0;

		for (let i = 0; i < toDelete.length; i += batchSize) {
			const batch = toDelete.slice(i, i + batchSize);

			const deleteRequests: DocumentClient.WriteRequest[] = batch.map(notification => ({
				DeleteRequest: {
					Key: { id: notification.id }
				}
			}));

			await documentClient.batchWrite({
				RequestItems: {
					[this.tableName]: deleteRequests
				}
			}).promise();

			deleted += batch.length;
		}

		return deleted;
	}

	/**
	 * Override do create para garantir limite antes de criar
	 */
	async create(notification: Notification): Promise<Notification> {
		// Garante que usuário não excede limite
		await this.enforceUserLimit(notification.user_id, MAX_NOTIFICATIONS_PER_USER);

		// Cria a notificação
		return super.create(notification);
	}
}
