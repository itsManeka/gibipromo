import { Repository } from './Repository';
import { Product } from '../entities';
import { PromotionFilters, FilterOptions } from '../types/PromotionFilters';

/**
 * Repository interface for Product entities
 */
export interface ProductRepository extends Repository<Product> {
	findByLink(link: string): Promise<Product | null>;
	getNextProductsToCheck(limit: number): Promise<Product[]>;

	/**
	 * Find products on promotion (price < full_price) with filters
	 * @param filters - Filtros a serem aplicados (categoria, editora, etc)
	 * @param limit - Limite de produtos a retornar (máximo 1000 para otimização)
	 * @returns Lista de produtos em promoção
	 */
	findPromotions(filters: PromotionFilters, limit: number): Promise<Product[]>;

	/**
	 * Find multiple products by their IDs (batch operation)
	 * Usado para buscar produtos específicos do usuário (filtro "Meus Produtos")
	 * @param ids - Array de product IDs
	 * @returns Lista de produtos encontrados
	 */
	findByIds(ids: string[]): Promise<Product[]>;

	/**
	 * Get unique values for all filterable fields
	 * Usado para popular os dropdowns de filtros no frontend
	 * @returns Valores únicos de categorias, editoras, gêneros, formatos e contributors
	 */
	getUniqueFilterValues(): Promise<FilterOptions>;
}