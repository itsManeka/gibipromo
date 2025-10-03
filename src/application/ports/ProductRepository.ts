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
  /**
   * Retorna os produtos monitorados por um usuário específico
   * @param userId ID do usuário
   * @param page Número da página (começando em 1)
   * @param pageSize Quantidade de itens por página
   * @returns Lista de produtos e total de produtos
   */
  findByUserId(userId: string, page: number, pageSize: number): Promise<{
    products: Product[];
    total: number;
  }>;
}