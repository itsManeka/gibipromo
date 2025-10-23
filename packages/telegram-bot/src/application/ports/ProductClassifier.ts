/**
 * Resultado da classificação de um produto
 */
export interface ProductClassification {
	/** Categoria do produto: HQ, Mangá ou Livro */
	category: 'HQ' | 'Mangá' | 'Livro';
	/** Gênero principal do produto */
	genre: string;
}

/**
 * Port para classificação de produtos usando IA
 * Identifica o tipo (HQ, Mangá, Livro) e o gênero baseado no título
 */
export interface ProductClassifier {
	/**
	 * Classifica um produto baseado no título
	 * @param title Título do produto
	 * @returns Classificação do produto (tipo e gênero) ou null em caso de erro
	 */
	classify(title: string): Promise<ProductClassification | null>;
}

