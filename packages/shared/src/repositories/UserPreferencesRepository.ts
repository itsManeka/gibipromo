import { Repository } from './Repository';
import { UserPreferences } from '../entities';

/**
 * Repository interface for UserPreferences entities
 */
export interface UserPreferencesRepository extends Repository<UserPreferences> {
	findByUserId(userId: string): Promise<UserPreferences | null>;
}