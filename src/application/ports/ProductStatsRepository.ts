import { Repository } from './Repository';
import { ProductStats } from '../../domain/entities/ProductStats';

/**
 * Repository interface for ProductStats entities
 */
export interface ProductStatsRepository extends Repository<ProductStats> {
    /**
     * Find all statistics records for a specific product
     * @param productId The product ID to search for
     * @returns Array of ProductStats records
     */
    findByProductId(productId: string): Promise<ProductStats[]>;

    /**
     * Find the latest statistics records across all products
     * @param limit Maximum number of records to return
     * @returns Array of the most recent ProductStats records
     */
    findLatest(limit: number): Promise<ProductStats[]>;

    /**
     * Find statistics records within a date range for a specific product
     * @param productId The product ID to search for
     * @param startDate Start date (ISO string)
     * @param endDate End date (ISO string)
     * @returns Array of ProductStats records within the date range
     */
    findByProductIdAndDateRange(
        productId: string,
        startDate: string,
        endDate: string
    ): Promise<ProductStats[]>;
}