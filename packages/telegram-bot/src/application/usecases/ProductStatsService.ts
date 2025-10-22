import { ProductStats, createProductStats, shouldCreateStats, calculatePercentageChange } from '@gibipromo/shared';
import { ProductStatsRepository } from '../ports/ProductStatsRepository';
import { Product } from '@gibipromo/shared';

/**
 * Service responsible for managing product price statistics
 */
export class ProductStatsService {
	constructor(private readonly productStatsRepository: ProductStatsRepository) { }

	/**
	 * Creates an initial statistics entry for a newly added product
	 * This ensures every product has at least one baseline data point for graphs
	 * @param product The newly created product
	 * @returns The created ProductStats
	 */
	async createInitialStats(product: Product): Promise<ProductStats> {
		// Create baseline statistics with no price change (old_price = price)
		const productStats = createProductStats({
			product_id: product.id,
			price: product.price,
			old_price: product.price, // Same as current price (no change yet)
			percentage_change: 0 // No change on initial entry
		});

		return await this.productStatsRepository.create(productStats);
	}

	/**
	 * Evaluates if a price change warrants creating statistics and creates them if needed
	 * @param product The product with updated pricing information
	 * @returns The created ProductStats if statistics were generated, null otherwise
	 */
	async handlePriceChange(product: Product): Promise<ProductStats | null> {
		// Skip if no old_price is available for comparison
		if (!product.old_price || product.old_price <= 0) {
			return null;
		}

		// Check if the price change is significant enough (>= 5% reduction)
		if (!shouldCreateStats(product.old_price, product.price)) {
			return null;
		}

		// Calculate the percentage change
		const percentageChange = calculatePercentageChange(product.old_price, product.price);

		// Create and save the statistics record
		const productStats = createProductStats({
			product_id: product.id,
			price: product.price,
			old_price: product.old_price,
			percentage_change: percentageChange
		});

		return await this.productStatsRepository.create(productStats);
	}

	/**
	 * Gets all statistics for a specific product
	 * @param productId The product ID to search for
	 * @returns Array of ProductStats records for the product
	 */
	async getProductStatistics(productId: string): Promise<ProductStats[]> {
		return await this.productStatsRepository.findByProductId(productId);
	}

	/**
	 * Gets the latest statistics across all products
	 * @param limit Maximum number of records to return
	 * @returns Array of the most recent ProductStats records
	 */
	async getLatestStatistics(limit: number = 10): Promise<ProductStats[]> {
		return await this.productStatsRepository.findLatest(limit);
	}

	/**
	 * Gets statistics for a product within a specific date range
	 * @param productId The product ID to search for
	 * @param startDate Start date (ISO string)
	 * @param endDate End date (ISO string)
	 * @returns Array of ProductStats records within the date range
	 */
	async getProductStatisticsInDateRange(
		productId: string,
		startDate: string,
		endDate: string
	): Promise<ProductStats[]> {
		return await this.productStatsRepository.findByProductIdAndDateRange(
			productId,
			startDate,
			endDate
		);
	}
}