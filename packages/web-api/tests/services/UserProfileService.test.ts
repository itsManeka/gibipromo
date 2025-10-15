/**
 * UserProfileService Tests
 *
 * Tests for user profile service business logic
 */

import { UserProfileService } from '../../src/services/UserProfileService';
import { UserProfile, UserProfileRepository } from '@gibipromo/shared';

// Mock do UserProfileRepository
class MockUserProfileRepository implements UserProfileRepository {
	private profiles: UserProfile[] = [];

	constructor(initialProfiles: UserProfile[] = []) {
		this.profiles = initialProfiles;
	}

	async create(entity: UserProfile): Promise<UserProfile> {
		this.profiles.push(entity);
		return entity;
	}

	async findById(id: string): Promise<UserProfile | null> {
		return this.profiles.find(p => p.id === id) || null;
	}

	async update(entity: UserProfile): Promise<UserProfile> {
		const index = this.profiles.findIndex(p => p.id === entity.id);
		if (index !== -1) {
			this.profiles[index] = entity;
		}
		return entity;
	}

	async delete(id: string): Promise<void> {
		this.profiles = this.profiles.filter(p => p.id !== id);
	}

	async findByUserId(userId: string): Promise<UserProfile | null> {
		return this.profiles.find(p => p.user_id === userId) || null;
	}

	// Método auxiliar para testes
	setProfiles(profiles: UserProfile[]): void {
		this.profiles = profiles;
	}
}

// Helper para criar perfis de teste
function createTestUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
	const now = new Date().toISOString();
	return {
		id: `profile-${Date.now()}-${Math.random()}`,
		user_id: 'user-123',
		nick: 'TestUser',
		created_at: now,
		updated_at: now,
		...overrides
	};
}

