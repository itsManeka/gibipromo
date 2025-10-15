import { User } from '@gibipromo/shared/dist/entities/User';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ActionType, AddProductAction } from '@gibipromo/shared/dist/entities/Action';
import { AmazonProduct } from '../../src/application/ports/AmazonProductAPI';
import { ProductStats } from '@gibipromo/shared/dist/entities/ProductStats';

export const createTestUser = (overrides?: Partial<User>): User => ({
	id: 'user-1',
	username: 'test_user',
	name: 'Test User',
	enabled: true,
	language: 'pt-BR',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

export const createTestAction = (asin: string, overrides?: Partial<AddProductAction>): AddProductAction => ({
	id: `action-${asin}`,
	user_id: 'user-1',
	type: ActionType.ADD_PRODUCT,
	created_at: new Date().toISOString(),
	value: `https://www.amazon.com.br/dp/${asin}/`,
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
	url: `https://www.amazon.com.br/dp/${asin}/`,
	...overrides
});

export const createProduct = (asin: string, overrides?: Partial<Product>): Product => ({
	id: asin,
	offer_id: `offer-${asin}`,
	title: `Test Product ${asin}`,
	full_price: 100,
	price: 95,
	lowest_price: 95,
	url: `https://amazon.com.br/dp/${asin}`,
	image: `http://example.com/${asin}.jpg`,
	in_stock: true,
	preorder: false,
	store: 'Amazon',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

export const createProductStats = (overrides?: Partial<ProductStats>): ProductStats => ({
	id: 'stats-1',
	product_id: 'prod-1',
	price: 85,
	old_price: 100,
	percentage_change: 15,
	created_at: new Date().toISOString(),
	...overrides
});