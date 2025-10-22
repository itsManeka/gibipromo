import { LinkToken } from '../../entities/LinkToken';
import { LinkTokenRepository } from '../../repositories/LinkTokenRepository';
import { documentClient } from '../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of LinkTokenRepository
 * Uses scan operations for token lookup (acceptable for low-volume token generation)
 */
export class DynamoDBLinkTokenRepository implements LinkTokenRepository {
	private tableName = 'LinkTokens';

	/**
	 * Creates a new link token in DynamoDB
	 */
	async create(token: LinkToken): Promise<void> {
		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: token
		};

		await documentClient.put(params).promise();
	}

	/**
	 * Finds a token by ID
	 */
	async findById(id: string): Promise<LinkToken | null> {
		const params: DocumentClient.GetItemInput = {
			TableName: this.tableName,
			Key: { id }
		};

		const result = await documentClient.get(params).promise();
		return result.Item ? (result.Item as LinkToken) : null;
	}

	/**
	 * Finds a token by its value using scan
	 * Note: Using scan is acceptable here as tokens are short-lived and volume is low
	 */
	async findByToken(token: string): Promise<LinkToken | null> {
		const params: DocumentClient.ScanInput = {
			TableName: this.tableName,
			FilterExpression: '#token = :token',
			ExpressionAttributeNames: { '#token': 'token' },
			ExpressionAttributeValues: { ':token': token }
		};

		const result = await documentClient.scan(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as LinkToken) : null;
	}

	/**
	 * Updates a link token
	 */
	async update(token: LinkToken): Promise<LinkToken> {
		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: token
		};

		await documentClient.put(params).promise();
		return token;
	}

	/**
	 * Deletes a link token
	 */
	async delete(id: string): Promise<void> {
		const params: DocumentClient.DeleteItemInput = {
			TableName: this.tableName,
			Key: { id }
		};

		await documentClient.delete(params).promise();
	}

	/**
	 * Marks a token as used
	 */
	async markAsUsed(tokenId: string): Promise<void> {
		const params: DocumentClient.UpdateItemInput = {
			TableName: this.tableName,
			Key: { id: tokenId },
			UpdateExpression: 'SET #used = :used',
			ExpressionAttributeNames: { '#used': 'used' },
			ExpressionAttributeValues: { ':used': true }
		};

		await documentClient.update(params).promise();
	}

	/**
	 * Deletes all expired tokens
	 * Should be called periodically (e.g., via cron or scheduler)
	 */
	async deleteExpired(): Promise<void> {
		const now = new Date().toISOString();
		const params: DocumentClient.ScanInput = {
			TableName: this.tableName,
			FilterExpression: 'expires_at < :now',
			ExpressionAttributeValues: { ':now': now }
		};

		const result = await documentClient.scan(params).promise();

		if (result.Items && result.Items.length > 0) {
			const deletePromises = result.Items.map((item: any) => {
				const deleteParams: DocumentClient.DeleteItemInput = {
					TableName: this.tableName,
					Key: { id: item.id }
				};
				return documentClient.delete(deleteParams).promise();
			});

			await Promise.all(deletePromises);
		}
	}
}