describe('UserProfileService', () => {
	let service: UserProfileService;
	let mockRepository: MockUserProfileRepository;

	beforeEach(() => {
		mockRepository = new MockUserProfileRepository();
		service = new UserProfileService(mockRepository);
	});

	describe('getUserProfile', () => {
		it('should get user profile by user ID', async () => {
			// Arrange
			const profile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'JohnDoe'
			});
			mockRepository.setProfiles([profile]);

			// Act
			const result = await service.getUserProfile('user-123');

			// Assert
			expect(result).not.toBeNull();
			expect(result?.id).toBe('profile-1');
			expect(result?.user_id).toBe('user-123');
			expect(result?.nick).toBe('JohnDoe');
		});

		it('should return null when profile not found', async () => {
			// Arrange
			mockRepository.setProfiles([]);

			// Act
			const result = await service.getUserProfile('non-existent-user');

			// Assert
			expect(result).toBeNull();
		});

		it('should handle repository errors', async () => {
			// Arrange
			const error = new Error('Database connection failed');
			jest.spyOn(mockRepository, 'findByUserId').mockRejectedValue(error);

			// Act & Assert
			await expect(service.getUserProfile('user-123')).rejects.toThrow('Database connection failed');
		});

		it('should retrieve correct profile when multiple profiles exist', async () => {
			// Arrange
			const profiles = [
				createTestUserProfile({ id: 'profile-1', user_id: 'user-1', nick: 'User1' }),
				createTestUserProfile({ id: 'profile-2', user_id: 'user-2', nick: 'User2' }),
				createTestUserProfile({ id: 'profile-3', user_id: 'user-3', nick: 'User3' })
			];
			mockRepository.setProfiles(profiles);

			// Act
			const result = await service.getUserProfile('user-2');

			// Assert
			expect(result).not.toBeNull();
			expect(result?.id).toBe('profile-2');
			expect(result?.user_id).toBe('user-2');
			expect(result?.nick).toBe('User2');
		});

		it('should handle empty user ID', async () => {
			// Arrange
			mockRepository.setProfiles([createTestUserProfile()]);

			// Act
			const result = await service.getUserProfile('');

			// Assert
			expect(result).toBeNull();
		});

		it('should handle special characters in user ID', async () => {
			// Arrange
			const profile = createTestUserProfile({
				id: 'profile-special',
				user_id: 'user-123-abc@test',
				nick: 'SpecialUser'
			});
			mockRepository.setProfiles([profile]);

			// Act
			const result = await service.getUserProfile('user-123-abc@test');

			// Assert
			expect(result).not.toBeNull();
			expect(result?.user_id).toBe('user-123-abc@test');
		});

		it('should log actions correctly', async () => {
			// Arrange
			const profile = createTestUserProfile();
			mockRepository.setProfiles([profile]);
			const logSpy = jest.spyOn(service as any, 'logAction');

			// Act
			await service.getUserProfile('user-123');

			// Assert
			expect(logSpy).toHaveBeenCalledWith('Getting user profile', { userId: 'user-123' });
			expect(logSpy).toHaveBeenCalledWith('User profile retrieved', {
				userId: 'user-123',
				profileId: profile.id
			});
		});

		it('should log when profile not found', async () => {
			// Arrange
			mockRepository.setProfiles([]);
			const logSpy = jest.spyOn(service as any, 'logAction');

			// Act
			await service.getUserProfile('non-existent');

			// Assert
			expect(logSpy).toHaveBeenCalledWith('Getting user profile', { userId: 'non-existent' });
			expect(logSpy).toHaveBeenCalledWith('User profile not found', { userId: 'non-existent' });
		});

		it('should log errors correctly', async () => {
			// Arrange
			const error = new Error('Test error');
			jest.spyOn(mockRepository, 'findByUserId').mockRejectedValue(error);
			const logErrorSpy = jest.spyOn(service as any, 'logError');

			// Act & Assert
			await expect(service.getUserProfile('user-123')).rejects.toThrow('Test error');
			expect(logErrorSpy).toHaveBeenCalledWith(error, 'getUserProfile');
		});
	});

	describe('updateUserProfile', () => {
		it('should update user profile successfully', async () => {
			// Arrange
			const existingProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'OldNick'
			});
			mockRepository.setProfiles([existingProfile]);

			const updateData = { nick: 'NewNick' };

			// Act
			const result = await service.updateUserProfile('user-123', updateData);

			// Assert
			expect(result).not.toBeNull();
			expect(result?.nick).toBe('NewNick');
			expect(result?.user_id).toBe('user-123');
		});

		it('should return null when profile not found', async () => {
			// Arrange
			mockRepository.setProfiles([]);
			const updateData = { nick: 'NewNick' };

			// Act
			const result = await service.updateUserProfile('non-existent', updateData);

			// Assert
			expect(result).toBeNull();
		});

		it('should throw error when nick is empty', async () => {
			// Arrange
			const updateData = { nick: '' };

			// Act & Assert
			await expect(service.updateUserProfile('user-123', updateData))
				.rejects.toThrow('Nick is required');
		});

		it('should throw error when nick is only whitespace', async () => {
			// Arrange
			const updateData = { nick: '   ' };

			// Act & Assert
			await expect(service.updateUserProfile('user-123', updateData))
				.rejects.toThrow('Nick is required');
		});

		it('should throw error when nick is too short', async () => {
			// Arrange
			const updateData = { nick: 'A' };

			// Act & Assert
			await expect(service.updateUserProfile('user-123', updateData))
				.rejects.toThrow('Nick must be at least 2 characters long');
		});

		it('should throw error when nick is too long', async () => {
			// Arrange
			const updateData = { nick: 'A'.repeat(51) };

			// Act & Assert
			await expect(service.updateUserProfile('user-123', updateData))
				.rejects.toThrow('Nick must be at most 50 characters long');
		});

		it('should trim whitespace from nick', async () => {
			// Arrange
			const existingProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'OldNick'
			});
			mockRepository.setProfiles([existingProfile]);

			const updateData = { nick: '  TrimmedNick  ' };

			// Act
			const result = await service.updateUserProfile('user-123', updateData);

			// Assert
			expect(result?.nick).toBe('TrimmedNick');
		});

		it('should handle special characters in nick', async () => {
			// Arrange
			const existingProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'OldNick'
			});
			mockRepository.setProfiles([existingProfile]);

			const updateData = { nick: 'Usuário Ação' };

			// Act
			const result = await service.updateUserProfile('user-123', updateData);

			// Assert
			expect(result?.nick).toBe('Usuário Ação');
		});

		it('should handle repository errors', async () => {
			// Arrange
			const existingProfile = createTestUserProfile();
			mockRepository.setProfiles([existingProfile]);

			const error = new Error('Database update failed');
			jest.spyOn(mockRepository, 'update').mockRejectedValue(error);

			// Act & Assert
			await expect(service.updateUserProfile('user-123', { nick: 'NewNick' }))
				.rejects.toThrow('Database update failed');
		});

		it('should log actions correctly', async () => {
			// Arrange
			const existingProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'OldNick'
			});
			mockRepository.setProfiles([existingProfile]);

			const updateData = { nick: 'NewNick' };
			const logSpy = jest.spyOn(service as any, 'logAction');

			// Act
			await service.updateUserProfile('user-123', updateData);

			// Assert
			expect(logSpy).toHaveBeenCalledWith('Updating user profile', {
				userId: 'user-123',
				data: updateData
			});
			expect(logSpy).toHaveBeenCalledWith('User profile updated', {
				userId: 'user-123',
				profileId: 'profile-1'
			});
		});

		it('should log when profile not found', async () => {
			// Arrange
			mockRepository.setProfiles([]);
			const logSpy = jest.spyOn(service as any, 'logAction');

			// Act
			await service.updateUserProfile('non-existent', { nick: 'NewNick' });

			// Assert
			expect(logSpy).toHaveBeenCalledWith('Updating user profile', expect.any(Object));
			expect(logSpy).toHaveBeenCalledWith('User profile not found for update', {
				userId: 'non-existent'
			});
		});

		it('should log errors correctly', async () => {
			// Arrange
			const existingProfile = createTestUserProfile();
			mockRepository.setProfiles([existingProfile]);

			const error = new Error('Test error');
			jest.spyOn(mockRepository, 'update').mockRejectedValue(error);
			const logErrorSpy = jest.spyOn(service as any, 'logError');

			// Act & Assert
			await expect(service.updateUserProfile('user-123', { nick: 'NewNick' }))
				.rejects.toThrow('Test error');
			expect(logErrorSpy).toHaveBeenCalledWith(error, 'updateUserProfile');
		});

		it('should preserve profile ID when updating', async () => {
			// Arrange
			const existingProfile = createTestUserProfile({
				id: 'profile-original',
				user_id: 'user-123',
				nick: 'OldNick'
			});
			mockRepository.setProfiles([existingProfile]);

			// Act
			const result = await service.updateUserProfile('user-123', { nick: 'NewNick' });

			// Assert
			expect(result?.id).toBe('profile-original');
		});

		it('should accept nick with exactly 2 characters', async () => {
			// Arrange
			const existingProfile = createTestUserProfile();
			mockRepository.setProfiles([existingProfile]);

			// Act
			const result = await service.updateUserProfile('user-123', { nick: 'AB' });

			// Assert
			expect(result?.nick).toBe('AB');
		});

		it('should accept nick with exactly 50 characters', async () => {
			// Arrange
			const existingProfile = createTestUserProfile();
			mockRepository.setProfiles([existingProfile]);

			const maxNick = 'A'.repeat(50);

			// Act
			const result = await service.updateUserProfile('user-123', { nick: maxNick });

			// Assert
			expect(result?.nick).toBe(maxNick);
			expect(result?.nick.length).toBe(50);
		});
	});
});
