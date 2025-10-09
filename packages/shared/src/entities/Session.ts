import { Entity } from './Entity';

/**
 * Represents a user session for website authentication
 */
export interface Session extends Entity {
	session_id: string; // Primary key
	user_id: string; // References User.id
	expires_at: string; // ISO date string
}

/**
 * Factory function to create a new Session
 */
export function createSession(params: {
	session_id: string;
	user_id: string;
	expiresInMinutes?: number;
}): Session {
	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + (params.expiresInMinutes || 60 * 24)); // Default: 24 hours
	
	return {
		id: params.session_id, // For Entity compliance
		session_id: params.session_id,
		user_id: params.user_id,
		expires_at: expiresAt.toISOString()
	};
}

/**
 * Checks if a session is expired
 */
export function isSessionExpired(session: Session): boolean {
	return new Date() > new Date(session.expires_at);
}