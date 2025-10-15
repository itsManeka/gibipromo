import { Entity } from './Entity';
import { v4 as uuidv4 } from 'uuid';
import { UserPreferences, createUserPreferences } from './UserPreferences';
import { UserProfile, createUserProfile } from './UserProfile';

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
			user_id: userId,
			monitor_preorders: false,
			monitor_coupons: false
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
		return {
			id: this.generateId(),
			email: '', // Telegram users don't have email initially
			telegram_id: telegramId,
			username: username || '',
			name: name || '',
			language,
			enabled: false // Users start with monitoring disabled
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
		return {
			id: this.generateId(),
			email,
			password_hash: passwordHash,
			username: username || '',
			name: '',
			language: 'en',
			enabled: true // Web users start enabled
		};
	}
}