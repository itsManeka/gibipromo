import { MockAmazonPAAPIClient } from 'infrastructure/adapters/amazon/MockAmazonPAAPIClient';

describe('MockAmazonPAAPIClient', () => {
    let client: MockAmazonPAAPIClient;

    beforeEach(() => {
        client = new MockAmazonPAAPIClient();
    });

    it('should return predefined products', async () => {
        const product = await client.getProduct('B08PP8QHFQ');
    
        expect(product).toBeDefined();
        expect(product?.offerId).toBe('mock-offer-1');
        expect(product?.title).toBe('Kindle 11ª Geração');
        expect(product?.fullPrice).toBe(149.99);
        expect(product?.currentPrice).toBe(129.99);
    });

    it('should generate mock products for unknown ASINs', async () => {
        const asin = 'UNKNOWN123';
        const product = await client.getProduct(asin);
    
        expect(product).toBeDefined();
        if (product) {
            expect(product.offerId).toBe(`mock-offer-${asin}`);
            expect(product.fullPrice).toBeGreaterThan(0);
            expect(product.currentPrice).toBeLessThanOrEqual(product.fullPrice);
        }
    });

    it('should simulate price changes', async () => {
        const asin = 'B08PP8QHFQ';
        const newPrice = 99.99;

        client.simulatePriceChange(asin, newPrice);
        const product = await client.getProduct(asin);

        expect(product?.currentPrice).toBe(newPrice);
    });

    it('should fetch multiple products', async () => {
        const asins = ['B08PP8QHFQ', 'B07JQKWWXT', 'UNKNOWN123'];
        const products = await client.getProducts(asins);

        expect(products.size).toBe(3);
        expect(products.get('B08PP8QHFQ')).toBeDefined();
        expect(products.get('B07JQKWWXT')).toBeDefined();
        expect(products.get('UNKNOWN123')).toBeDefined();
    });
});