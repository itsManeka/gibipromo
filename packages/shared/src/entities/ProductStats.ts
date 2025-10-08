import { Entity } from './Entity';

/**
 * Represents historical price statistics for a product
 */
export interface ProductStats extends Entity {
	product_id: string;
	price: number;
	old_price: number;
	percentage_change: number;
	created_at: string;
}

/**
 * Factory function to create a new ProductStats
 */
export function createProductStats(params: Omit<ProductStats, 'id' | 'created_at'>): ProductStats {
	return {
		id: generateStatsId(),
		...params,
		created_at: new Date().toISOString()
	};
}

/**
 * Calculates the percentage change between old price and new price
 * Returns positive value for price reduction, negative for price increase
 */
export function calculatePercentageChange(oldPrice: number, newPrice: number): number {
	if (oldPrice <= 0) {
		return 0;
	}
	return ((oldPrice - newPrice) / oldPrice) * 100;
}

/**
 * Determines if a price change warrants creating a ProductStats record
 * Returns true if the price reduction is 5% or more
 */
export function shouldCreateStats(oldPrice: number, newPrice: number): boolean {
	const percentageChange = calculatePercentageChange(oldPrice, newPrice);
	return percentageChange >= 5;
}

/**
 * Generates a unique ID for product statistics
 */
function generateStatsId(): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `stats_${timestamp}_${random}`;
}