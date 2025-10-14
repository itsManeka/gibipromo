/**
 * Auth Middleware Tests
 * 
 * Tests for JWT authentication middleware.
 * 
 * @group integration
 */

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../src/middleware/auth';
import { AuthService } from '../../src/services/AuthService';

// Mock the AuthService
jest.mock('../../src/services/AuthService');

describe('Auth Middleware', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
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
			validateToken: jest.fn()
		} as any;

		// Mock AuthService constructor
		(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

		// Setup mock request/response
		mockRequest = {
			headers: {}
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		mockNext = jest.fn();
	});

	describe('authMiddleware', () => {
		const mockUser = {
			id: 'user-123',
			email: 'test@example.com',
			enabled: true,
			username: '',
			name: '',
			language: 'en'
		};

		it('should authenticate valid Bearer token', async () => {
			mockRequest.headers = {
				authorization: 'Bearer valid-token'
			};
			mockAuthService.validateToken.mockResolvedValue(mockUser);

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
			expect((mockRequest as any).user).toEqual(mockUser);
			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
		});

		it('should return 401 if no authorization header', async () => {
			mockRequest.headers = {};

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'No authorization header provided'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 if authorization header is empty', async () => {
			mockRequest.headers = {
				authorization: ''
			};

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'No authorization header provided'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 if authorization header does not start with Bearer', async () => {
			mockRequest.headers = {
				authorization: 'Basic invalid-token'
			};

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'Invalid authorization format. Use: Bearer <token>'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 if token is missing after Bearer', async () => {
			mockRequest.headers = {
				authorization: 'Bearer '
			};

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'No token provided'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 for invalid token', async () => {
			mockRequest.headers = {
				authorization: 'Bearer invalid-token'
			};
			mockAuthService.validateToken.mockRejectedValue(new Error('Invalid token'));

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'Invalid token'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 for expired token', async () => {
			mockRequest.headers = {
				authorization: 'Bearer expired-token'
			};
			mockAuthService.validateToken.mockRejectedValue(new Error('Token expired'));

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'Token expired'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 if user not found', async () => {
			mockRequest.headers = {
				authorization: 'Bearer valid-token'
			};
			mockAuthService.validateToken.mockRejectedValue(new Error('User not found'));

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'User not found'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 if user is disabled', async () => {
			mockRequest.headers = {
				authorization: 'Bearer valid-token'
			};
			mockAuthService.validateToken.mockRejectedValue(new Error('User account is disabled'));

			await authMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				error: 'User account is disabled'
			});
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe('optionalAuthMiddleware', () => {
		const mockUser = {
			id: 'user-123',
			email: 'test@example.com',
			enabled: true,
			username: '',
			name: '',
			language: 'en'
		};

		it('should authenticate valid Bearer token', async () => {
			mockRequest.headers = {
				authorization: 'Bearer valid-token'
			};
			mockAuthService.validateToken.mockResolvedValue(mockUser);

			await optionalAuthMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
			expect((mockRequest as any).user).toEqual(mockUser);
			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
		});

		it('should proceed without user if no authorization header', async () => {
			mockRequest.headers = {};

			await optionalAuthMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockAuthService.validateToken).not.toHaveBeenCalled();
			expect((mockRequest as any).user).toBeUndefined();
			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
		});

		it('should proceed without user if authorization header is empty', async () => {
			mockRequest.headers = {
				authorization: ''
			};

			await optionalAuthMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockAuthService.validateToken).not.toHaveBeenCalled();
			expect((mockRequest as any).user).toBeUndefined();
			expect(mockNext).toHaveBeenCalled();
		});

		it('should proceed without user if token is invalid', async () => {
			mockRequest.headers = {
				authorization: 'Bearer invalid-token'
			};
			mockAuthService.validateToken.mockRejectedValue(new Error('Invalid token'));

			await optionalAuthMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalid-token');
			expect((mockRequest as any).user).toBeUndefined();
			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
		});

		it('should proceed without user if token is expired', async () => {
			mockRequest.headers = {
				authorization: 'Bearer expired-token'
			};
			mockAuthService.validateToken.mockRejectedValue(new Error('Token expired'));

			await optionalAuthMiddleware(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockAuthService.validateToken).toHaveBeenCalledWith('expired-token');
			expect((mockRequest as any).user).toBeUndefined();
			expect(mockNext).toHaveBeenCalled();
			expect(mockResponse.status).not.toHaveBeenCalled();
		});
	});
});
