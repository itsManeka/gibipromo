import { Repository } from './Repository';
import { Product } from '../../domain/entities/Product';

/**
 * Repository interface for Product entities
 */
export interface ProductRepository extends Repository<Product> {
  findByLink(link: string): Promise<Product | null>;
  getNextProductsToCheck(limit: number): Promise<Product[]>;
}