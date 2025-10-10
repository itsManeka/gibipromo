import { Request, Response } from 'express';
import { ApiResponse } from '@gibipromo/shared';

/**
 * Base controller class with common functionality
 * Following Clean Architecture principles
 */
export abstract class BaseController {
	/**
	 * Send successful response
	 */
	protected sendSuccess<T>(res: Response, data: T, message?: string): void {
		const response: ApiResponse<T> = {
			success: true,
			data,
			message
		};
		res.status(200).json(response);
	}

	/**
	 * Send error response
	 */
	protected sendError(res: Response, error: string, statusCode: number = 400): void {
		const response: ApiResponse<null> = {
			success: false,
			error,
			data: null
		};
		res.status(statusCode).json(response);
	}

	/**
	 * Send server error response
	 */
	protected sendServerError(res: Response, error: Error): void {
		console.error('Controller error:', error);
		const response: ApiResponse<null> = {
			success: false,
			error: process.env.NODE_ENV === 'development' 
				? error.message 
				: 'Internal server error',
			data: null
		};
		res.status(500).json(response);
	}

	/**
	 * Handle async routes with error handling
	 */
	protected asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
		return (req: Request, res: Response): void => {
			Promise.resolve(fn(req, res)).catch((error) => {
				this.sendServerError(res, error);
			});
		};
	};
}