import { Repository } from './Repository';
import { User } from '@gibipromo/shared';

/**
 * Repository interface for User entities
 */
export interface UserRepository extends Repository<User> {
	findByUsername(username: string): Promise<User | null>;
	setEnabled(id: string, enabled: boolean): Promise<User>;
}