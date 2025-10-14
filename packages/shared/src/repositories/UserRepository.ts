import { Repository } from './Repository';
import { User } from '../entities';

/**
 * Repository interface for User entities
 */
export interface UserRepository extends Repository<User> {
	findByUsername(username: string): Promise<User | null>;
	findByTelegramId(telegramId: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	setEnabled(id: string, enabled: boolean): Promise<User>;
	updateSessionId(id: string, sessionId: string | null): Promise<User>;
}