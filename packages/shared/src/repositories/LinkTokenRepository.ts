import { LinkToken } from '../entities/LinkToken';

/**
 * Repository interface for LinkToken operations
 * Manages link tokens for account linking between Telegram and Site
 */
export interface LinkTokenRepository {
	/**
	 * Creates a new link token
	 * @param token LinkToken to create
	 */
	create(token: LinkToken): Promise<void>;

	/**
	 * Finds a token by its value
	 * @param token Token string to search for
	 * @returns LinkToken if found, null otherwise
	 */
	findByToken(token: string): Promise<LinkToken | null>;

	/**
	 * Marks a token as used
	 * @param tokenId ID of the token to mark as used
	 */
	markAsUsed(tokenId: string): Promise<void>;

	/**
	 * Deletes all expired tokens
	 * Should be called periodically to clean up old tokens
	 */
	deleteExpired(): Promise<void>;
}

