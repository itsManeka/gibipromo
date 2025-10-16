/**
 * Products Routes
 *
 * Defines routes for product-related endpoints
 *
 * @module routes/products
 */

import { Router } from 'express';
import { ProductsController } from '../controllers/ProductsController';
import { ProductActionsController } from '../controllers/ProductActionsController';
import { ProductActionsService } from '../services/ProductActionsService';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createRepository } from '../infrastructure/factories/repositories';

const router = Router();
const productsController = new ProductsController();

// Setup ProductActionsController
const actionRepository = createRepository('actions');
const userRepository = createRepository('users');
const productActionsService = new ProductActionsService(actionRepository, userRepository);
const productActionsController = new ProductActionsController(productActionsService);

/**
 * GET /products
 * List products with pagination
 * Public endpoint - no authentication required
 */
router.get('/', productsController.listProducts);

/**
 * GET /products/promotions
 * List promotions with advanced filters
 * Public endpoint with optional authentication for "Meus Produtos" filter
 */
router.get('/promotions', optionalAuthMiddleware, productsController.getPromotions);

/**
 * GET /products/filter-options
 * Get unique values for filterable fields (categories, publishers, etc)
 * Public endpoint - no authentication required
 */
router.get('/filter-options', productsController.getFilterOptions);

/**
 * GET /products/search
 * Search products with filters
 * Public endpoint - no authentication required
 */
router.get('/search', productsController.searchProducts);

/**
 * GET /products/:id
 * Get product by ID
 * Public endpoint - no authentication required
 */
router.get('/:id', productsController.getProductById);

/**
 * POST /products/add
 * Add product to monitoring
 * Requires authentication
 */
router.post('/add', authMiddleware, productActionsController.addProduct);

/**
 * POST /products/add-multiple
 * Add multiple products to monitoring
 * Requires authentication
 */
router.post('/add-multiple', authMiddleware, productActionsController.addMultipleProducts);

/**
 * POST /products/validate-url
 * Validate Amazon URL without creating action
 * Public endpoint - no authentication required (for real-time feedback)
 */
router.post('/validate-url', productActionsController.validateUrl);

/**
 * DELETE /products/cache
 * Clear product cache (admin only)
 * Requires authentication
 */
router.delete('/cache', authMiddleware, productsController.clearCache);

/**
 * GET /products/cache/stats
 * Get cache statistics (admin only)
 * Requires authentication
 */
router.get('/cache/stats', authMiddleware, productsController.getCacheStats);

export default router;

