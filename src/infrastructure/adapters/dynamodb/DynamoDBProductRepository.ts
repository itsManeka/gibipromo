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

  async findByLink(link: string): Promise<Product | null> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: 'LinkIndex',
      KeyConditionExpression: 'link = :link',
      ExpressionAttributeValues: {
        ':link': link
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
    if (product.usuarios?.includes(userId)) {
      return;
    }

    const params: DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: { id: productId },
      UpdateExpression: 'SET usuarios = list_append(if_not_exists(usuarios, :empty), :userId)',
      ExpressionAttributeValues: {
        ':userId': [userId],
        ':empty': []
      }
    };

    await documentClient.update(params).promise();
  }

  async removeUser(productId: string, userId: string): Promise<void> {
    // Primeiro busca o produto para pegar a lista atual de usuários
    const product = await this.findById(productId);
    if (!product) return;

    // Remove o usuário da lista
    const usuarios = product.usuarios.filter(id => id !== userId);

    // Atualiza o produto
    const params: DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: { id: productId },
      UpdateExpression: 'SET usuarios = :usuarios',
      ExpressionAttributeValues: {
        ':usuarios': usuarios
      }
    };

    await documentClient.update(params).promise();
  }

  async getNextProductsToCheck(limit: number): Promise<Product[]> {
    const params: DocumentClient.ScanInput = {
      TableName: this.tableName,
      Limit: limit
    };

    const result = await documentClient.scan(params).promise();
    return (result.Items || []) as Product[];
  }
}