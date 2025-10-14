import { Repository } from './Repository';
import { ActionConfig } from '../entities';
import { ActionType } from '../entities';

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