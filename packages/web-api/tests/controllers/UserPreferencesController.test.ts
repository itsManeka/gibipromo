/**
 * UserPreferencesController Tests
 *
 * Tests for user preferences controller endpoints
 */

import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { UserPreferencesController } from '../../src/controllers/UserPreferencesController';
import { UserPreferencesService } from '../../src/services/UserPreferencesService';
import { UserPreferences } from '@gibipromo/shared';

// Mock do UserPreferencesService
jest.mock('../../src/services/UserPreferencesService');
jest.mock('@gibipromo/shared', () => ({
	...jest.requireActual('@gibipromo/shared'),
	DynamoDBUserPreferencesRepository: jest.fn().mockImplementation(() => ({}))
}));

// Helper para criar preferências de teste
function createTestUserPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
	return {
		id: `pref-${Date.now()}`,
		user_id: 'user-123',
		monitor_preorders: true,
		monitor_coupons: true,
		...overrides
	};
}

// Mock middleware de autenticação
const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
	// Simula usuário autenticado
	req.user = { id: 'user-123' };
	next();
};

describe('UserPreferencesController', () => {
	let app: Express;
	let mockUserPreferencesService: jest.Mocked<UserPreferencesService>;

	beforeEach(() => {
		// Criar app Express para testes
		app = express();
		app.use(express.json());

		// Criar controller
		const controller = new UserPreferencesController();

		// Obter mock do service
		mockUserPreferencesService = (controller as any).userPreferencesService as jest.Mocked<UserPreferencesService>;

		// Registrar rotas (com mock do auth middleware)
		app.get('/users/preferences', mockAuthMiddleware, controller.getPreferences);
		app.put('/users/preferences', mockAuthMiddleware, controller.updatePreferences);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /users/preferences', () => {
		it('should return user preferences successfully', async () => {
			// Arrange
			const mockPreferences = createTestUserPreferences({
				id: 'pref-1',
				user_id: 'user-123',
				monitor_preorders: true,
				monitor_coupons: false
			});

			mockUserPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			const response = await request(app).get('/users/preferences');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockPreferences);
			expect(response.body.message).toBe('Preferences retrieved successfully');
			expect(mockUserPreferencesService.getUserPreferences).toHaveBeenCalledWith('user-123');
		});

		it('should return 404 when preferences not found', async () => {
			// Arrange
			mockUserPreferencesService.getUserPreferences.mockResolvedValue(null);

			// Act
			const response = await request(app).get('/users/preferences');

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User preferences not found');
		});

		it('should return 401 when user ID is missing', async () => {
			// Arrange - criar rota sem userId no middleware
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserPreferencesController();
			
			const mockAuthWithoutUserId = (req: Request, res: Response, next: NextFunction) => {
				// Não define req.user
				next();
			};

			testApp.get('/users/preferences', mockAuthWithoutUserId, controller.getPreferences);

			// Act
			const response = await request(testApp).get('/users/preferences');

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User ID not found in request');
		});

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Database connection failed');
			mockUserPreferencesService.getUserPreferences.mockRejectedValue(error);

			// Act
			const response = await request(app).get('/users/preferences');

			// Assert
			expect(response.status).toBe(500);
			expect(mockUserPreferencesService.getUserPreferences).toHaveBeenCalledWith('user-123');
		});

		it('should call service with correct parameters', async () => {
			// Arrange
			const mockPreferences = createTestUserPreferences();
			mockUserPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			await request(app).get('/users/preferences');

			// Assert
			expect(mockUserPreferencesService.getUserPreferences).toHaveBeenCalledTimes(1);
			expect(mockUserPreferencesService.getUserPreferences).toHaveBeenCalledWith('user-123');
		});

		it('should return preferences with all expected fields', async () => {
			// Arrange
			const mockPreferences = createTestUserPreferences({
				id: 'pref-full',
				user_id: 'user-123',
				monitor_preorders: false,
				monitor_coupons: true
			});

			mockUserPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			const response = await request(app).get('/users/preferences');

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data).toHaveProperty('id');
			expect(response.body.data).toHaveProperty('user_id');
			expect(response.body.data).toHaveProperty('monitor_preorders');
			expect(response.body.data).toHaveProperty('monitor_coupons');
		});
	});

	describe('Authentication requirement', () => {
		it('should be protected by authentication middleware', async () => {
			// Arrange - criar app sem middleware de auth
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserPreferencesController();

			// Não usar middleware de auth
			testApp.get('/users/preferences', controller.getPreferences);

			// Act
			const response = await request(testApp).get('/users/preferences');

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});

	describe('PUT /users/preferences', () => {
		it('should update user preferences successfully', async () => {
			// Arrange
			const updateData = { 
				monitor_preorders: false,
				monitor_coupons: false
			};
			const mockPreferences = createTestUserPreferences({
				id: 'pref-1',
				user_id: 'user-123',
				...updateData
			});

			mockUserPreferencesService.updateUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send(updateData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockPreferences);
			expect(response.body.message).toBe('Preferences updated successfully');
			expect(mockUserPreferencesService.updateUserPreferences).toHaveBeenCalledWith('user-123', updateData);
		});

		it('should return 400 when no fields provided', async () => {
			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send({});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('At least one preference field must be provided');
		});

		it('should return 404 when preferences not found', async () => {
			// Arrange
			mockUserPreferencesService.updateUserPreferences.mockResolvedValue(null);

			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send({ monitor_preorders: false });

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User preferences not found');
		});

		it('should return 401 when user ID is missing', async () => {
			// Arrange
			const testApp = express();
			testApp.use(express.json());
			const controller = new UserPreferencesController();
			
			const mockAuthWithoutUserId = (req: Request, res: Response, next: NextFunction) => {
				// Não define req.user
				next();
			};

			testApp.put('/users/preferences', mockAuthWithoutUserId, controller.updatePreferences);

			// Act
			const response = await request(testApp)
				.put('/users/preferences')
				.send({ monitor_preorders: false });

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('User ID not found in request');
		});

		it('should return 400 for validation errors from service', async () => {
			// Arrange
			const error = new Error('monitor_preorders must be a boolean value');
			mockUserPreferencesService.updateUserPreferences.mockRejectedValue(error);

			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send({ monitor_preorders: 'invalid' });

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('monitor_preorders must be a boolean value');
		});

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Database connection failed');
			mockUserPreferencesService.updateUserPreferences.mockRejectedValue(error);

			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send({ monitor_preorders: false });

			// Assert
			expect(response.status).toBe(500);
		});

		it('should update only monitor_preorders', async () => {
			// Arrange
			const updateData = { monitor_preorders: false };
			const mockPreferences = createTestUserPreferences({
				...updateData
			});

			mockUserPreferencesService.updateUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send(updateData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data.monitor_preorders).toBe(false);
		});

		it('should update only monitor_coupons', async () => {
			// Arrange
			const updateData = { monitor_coupons: false };
			const mockPreferences = createTestUserPreferences({
				...updateData
			});

			mockUserPreferencesService.updateUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			const response = await request(app)
				.put('/users/preferences')
				.send(updateData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.data.monitor_coupons).toBe(false);
		});

		it('should call service with correct parameters', async () => {
			// Arrange
			const updateData = { 
				monitor_preorders: true,
				monitor_coupons: false
			};
			const mockPreferences = createTestUserPreferences(updateData);
			mockUserPreferencesService.updateUserPreferences.mockResolvedValue(mockPreferences);

			// Act
			await request(app)
				.put('/users/preferences')
				.send(updateData);

			// Assert
			expect(mockUserPreferencesService.updateUserPreferences).toHaveBeenCalledTimes(1);
			expect(mockUserPreferencesService.updateUserPreferences).toHaveBeenCalledWith('user-123', updateData);
		});
	});
});
