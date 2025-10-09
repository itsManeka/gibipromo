import { Entity } from './Entity';

/**
 * Represents a user in the system
 */
export interface User extends Entity {
	telegram_id?: string; // Optional for users created via website
	username: string;
	name: string;
	language: string;
	enabled: boolean;
	email?: string; // Email for website authentication
	password_hash?: string; // Password hash for website authentication
	session_id?: string; // Current active session ID
}

/**
 * Factory function to create a new User from Telegram
 */
export function createTelegramUser(params: Omit<User, 'enabled' | 'email' | 'password_hash' | 'session_id'>): User {
	return {
		...params,
		enabled: false // Users start with monitoring disabled
	};
}

/**
 * Factory function to create a new User from website
 */
export function createWebsiteUser(params: {
	id: string;
	username: string;
	name: string;
	language: string;
	email: string;
	password_hash: string;
}): User {
	return {
		...params,
		enabled: false // Users start with monitoring disabled
	};
}