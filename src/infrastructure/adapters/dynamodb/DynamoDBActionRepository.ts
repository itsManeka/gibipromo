import { Action, ActionType } from '../../../domain/entities/Action';
import { ActionRepository } from '../../../application/ports/ActionRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

/**
 * DynamoDB implementation of ActionRepository
 */
export class DynamoDBActionRepository extends DynamoDBRepository<Action> implements ActionRepository {
  constructor() {
    super('Actions');
  }

  async findByType(type: ActionType, limit: number): Promise<Action[]> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: 'TypeCreatedIndex',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':type': type
      },
      Limit: limit,
      ScanIndexForward: true // ascending order by created_at
    };

    const result = await documentClient.query(params).promise();
    return (result.Items || []) as Action[];
  }

  async findPendingByType(type: ActionType, limit: number): Promise<Action[]> {
    console.log(`[DynamoDB] Buscando ${limit} ações pendentes do tipo ${type}`);
    
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: 'TypeProcessedIndex',
      KeyConditionExpression: '#type = :type AND #is_processed = :is_processed',
      ExpressionAttributeNames: {
        '#type': 'type',
        '#is_processed': 'is_processed'
      },
      ExpressionAttributeValues: {
        ':type': type,
        ':is_processed': 0 // No DynamoDB, false = 0, true = 1 para números
      },
      Limit: limit,
      ScanIndexForward: true // ordena por is_processed ascendente
    };

    try {
      const result = await documentClient.query(params).promise();
      console.log(`[DynamoDB] Encontradas ${result.Items?.length || 0} ações pendentes do tipo ${type}`);
      return (result.Items || []) as Action[];
    } catch (error) {
      console.error('[DynamoDB] Erro ao buscar ações pendentes:', error);
      throw error;
    }
  }

  async markProcessed(id: string): Promise<void> {
    console.log(`[DynamoDB] Marcando ação ${id} como processada`);
    const params: DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'set is_processed = :is_processed',
      ExpressionAttributeValues: {
        ':is_processed': 1 // No DynamoDB, true = 1 para números
      }
    };

    try {
      await documentClient.update(params).promise();
      console.log(`[DynamoDB] Ação ${id} marcada como processada com sucesso`);
    } catch (error) {
      console.error('[DynamoDB] Erro ao marcar ação como processada:', error);
      throw error;
    }
  }
}