import { Repository } from './Repository';
import { ProductUser } from '@gibipromo/shared';

/**
 * Repository interface for ProductUser entities
 */
export interface ProductUserRepository extends Repository<ProductUser> {
	/**
	 * Find a specific product-user relationship
	 */
	findByProductAndUser(productId: string, userId: string): Promise<ProductUser | null>;

	/**
	 * Find all users monitoring a specific product
	 */
	findByProductId(productId: string): Promise<ProductUser[]>;

	/**
	 * Find all products monitored by a specific user
	 */
	findByUserId(userId: string, page: number, pageSize: number): Promise<{
		productUsers: ProductUser[];
		total: number;
	}>;

	/**
	 * Add or update a product-user relationship
	 */
	upsert(productUser: ProductUser): Promise<void>;

	/**
	 * Remove a product-user relationship
	 */
	removeByProductAndUser(productId: string, userId: string): Promise<void>;

	/**
	 * Update the desired price for a product-user relationship
	 */
	updateDesiredPrice(productId: string, userId: string, desiredPrice: number): Promise<void>;
}