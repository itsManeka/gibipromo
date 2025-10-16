/**
 * Product Actions Routes
 * 
 * Routes for adding products to monitoring.
 * 
 * @module routes/productActions.routes
 */

import { Router } from 'express';
import { ProductActionsController } from '../controllers/ProductActionsController';
import { authMiddleware } from '../middleware/auth';

/**
 * Creates and configures product actions routes
 * 
 * @param controller - ProductActionsController instance
 * @returns Configured Express router
 */
export function createProductActionsRoutes(
	controller: ProductActionsController
): Router {
	const router = Router();

	/**
	 * POST /add
	 * Adiciona produto para monitoramento
	 * Requer autenticação
	 */
	router.post('/add', authMiddleware, controller.addProduct);

	/**
	 * POST /add-multiple
	 * Adiciona múltiplos produtos de uma vez
	 * Requer autenticação
	 */
	router.post('/add-multiple', authMiddleware, controller.addMultipleProducts);

	/**
	 * POST /validate-url
	 * Valida URL sem criar ação
	 * Não requer autenticação (para feedback em tempo real)
	 */
	router.post('/validate-url', controller.validateUrl);

	return router;
}
