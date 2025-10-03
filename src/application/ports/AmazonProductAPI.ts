/**
 * Dados do produto retornados pela API da Amazon
 */
export interface AmazonProduct {
  offerId: string;
  title: string;
  fullPrice: number;
  currentPrice: number;
  inStock: boolean;
  imageUrl: string;
  isPreOrder: boolean;
  url: string;
}

/**
 * Interface para a API de produtos da Amazon
 */
export interface AmazonProductAPI {
  /**
   * Busca informações de um produto pelo ASIN
   */
  getProduct(asin: string): Promise<AmazonProduct | null>;

  /**
   * Busca informações de múltiplos produtos por ASIN
   */
  getProducts(asins: string[]): Promise<Map<string, AmazonProduct>>;
}