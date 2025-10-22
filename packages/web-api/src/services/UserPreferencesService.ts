/**
 * User Preferences Service
 *
 * Handles business logic for user preferences management.
 *
 * @module services/UserPreferencesService
 */

import { BaseService } from './BaseService';
import { UserPreferences } from '@gibipromo/shared';
import { DynamoDBUserPreferencesRepository } from '@gibipromo/shared';

/**
 * Data for updating user preferences
 */
export interface UpdatePreferencesData {
	monitor_preorders?: boolean;
	monitor_coupons?: boolean;
}

/**
 * User Preferences Service
 * Provides business logic for preferences retrieval and updates
 */
export class UserPreferencesService extends BaseService {
	constructor(
		private readonly userPreferencesRepository: DynamoDBUserPreferencesRepository
	) {
		super('UserPreferencesService');
	}

	/**
	 * Get user preferences by user ID
	 */
	async getUserPreferences(userId: string): Promise<UserPreferences | null> {
		try {
			this.logAction(`Getting preferences for user: ${userId}`);

			const preferences = await this.userPreferencesRepository.findByUserId(userId);

			if (!preferences) {
				this.logAction(`Preferences not found for user: ${userId}`);
				return null;
			}

			this.logAction(`Preferences retrieved successfully for user: ${userId}`);
			return preferences;
		} catch (error) {
			this.logError(error as Error, 'getUserPreferences');
			throw error;
		}
	}

	/**
	 * Update user preferences
	 */
	async updateUserPreferences(
		userId: string,
		data: UpdatePreferencesData
	): Promise<UserPreferences | null> {
		try {
			this.logAction(`Updating preferences for user: ${userId}`);

			// Validar dados de entrada
			this.validatePreferencesData(data);

			// Buscar preferências existentes
			const existingPreferences = await this.userPreferencesRepository.findByUserId(userId);

			if (!existingPreferences) {
				this.logError(new Error(`User ${userId} not found`), 'updateUserPreferences');
				return null;
			}

			// Atualizar apenas os campos fornecidos
			const updatedPreferences: UserPreferences = {
				...existingPreferences,
				...data,
				updated_at: new Date().toISOString()
			};

			// Salvar no repositório
			const result = await this.userPreferencesRepository.update(updatedPreferences);

			this.logAction(`Preferences updated successfully for user: ${userId}`);
			return result;
		} catch (error) {
			this.logError(error as Error, 'updateUserPreferences');
			throw error;
		}
	}

	/**
	 * Validate preferences data
	 */
	private validatePreferencesData(data: UpdatePreferencesData): void {
		// Validar tipos booleanos
		const booleanFields: (keyof UpdatePreferencesData)[] = [
			'monitor_preorders',
			'monitor_coupons'
		];

		for (const field of booleanFields) {
			if (data[field] !== undefined && typeof data[field] !== 'boolean') {
				throw new Error(`${field} must be a boolean value`);
			}
		}
	}
}
