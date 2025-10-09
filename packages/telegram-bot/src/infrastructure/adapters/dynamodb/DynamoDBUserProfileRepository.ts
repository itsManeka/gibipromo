import { UserProfile } from '@gibipromo/shared';
import { UserProfileRepository } from '../../../application/ports/UserProfileRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of UserProfileRepository
 */
export class DynamoDBUserProfileRepository extends DynamoDBRepository<UserProfile> implements UserProfileRepository {
	constructor() {
		super('UserProfile');
	}

	async findByUserId(userId: string): Promise<UserProfile | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdIndex',
			KeyConditionExpression: 'user_id = :user_id',
			ExpressionAttributeValues: {
				':user_id': userId
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as UserProfile) : null;
	}
}