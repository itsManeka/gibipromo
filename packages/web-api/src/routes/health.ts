import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

/**
 * Health check routes
 * Provides endpoints for monitoring API health and status
 */
const healthRouter = Router();
const healthController = new HealthController();

/**
 * GET /health
 * Basic health check endpoint
 */
healthRouter.get('/', healthController.getHealth);

/**
 * GET /health/detailed
 * Detailed health check with system information
 */
healthRouter.get('/detailed', healthController.getDetailedHealth);

export { healthRouter };