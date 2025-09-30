import { Entity } from '../../../domain/entities/Entity';
import { Repository } from '../../../application/ports/Repository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * Base DynamoDB repository implementation
 */
export abstract class DynamoDBRepository<T extends Entity> implements Repository<T> {
  protected constructor(
    protected readonly tableName: string
  ) {}

  async create(entity: T): Promise<T> {
    const params: DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: entity
    };

    await documentClient.put(params).promise();
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const params: DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: { id }
    };

    const result = await documentClient.get(params).promise();
    return result.Item ? (result.Item as T) : null;
  }

  async update(entity: T): Promise<T> {
    const params: DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: entity
    };

    await documentClient.put(params).promise();
    return entity;
  }

  async delete(id: string): Promise<void> {
    const params: DocumentClient.DeleteItemInput = {
      TableName: this.tableName,
      Key: { id }
    };

    await documentClient.delete(params).promise();
  }
}