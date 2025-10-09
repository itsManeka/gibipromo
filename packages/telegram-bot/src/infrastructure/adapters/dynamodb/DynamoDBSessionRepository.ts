import { Session } from '@gibipromo/shared';
import { SessionRepository } from '../../../application/ports/SessionRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of SessionRepository
 */
export class DynamoDBSessionRepository extends DynamoDBRepository<Session> implements SessionRepository {
	constructor() {
		super('Session');
	}

	async findBySessionId(sessionId: string): Promise<Session | null> {
		const params: DocumentClient.GetItemInput = {
			TableName: this.tableName,
			Key: { session_id: sessionId }
		};

		const result = await documentClient.get(params).promise();
		return result.Item ? (result.Item as Session) : null;
	}

	async findByUserId(userId: string): Promise<Session[]> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdIndex',
			KeyConditionExpression: 'user_id = :user_id',
			ExpressionAttributeValues: {
				':user_id': userId
			}
		};

		const result = await documentClient.query(params).promise();
		return (result.Items || []) as Session[];
	}

	async deleteExpiredSessions(): Promise<void> {
		const now = new Date().toISOString();
		
		// First, scan for expired sessions
		const scanParams: DocumentClient.ScanInput = {
			TableName: this.tableName,
			FilterExpression: 'expires_at < :now',
			ExpressionAttributeValues: {
				':now': now
			}
		};

		const scanResult = await documentClient.scan(scanParams).promise();
		const expiredSessions = scanResult.Items as Session[];

		// Delete expired sessions in batches
		if (expiredSessions.length > 0) {
			const batchSize = 25; // DynamoDB batch write limit
			for (let i = 0; i < expiredSessions.length; i += batchSize) {
				const batch = expiredSessions.slice(i, i + batchSize);
				
				const deleteRequests = batch.map(session => ({
					DeleteRequest: {
						Key: { session_id: session.session_id }
					}
				}));

				const batchParams: DocumentClient.BatchWriteItemInput = {
					RequestItems: {
						[this.tableName]: deleteRequests
					}
				};

				await documentClient.batchWrite(batchParams).promise();
			}
		}
	}

	async create(entity: Session): Promise<Session> {
		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: entity
		};

		await documentClient.put(params).promise();
		return entity;
	}

	async delete(sessionId: string): Promise<void> {
		const params: DocumentClient.DeleteItemInput = {
			TableName: this.tableName,
			Key: { session_id: sessionId }
		};

		await documentClient.delete(params).promise();
	}
}