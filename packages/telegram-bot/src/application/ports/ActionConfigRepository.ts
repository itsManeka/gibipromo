import { Repository } from './Repository';
import { ActionConfig } from '@gibipromo/shared';
import { ActionType } from '@gibipromo/shared';

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