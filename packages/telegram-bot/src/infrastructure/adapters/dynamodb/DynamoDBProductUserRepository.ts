import { ProductUser } from '@gibipromo/shared';
import { ProductUserRepository } from '../../../application/ports/ProductUserRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of ProductUserRepository
 */
export class DynamoDBProductUserRepository extends DynamoDBRepository<ProductUser> implements ProductUserRepository {
	constructor() {
		super('ProductUsers');
	}

	async create(entity: ProductUser): Promise<ProductUser> {
		const now = new Date().toISOString();
		const productUserWithTimestamps = {
			...entity,
			created_at: now,
			updated_at: now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productUserWithTimestamps
		};

		await documentClient.put(params).promise();
		return productUserWithTimestamps;
	}

	async update(entity: ProductUser): Promise<ProductUser> {
		const now = new Date().toISOString();
		const productUserWithUpdatedTimestamp = {
			...entity,
			updated_at: now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productUserWithUpdatedTimestamp
		};

		await documentClient.put(params).promise();
		return productUserWithUpdatedTimestamp;
	}

	async findByProductAndUser(productId: string, userId: string): Promise<ProductUser | null> {
		const params: DocumentClient.GetItemInput = {
			TableName: this.tableName,
			Key: {
				product_id: productId,
				user_id: userId
			}
		};

		const result = await documentClient.get(params).promise();
		return result.Item ? (result.Item as ProductUser) : null;
	}

	async findByProductId(productId: string): Promise<ProductUser[]> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			KeyConditionExpression: 'product_id = :productId',
			ExpressionAttributeValues: {
				':productId': productId
			}
		};

		const result = await documentClient.query(params).promise();
		return (result.Items || []) as ProductUser[];
	}

	async findByUserId(userId: string, page: number, pageSize: number): Promise<{
		productUsers: ProductUser[];
		total: number;
	}> {
		console.log(`[DynamoDB] Buscando produtos do usuário ${userId} (página ${page}, ${pageSize} itens por página)`);

		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UserIdIndex',
			KeyConditionExpression: 'user_id = :userId',
			ExpressionAttributeValues: {
				':userId': userId
			}
		};

		try {
			// Primeiro faz uma query para pegar todos os produtos do usuário
			const result = await documentClient.query(params).promise();
			const allProductUsers = (result.Items || []) as ProductUser[];

			// Ordena por created_at em ordem decrescente (mais recentes primeiro)
			const sortedProductUsers = allProductUsers.sort((a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			);

			// Calcula o offset e limite para a paginação
			const start = (page - 1) * pageSize;
			const end = start + pageSize;

			// Retorna apenas os produtos da página solicitada
			const paginatedProductUsers = sortedProductUsers.slice(start, end);

			console.log(`[DynamoDB] Encontrados ${allProductUsers.length} produtos, retornando ${paginatedProductUsers.length}`);

			return {
				productUsers: paginatedProductUsers,
				total: allProductUsers.length
			};
		} catch (error) {
			console.error('[DynamoDB] Erro ao buscar produtos do usuário:', error);
			throw error;
		}
	}

	async upsert(productUser: ProductUser): Promise<void> {
		const now = new Date().toISOString();
		const productUserWithTimestamps = {
			...productUser,
			updated_at: now,
			// Se não tem created_at, define agora
			created_at: productUser.created_at || now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productUserWithTimestamps
		};

		await documentClient.put(params).promise();
	}

	async removeByProductAndUser(productId: string, userId: string): Promise<void> {
		const params: DocumentClient.DeleteItemInput = {
			TableName: this.tableName,
			Key: {
				product_id: productId,
				user_id: userId
			}
		};

		await documentClient.delete(params).promise();
	}

	async updateDesiredPrice(productId: string, userId: string, desiredPrice: number): Promise<void> {
		const params: DocumentClient.UpdateItemInput = {
			TableName: this.tableName,
			Key: {
				product_id: productId,
				user_id: userId
			},
			UpdateExpression: 'SET desired_price = :desiredPrice, updated_at = :updatedAt',
			ExpressionAttributeValues: {
				':desiredPrice': desiredPrice,
				':updatedAt': new Date().toISOString()
			}
		};

		await documentClient.update(params).promise();
	}
}