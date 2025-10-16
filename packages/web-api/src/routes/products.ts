/**
 * Products Routes
 *
 * Defines routes for product-related endpoints
 *
 * @module routes/products
 */

import { Router } from 'express';
import { ProductsController } from '../controllers/ProductsController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();
const productsController = new ProductsController();

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

