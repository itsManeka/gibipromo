import { Repository } from './Repository';
import { Action, ActionType } from '../../domain/entities/Action';

/**
 * Repository interface for Action entities
 */
export interface ActionRepository extends Repository<Action> {
  findByType(type: ActionType, limit: number): Promise<Action[]>;
  findPendingByType(type: ActionType, limit: number): Promise<Action[]>;
  markProcessed(id: string): Promise<void>;
}