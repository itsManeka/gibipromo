/**
 * Authentication Controller
 * 
 * Handles HTTP requests for user authentication endpoints.
 * 
 * @module controllers/AuthController
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthService, RegisterData, LoginData } from '../services/AuthService';
import { ApiResponse } from '@gibipromo/shared';

/**
 * Authentication Controller
 */
export class AuthController extends BaseController {
	private readonly authService: AuthService;

	constructor() {
		super();
		this.authService = new AuthService();
	}

	/**
	 * POST /auth/register
	 * Register a new user (website only - email and password)
	 */
	register = this.asyncHandler(async (req: Request, res: Response) => {
		const data: RegisterData = req.body;

		// Validação básica
		if (!data.email || !data.password) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Email and password are required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const result = await this.authService.register(data);

			const response: ApiResponse<typeof result> = {
				success: true,
				data: result,
				message: 'User registered successfully'
			};

			this.sendCreated(res, response);
		} catch (error) {
			if (error instanceof Error) {
				// Erros de validação do negócio
				if (error.message.includes('already') ||
					error.message.includes('Invalid') ||
					error.message.includes('required') ||
					error.message.includes('must be')) {
					const response: ApiResponse<null> = {
						success: false,
						error: error.message
					};
					return this.sendBadRequest(res, response);
				}
			}
			throw error;
		}
	});

	/**
	 * POST /auth/login
	 * Login user
	 */
	login = this.asyncHandler(async (req: Request, res: Response) => {
		const data: LoginData = req.body;

		// Validação básica
		if (!data.email || !data.password) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Email and password are required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const result = await this.authService.login(data);

			const response: ApiResponse<typeof result> = {
				success: true,
				data: result,
				message: 'Login successful'
			};

			this.sendSuccess(res, response);
		} catch (error) {
			if (error instanceof Error) {
				// Erros de autenticação
				if (error.message.includes('Invalid credentials') ||
					error.message.includes('disabled') ||
					error.message.includes('password')) {
					const response: ApiResponse<null> = {
						success: false,
						error: error.message
					};
					return this.sendUnauthorized(res, response);
				}
			}
			throw error;
		}
	});

	/**
	 * GET /auth/me
	 * Get current user profile
	 * Requires authentication
	 */
	me = this.asyncHandler(async (req: Request, res: Response) => {
		// O usuário é injetado pelo middleware de autenticação
		const user = (req as any).user;

		if (!user) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User not authenticated'
			};
			return this.sendUnauthorized(res, response);
		}

		const response: ApiResponse<any> = {
			success: true,
			data: {
				id: user.id,
				email: user.email
			}
		};

		this.sendSuccess(res, response);
	});

	/**
	 * POST /auth/validate
	 * Validate JWT token
	 */
	validateToken = this.asyncHandler(async (req: Request, res: Response) => {
		const { token } = req.body;

		if (!token) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Token is required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const user = await this.authService.validateToken(token);

			const response: ApiResponse<any> = {
				success: true,
				data: {
					valid: true,
					user: {
						id: user.id,
						email: user.email
					}
				}
			};

			this.sendSuccess(res, response);
		} catch (error) {
			if (error instanceof Error) {
				const response: ApiResponse<any> = {
					success: false,
					data: {
						valid: false
					},
					error: error.message
				};
				return this.sendUnauthorized(res, response);
			}
			throw error;
		}
	});
}
