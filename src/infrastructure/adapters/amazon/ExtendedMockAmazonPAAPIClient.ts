import { AmazonProduct, AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';

interface MockProductTemplate {
    title: string;
    basePrice: number;
}

/**
 * Mock do cliente da API de produtos da Amazon para desenvolvimento
 */
export class ExtendedMockAmazonPAAPIClient implements AmazonProductAPI {
    private mockProducts: Map<string, AmazonProduct> = new Map();
    private mockTemplates: MockProductTemplate[];
    private randomSeed: number;

    constructor() {
        this.mockTemplates = this.createTemplates();
        this.randomSeed = Date.now();
        this.initializeMockData();
    }

    setProducts(products: AmazonProduct[]): void {
        this.mockProducts.clear();
        for (const product of products) {
            this.mockProducts.set(product.offerId.replace('offer-', ''), product);
        }
    }

    async getProduct(asin: string): Promise<AmazonProduct | null> {
        return this.mockProducts.get(asin) || this.generateConsistentProduct(asin);
    }

    async getProducts(asins: string[]): Promise<Map<string, AmazonProduct>> {
        const result = new Map<string, AmazonProduct>();
    
        // Simula delay da API
        await new Promise(resolve => setTimeout(resolve, 100));

        for (const asin of asins) {
            const product = this.mockProducts.get(asin) || this.generateConsistentProduct(asin);
            if (product) {
                result.set(asin, product);
            }
        }

        return result;
    }

    private initializeMockData(): void {
    // Produtos de exemplo fixos para testes
        this.mockProducts.set('B08PP8QHFQ', {
            offerId: 'mock-offer-1',
            title: 'Kindle 11ª Geração',
            fullPrice: 149.99,
            currentPrice: 129.99,
            inStock: true,
            imageUrl: 'https://example.com/kindle_11gen.jpg',
            isPreOrder: false,
            url: 'https://amazon.com.br/dp/B08PP8QHFQ'
        });

        this.mockProducts.set('B07JQKWWXT', {
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
        this.mockProducts.set('B09QWERTY1', {
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

    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private createTemplates(): MockProductTemplate[] {
        return [
            { title: 'Naruto Vol.', basePrice: 24.99 },
            { title: 'Dragon Ball Vol.', basePrice: 27.99 },
            { title: 'One Piece Vol.', basePrice: 29.99 },
            { title: 'Demon Slayer Vol.', basePrice: 25.99 },
            { title: 'My Hero Academia Vol.', basePrice: 26.99 },
            { title: 'Jujutsu Kaisen Vol.', basePrice: 28.99 }
        ];
    }
}