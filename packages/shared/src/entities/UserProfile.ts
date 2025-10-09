import { Entity } from './Entity';

/**
 * Represents a user's public profile information
 */
export interface UserProfile extends Entity {
	user_id: string; // References User.id
	nick: string; // Display name or nickname
}

/**
 * Factory function to create a new UserProfile
 */
export function createUserProfile(params: {
	id: string;
	user_id: string;
	nick: string;
}): UserProfile {
	return {
		id: params.id,
		user_id: params.user_id,
		nick: params.nick
	};
}