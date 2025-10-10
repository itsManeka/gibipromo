import { Request, Response } from 'express';
import { BaseController } from './BaseController';

/**
 * Health controller for monitoring endpoints
 * Extends BaseController for consistent response handling
 */
export class HealthController extends BaseController {
	/**
	 * GET /health
	 * Basic health check endpoint
	 */
	public getHealth = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const healthData = {
			status: 'ok',
			timestamp: Date.now(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
			version: '1.0.0'
		};

		this.sendSuccess(res, healthData, 'API is healthy');
	});

	/**
	 * GET /health/detailed
	 * Detailed health check with system information
	 */
	public getDetailedHealth = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const memoryUsage = process.memoryUsage();
		
		const detailedHealthData = {
			status: 'ok',
			timestamp: Date.now(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
			version: '1.0.0',
			system: {
				platform: process.platform,
				nodeVersion: process.version,
				memory: {
					rss: Math.round(memoryUsage.rss / 1024 / 1024),
					heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
					heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
					external: Math.round(memoryUsage.external / 1024 / 1024),
				}
			},
			services: {
				dynamodb: 'connected', // TODO: Implement actual health checks
				amazon_api: 'available'
			}
		};

		this.sendSuccess(res, detailedHealthData, 'Detailed API health information');
	});
}