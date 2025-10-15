import { UserProfile, UserProfileRepository } from '@gibipromo/shared';
import { BaseService } from './BaseService';

/**
 * Data for updating user profile
 */
export interface UpdateProfileData {
	nick: string;
}

/**
 * Service for user profile business logic
 * Handles profile retrieval and metrics
 */
export class UserProfileService extends BaseService {
	constructor(private readonly userProfileRepository: UserProfileRepository) {
		super('UserProfileService');
	}

	/**
	 * Get user profile by user ID
	 * @param userId - The user ID
	 * @returns User profile or null if not found
	 */
	async getUserProfile(userId: string): Promise<UserProfile | null> {
		this.logAction('Getting user profile', { userId });

		try {
			const profile = await this.userProfileRepository.findByUserId(userId);

			if (!profile) {
				this.logAction('User profile not found', { userId });
				return null;
			}

			this.logAction('User profile retrieved', { userId, profileId: profile.id });
			return profile;
		} catch (error) {
			this.logError(error as Error, 'getUserProfile');
			throw error;
		}
	}

	/**
	 * Update user profile
	 * @param userId - The user ID
	 * @param data - Update data (nick)
	 * @returns Updated user profile or null if not found
	 */
	async updateUserProfile(userId: string, data: UpdateProfileData): Promise<UserProfile | null> {
		this.logAction('Updating user profile', { userId, data });

		// Validação
		if (!data.nick || data.nick.trim().length === 0) {
			throw new Error('Nick is required');
		}

		if (data.nick.trim().length < 2) {
			throw new Error('Nick must be at least 2 characters long');
		}

		if (data.nick.trim().length > 50) {
			throw new Error('Nick must be at most 50 characters long');
		}

		try {
			// Buscar perfil existente
			const existingProfile = await this.userProfileRepository.findByUserId(userId);

			if (!existingProfile) {
				this.logAction('User profile not found for update', { userId });
				return null;
			}

			// Atualizar perfil
			const updatedProfile: UserProfile = {
				...existingProfile,
				nick: data.nick.trim()
			};

			const result = await this.userProfileRepository.update(updatedProfile);

			this.logAction('User profile updated', { userId, profileId: result.id });
			return result;
		} catch (error) {
			this.logError(error as Error, 'updateUserProfile');
			throw error;
		}
	}
}
