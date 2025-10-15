/**
 * UserProfileController Tests
 *
 * Tests for user profile controller endpoints
 */

import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { UserProfileController } from '../../src/controllers/UserProfileController';
import { UserProfileService } from '../../src/services/UserProfileService';
import { UserProfile } from '@gibipromo/shared';

// Mock do UserProfileService
jest.mock('../../src/services/UserProfileService');
jest.mock('@gibipromo/shared', () => ({
	...jest.requireActual('@gibipromo/shared'),
	DynamoDBUserProfileRepository: jest.fn().mockImplementation(() => ({}))
}));

// Helper para criar perfis de teste
function createTestUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
	const now = new Date().toISOString();
	return {
		id: `profile-${Date.now()}`,
		user_id: 'user-123',
		nick: 'TestUser',
		created_at: now,
		updated_at: now,
		...overrides
	};
}

// Mock middleware de autenticação
const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
	// Simula usuário autenticado
	req.user = { id: 'user-123' };
	next();
};

describe('UserProfileController', () => {
	let app: Express;
	let mockUserProfileService: jest.Mocked<UserProfileService>;

	beforeEach(() => {
		// Criar app Express para testes
		app = express();
		app.use(express.json());

		// Criar controller
		const controller = new UserProfileController();

		// Obter mock do service
		mockUserProfileService = (controller as any).userProfileService as jest.Mocked<UserProfileService>;

		// Registrar rotas (com mock do auth middleware)
		app.get('/users/profile', mockAuthMiddleware, controller.getProfile);
		app.put('/users/profile', mockAuthMiddleware, controller.updateProfile);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /users/profile', () => {
		it('should return user profile successfully', async () => {
			// Arrange
			const mockProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'JohnDoe'
			});

			mockUserProfileService.getUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(app).get('/users/profile');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockProfile);
			expect(response.body.message).toBe('Profile retrieved successfully');
			expect(mockUserProfileService.getUserProfile).toHaveBeenCalledWith('user-123');
		});

		it('should return 404 when profile not found', async () => {
			// Arrange
			mockUserProfileService.getUserProfile.mockResolvedValue(null);

			// Act
			const response = await request(app).get('/users/profile');

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User profile not found');
		});

		it('should return 401 when user ID is missing', async () => {
			// Arrange - criar rota sem userId no middleware
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserProfileController();
			
			const mockAuthWithoutUserId = (req: Request, res: Response, next: NextFunction) => {
				// Não define req.user
				next();
			};

			testApp.get('/users/profile', mockAuthWithoutUserId, controller.getProfile);

			// Act
			const response = await request(testApp).get('/users/profile');

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User ID not found in request');
		});

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Database connection failed');
			mockUserProfileService.getUserProfile.mockRejectedValue(error);

			// Act
			const response = await request(app).get('/users/profile');

			// Assert
			expect(response.status).toBe(500);
			expect(mockUserProfileService.getUserProfile).toHaveBeenCalledWith('user-123');
		});

		it('should retrieve profile for different authenticated users', async () => {
			// Arrange
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserProfileController();
			const mockService = (controller as any).userProfileService as jest.Mocked<UserProfileService>;

			const mockAuthUser2 = (req: Request, res: Response, next: NextFunction) => {
				req.user = { id: 'user-456' };
				next();
			};

			testApp.get('/users/profile', mockAuthUser2, controller.getProfile);

			const mockProfile = createTestUserProfile({
				id: 'profile-2',
				user_id: 'user-456',
				nick: 'JaneDoe'
			});

			mockService.getUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(testApp).get('/users/profile');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.user_id).toBe('user-456');
			expect(mockService.getUserProfile).toHaveBeenCalledWith('user-456');
		});

		it('should handle special characters in nick', async () => {
			// Arrange
			const mockProfile = createTestUserProfile({
				id: 'profile-special',
				user_id: 'user-123',
				nick: 'Usuário Ação'
			});

			mockUserProfileService.getUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(app).get('/users/profile');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.nick).toBe('Usuário Ação');
		});

		it('should call service with correct parameters', async () => {
			// Arrange
			const mockProfile = createTestUserProfile();
			mockUserProfileService.getUserProfile.mockResolvedValue(mockProfile);

			// Act
			await request(app).get('/users/profile');

			// Assert
			expect(mockUserProfileService.getUserProfile).toHaveBeenCalledTimes(1);
			expect(mockUserProfileService.getUserProfile).toHaveBeenCalledWith('user-123');
		});

		it('should return profile with all expected fields', async () => {
			// Arrange
			const mockProfile = createTestUserProfile({
				id: 'profile-full',
				user_id: 'user-123',
				nick: 'FullUser'
			});

			mockUserProfileService.getUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(app).get('/users/profile');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data).toHaveProperty('id');
			expect(response.body.data).toHaveProperty('user_id');
			expect(response.body.data).toHaveProperty('nick');
			expect(response.body.data).toHaveProperty('created_at');
			expect(response.body.data).toHaveProperty('updated_at');
		});
	});

	describe('Authentication requirement', () => {
		it('should be protected by authentication middleware', async () => {
			// Arrange - criar app sem middleware de auth
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserProfileController();

			// Não usar middleware de auth
			testApp.get('/users/profile', controller.getProfile);

			// Act
			const response = await request(testApp).get('/users/profile');

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	describe('PUT /users/profile', () => {
		it('should update user profile successfully', async () => {
			// Arrange
			const updateData = { nick: 'UpdatedNick' };
			const mockProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'UpdatedNick'
			});

			mockUserProfileService.updateUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(app)
				.put('/users/profile')
				.send(updateData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.nick).toBe('UpdatedNick');
			expect(response.body.message).toBe('Profile updated successfully');
			expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('user-123', updateData);
		});

		it('should return 400 when nick is missing', async () => {
			// Act
			const response = await request(app)
				.put('/users/profile')
				.send({});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Nick is required');
		});

		it('should return 400 when nick is empty string', async () => {
			// Act
			const response = await request(app)
				.put('/users/profile')
				.send({ nick: '' });

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Nick is required');
		});

		it('should return 404 when profile not found', async () => {
			// Arrange
			mockUserProfileService.updateUserProfile.mockResolvedValue(null);

			// Act
			const response = await request(app)
				.put('/users/profile')
				.send({ nick: 'NewNick' });

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User profile not found');
		});

		it('should return 401 when user ID is missing', async () => {
			// Arrange
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserProfileController();
			
			const mockAuthWithoutUserId = (req: Request, res: Response, next: NextFunction) => {
				// Não define req.user
				next();
			};

			testApp.put('/users/profile', mockAuthWithoutUserId, controller.updateProfile);

			// Act
			const response = await request(testApp)
				.put('/users/profile')
				.send({ nick: 'NewNick' });

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User ID not found in request');
		});

		it('should return 400 for validation errors from service', async () => {
			// Arrange
			const error = new Error('Nick must be at least 2 characters long');
			mockUserProfileService.updateUserProfile.mockRejectedValue(error);

			// Act
			const response = await request(app)
				.put('/users/profile')
				.send({ nick: 'A' });

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Nick must be at least 2 characters long');
		});

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Database connection failed');
			mockUserProfileService.updateUserProfile.mockRejectedValue(error);

			// Act
			const response = await request(app)
				.put('/users/profile')
				.send({ nick: 'NewNick' });

			// Assert
			expect(response.status).toBe(500);
		});

		it('should handle special characters in nick', async () => {
			// Arrange
			const updateData = { nick: 'Usuário Ação' };
			const mockProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'Usuário Ação'
			});

			mockUserProfileService.updateUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(app)
				.put('/users/profile')
				.send(updateData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data.nick).toBe('Usuário Ação');
		});

		it('should trim whitespace from nick', async () => {
			// Arrange
			const updateData = { nick: '  TrimmedNick  ' };
			const mockProfile = createTestUserProfile({
				id: 'profile-1',
				user_id: 'user-123',
				nick: 'TrimmedNick'
			});

			mockUserProfileService.updateUserProfile.mockResolvedValue(mockProfile);

			// Act
			const response = await request(app)
				.put('/users/profile')
				.send(updateData);

			// Assert
			expect(response.status).toBe(200);
			expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('user-123', updateData);
		});

		it('should call service with correct parameters', async () => {
			// Arrange
			const updateData = { nick: 'NewNick' };
			const mockProfile = createTestUserProfile();
			mockUserProfileService.updateUserProfile.mockResolvedValue(mockProfile);

			// Act
			await request(app)
				.put('/users/profile')
				.send(updateData);

			// Assert
			expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledTimes(1);
			expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('user-123', updateData);
		});
	});
});
