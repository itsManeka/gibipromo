/**
 * Products Controller
 *
 * Handles HTTP requests for product-related endpoints.
 *
 * @module controllers/ProductsController
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import {
	ProductsService,
	PaginationOptions,
	ProductSearchFilters
} from '../services/ProductsService';
import { ApiResponse } from '@gibipromo/shared';
import { DynamoDBProductRepository } from '@gibipromo/shared';

/**
 * Products Controller
 * Provides REST endpoints for product listing and search
 */
export class ProductsController extends BaseController {
	private readonly productsService: ProductsService;

	constructor() {
		super();
		const productRepository = new DynamoDBProductRepository();
		this.productsService = new ProductsService(productRepository);
	}

	/**
	 * GET /products
	 * List products with pagination
	 */
	listProducts = this.asyncHandler(async (req: Request, res: Response) => {
		// Parse pagination parameters
		const pageParam = req.query.page as string;
		const limitParam = req.query.limit as string;
		
		const page = pageParam ? parseInt(pageParam, 10) : 1;
		const limit = limitParam ? parseInt(limitParam, 10) : 20;

		// Validação
		if (isNaN(page) || page < 1) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Page must be greater than 0'
			};
			return this.sendBadRequest(res, response);
		}

		if (isNaN(limit) || limit < 1 || limit > 100) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Limit must be between 1 and 100'
			};
			return this.sendBadRequest(res, response);
		}

		const options: PaginationOptions = { page, limit };

		try {
			const result = await this.productsService.listProducts(options);

			const response: ApiResponse<typeof result> = {
				success: true,
				data: result,
				message: `Retrieved ${result.data.length} products`
			};

			this.sendSuccess(res, response);
		} catch (error) {
			throw error;
		}
	});

	/**
	 * GET /products/search
	 * Search products with filters and pagination
	 */
	searchProducts = this.asyncHandler(async (req: Request, res: Response) => {
		// Parse pagination parameters
		const pageParam = req.query.page as string;
		const limitParam = req.query.limit as string;
		
		const page = pageParam ? parseInt(pageParam, 10) : 1;
		const limit = limitParam ? parseInt(limitParam, 10) : 20;

		// Parse filter parameters
		const filters: ProductSearchFilters = {
			query: req.query.q as string,
			minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
			maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
			category: req.query.category as string,
			format: req.query.format as string,
			genre: req.query.genre as string,
			publisher: req.query.publisher as string,
			available: req.query.available ? req.query.available === 'true' : undefined
		};

		// Validação de paginação
		if (isNaN(page) || page < 1) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Page must be greater than 0'
			};
			return this.sendBadRequest(res, response);
		}

		if (isNaN(limit) || limit < 1 || limit > 100) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Limit must be between 1 and 100'
			};
			return this.sendBadRequest(res, response);
		}

		// Validação de preços
		if (filters.minPrice !== undefined && filters.minPrice < 0) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Min price must be greater than or equal to 0'
			};
			return this.sendBadRequest(res, response);
		}

		if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Max price must be greater than or equal to 0'
			};
			return this.sendBadRequest(res, response);
		}

		if (
			filters.minPrice !== undefined &&
			filters.maxPrice !== undefined &&
			filters.minPrice > filters.maxPrice
		) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Min price cannot be greater than max price'
			};
			return this.sendBadRequest(res, response);
		}

		const options: PaginationOptions = { page, limit };

		try {
			const result = await this.productsService.searchProducts(filters, options);

			const response: ApiResponse<typeof result> = {
				success: true,
				data: result,
				message: `Found ${result.pagination.total} products`
			};

			this.sendSuccess(res, response);
		} catch (error) {
			throw error;
		}
	});

	/**
	 * GET /products/:id
	 * Get product by ID
	 */
	getProductById = this.asyncHandler(async (req: Request, res: Response) => {
		const { id } = req.params;

		// Validação
		if (!id) {
			const response: ApiResponse<null> = {
				success: false,
				error: 'Product ID is required'
			};
			return this.sendBadRequest(res, response);
		}

		try {
			const product = await this.productsService.getProductById(id);

			if (!product) {
				const response: ApiResponse<null> = {
					success: false,
					error: 'Product not found'
				};
				return this.sendNotFound(res, response);
			}

			const response: ApiResponse<typeof product> = {
				success: true,
				data: product,
				message: 'Product retrieved successfully'
			};

			this.sendSuccess(res, response);
		} catch (error) {
			throw error;
		}
	});

	/**
	 * DELETE /products/cache (Admin only)
	 * Clear product cache
	 */
	clearCache = this.asyncHandler(async (req: Request, res: Response) => {
		const { key } = req.query;

		this.productsService.clearCache(key as string | undefined);

		const response: ApiResponse<null> = {
			success: true,
			message: key ? `Cache cleared for key: ${key}` : 'All cache cleared'
		};

		this.sendSuccess(res, response);
	});

	/**
	 * GET /products/cache/stats (Admin only)
	 * Get cache statistics
	 */
	getCacheStats = this.asyncHandler(async (req: Request, res: Response) => {
		const stats = this.productsService.getCacheStats();

		const response: ApiResponse<typeof stats> = {
			success: true,
			data: stats,
			message: 'Cache statistics retrieved'
		};

		this.sendSuccess(res, response);
	});
}
