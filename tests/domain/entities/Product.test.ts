import { createProduct, updateProductPrice, Product } from '../../../src/domain/entities/Product';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = createProduct({
      id: 'B08PP8QHFQ',
      offerid: 'offer-123',
      title: 'Kindle 11ª Geração',
      preco_cheio: 99.99,
      preco: 89.99,
      estoque: true,
      link: 'https://amazon.com.br/dp/B08PP8QHFQ',
      imagem: 'https://example.com/image.jpg',
      pre_venda: false
    });
  });

  it('should create a product with initial price as menor_preco', () => {
    expect(product.menor_preco).toBe(product.preco);
    expect(product.usuarios).toEqual([]);
  });

  it('should update menor_preco when price decreases', () => {
    const oldPrice = product.preco;
    const newPrice = oldPrice - 10;
    
    const shouldNotify = updateProductPrice(product, newPrice);
    
    expect(shouldNotify).toBe(true);
    expect(product.preco).toBe(newPrice);
    expect(product.menor_preco).toBe(newPrice);
  });

  it('should not update menor_preco when price increases', () => {
    const oldPrice = product.preco;
    const oldMenorPreco = product.menor_preco;
    const newPrice = oldPrice + 10;
    
    const shouldNotify = updateProductPrice(product, newPrice);
    
    expect(shouldNotify).toBe(false);
    expect(product.preco).toBe(newPrice);
    expect(product.menor_preco).toBe(oldMenorPreco);
  });
});