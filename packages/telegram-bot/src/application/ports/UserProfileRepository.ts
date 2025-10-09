import { Repository } from './Repository';
import { UserProfile } from '@gibipromo/shared';

/**
 * Repository interface for UserProfile entities
 */
export interface UserProfileRepository extends Repository<UserProfile> {
	findByUserId(userId: string): Promise<UserProfile | null>;
}