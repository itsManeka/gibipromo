import { User } from '../../src/domain/entities/User';
import { Product } from '../../src/domain/entities/Product';
import { ActionType, AddProductAction } from '../../src/domain/entities/Action';
import { AmazonProduct } from '../../src/application/ports/AmazonProductAPI';

export const createTestUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  username: 'test_user',
  name: 'Test User',
  enabled: true,
  language: 'pt-BR',
  ...overrides
});

export const createTestAction = (asin: string, overrides?: Partial<AddProductAction>): AddProductAction => ({
  id: `action-${asin}`,
  user_id: 'user-1',
  type: ActionType.ADD_PRODUCT,
  created_at: new Date().toISOString(),
  product_link: `https://www.amazon.com.br/dp/${asin}/`,
  is_processed: 0,
  ...overrides
});

export const createAmazonProduct = (asin: string, overrides?: Partial<AmazonProduct>): AmazonProduct => ({
  offerId: `offer-${asin}`,
  title: `Test Product ${asin}`,
  fullPrice: 100,
  currentPrice: 90,
  inStock: true,
  imageUrl: `http://example.com/${asin}.jpg`,
  isPreOrder: false,
  ...overrides
});

export const createProduct = (asin: string, overrides?: Partial<Product>): Product => ({
  id: asin,
  offerid: `offer-${asin}`,
  title: `Test Product ${asin}`,
  preco_cheio: 100,
  preco: 95,
  menor_preco: 95,
  link: `https://amazon.com.br/dp/${asin}`,
  imagem: `http://example.com/${asin}.jpg`,
  usuarios: [],
  estoque: true,
  pre_venda: false,
  ...overrides
});