import { ProductStats } from '@gibipromo/shared';
import { ProductStatsRepository } from '../../../application/ports/ProductStatsRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of ProductStatsRepository
 */
export class DynamoDBProductStatsRepository
	extends DynamoDBRepository<ProductStats>
	implements ProductStatsRepository {
	constructor() {
		super('ProductStats');
	}

	async findByProductId(productId: string): Promise<ProductStats[]> {
		const params: DocumentClient.ScanInput = {
			TableName: this.tableName,
			FilterExpression: 'product_id = :product_id',
			ExpressionAttributeValues: {
				':product_id': productId
			}
		};

		const result = await documentClient.scan(params).promise();
		return (result.Items as ProductStats[]) || [];
	}

	async findLatest(limit: number): Promise<ProductStats[]> {
		const params: DocumentClient.ScanInput = {
			TableName: this.tableName,
			Limit: limit
		};

		const result = await documentClient.scan(params).promise();
		const stats = (result.Items as ProductStats[]) || [];

		// Sort by created_at descending to get the latest first
		return stats.sort((a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
	}

	async findByProductIdAndDateRange(
		productId: string,
		startDate: string,
		endDate: string
	): Promise<ProductStats[]> {
		const params: DocumentClient.ScanInput = {
			TableName: this.tableName,
			FilterExpression: 'product_id = :product_id AND created_at BETWEEN :start_date AND :end_date',
			ExpressionAttributeValues: {
				':product_id': productId,
				':start_date': startDate,
				':end_date': endDate
			}
		};

		const result = await documentClient.scan(params).promise();
		const stats = (result.Items as ProductStats[]) || [];

		// Sort by created_at ascending for chronological order
		return stats.sort((a, b) =>
			new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		);
	}
}