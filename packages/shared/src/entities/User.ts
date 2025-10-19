import { Entity } from './Entity';
import { v4 as uuidv4 } from 'uuid';
import { UserPreferences, createUserPreferences } from './UserPreferences';
import { UserProfile, createUserProfile } from './UserProfile';
import { UserOrigin } from '../constants';

/**
 * Represents a user in the system
 */
export interface User extends Entity {
	telegram_id?: string; // Optional for users created via website
	username: string;
	name: string;
	language: string;
	enabled: boolean;
	origin?: UserOrigin; // Origin of the user (TELEGRAM, SITE, BOTH) - optional for backward compatibility
	email?: string; // Email for website authentication
	password_hash?: string; // Password hash for website authentication
	session_id?: string; // Current active session ID
	created_at: string; // ISO 8601 timestamp
	updated_at: string; // ISO 8601 timestamp
}

/**
 * User factory methods
 * Centralized user creation logic for consistency
 */
export class UserFactory {
	/**
	 * Generate a unique user ID
	 * Uses UUID v4 for consistency across bot and web
	 */
	static generateId(): string {
		return uuidv4();
	}

	/**
	 * Create default UserPreferences for a new user
	 */
	static createDefaultPreferences(userId: string): UserPreferences {
		return createUserPreferences({
			id: this.generateId(),
			user_id: userId
		});
	}

	/**
	 * Create default UserProfile for a new user
	 */
	static createDefaultProfile(userId: string, nick: string): UserProfile {
		return createUserProfile({
			id: this.generateId(),
			user_id: userId,
			nick: nick || 'Usuario'
		});
	}

	/**
	 * Create a new Telegram user
	 */
	static createTelegramUser(
		telegramId: string,
		username?: string,
		name?: string,
		language: string = 'en'
	): User {
		const now = new Date().toISOString();
		return {
			id: this.generateId(),
			// email is omitted (undefined) for Telegram users - DynamoDB GSI doesn't allow empty strings
			telegram_id: telegramId,
			username: username || '',
			name: name || '',
			language,
			enabled: false, // Users start with monitoring disabled
			origin: UserOrigin.TELEGRAM, // User created via Telegram bot
			created_at: now,
			updated_at: now
		};
	}

	/**
	 * Create a new website user
	 */
	static createWebsiteUser(
		email: string,
		passwordHash: string,
		username?: string
	): User {
		const now = new Date().toISOString();
		return {
			id: this.generateId(),
			email,
			password_hash: passwordHash,
			username: username || '',
			name: '',
			language: 'en',
			enabled: true, // Web users start enabled
			origin: UserOrigin.SITE, // User created via website
			created_at: now,
			updated_at: now
		};
	}
}