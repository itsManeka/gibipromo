import { Repository } from './Repository';
import { Session } from '@gibipromo/shared';

/**
 * Repository interface for Session entities
 */
export interface SessionRepository extends Repository<Session> {
	findBySessionId(sessionId: string): Promise<Session | null>;
	findByUserId(userId: string): Promise<Session[]>;
	deleteExpiredSessions(): Promise<void>;
}