import { Entity } from './Entity';

/**
 * Represents a user's public profile information
 */
export interface UserProfile extends Entity {
	user_id: string; // References User.id
	nick: string; // Display name or nickname
	created_at: string; // ISO 8601 timestamp
	updated_at: string; // ISO 8601 timestamp
}

/**
 * Factory function to create a new UserProfile
 */
export function createUserProfile(params: {
	id: string;
	user_id: string;
	nick: string;
	created_at?: string;
	updated_at?: string;
}): UserProfile {
	const now = new Date().toISOString();
	return {
		id: params.id,
		user_id: params.user_id,
		nick: params.nick,
		created_at: params.created_at ?? now,
		updated_at: params.updated_at ?? now
	};
}