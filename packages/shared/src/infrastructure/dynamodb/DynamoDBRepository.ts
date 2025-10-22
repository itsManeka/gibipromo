import { Entity } from '../../entities';
import { Repository } from '../../repositories/Repository';
import { documentClient } from '../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * Base DynamoDB repository implementation
 */
export abstract class DynamoDBRepository<T extends Entity> implements Repository<T> {
	protected constructor(
		protected readonly tableName: string
	) { }

	/**
	 * Remove empty string values from entity to prevent DynamoDB GSI errors
	 * DynamoDB GSI doesn't allow empty strings in indexed attributes
	 */
	protected sanitizeEntity(entity: T): T {
		const sanitized = { ...entity };
		Object.keys(sanitized).forEach(key => {
			if (sanitized[key as keyof T] === '') {
				delete sanitized[key as keyof T];
			}
		});
		return sanitized;
	}

	async create(entity: T): Promise<T> {
		const sanitizedEntity = this.sanitizeEntity(entity);
		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: sanitizedEntity
		};

		await documentClient.put(params).promise();
		return entity;
	}

	async findById(id: string): Promise<T | null> {
		const params: DocumentClient.GetItemInput = {
			TableName: this.tableName,
			Key: { id }
		};

		const result = await documentClient.get(params).promise();
		return result.Item ? (result.Item as T) : null;
	}

	async update(entity: T): Promise<T> {
		const sanitizedEntity = this.sanitizeEntity(entity);
		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: sanitizedEntity
		};

		await documentClient.put(params).promise();
		return entity;
	}

	async delete(id: string): Promise<void> {
		const params: DocumentClient.DeleteItemInput = {
			TableName: this.tableName,
			Key: { id }
		};

		await documentClient.delete(params).promise();
	}
}