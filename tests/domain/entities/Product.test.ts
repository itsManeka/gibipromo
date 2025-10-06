import { createProduct, updateProductPrice, Product } from '../../../src/domain/entities/Product';

describe('Product Entity', () => {
    let product: Product;
    const fixedDate = '2024-01-01T00:00:00.000Z';

    beforeEach(() => {
    // Mock Date.toISOString to return a fixed date for consistent testing
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(fixedDate);
    
        product = createProduct({
            id: 'B08PP8QHFQ',
            offer_id: 'offer-123',
            title: 'Kindle 11ª Geração',
            full_price: 99.99,
            price: 89.99,
            in_stock: true,
            url: 'https://amazon.com.br/dp/B08PP8QHFQ',
            image: 'https://example.com/image.jpg',
            preorder: false
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create a product with initial price as lowest_price and timestamps', () => {
        expect(product.lowest_price).toBe(product.price);
        expect(product.created_at).toBe(fixedDate);
        expect(product.updated_at).toBe(fixedDate);
    });

    it('should update lowest_price and old_price when price decreases', () => {
        const oldPrice = product.price;
        const newPrice = oldPrice - 10;
    
        const shouldNotify = updateProductPrice(product, newPrice);
    
        expect(shouldNotify).toBe(true);
        expect(product.price).toBe(newPrice);
        expect(product.old_price).toBe(oldPrice);
        expect(product.lowest_price).toBe(newPrice);
        expect(product.updated_at).toBe(fixedDate);
    });

    it('should not update lowest_price when price increases but should update old_price', () => {
        const oldPrice = product.price;
        const oldLowestPrice = product.lowest_price;
        const newPrice = oldPrice + 10;
    
        const shouldNotify = updateProductPrice(product, newPrice);
    
        expect(shouldNotify).toBe(false);
        expect(product.price).toBe(newPrice);
        expect(product.old_price).toBe(oldPrice);
        expect(product.lowest_price).toBe(oldLowestPrice);
        expect(product.updated_at).toBe(fixedDate);
    });

    it('should set old_price when updating price', () => {
        const oldPrice = product.price;
        const newPrice = oldPrice - 5;
    
        updateProductPrice(product, newPrice);
    
        expect(product.old_price).toBe(oldPrice);
    });
});