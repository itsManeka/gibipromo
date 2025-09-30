import { AmazonProduct, AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';

/**
 * Mock do cliente da API de produtos da Amazon para desenvolvimento
 */
export class MockAmazonPAAPIClient implements AmazonProductAPI {
  private products: Map<string, AmazonProduct>;

  constructor() {
    this.products = new Map();
    this.initializeMockData();
  }

  async getProduct(asin: string): Promise<AmazonProduct | null> {
    return this.products.get(asin) || this.generateMockProduct(asin);
  }

  async getProducts(asins: string[]): Promise<Map<string, AmazonProduct>> {
    const result = new Map<string, AmazonProduct>();
    
    for (const asin of asins) {
      const product = await this.getProduct(asin);
      if (product) {
        result.set(asin, product);
      }
    }

    return result;
  }

  private initializeMockData(): void {
    // Alguns produtos de exemplo
    this.products.set('B08PP8QHFQ', {
      offerId: 'mock-offer-1',
      fullPrice: 149.99,
      currentPrice: 129.99,
      inStock: true,
      imageUrl: 'https://example.com/manga1.jpg',
      isPreOrder: false
    });

    this.products.set('B07JQKWWXT', {
      offerId: 'mock-offer-2',
      fullPrice: 89.99,
      currentPrice: 79.99,
      inStock: true,
      imageUrl: 'https://example.com/manga2.jpg',
      isPreOrder: true
    });
  }

  private generateMockProduct(asin: string): AmazonProduct {
    // Gera um produto aleatório para ASINs desconhecidos
    const basePrice = Math.floor(Math.random() * 150) + 50;
    const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 30) : 0;

    return {
      offerId: `mock-offer-${asin}`,
      fullPrice: basePrice,
      currentPrice: basePrice - discount,
      inStock: Math.random() > 0.1,
      imageUrl: `https://example.com/${asin}.jpg`,
      isPreOrder: Math.random() < 0.1
    };
  }

  /**
   * Método auxiliar para simular alterações de preço (apenas para testes)
   */
  public simulatePriceChange(asin: string, newPrice: number): void {
    const product = this.products.get(asin);
    if (product) {
      product.currentPrice = newPrice;
      this.products.set(asin, product);
    }
  }
}