/**
 * AuthService Tests
 * 
 * Tests for authentication service including registration, login, and token validation.
 * 
 * @group unit
 */

import { AuthService } from '../../src/services/AuthService';
import { createRepository } from '../../src/infrastructure/factories/repositories';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the repository
jest.mock('../../src/infrastructure/factories/repositories');

describe('AuthService', () => {
	let authService: AuthService;
	let mockUserRepository: any;
	let mockUserPreferencesRepository: any;
	let mockUserProfileRepository: any;
	const JWT_SECRET = 'test-secret-key';

	beforeAll(() => {
		// Set JWT secret before any test runs
		process.env.JWT_SECRET = JWT_SECRET;
		process.env.JWT_EXPIRES_IN = '1h';
	});

	afterAll(() => {
		delete process.env.JWT_SECRET;
		delete process.env.JWT_EXPIRES_IN;
	});

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Create mock repository
		mockUserRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findByEmail: jest.fn(),
			findByUsername: jest.fn(),
			findByTelegramId: jest.fn(),
			setEnabled: jest.fn(),
			updateSessionId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		};

		mockUserPreferencesRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		};

		mockUserProfileRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		};

		// Mock createRepository to return our mocks based on repository type
		(createRepository as jest.Mock).mockImplementation((type: string) => {
			if (type === 'users') return mockUserRepository;
			if (type === 'userPreferences') return mockUserPreferencesRepository;
			if (type === 'userProfile') return mockUserProfileRepository;
			return mockUserRepository; // default
		});

		// Create service instance
		authService = new AuthService();
	});

	describe('register', () => {
		const validRegisterData = {
			email: 'test@example.com',
			password: 'password123'
		};

		it('should register a new user successfully', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);
			const mockUser = { id: 'user-uuid-123', email: validRegisterData.email, username: 'web_test_abc123', enabled: true };
			mockUserRepository.create.mockResolvedValue(mockUser);
			mockUserPreferencesRepository.create.mockImplementation((prefs: any) => Promise.resolve(prefs));
			mockUserProfileRepository.create.mockImplementation((profile: any) => Promise.resolve(profile));

			const result = await authService.register(validRegisterData);

			expect(result).toHaveProperty('token');
			expect(result).toHaveProperty('expiresAt');
			expect(result).toHaveProperty('user');
			expect(result.user.email).toBe(validRegisterData.email);
			expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
			expect(mockUserPreferencesRepository.create).toHaveBeenCalledTimes(1);
			expect(mockUserProfileRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should hash password before storing', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);
			mockUserRepository.findByUsername.mockResolvedValue(null);
			mockUserRepository.create.mockImplementation((user: any) => Promise.resolve(user));

			await authService.register(validRegisterData);

			const createCall = mockUserRepository.create.mock.calls[0][0];
			expect(createCall.password_hash).toBeDefined();
			expect(createCall.password_hash).not.toBe(validRegisterData.password);
			
			// Verify it's a valid bcrypt hash
			const isValidHash = await bcrypt.compare(validRegisterData.password, createCall.password_hash);
			expect(isValidHash).toBe(true);
		});

		it('should throw error if email already exists', async () => {
			mockUserRepository.findByEmail.mockResolvedValue({ id: '1', email: validRegisterData.email });

			await expect(authService.register(validRegisterData))
				.rejects.toThrow('Email already registered');
		});

		it('should throw error if email is missing', async () => {
			await expect(authService.register({ ...validRegisterData, email: '' }))
				.rejects.toThrow('Email and password are required');
		});

		it('should throw error if password is too short', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);

			await expect(authService.register({ ...validRegisterData, password: '12345' }))
				.rejects.toThrow('Password must be at least 6 characters long');
		});

		it('should throw error for invalid email format', async () => {
			await expect(authService.register({ ...validRegisterData, email: 'invalid-email' }))
				.rejects.toThrow('Invalid email format');
		});

		it('should set enabled to true for new users', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);
			mockUserRepository.create.mockImplementation((user: any) => Promise.resolve(user));
			mockUserPreferencesRepository.create.mockImplementation((prefs: any) => Promise.resolve(prefs));
			mockUserProfileRepository.create.mockImplementation((profile: any) => Promise.resolve(profile));

			await authService.register(validRegisterData);

			const createCall = mockUserRepository.create.mock.calls[0][0];
			expect(createCall.enabled).toBe(true);
		});

		it('should create user preferences with default values', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);
			const mockUser = { id: 'user-uuid-123', email: validRegisterData.email, enabled: true };
			mockUserRepository.create.mockResolvedValue(mockUser);
			mockUserPreferencesRepository.create.mockImplementation((prefs: any) => Promise.resolve(prefs));
			mockUserProfileRepository.create.mockImplementation((profile: any) => Promise.resolve(profile));

			await authService.register(validRegisterData);

			expect(mockUserPreferencesRepository.create).toHaveBeenCalledWith(expect.objectContaining({
				user_id: 'user-uuid-123',
				monitor_preorders: true,
				monitor_coupons: true
			}));
		});

		it('should create user profile with username as nick', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);
			const mockUser = { id: 'user-uuid-123', email: validRegisterData.email, username: 'web_test_abc123', enabled: true };
			mockUserRepository.create.mockResolvedValue(mockUser);
			mockUserPreferencesRepository.create.mockImplementation((prefs: any) => Promise.resolve(prefs));
			mockUserProfileRepository.create.mockImplementation((profile: any) => Promise.resolve(profile));

			await authService.register(validRegisterData);

			expect(mockUserProfileRepository.create).toHaveBeenCalledWith(expect.objectContaining({
				user_id: 'user-uuid-123'
			}));
			
			// Verify that nick was set (it will be the generated username)
			const profileCall = mockUserProfileRepository.create.mock.calls[0][0];
			expect(profileCall.nick).toBeDefined();
			expect(profileCall.nick).toContain('web_');
		});
	});

	describe('login', () => {
		const validLoginData = {
			email: 'test@example.com',
			password: 'password123'
		};

		const mockUser = {
			id: 'user-123',
			email: 'test@example.com',
			username: 'testuser',
			name: 'Test User',
			language: 'en',
			enabled: true,
			password_hash: '' // Will be set in tests
		};

		it('should login user successfully with valid credentials', async () => {
			const hashedPassword = await bcrypt.hash(validLoginData.password, 10);
			mockUserRepository.findByEmail.mockResolvedValue({
				...mockUser,
				password_hash: hashedPassword
			});

			const result = await authService.login(validLoginData);

			expect(result).toHaveProperty('token');
			expect(result).toHaveProperty('expiresAt');
			expect(result).toHaveProperty('user');
			expect(result.user.email).toBe(validLoginData.email);
		});

		it('should throw error if user not found', async () => {
			mockUserRepository.findByEmail.mockResolvedValue(null);

			await expect(authService.login(validLoginData))
				.rejects.toThrow('Invalid credentials');
		});

		it('should throw error if password is incorrect', async () => {
			const hashedPassword = await bcrypt.hash('different-password', 10);
			mockUserRepository.findByEmail.mockResolvedValue({
				...mockUser,
				password_hash: hashedPassword
			});

			await expect(authService.login(validLoginData))
				.rejects.toThrow('Invalid credentials');
		});

		it('should throw error if user account is disabled', async () => {
			const hashedPassword = await bcrypt.hash(validLoginData.password, 10);
			mockUserRepository.findByEmail.mockResolvedValue({
				...mockUser,
				password_hash: hashedPassword,
				enabled: false
			});

			await expect(authService.login(validLoginData))
				.rejects.toThrow('User account is disabled');
		});

		it('should throw error if email is missing', async () => {
			await expect(authService.login({ email: '', password: 'test' }))
				.rejects.toThrow('Email and password are required');
		});

		it('should throw error if password is missing', async () => {
			await expect(authService.login({ email: 'test@example.com', password: '' }))
				.rejects.toThrow('Email and password are required');
		});
	});

	describe('validateToken', () => {
		const mockUser = {
			id: 'user-123',
			email: 'test@example.com',
			enabled: true
		};

		it('should validate valid token successfully', async () => {
			const token = jwt.sign(
				{ userId: mockUser.id, email: mockUser.email },
				JWT_SECRET,
				{ expiresIn: '1h' }
			);

			mockUserRepository.findById.mockResolvedValue(mockUser);

			const result = await authService.validateToken(token);

			expect(result).toEqual(mockUser);
			expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
		});

		it('should throw error for invalid token', async () => {
			const invalidToken = 'invalid.token.here';

			await expect(authService.validateToken(invalidToken))
				.rejects.toThrow('Invalid token');
		});

		it('should throw error for expired token', async () => {
			const expiredToken = jwt.sign(
				{ userId: mockUser.id, email: mockUser.email },
				JWT_SECRET,
				{ expiresIn: '-1h' } // Expired
			);

			await expect(authService.validateToken(expiredToken))
				.rejects.toThrow('Token expired');
		});

		it('should throw error if user not found', async () => {
			const token = jwt.sign(
				{ userId: 'nonexistent', email: mockUser.email },
				JWT_SECRET,
				{ expiresIn: '1h' }
			);

			mockUserRepository.findById.mockResolvedValue(null);

			await expect(authService.validateToken(token))
				.rejects.toThrow('User not found');
		});

		it('should throw error if user is disabled', async () => {
			const token = jwt.sign(
				{ userId: mockUser.id, email: mockUser.email },
				JWT_SECRET,
				{ expiresIn: '1h' }
			);

			mockUserRepository.findById.mockResolvedValue({
				...mockUser,
				enabled: false
			});

			await expect(authService.validateToken(token))
				.rejects.toThrow('User account is disabled');
		});
	});

	describe('hashPassword', () => {
		it('should hash password successfully', async () => {
			const password = 'mypassword123';
			const hash = await authService.hashPassword(password);

			expect(hash).toBeDefined();
			expect(hash).not.toBe(password);
			expect(hash.length).toBeGreaterThan(50);
		});

		it('should create different hashes for same password', async () => {
			const password = 'mypassword123';
			const hash1 = await authService.hashPassword(password);
			const hash2 = await authService.hashPassword(password);

			expect(hash1).not.toBe(hash2);
		});
	});

	describe('verifyPassword', () => {
		it('should verify correct password', async () => {
			const password = 'mypassword123';
			const hash = await bcrypt.hash(password, 10);

			const isValid = await authService.verifyPassword(password, hash);

			expect(isValid).toBe(true);
		});

		it('should reject incorrect password', async () => {
			const password = 'mypassword123';
			const wrongPassword = 'wrongpassword';
			const hash = await bcrypt.hash(password, 10);

			const isValid = await authService.verifyPassword(wrongPassword, hash);

			expect(isValid).toBe(false);
		});
	});
});
