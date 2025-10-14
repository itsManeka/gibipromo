/**
 * Authentication Service
 * 
 * Handles user authentication, registration, and token validation.
 * Uses JWT for token generation and bcrypt for password hashing.
 * 
 * @module services/AuthService
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { BaseService } from './BaseService';
import { User, UserFactory, createLogger } from '@gibipromo/shared';
import { createRepository } from '../infrastructure/factories/repositories';

const logger = createLogger('AuthService');

/**
 * JWT payload structure (website only)
 */
export interface JWTPayload {
	userId: string;
	email: string;
}

/**
 * Authentication response (only essential fields for website)
 */
export interface AuthResponse {
	token: string;
	expiresAt: string;
	user: {
		id: string;
		email: string;
		enabled: boolean;
	};
}

/**
 * Registration data (website only - email and password)
 */
export interface RegisterData {
	email: string;
	password: string;
}

/**
 * Login data
 */
export interface LoginData {
	email: string;
	password: string;
}

/**
 * Authentication Service
 */
export class AuthService extends BaseService {
	private readonly userRepository = createRepository('users');
	private readonly jwtSecret: string;
	private readonly jwtExpiresIn: string;
	private readonly saltRounds = 10;

	constructor() {
		super('AuthService');
		this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
		this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

		if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
			logger.warn('⚠️  JWT_SECRET not set in production environment!');
		}
	}

	/**
	 * Generate a unique username from email
	 * Used for web user who dont't have a Telegram username
	 */
	private generateUsernameFromEmail(email: string): string {
		const [localPart] = email.split('@');
		const sanitized = localPart.replace(/[^a-zA-Z0-9]/g, '_');
		const timestamp = Date.now().toString(36); // Base36 pra ser mais curto
		return `web_${sanitized}_${timestamp}`;
	}

	/**
	 * Register a new user (website only)
	 */
	async register(data: RegisterData): Promise<AuthResponse> {
		// Validação
		if (!data.email || !data.password) {
			throw new Error('Email and password are required');
		}

		if (!this.isValidEmail(data.email)) {
			throw new Error('Invalid email format');
		}

		if (data.password.length < 6) {
			throw new Error('Password must be at least 6 characters long');
		}

		// Verifica se o email já existe
		const existingUserByEmail = await this.userRepository.findByEmail(data.email);
		if (existingUserByEmail) {
			throw new Error('Email already registered');
		}

		// Hash da senha
		const passwordHash = await this.hashPassword(data.password);

		// Gerar username único para usuários web
		const username = this.generateUsernameFromEmail(data.email);

		// Cria o usuário usando UserFactory (UUID v4)
		const newUser: User = UserFactory.createWebsiteUser(
			data.email,
			passwordHash,
			username
		);

		const createdUser = await this.userRepository.create(newUser);
		logger.info(`User registered: ${createdUser.email}`);

		// Gera token
		return this.generateAuthResponse(createdUser);
	}

	/**
	 * Login user
	 */
	async login(data: LoginData): Promise<AuthResponse> {
		// Validação
		if (!data.email || !data.password) {
			throw new Error('Email and password are required');
		}

		// Busca usuário por email
		const user = await this.userRepository.findByEmail(data.email);
		if (!user) {
			throw new Error('Invalid credentials');
		}

		// Verifica senha
		if (!user.password_hash) {
			throw new Error('User does not have a password set');
		}

		const isPasswordValid = await this.verifyPassword(data.password, user.password_hash);
		if (!isPasswordValid) {
			throw new Error('Invalid credentials');
		}

		// Verifica se o usuário está ativo
		if (!user.enabled) {
			throw new Error('User account is disabled');
		}

		logger.info(`User logged in: ${user.email}`);

		// Gera token
		return this.generateAuthResponse(user);
	}

	/**
	 * Validate JWT token and return user data
	 */
	async validateToken(token: string): Promise<User> {
		try {
			// Verifica o token
			const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;

			// Busca o usuário
			const user = await this.userRepository.findById(decoded.userId);
			if (!user) {
				throw new Error('User not found');
			}

			// Verifica se o usuário está ativo
			if (!user.enabled) {
				throw new Error('User account is disabled');
			}

			return user;
		} catch (error) {
			// Check TokenExpiredError first (it extends JsonWebTokenError)
			if (error instanceof jwt.TokenExpiredError) {
				throw new Error('Token expired');
			}
			if (error instanceof jwt.JsonWebTokenError) {
				throw new Error('Invalid token');
			}
			throw error;
		}
	}

	/**
	 * Hash password using bcrypt
	 */
	async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, this.saltRounds);
	}

	/**
	 * Verify password against hash
	 */
	async verifyPassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	/**
	 * Generate JWT token for user
	 */
	private generateToken(user: User): { token: string; expiresAt: string } {
		const payload: JWTPayload = {
			userId: user.id,
			email: user.email!
		};

		// @ts-ignore - JWT types issue
		const token = jwt.sign(payload, this.jwtSecret, {
			expiresIn: this.jwtExpiresIn
		});

		// Calcula data de expiração
		const expiresAt = new Date();
		const expirationMatch = this.jwtExpiresIn.match(/^(\d+)([dhms])$/);
		if (expirationMatch) {
			const [, value, unit] = expirationMatch;
			const amount = parseInt(value, 10);
			switch (unit) {
				case 'd':
					expiresAt.setDate(expiresAt.getDate() + amount);
					break;
				case 'h':
					expiresAt.setHours(expiresAt.getHours() + amount);
					break;
				case 'm':
					expiresAt.setMinutes(expiresAt.getMinutes() + amount);
					break;
				case 's':
					expiresAt.setSeconds(expiresAt.getSeconds() + amount);
					break;
			}
		}

		return {
			token,
			expiresAt: expiresAt.toISOString()
		};
	}

	/**
	 * Generate complete authentication response (website only)
	 */
	private generateAuthResponse(user: User): AuthResponse {
		const { token, expiresAt } = this.generateToken(user);

		return {
			token,
			expiresAt,
			user: {
				id: user.id,
				email: user.email!,
				enabled: user.enabled
			}
		};
	}

	/**
	 * Validate email format
	 */
	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}
