/**
 * UserProfile Controller
 *
 * Handles HTTP requests for user profile endpoints.
 *
 * @module controllers/UserProfileController
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserProfileService, UpdateProfileData } from '../services/UserProfileService';
import { ApiResponse } from '@gibipromo/shared';
import { DynamoDBUserProfileRepository } from '@gibipromo/shared';

/**
 * UserProfile Controller
 * Provides REST endpoints for user profile retrieval
 */
export class UserProfileController extends BaseController {
	private readonly userProfileService: UserProfileService;

	constructor() {
		super();
		const userProfileRepository = new DynamoDBUserProfileRepository();
		this.userProfileService = new UserProfileService(userProfileRepository);
	}

	/**
	 * GET /users/profile
	 * Get current user's profile
	 * Requires authentication middleware
	 */
	getProfile = this.asyncHandler(async (req: Request, res: Response) => {
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
			const profile = await this.userProfileService.getUserProfile(userId);

			if (!profile) {
				const response: ApiResponse<null> = {
					success: false,
					error: 'User profile not found'
				};
				return this.sendNotFound(res, response);
			}

			const response: ApiResponse<typeof profile> = {
				success: true,
				data: profile,
				message: 'Profile retrieved successfully'
			};

			this.sendSuccess(res, response);
		} catch (error) {
			throw error;
		}
	});

	/**
	 * PUT /users/profile
	 * Update current user's profile
	 * Requires authentication middleware
	 */
	updateProfile = this.asyncHandler(async (req: Request, res: Response) => {
		// O userId vem do middleware de autenticação (req.user.id)
		const userId = (req as any).user?.id;

		if (!userId) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'User ID not found in request'
			};
			return this.sendUnauthorized(res, response);
		}

		const data: UpdateProfileData = req.body;

		// Validação básica
		if (!data.nick) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Nick is required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const profile = await this.userProfileService.updateUserProfile(userId, data);

			if (!profile) {
				const response: ApiResponse<null> = {
					success: false,
					error: 'User profile not found'
				};
				return this.sendNotFound(res, response);
			}

			const response: ApiResponse<typeof profile> = {
				success: true,
				data: profile,
				message: 'Profile updated successfully'
			};

			this.sendSuccess(res, response);
		} catch (error) {
			// Erros de validação do service
			if (error instanceof Error && 
				(error.message.includes('required') ||
				 error.message.includes('must be') ||
				 error.message.includes('characters'))) {
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
