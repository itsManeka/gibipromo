/**
 * AuthController Tests
 * 
 * Integration tests for authentication controller endpoints.
 * 
 * @group integration
 */

import request from 'supertest';
import express, { Application } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { AuthService } from '../../src/services/AuthService';
import { authMiddleware } from '../../src/middleware/auth';

// Mock the AuthService
jest.mock('../../src/services/AuthService');

// Mock the auth middleware
jest.mock('../../src/middleware/auth');

describe('AuthController', () => {
	let app: Application;
	let authController: AuthController;
	let mockAuthService: jest.Mocked<AuthService>;

	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret-key';
		process.env.JWT_EXPIRES_IN = '1h';
	});

	afterAll(() => {
		delete process.env.JWT_SECRET;
		delete process.env.JWT_EXPIRES_IN;
	});

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Create mock auth service
		mockAuthService = {
			register: jest.fn(),
			login: jest.fn(),
			validateToken: jest.fn(),
			hashPassword: jest.fn(),
			verifyPassword: jest.fn()
		} as any;

		// Mock AuthService constructor
		(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

		// Create controller instance
		authController = new AuthController();

		// Create Express app for testing
		app = express();
		app.use(express.json());

		// Setup routes
		app.post('/auth/register', authController.register);
		app.post('/auth/login', authController.login);
		app.post('/auth/validate', authController.validateToken);

		// Mock authMiddleware to add user to request (website user)
		(authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
			req.user = {
				id: 'user-123',
				email: 'test@example.com',
				username: '',
				name: '',
				language: 'en',
				enabled: true
			};
			next();
		});

		app.get('/auth/me', authMiddleware, authController.me);
	});

	describe('POST /auth/register', () => {
		const validRegisterData = {
			email: 'test@example.com',
			password: 'password123'
		};

		const mockAuthResponse = {
			token: 'jwt-token-here',
			expiresAt: new Date(Date.now() + 3600000).toISOString(),
			user: {
				id: 'user-123',
				email: 'test@example.com',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}
		};
		it('should register a new user successfully', async () => {
			mockAuthService.register.mockResolvedValue(mockAuthResponse);

			const response = await request(app)
				.post('/auth/register')
				.send(validRegisterData)
				.expect(201);

			expect(response.body).toEqual({
				success: true,
				data: mockAuthResponse,
				message: 'User registered successfully'
			});
			expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterData);
		});

		it('should return 400 for validation errors', async () => {
			mockAuthService.register.mockRejectedValue(new Error('Email already registered'));

			const response = await request(app)
				.post('/auth/register')
				.send(validRegisterData)
				.expect(400);

			expect(response.body).toEqual({
				success: false,
				error: 'Email already registered'
			});
		});

		it('should return 400 for missing email', async () => {
			mockAuthService.register.mockRejectedValue(new Error('Email and password are required'));

			const response = await request(app)
				.post('/auth/register')
				.send({ ...validRegisterData, email: '' })
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('required');
		});

		it('should return 400 for invalid email format', async () => {
			mockAuthService.register.mockRejectedValue(new Error('Invalid email format'));

			const response = await request(app)
				.post('/auth/register')
				.send({ ...validRegisterData, email: 'invalid-email' })
				.expect(400);

			expect(response.body).toEqual({
				success: false,
				error: 'Invalid email format'
			});
		});

		it('should return 400 for weak password', async () => {
			mockAuthService.register.mockRejectedValue(new Error('Password must be at least 6 characters long'));

			const response = await request(app)
				.post('/auth/register')
				.send({ ...validRegisterData, password: '123' })
				.expect(400);

			expect(response.body).toEqual({
				success: false,
				error: 'Password must be at least 6 characters long'
			});
		});

		it('should return 500 for server errors', async () => {
			mockAuthService.register.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(app)
				.post('/auth/register')
				.send(validRegisterData)
				.expect(500);

			expect(response.body).toEqual({
				success: false,
				data: null,
				error: 'Internal server error'
			});
		});
	});

	describe('POST /auth/login', () => {
		const validLoginData = {
			email: 'test@example.com',
			password: 'password123'
		};

		const mockAuthResponse = {
			token: 'jwt-token-here',
			expiresAt: new Date(Date.now() + 3600000).toISOString(),
			user: {
				id: 'user-123',
				email: 'test@example.com',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}
		};
		it('should login user successfully', async () => {
			mockAuthService.login.mockResolvedValue(mockAuthResponse);

			const response = await request(app)
				.post('/auth/login')
				.send(validLoginData)
				.expect(200);

			expect(response.body).toEqual({
				success: true,
				data: mockAuthResponse,
				message: 'Login successful'
			});
			expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
		});

		it('should return 401 for invalid credentials', async () => {
			mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

			const response = await request(app)
				.post('/auth/login')
				.send(validLoginData)
				.expect(401);

			expect(response.body).toEqual({
				success: false,
				error: 'Invalid credentials'
			});
		});

		it('should return 401 for disabled account', async () => {
			mockAuthService.login.mockRejectedValue(new Error('User account is disabled'));

			const response = await request(app)
				.post('/auth/login')
				.send(validLoginData)
				.expect(401);

			expect(response.body).toEqual({
				success: false,
				error: 'User account is disabled'
			});
		});

		it('should return 400 for missing email', async () => {
			mockAuthService.login.mockRejectedValue(new Error('Email and password are required'));

			const response = await request(app)
				.post('/auth/login')
				.send({ password: 'password123' })
				.expect(400);

			expect(response.body).toEqual({
				success: false,
				error: 'Email and password are required'
			});
		});

		it('should return 400 for missing password', async () => {
			mockAuthService.login.mockRejectedValue(new Error('Email and password are required'));

			const response = await request(app)
				.post('/auth/login')
				.send({ email: 'test@example.com' })
				.expect(400);

			expect(response.body).toEqual({
				success: false,
				error: 'Email and password are required'
			});
		});
	});

	describe('GET /auth/me', () => {
		const mockUser = {
			id: 'user-123',
			email: 'test@example.com'
		};

		it('should return current user data', async () => {
			const response = await request(app)
				.get('/auth/me')
				.expect(200);

			expect(response.body).toEqual({
				success: true,
				data: mockUser
			});
		});

		it('should return 401 if not authenticated', async () => {
			// Mock middleware to simulate no auth
			(authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
				res.status(401).json({ success: false, error: 'Unauthorized' });
			});

			// Recreate route with new middleware behavior
			const testApp = express();
			testApp.use(express.json());
			testApp.get('/auth/me', authMiddleware, authController.me);

			const response = await request(testApp)
				.get('/auth/me')
				.expect(401);

			expect(response.body).toEqual({
				success: false,
				error: 'Unauthorized'
			});
		});
	});

	describe('POST /auth/validate', () => {
		const mockUser = {
			id: 'user-123',
			email: 'test@example.com',
			username: '',
			name: '',
			language: 'en',
			enabled: true,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		
		it('should validate token successfully', async () => {
			mockAuthService.validateToken.mockResolvedValue(mockUser);

			const response = await request(app)
				.post('/auth/validate')
				.send({ token: 'valid-jwt-token' })
				.expect(200);

			expect(response.body).toEqual({
				success: true,
				data: {
					valid: true,
					user: {
						id: mockUser.id,
						email: mockUser.email
					}
				}
			});
			expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-jwt-token');
		});

		it('should return 401 for invalid token', async () => {
			mockAuthService.validateToken.mockRejectedValue(new Error('Invalid token'));

			const response = await request(app)
				.post('/auth/validate')
				.send({ token: 'invalid-token' })
				.expect(401);

			expect(response.body).toEqual({
				success: false,
				data: { valid: false },
				error: 'Invalid token'
			});
		});

		it('should return 401 for expired token', async () => {
			mockAuthService.validateToken.mockRejectedValue(new Error('Token expired'));

			const response = await request(app)
				.post('/auth/validate')
				.send({ token: 'expired-token' })
				.expect(401);

			expect(response.body).toEqual({
				success: false,
				data: { valid: false },
				error: 'Token expired'
			});
		});

		it('should return 400 for missing token', async () => {
			mockAuthService.validateToken.mockRejectedValue(new Error('Token is required'));

			const response = await request(app)
				.post('/auth/validate')
				.send({})
				.expect(400);

			expect(response.body.success).toBe(false);
		});
	});
});
