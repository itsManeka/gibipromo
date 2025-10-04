import { ActionConfig } from '../../../domain/entities/ActionConfig';
import { ActionType } from '../../../domain/entities/Action';
import { ActionConfigRepository } from '../../../application/ports/ActionConfigRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of ActionConfigRepository
 */
export class DynamoDBActionConfigRepository extends DynamoDBRepository<ActionConfig> implements ActionConfigRepository {
    constructor() {
        super('ActionConfigs');
    }

    async findByType(type: ActionType): Promise<ActionConfig | null> {
        const params: DocumentClient.GetItemInput = {
            TableName: this.tableName,
            Key: {
                action_type: type
            }
        };

        const result = await documentClient.get(params).promise();
        return result.Item ? (result.Item as ActionConfig) : null;
    }

    async findEnabled(): Promise<ActionConfig[]> {
        const params: DocumentClient.ScanInput = {
            TableName: this.tableName,
            FilterExpression: 'enabled = :enabled',
            ExpressionAttributeValues: {
                ':enabled': true
            }
        };

        const result = await documentClient.scan(params).promise();
        return (result.Items || []) as ActionConfig[];
    }
}