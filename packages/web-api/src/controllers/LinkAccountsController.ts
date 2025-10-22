import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { LinkAccountsService } from '../services/LinkAccountsService';
import { ApiResponse } from '@gibipromo/shared';

/**
 * Controller for account linking endpoints
 */
export class LinkAccountsController extends BaseController {
	constructor(private linkAccountsService: LinkAccountsService) {
		super();
	}

	/**
	 * POST /api/v1/link-telegram
	 * Initiates account linking with Telegram
	 */
	linkTelegram = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;
		const { token } = req.body;

		if (!userId) {
			return this.sendError(res, 'Não autenticado', 401);
		}

		if (!token || typeof token !== 'string' || token.length !== 6) {
			return this.sendError(res, 'Código inválido', 400);
		}

		const result = await this.linkAccountsService.linkAccount(userId, token.toUpperCase());

		if (result.success) {
			const successResponse: ApiResponse<{ message: string }> = {
				success: true,
				data: { message: result.message }
			};
			this.sendSuccess(res, successResponse);
		} else {
			return this.sendError(res, result.message, 400);
		}
	});

	/**
	 * GET /api/v1/link-telegram/status
	 * Checks account link status
	 */
	getLinkStatus = this.asyncHandler(async (req: Request, res: Response) => {
		const userId = req.user?.id;

		if (!userId) {
			return this.sendError(res, 'Não autenticado', 401);
		}

		const status = await this.linkAccountsService.checkLinkStatus(userId);
		const successResponse: ApiResponse<typeof status> = {
			success: true,
			data: status
		};
		this.sendSuccess(res, successResponse);
	});
}

