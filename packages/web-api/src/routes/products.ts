/**
 * Products Routes
 *
 * Defines routes for product-related endpoints
 *
 * @module routes/products
 */

import { Router } from 'express';
import { ProductsController } from '../controllers/ProductsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const productsController = new ProductsController();

/**
 * GET /products
 * List products with pagination
 * Requires authentication
 */
router.get('/', authMiddleware, productsController.listProducts);

/**
 * GET /products/search
 * Search products with filters
 * Requires authentication
 */
router.get('/search', authMiddleware, productsController.searchProducts);

/**
 * GET /products/:id
 * Get product by ID
 * Requires authentication
 */
router.get('/:id', authMiddleware, productsController.getProductById);

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
