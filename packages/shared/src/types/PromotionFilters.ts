/**
 * Filtros para busca de promoções
 * Utilizados tanto no frontend quanto no backend para consistência
 */
export interface PromotionFilters {
	/**
	 * Busca textual por título ou "Autores e Ilustradores"
	 */
	query?: string;

	/**
	 * Filtro por categoria do produto (ex: Mangá, HQ, Livro)
	 */
	category?: string;

	/**
	 * Filtro por editora (ex: Panini, Pipoca & Nanquim)
	 */
	publisher?: string;

	/**
	 * Filtro por gênero (ex: Fantasia, Aventura, Ficção Científica)
	 */
	genre?: string;

	/**
	 * Filtro por formato (ex: Capa dura, Capa cartão, Digital)
	 */
	format?: string;

	/**
	 * Filtro por Autores e Ilustradores específicos
	 * Pode conter múltiplos valores
	 */
	contributors?: string[];

	/**
	 * Filtrar apenas pré-vendas (preorder = true)
	 * Padrão: false (mostra todos)
	 */
	preorder?: boolean;

	/**
	 * Filtrar apenas produtos em estoque (in_stock = true)
	 * Padrão: true (mostra apenas em estoque)
	 */
	inStock?: boolean;

	/**
	 * Filtro "Meus Produtos" vs "Todos"
	 * Se true, mostra apenas produtos que o usuário monitora
	 * Requer autenticação (userId no backend)
	 */
	onlyMyProducts?: boolean;
}

/**
 * Opções disponíveis para popular os filtros
 * Contém valores únicos de cada campo filtrável
 */
export interface FilterOptions {
	/**
	 * Todas as categorias únicas disponíveis
	 */
	categories: string[];

	/**
	 * Todas as editoras únicas disponíveis
	 */
	publishers: string[];

	/**
	 * Todos os gêneros únicos disponíveis
	 */
	genres: string[];

	/**
	 * Todos os formatos únicos disponíveis
	 */
	formats: string[];

	/**
	 * Todos os Autores e Ilustradores únicos disponíveis
	 */
	contributors: string[];
}
