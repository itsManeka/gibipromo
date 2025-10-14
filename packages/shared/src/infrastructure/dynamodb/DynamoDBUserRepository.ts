import { User } from '../../entities';
import { UserRepository } from '../../repositories/UserRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of UserRepository
 */
export class DynamoDBUserRepository extends DynamoDBRepository<User> implements UserRepository {
	constructor() {
		super('Users');
	}

	async findByUsername(username: string): Promise<User | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UsernameIndex',
			KeyConditionExpression: 'username = :username',
			ExpressionAttributeValues: {
				':username': username
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as User) : null;
	}

	async findByTelegramId(telegramId: string): Promise<User | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'TelegramIdIndex',
			KeyConditionExpression: 'telegram_id = :telegram_id',
			ExpressionAttributeValues: {
				':telegram_id': telegramId
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as User) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'EmailIndex',
			KeyConditionExpression: 'email = :email',
			ExpressionAttributeValues: {
				':email': email
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as User) : null;
	}

	async setEnabled(id: string, enabled: boolean): Promise<User> {
		const params: DocumentClient.UpdateItemInput = {
			TableName: this.tableName,
			Key: { id },
			UpdateExpression: 'set enabled = :enabled',
			ExpressionAttributeValues: {
				':enabled': enabled
			},
			ReturnValues: 'ALL_NEW'
		};

		const result = await documentClient.update(params).promise();
		return result.Attributes as User;
	}

	async updateSessionId(id: string, sessionId: string | null): Promise<User> {
		const params: DocumentClient.UpdateItemInput = {
			TableName: this.tableName,
			Key: { id },
			UpdateExpression: sessionId ? 'set session_id = :session_id' : 'remove session_id',
			ExpressionAttributeValues: sessionId ? {
				':session_id': sessionId
			} : undefined,
			ReturnValues: 'ALL_NEW'
		};

		const result = await documentClient.update(params).promise();
		return result.Attributes as User;
	}
}