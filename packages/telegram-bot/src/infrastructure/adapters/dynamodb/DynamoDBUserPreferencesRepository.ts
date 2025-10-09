import { UserPreferences } from '@gibipromo/shared';
import { UserPreferencesRepository } from '../../../application/ports/UserPreferencesRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of UserPreferencesRepository
 */
export class DynamoDBUserPreferencesRepository extends DynamoDBRepository<UserPreferences> implements UserPreferencesRepository {
	constructor() {
		super('UserPreferences');
	}

	async findByUserId(userId: string): Promise<UserPreferences | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdIndex',
			KeyConditionExpression: 'user_id = :user_id',
			ExpressionAttributeValues: {
				':user_id': userId
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as UserPreferences) : null;
	}
}