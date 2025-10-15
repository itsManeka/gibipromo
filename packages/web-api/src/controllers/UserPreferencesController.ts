/**
 * UserPreferences Controller
 *
 * Handles HTTP requests for user preferences endpoints.
 *
 * @module controllers/UserPreferencesController
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserPreferencesService, UpdatePreferencesData } from '../services/UserPreferencesService';
import { ApiResponse } from '@gibipromo/shared';
import { DynamoDBUserPreferencesRepository } from '@gibipromo/shared';

/**
 * UserPreferences Controller
 * Provides REST endpoints for user preferences management
 */
export class UserPreferencesController extends BaseController {
	private readonly userPreferencesService: UserPreferencesService;

	constructor() {
		super();
		const userPreferencesRepository = new DynamoDBUserPreferencesRepository();
		this.userPreferencesService = new UserPreferencesService(userPreferencesRepository);
	}

	/**
	 * GET /users/preferences
	 * Get current user's preferences
	 * Requires authentication middleware
	 */
	getPreferences = this.asyncHandler(async (req: Request, res: Response) => {
		// O userId vem do middleware de autenticação (req.user.id)
		const userId = (req as any).user?.id;

		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User ID not found in request'
			};
			return this.sendUnauthorized(res, response);
		}

		try {
			const preferences = await this.userPreferencesService.getUserPreferences(userId);

			if (!preferences) {
				const response: ApiResponse<null> = {
					success: false,
					error: 'User preferences not found'
				};
				return this.sendNotFound(res, response);
			}

			const response: ApiResponse<typeof preferences> = {
				success: true,
				data: preferences,
				message: 'Preferences retrieved successfully'
			};

			this.sendSuccess(res, response);
		} catch (error) {
			throw error;
		}
	});

	/**
	 * PUT /users/preferences
	 * Update current user's preferences
	 * Requires authentication middleware
	 */
	updatePreferences = this.asyncHandler(async (req: Request, res: Response) => {
		// O userId vem do middleware de autenticação (req.user.id)
		const userId = (req as any).user?.id;

		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User ID not found in request'
			};
			return this.sendUnauthorized(res, response);
		}

		const data: UpdatePreferencesData = req.body;

		// Validação básica - pelo menos um campo deve ser fornecido
		if (Object.keys(data).length === 0) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'At least one preference field must be provided'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const preferences = await this.userPreferencesService.updateUserPreferences(userId, data);

			if (!preferences) {
				const response: ApiResponse<null> = {
					success: false,
					error: 'User preferences not found'
				};
				return this.sendNotFound(res, response);
			}

			const response: ApiResponse<typeof preferences> = {
				success: true,
				data: preferences,
				message: 'Preferences updated successfully'
			};

			this.sendSuccess(res, response);
		} catch (error) {
			// Erros de validação do service
			if (error instanceof Error &&
				(error.message.includes('must be') ||
					error.message.includes('between'))) {
				const response: ApiResponse<null> = {
					success: false,
					error: error.message
				};
				return this.sendBadRequest(res, response);
			}
			throw error;
		}
	});
}
