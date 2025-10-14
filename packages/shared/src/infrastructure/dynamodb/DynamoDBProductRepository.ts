import { Product } from '../../entities';
import { ProductRepository } from '../../repositories/ProductRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of ProductRepository
 */
export class DynamoDBProductRepository extends DynamoDBRepository<Product> implements ProductRepository {
	constructor() {
		super('Products');
	}

	async create(entity: Product): Promise<Product> {
		const now = new Date().toISOString();
		const productWithTimestamps = {
			...entity,
			created_at: now,
			updated_at: now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productWithTimestamps
		};

		await documentClient.put(params).promise();
		return productWithTimestamps;
	}

	async update(entity: Product): Promise<Product> {
		const now = new Date().toISOString();
		const productWithUpdatedTimestamp = {
			...entity,
			updated_at: now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productWithUpdatedTimestamp
		};

		await documentClient.put(params).promise();
		return productWithUpdatedTimestamp;
	}

	async findByLink(link: string): Promise<Product | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UrlIndex',
			KeyConditionExpression: 'url = :url',
			ExpressionAttributeValues: {
				':url': link
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as Product) : null;
	}

	private lastEvaluatedKey: DocumentClient.Key | undefined;

	async getNextProductsToCheck(limit: number): Promise<Product[]> {
		try {
			console.log(`[DynamoDB] Buscando próximos ${limit} produtos para verificar`);

			const params: DocumentClient.ScanInput = {
				TableName: this.tableName,
				Limit: limit
			};

			// Se tiver uma chave salva, usa para continuar de onde parou
			if (this.lastEvaluatedKey) {
				params.ExclusiveStartKey = this.lastEvaluatedKey;
			}

			const result = await documentClient.scan(params).promise();

			// Guarda a última chave avaliada para a próxima consulta
			this.lastEvaluatedKey = result.LastEvaluatedKey;

			// Se não tem mais itens, reinicia a paginação
			if (!this.lastEvaluatedKey) {
				console.log('[DynamoDB] Fim da lista de produtos, reiniciando paginação');
			}

			const products = (result.Items || []) as Product[];
			console.log(`[DynamoDB] Encontrados ${products.length} produtos para verificar`);

			return products;
		} catch (error) {
			console.error('[DynamoDB] Erro ao buscar produtos para verificar:', error);
			this.lastEvaluatedKey = undefined; // Reseta em caso de erro
			throw error;
		}
	}
}