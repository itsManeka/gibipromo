/**
 * JWT Authentication Middleware
 * 
 * Validates JWT tokens and attaches user data to request object.
 * 
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ApiResponse } from '@gibipromo/shared';

/**
 * Extend Express Request to include user
 */
declare global {
	namespace Express {
		interface Request {
			user?: any;
		}
	}
}

/**
 * JWT Authentication Middleware
 * 
 * Validates the Authorization header bearer token and attaches user to request.
 * 
 * @example
 * router.get('/protected', authMiddleware, controller.protectedRoute);
 */
export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Extract token from Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'No authorization header provided'
			};
			res.status(401).json(response);
			return;
		}

		// Check if it's a Bearer token
		if (!authHeader.startsWith('Bearer ')) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Invalid authorization format. Use: Bearer <token>'
			};
			res.status(401).json(response);
			return;
		}

		// Extract the token
		const token = authHeader.substring(7);

		if (!token) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'No token provided'
			};
			res.status(401).json(response);
			return;
		}

		// Validate token
		const authService = new AuthService();
		const user = await authService.validateToken(token);

		// Attach user to request
		req.user = user;

		// Continue to next middleware/route
		next();
	} catch (error) {
		if (error instanceof Error) {
			const response: ApiResponse<null> = {
				success: false,
				error: error.message
			};
			res.status(401).json(response);
			return;
		}

		const response: ApiResponse<null> = {
			success: false,
			error: 'Authentication failed'
		};
		res.status(401).json(response);
	}
};

/**
 * Optional JWT Authentication Middleware
 * 
 * Similar to authMiddleware but doesn't fail if no token is provided.
 * Useful for routes that work both with and without authentication.
 * 
 * @example
 * router.get('/optional-auth', optionalAuthMiddleware, controller.route);
 */
export const optionalAuthMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			// No token provided, continue without user
			next();
			return;
		}

		const token = authHeader.substring(7);

		if (!token) {
			next();
			return;
		}

		// Try to validate token
		const authService = new AuthService();
		const user = await authService.validateToken(token);

		// Attach user to request if valid
		req.user = user;

		next();
	} catch (error) {
		// Token invalid, but continue without user
		next();
	}
};
