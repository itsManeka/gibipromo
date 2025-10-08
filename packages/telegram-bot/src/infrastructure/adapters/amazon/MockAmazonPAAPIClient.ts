import { AmazonProduct, AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';

interface MockProductTemplate {
	title: string;
	basePrice: number;
}

/**
 * Mock do cliente da API de produtos da Amazon para desenvolvimento
 */
export class MockAmazonPAAPIClient implements AmazonProductAPI {
	private products: Map<string, AmazonProduct>;
	private mockTemplates: MockProductTemplate[];
	private randomSeed: number;

	constructor() {
		this.products = new Map();
		this.mockTemplates = this.createTemplates();
		this.randomSeed = Date.now();
		this.initializeMockData();
	}

	async getProduct(asin: string): Promise<AmazonProduct | null> {
		return this.products.get(asin) || this.generateConsistentProduct(asin);
	}

	async getProducts(asins: string[]): Promise<Map<string, AmazonProduct>> {
		const result = new Map<string, AmazonProduct>();

		// Simula delay da API
		await new Promise(resolve => setTimeout(resolve, 100));

		for (const asin of asins) {
			const product = this.products.get(asin) || this.generateConsistentProduct(asin);
			if (product) {
				result.set(asin, product);
			}
		}

		return result;
	}

	private initializeMockData(): void {
		// Produtos de exemplo fixos para testes
		this.products.set('B08PP8QHFQ', {
			offerId: 'mock-offer-1',
			title: 'Kindle 11ª Geração',
			fullPrice: 149.99,
			currentPrice: 129.99,
			inStock: true,
			imageUrl: 'https://example.com/kindle_11gen.jpg',
			isPreOrder: false,
			url: 'https://amazon.com.br/dp/B08PP8QHFQ'
		});

		this.products.set('B07JQKWWXT', {
			offerId: 'mock-offer-2',
			title: 'Naruto Vol. 1 (Pré-venda)',
			fullPrice: 27.99,
			currentPrice: 27.99,
			inStock: false,
			imageUrl: 'https://example.com/manga/naruto_1.jpg',
			isPreOrder: true,
			url: 'https://amazon.com.br/dp/B07JQKWWXT'
		});

		// Adiciona alguns em promoção
		this.products.set('B09QWERTY1', {
			offerId: 'mock-offer-3',
			title: 'Dragon Ball Vol. 1 (Edição Luxo)',
			fullPrice: 49.99,
			currentPrice: 39.99,
			inStock: true,
			imageUrl: 'https://example.com/manga/dragonball_1.jpg',
			isPreOrder: false,
			url: 'https://amazon.com.br/dp/B09QWERTY1'
		});
	}

	private generateConsistentProduct(asin: string): AmazonProduct {
		// Usa o ASIN como seed para gerar valores consistentes
		const hash = this.hashCode(asin);
		const template = this.mockTemplates[hash % this.mockTemplates.length];

		// Variação de preço baseada no hash
		const variance = (hash % 20) / 100; // -20% a +20%
		const basePrice = template.basePrice * (1 + variance);

		// Chance de desconto baseada no hash
		const hasDiscount = (hash % 100) < 30; // 30% de chance
		const discountPercent = hasDiscount ? (hash % 25 + 5) / 100 : 0; // 5% a 30%

		const fullPrice = Math.round(basePrice * 100) / 100;
		const currentPrice = Math.round(basePrice * (1 - discountPercent) * 100) / 100;

		return {
			offerId: `mock-offer-${asin}`,
			title: `${template.title} ${Math.abs(hash % 50) + 1}`,
			fullPrice,
			currentPrice,
			inStock: (hash % 100) < 90, // 90% em estoque
			imageUrl: `https://example.com/${asin}.jpg`,
			isPreOrder: (hash % 100) < 10, // 10% pré-venda
			url: `https://amazon.com.br/dp/${asin}`
		};
	}

	private createTemplates(): MockProductTemplate[] {
		return [
			{ title: 'Kindle 11ª Geração', basePrice: 299.99 },
			{ title: 'Fire TV Stick Lite', basePrice: 249.99 },
			{ title: 'Echo Dot', basePrice: 299.99 },
			{ title: 'Fire Tablet', basePrice: 399.99 },
			{ title: 'Kindle Paperwhite', basePrice: 499.99 },
			{ title: 'Echo Show', basePrice: 599.99 },
			{ title: 'Fire TV Cube', basePrice: 699.99 },
			{ title: 'Kindle Oasis', basePrice: 999.99 },
			{ title: 'Echo Studio', basePrice: 799.99 },
			{ title: 'Fire TV', basePrice: 399.99 }
		];
	}

	private hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash);
	}

	/**
	* Método auxiliar para simular alterações de preço (apenas para testes)
	*/
	public simulatePriceChange(asin: string, newPrice: number): void {
		const product = this.products.get(asin);
		if (product) {
			const oldPrice = product.currentPrice;
			product.currentPrice = Math.round(newPrice * 100) / 100;

			// Se o novo preço for menor, atualiza o preço cheio também
			if (newPrice < oldPrice) {
				product.fullPrice = Math.round(oldPrice * 100) / 100;
			}

			this.products.set(asin, product);
		}
	}
}