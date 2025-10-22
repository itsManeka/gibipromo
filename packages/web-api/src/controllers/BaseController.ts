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
	protected sendSuccess<T>(res: Response, response: ApiResponse<T>): void {
		res.status(200).json(response);
	}

	/**
	 * Send created response (201)
	 */
	protected sendCreated<T>(res: Response, response: ApiResponse<T>): void {
		res.status(201).json(response);
	}

	/**
	 * Send bad request response (400)
	 */
	protected sendBadRequest<T>(res: Response, response: ApiResponse<T>): void {
		res.status(400).json(response);
	}

	/**
	 * Send unauthorized response (401)
	 */
	protected sendUnauthorized<T>(res: Response, response: ApiResponse<T>): void {
		res.status(401).json(response);
	}

	/**
	 * Send forbidden response (403)
	 */
	protected sendForbidden<T>(res: Response, response: ApiResponse<T>): void {
		res.status(403).json(response);
	}

	/**
	 * Send not found response (404)
	 */
	protected sendNotFound<T>(res: Response, response: ApiResponse<T>): void {
		res.status(404).json(response);
	}

	/**
	 * Send error response (generic)
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