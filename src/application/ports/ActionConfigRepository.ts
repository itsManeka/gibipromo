import { Repository } from './Repository';
import { ActionConfig } from '../../domain/entities/ActionConfig';
import { ActionType } from '../../domain/entities/Action';

/**
 * Repository interface for ActionConfig entities
 */
export interface ActionConfigRepository extends Repository<ActionConfig> {
  /**
   * Gets the configuration for a specific action type
   */
  findByType(type: ActionType): Promise<ActionConfig | null>;

  /**
   * Gets all enabled action configurations
   */
  findEnabled(): Promise<ActionConfig[]>;
}