import { Product } from '../../../domain/entities/Product';
import { ProductRepository } from '../../../application/ports/ProductRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
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

    async findByUserId(userId: string, page: number, pageSize: number): Promise<{ products: Product[]; total: number }> {
        console.log(`[DynamoDB] Buscando produtos do usuário ${userId} (página ${page}, ${pageSize} itens por página)`);
    
        const params: DocumentClient.ScanInput = {
            TableName: this.tableName,
            FilterExpression: 'contains(users, :userId)',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };

        try {
            // Primeiro faz um scan para pegar todos os produtos do usuário
            const result = await documentClient.scan(params).promise();
            const allProducts = (result.Items || []) as Product[];
      
            // Ordena por ID (que contém timestamp) em ordem decrescente
            const sortedProducts = allProducts.sort((a, b) => b.id.localeCompare(a.id));
      
            // Calcula o offset e limite para a paginação
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
      
            // Retorna apenas os produtos da página solicitada
            const paginatedProducts = sortedProducts.slice(start, end);
      
            console.log(`[DynamoDB] Encontrados ${allProducts.length} produtos, retornando ${paginatedProducts.length}`);
      
            return {
                products: paginatedProducts,
                total: allProducts.length
            };
        } catch (error) {
            console.error('[DynamoDB] Erro ao buscar produtos do usuário:', error);
            throw error;
        }
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

    async addUser(productId: string, userId: string): Promise<void> {
    // Primeiro busca o produto para verificar se o usuário já está na lista
        const product = await this.findById(productId);
        if (!product) return;

        // Se o usuário já está na lista, não faz nada
        if (product.users?.includes(userId)) {
            return;
        }

        const params: DocumentClient.UpdateItemInput = {
            TableName: this.tableName,
            Key: { id: productId },
            UpdateExpression: 'SET #users = list_append(if_not_exists(#users, :empty), :userId), updated_at = :updated_at',
            ExpressionAttributeNames: {
                '#users': 'users'
            },
            ExpressionAttributeValues: {
                ':userId': [userId],
                ':empty': [],
                ':updated_at': new Date().toISOString()
            }
        };

        await documentClient.update(params).promise();
    }

    async removeUser(productId: string, userId: string): Promise<void> {
    // Primeiro busca o produto para pegar a lista atual de usuários
        const product = await this.findById(productId);
        if (!product) return;

        // Remove o usuário da lista
        const users = product.users.filter((id: string) => id !== userId);

        // Atualiza o produto
        const params: DocumentClient.UpdateItemInput = {
            TableName: this.tableName,
            Key: { id: productId },
            UpdateExpression: 'SET #users = :users, updated_at = :updated_at',
            ExpressionAttributeNames: {
                '#users': 'users'
            },
            ExpressionAttributeValues: {
                ':users': users,
                ':updated_at': new Date().toISOString()
            }
        };

        await documentClient.update(params).promise();
    }

    private lastEvaluatedKey: DocumentClient.Key | undefined;

    async getNextProductsToCheck(limit: number): Promise<Product[]> {
        try {
            console.log(`[DynamoDB] Buscando próximos ${limit} produtos para verificar`);

            const params: DocumentClient.ScanInput = {
                TableName: this.tableName,
                Limit: limit,
                // Busca apenas produtos que têm usuários monitorando
                FilterExpression: 'attribute_exists(#users) AND size(#users) > :zero',
                ExpressionAttributeNames: {
                    '#users': 'users'
                },
                ExpressionAttributeValues: {
                    ':zero': 0
                }
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