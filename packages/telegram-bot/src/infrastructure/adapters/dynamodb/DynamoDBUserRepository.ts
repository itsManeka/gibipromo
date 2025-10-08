import { User } from '@gibipromo/shared';
import { UserRepository } from '../../../application/ports/UserRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
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
}