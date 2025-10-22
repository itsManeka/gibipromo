/**
 * UserPreferencesService Tests
 *
 * Tests for user preferences service
 */

import { UserPreferencesService, UpdatePreferencesData } from '../../src/services/UserPreferencesService';
import { UserPreferences } from '@gibipromo/shared';
import { DynamoDBUserPreferencesRepository } from '@gibipromo/shared';

// Mock do DynamoDBUserPreferencesRepository
jest.mock('@gibipromo/shared', () => ({
	...jest.requireActual('@gibipromo/shared'),
	DynamoDBUserPreferencesRepository: jest.fn().mockImplementation(() => ({
		findByUserId: jest.fn(),
		update: jest.fn()
	}))
}));

describe('UserPreferencesService', () => {
	let service: UserPreferencesService;
	let mockRepository: jest.Mocked<DynamoDBUserPreferencesRepository>;

	// Helper para criar preferências de teste
	function createTestPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
		const now = new Date().toISOString();
		return {
			id: `pref-${Date.now()}`,
			user_id: 'user-123',
			monitor_preorders: true,
			monitor_coupons: true,
			created_at: now,
			updated_at: now,
			...overrides
		};
	}

	beforeEach(() => {
		// Criar mock do repository
		mockRepository = new DynamoDBUserPreferencesRepository() as jest.Mocked<DynamoDBUserPreferencesRepository>;
		
		// Criar service com mock
		service = new UserPreferencesService(mockRepository);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getUserPreferences', () => {
		it('should return user preferences when found', async () => {
			// Arrange
			const mockPreferences = createTestPreferences({
				id: 'pref-1',
				user_id: 'user-123'
			});

			mockRepository.findByUserId.mockResolvedValue(mockPreferences);

			// Act
			const result = await service.getUserPreferences('user-123');

			// Assert
			expect(result).toEqual(mockPreferences);
			expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should return null when preferences not found', async () => {
			// Arrange
			mockRepository.findByUserId.mockResolvedValue(null);

			// Act
			const result = await service.getUserPreferences('user-456');

			// Assert
			expect(result).toBeNull();
			expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-456');
		});

		it('should throw error when repository fails', async () => {
			// Arrange
			const error = new Error('Database connection failed');
			mockRepository.findByUserId.mockRejectedValue(error);

			// Act & Assert
			await expect(service.getUserPreferences('user-123')).rejects.toThrow('Database connection failed');
		});

		it('should handle different user IDs', async () => {
			// Arrange
			const mockPreferences1 = createTestPreferences({ user_id: 'user-111' });
			const mockPreferences2 = createTestPreferences({ user_id: 'user-222' });

			mockRepository.findByUserId.mockResolvedValueOnce(mockPreferences1);
			mockRepository.findByUserId.mockResolvedValueOnce(mockPreferences2);

			// Act
			const result1 = await service.getUserPreferences('user-111');
			const result2 = await service.getUserPreferences('user-222');

			// Assert
			expect(result1?.user_id).toBe('user-111');
			expect(result2?.user_id).toBe('user-222');
		});
	});

	describe('updateUserPreferences', () => {
		const userId = 'user-123';
		let existingPreferences: UserPreferences;

		beforeEach(() => {
			existingPreferences = createTestPreferences({
				id: 'pref-1',
				user_id: userId
			});
		});

		it('should update preferences successfully', async () => {
			// Arrange
			const updateData: UpdatePreferencesData = {
				monitor_preorders: false,
				monitor_coupons: false
			};

			const updatedPreferences = {
				...existingPreferences,
				...updateData
			};

			mockRepository.findByUserId.mockResolvedValue(existingPreferences);
			mockRepository.update.mockResolvedValue(updatedPreferences);

			// Act
			const result = await service.updateUserPreferences(userId, updateData);

			// Assert
			expect(result).toEqual(updatedPreferences);
			expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockRepository.update).toHaveBeenCalledWith(
				expect.objectContaining({
					...existingPreferences,
					...updateData,
					updated_at: expect.any(String)
				})
			);
		});

		it('should return null when preferences not found', async () => {
			// Arrange
			mockRepository.findByUserId.mockResolvedValue(null);

			// Act
			const result = await service.updateUserPreferences(userId, { monitor_preorders: false });

			// Assert
			expect(result).toBeNull();
			expect(mockRepository.update).not.toHaveBeenCalled();
		});

		it('should validate boolean fields', async () => {
			// Arrange
			const invalidData = {
				monitor_preorders: 'true' as any // String instead of boolean
			};

			mockRepository.findByUserId.mockResolvedValue(existingPreferences);

			// Act & Assert
			await expect(service.updateUserPreferences(userId, invalidData))
				.rejects.toThrow('monitor_preorders must be a boolean value');
		});

		it('should validate monitor_coupons as boolean', async () => {
			// Arrange
			const invalidData = {
				monitor_coupons: 1 as any // Number instead of boolean
			};

			mockRepository.findByUserId.mockResolvedValue(existingPreferences);

			// Act & Assert
			await expect(service.updateUserPreferences(userId, invalidData))
				.rejects.toThrow('monitor_coupons must be a boolean value');
		});

		it('should update multiple fields at once', async () => {
			// Arrange
			const updateData: UpdatePreferencesData = {
				monitor_preorders: false,
				monitor_coupons: false
			};

			const updatedPreferences = {
				...existingPreferences,
				...updateData
			};

			mockRepository.findByUserId.mockResolvedValue(existingPreferences);
			mockRepository.update.mockResolvedValue(updatedPreferences);

			// Act
			const result = await service.updateUserPreferences(userId, updateData);

			// Assert
			expect(result?.monitor_preorders).toBe(false);
			expect(result?.monitor_coupons).toBe(false);
		});

		it('should preserve unchanged fields', async () => {
			// Arrange
			const updateData: UpdatePreferencesData = {
				monitor_preorders: false
			};

			const updatedPreferences = {
				...existingPreferences,
				monitor_preorders: false
			};

			mockRepository.findByUserId.mockResolvedValue(existingPreferences);
			mockRepository.update.mockResolvedValue(updatedPreferences);

			// Act
			const result = await service.updateUserPreferences(userId, updateData);

			// Assert
			expect(result?.monitor_coupons).toBe(existingPreferences.monitor_coupons);
		});

		it('should handle repository update errors', async () => {
			// Arrange
			const error = new Error('Database update failed');
			mockRepository.findByUserId.mockResolvedValue(existingPreferences);
			mockRepository.update.mockRejectedValue(error);

			// Act & Assert
			await expect(service.updateUserPreferences(userId, { monitor_preorders: false }))
				.rejects.toThrow('Database update failed');
		});

		it('should validate all boolean preference fields', async () => {
			// Arrange
			mockRepository.findByUserId.mockResolvedValue(existingPreferences);

			const booleanFields = [
				'monitor_preorders',
				'monitor_coupons'
			];

			// Act & Assert
			for (const field of booleanFields) {
				const invalidData = { [field]: 'invalid' };
				await expect(service.updateUserPreferences(userId, invalidData as any))
					.rejects.toThrow(`${field} must be a boolean value`);
			}
		});

		it('should accept true and false for boolean fields', async () => {
			// Arrange
			mockRepository.findByUserId.mockResolvedValue(existingPreferences);

			const testCases = [
				{ monitor_preorders: true, monitor_coupons: false },
				{ monitor_preorders: false, monitor_coupons: true }
			];

			for (const updateData of testCases) {
				const updatedPreferences = { ...existingPreferences, ...updateData };
				
				mockRepository.update.mockResolvedValue(updatedPreferences);

				// Act
				const result = await service.updateUserPreferences(userId, updateData);

				// Assert
				expect(result?.monitor_preorders).toBe(updateData.monitor_preorders);
				expect(result?.monitor_coupons).toBe(updateData.monitor_coupons);
			}
		});
	});
});
