import { Repository } from './Repository';
import { UserPreferences } from '@gibipromo/shared';

/**
 * Repository interface for UserPreferences entities
 */
export interface UserPreferencesRepository extends Repository<UserPreferences> {
	findByUserId(userId: string): Promise<UserPreferences | null>;
}