import { Repository } from './Repository';
import { Product } from '../../domain/entities/Product';

/**
 * Repository interface for Product entities
 */
export interface ProductRepository extends Repository<Product> {
  findByLink(link: string): Promise<Product | null>;
  addUser(productId: string, userId: string): Promise<void>;
  removeUser(productId: string, userId: string): Promise<void>;
  getNextProductsToCheck(limit: number): Promise<Product[]>;
}