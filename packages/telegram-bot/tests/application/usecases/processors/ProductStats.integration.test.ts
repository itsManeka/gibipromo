import { AddProductActionProcessor } from '../../../../src/application/usecases/processors/AddProductActionProcessor';
import { CheckProductActionProcessor } from '../../../../src/application/usecases/processors/CheckProductActionProcessor';
import { ProductStatsService } from '../../../../src/application/usecases/ProductStatsService';
import { MockAmazonPAAPIClient } from '../../../../src/infrastructure/adapters/amazon/MockAmazonPAAPIClient';
import { ProductStatsRepository } from '../../../../src/application/ports/ProductStatsRepository';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { ProductUserRepository } from '../../../../src/application/ports/ProductUserRepository';
import { UserRepository } from '../../../../src/application/ports/UserRepository';
import { ProductStats } from '@gibipromo/shared/dist/entities/ProductStats';
import { ProductUser } from '@gibipromo/shared/dist/entities/ProductUser';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { User } from '@gibipromo/shared/dist/entities/User';
import { Action, ActionType, CheckProductAction } from '@gibipromo/shared/dist/entities/Action';
import {
	createTestUser,
	createTestAction,
	createAmazonProduct,
	createProduct
} from '../../../test-helpers/factories';

/**
 * Mock repositories para testes de integração
 */
class MockActionRepository implements ActionRepository {
	private actions: Action[] = [];
	private idCounter = 1;

	async create(action: Omit<Action, 'id'> | Action): Promise<Action> {
		const newAction: Action = {
			...action,
			id: 'id' in action && action.id ? action.id : `action-${this.idCounter++}`
		};
		this.actions.push(newAction);
		return newAction;
	}

	async findById(id: string): Promise<Action | null> {
		return this.actions.find(a => a.id === id) || null;
	}

	async update(action: Action): Promise<Action> {
		const index = this.actions.findIndex(a => a.id === action.id);
		if (index >= 0) {
			this.actions[index] = action;
		}
		return action;
	}

	async delete(id: string): Promise<void> {
		const index = this.actions.findIndex(a => a.id === id);
		if (index >= 0) {
			this.actions.splice(index, 1);
		}
	}

	async findByType(type: ActionType, limit: number): Promise<Action[]> {
		return this.actions.filter(a => a.type === type).slice(0, limit);
	}

	async findUnprocessed(type: ActionType, limit?: number): Promise<Action[]> {
		const filtered = this.actions.filter(
			action => action.type === type && action.is_processed === 0
		);
		return limit ? filtered.slice(0, limit) : filtered;
	}

	async findPendingByType(type: ActionType, limit?: number): Promise<Action[]> {
		return this.findUnprocessed(type, limit);
	}

	async markProcessed(actionId: string): Promise<void> {
		const action = this.actions.find(a => a.id === actionId);
		if (action) {
			action.is_processed = 1;
		}
	}
}

class MockUserRepository implements UserRepository {
	private users: User[] = [];

	constructor() {
		this.users.push(createTestUser());
	}

	async create(user: User): Promise<User> {
		this.users.push(user);
		return user;
	}

	async findById(id: string): Promise<User | null> {
		return this.users.find(u => u.id === id) || null;
	}

	async findByUsername(username: string): Promise<User | null> {
		return this.users.find(u => u.username === username) || null;
	}

	async update(user: User): Promise<User> {
		const index = this.users.findIndex(u => u.id === user.id);
		if (index >= 0) {
			this.users[index] = user;
		}
		return user;
	}

	async delete(id: string): Promise<void> {
		const index = this.users.findIndex(u => u.id === id);
		if (index >= 0) {
			this.users.splice(index, 1);
		}
	}

	async setEnabled(id: string, enabled: boolean): Promise<User> {
		const user = await this.findById(id);
		if (user) {
			user.enabled = enabled;
			return this.update(user);
		}
		throw new Error(`User not found: ${id}`);
	}
}

class MockProductRepository implements ProductRepository {
	private products: Product[] = [];

	async create(product: Product): Promise<Product> {
		this.products.push(product);
		return product;
	}

	async findById(id: string): Promise<Product | null> {
		return this.products.find(p => p.id === id) || null;
	}

	async findByLink(link: string): Promise<Product | null> {
		return this.products.find(p => p.url === link) || null;
	}

	async update(product: Product): Promise<Product> {
		const index = this.products.findIndex(p => p.id === product.id);
		if (index >= 0) {
			this.products[index] = product;
		}
		return product;
	}

	async delete(id: string): Promise<void> {
		const index = this.products.findIndex(p => p.id === id);
		if (index >= 0) {
			this.products.splice(index, 1);
		}
	}

	async getNextProductsToCheck(limit: number): Promise<Product[]> {
		return this.products.slice(0, limit);
	}
}

class MockProductUserRepository implements ProductUserRepository {
	private productUsers: ProductUser[] = [];

	async findById(id: string): Promise<ProductUser | null> {
		return this.productUsers.find(pu => pu.id === id) || null;
	}

	async findByProductAndUser(productId: string, userId: string): Promise<ProductUser | null> {
		return this.productUsers.find(pu => pu.product_id === productId && pu.user_id === userId) || null;
	}

	async findByProductId(productId: string): Promise<ProductUser[]> {
		return this.productUsers.filter(pu => pu.product_id === productId);
	}

	async findByUserId(userId: string, page: number, pageSize: number): Promise<{
		productUsers: ProductUser[];
		total: number;
	}> {
		const filtered = this.productUsers.filter(pu => pu.user_id === userId);
		const total = filtered.length;
		const start = (page - 1) * pageSize;
		const productUsers = filtered.slice(start, start + pageSize);
		return { productUsers, total };
	}

	async create(productUser: ProductUser): Promise<ProductUser> {
		this.productUsers.push(productUser);
		return productUser;
	}

	async upsert(productUser: ProductUser): Promise<void> {
		const existing = await this.findByProductAndUser(productUser.product_id, productUser.user_id);
		if (existing) {
			const index = this.productUsers.findIndex(pu => pu.id === existing.id);
			this.productUsers[index] = { ...productUser, id: existing.id };
		} else {
			const newProductUser = { ...productUser, id: `${productUser.product_id}#${productUser.user_id}` };
			this.productUsers.push(newProductUser);
		}
	}

	async update(productUser: ProductUser): Promise<ProductUser> {
		const index = this.productUsers.findIndex(pu => pu.id === productUser.id);
		if (index !== -1) {
			this.productUsers[index] = productUser;
		}
		return productUser;
	}

	async removeByProductAndUser(productId: string, userId: string): Promise<void> {
		this.productUsers = this.productUsers.filter(
			pu => !(pu.product_id === productId && pu.user_id === userId)
		);
	}

	async updateDesiredPrice(productId: string, userId: string, desiredPrice: number): Promise<void> {
		const productUser = await this.findByProductAndUser(productId, userId);
		if (productUser) {
			productUser.desired_price = desiredPrice;
			productUser.updated_at = new Date().toISOString();
			await this.update(productUser);
		}
	}

	async delete(id: string): Promise<void> {
		this.productUsers = this.productUsers.filter(pu => pu.id !== id);
	}
}

class MockProductStatsRepository implements ProductStatsRepository {
	private stats: ProductStats[] = [];

	async create(stats: ProductStats): Promise<ProductStats> {
		this.stats.push(stats);
		return stats;
	}

	async findById(id: string): Promise<ProductStats | null> {
		return this.stats.find(s => s.id === id) || null;
	}

	async update(stats: ProductStats): Promise<ProductStats> {
		const index = this.stats.findIndex(s => s.id === stats.id);
		if (index >= 0) {
			this.stats[index] = stats;
		}
		return stats;
	}

	async delete(id: string): Promise<void> {
		const index = this.stats.findIndex(s => s.id === id);
		if (index >= 0) {
			this.stats.splice(index, 1);
		}
	}

	async findByProductId(productId: string): Promise<ProductStats[]> {
		return this.stats.filter(s => s.product_id === productId);
	}

	async findLatest(limit: number): Promise<ProductStats[]> {
		return this.stats
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.slice(0, limit);
	}

	async findByProductIdAndDateRange(
		productId: string,
		startDate: string,
		endDate: string
	): Promise<ProductStats[]> {
		return this.stats.filter(s =>
			s.product_id === productId &&
			s.created_at >= startDate &&
			s.created_at <= endDate
		);
	}

	// Método para acessar stats nos testes
	getAllStats(): ProductStats[] {
		return [...this.stats];
	}
}

describe('ProductStats Integration Tests', () => {
	let actionRepository: MockActionRepository;
	let userRepository: MockUserRepository;
	let productRepository: MockProductRepository;
	let productUserRepository: MockProductUserRepository;
	let productStatsRepository: MockProductStatsRepository;
	let productStatsService: ProductStatsService;
	let addProductProcessor: AddProductActionProcessor;
	let checkProductProcessor: CheckProductActionProcessor;
	let amazonApi: MockAmazonPAAPIClient;

	beforeEach(() => {
		actionRepository = new MockActionRepository();
		userRepository = new MockUserRepository();
		productRepository = new MockProductRepository();
		productUserRepository = new MockProductUserRepository();
		productStatsRepository = new MockProductStatsRepository();
		productStatsService = new ProductStatsService(productStatsRepository);
		amazonApi = new MockAmazonPAAPIClient();

		addProductProcessor = new AddProductActionProcessor(
			actionRepository,
			productRepository,
			productUserRepository,
			userRepository,
			amazonApi,
			productStatsService
		);

		checkProductProcessor = new CheckProductActionProcessor(
			actionRepository,
			productRepository,
			amazonApi,
			productStatsService
		);
	});

	describe('AddProductActionProcessor with ProductStats', () => {
		it('should create statistics when price reduces by 5% or more', async () => {
			const asin = 'B012345679';

			// Cria produto existente com preço inicial
			const existingProduct = createProduct(asin, {
				price: 100,
				old_price: 100
			});
			await productRepository.create(existingProduct);

			// Garante que o produto existe no MockAmazonPAAPIClient primeiro
			const amazonProduct = createAmazonProduct(asin, {
				currentPrice: 100 // Preço inicial igual ao produto existente
			});
			// Adiciona o produto diretamente ao mock para garantir controle do preço
			amazonApi['products'].set(asin, amazonProduct);

			// Agora simula a redução de preço
			amazonApi.simulatePriceChange(asin, 80);

			// Cria ação de adicionar produto
			const action = createTestAction(asin);

			// Processa a ação
			await addProductProcessor.process(action);

			// Verifica se as estatísticas foram criadas
			const stats = productStatsRepository.getAllStats();
			expect(stats).toHaveLength(1);
			expect(stats[0].product_id).toBe(asin);
			expect(stats[0].price).toBe(80);
			expect(stats[0].old_price).toBe(100);
			expect(stats[0].percentage_change).toBe(20);
		});

		it('should not create statistics when price reduces by less than 5%', async () => {
			const asin = 'B012345679';

			// Cria produto existente com preço inicial
			const existingProduct = createProduct(asin, {
				price: 100,
				old_price: 100
			});
			await productRepository.create(existingProduct);

			// Garante que o produto existe no MockAmazonPAAPIClient primeiro
			const amazonProduct = createAmazonProduct(asin, {
				currentPrice: 100 // Preço inicial igual ao produto existente
			});
			// Adiciona o produto diretamente ao mock para garantir controle do preço
			amazonApi['products'].set(asin, amazonProduct);

			// Amazon retorna produto com preço reduzido em apenas 3%
			amazonApi.simulatePriceChange(asin, 97);

			// Cria ação de adicionar produto
			const action = createTestAction(asin);

			// Processa a ação
			await addProductProcessor.process(action);

			// Verifica se nenhuma estatística foi criada
			const stats = productStatsRepository.getAllStats();
			expect(stats).toHaveLength(0);
		});

		it('should not create statistics when price increases', async () => {
			const asin = 'B012345679';

			// Cria produto existente com preço inicial
			const existingProduct = createProduct(asin, {
				price: 100,
				old_price: 100
			});
			await productRepository.create(existingProduct);

			// Garante que o produto existe no MockAmazonPAAPIClient primeiro
			const amazonProduct = createAmazonProduct(asin, {
				currentPrice: 100 // Preço inicial igual ao produto existente
			});
			// Adiciona o produto diretamente ao mock para garantir controle do preço
			amazonApi['products'].set(asin, amazonProduct);

			// Amazon retorna produto com preço aumentado
			amazonApi.simulatePriceChange(asin, 120);

			// Cria ação de adicionar produto
			const action = createTestAction(asin);

			// Processa a ação
			await addProductProcessor.process(action);

			// Verifica se nenhuma estatística foi criada
			const stats = productStatsRepository.getAllStats();
			expect(stats).toHaveLength(0);
		});
	});

	describe('CheckProductActionProcessor with ProductStats', () => {
		it('should create statistics when checking products with significant price drop', async () => {
			const asin = 'B012345679';

			// Cria produto existente com preço inicial
			const existingProduct = createProduct(asin, {
				price: 150,
				old_price: 150
			});
			await productRepository.create(existingProduct);

			// Garante que o produto existe no MockAmazonPAAPIClient primeiro
			const amazonProduct = createAmazonProduct(asin, {
				currentPrice: 150 // Preço inicial igual ao produto existente
			});
			// Adiciona o produto diretamente ao mock para garantir controle do preço
			amazonApi['products'].set(asin, amazonProduct);

			// Amazon retorna produto com preço reduzido em 10%
			amazonApi.simulatePriceChange(asin, 135);

			// Cria ação de verificar produto
			const checkAction: CheckProductAction = {
				id: 'check-1',
				user_id: 'user-1',
				type: ActionType.CHECK_PRODUCT,
				value: asin,
				created_at: new Date().toISOString(),
				is_processed: 0
			};

			// Processa a ação
			await checkProductProcessor.process(checkAction);

			// Verifica se as estatísticas foram criadas
			const stats = productStatsRepository.getAllStats();
			expect(stats).toHaveLength(1);
			expect(stats[0].product_id).toBe(asin);
			expect(stats[0].price).toBe(135);
			expect(stats[0].old_price).toBe(150);
			expect(stats[0].percentage_change).toBe(10);
		});

		it('should handle multiple price reductions correctly', async () => {
			const asin = 'B012345679';

			// Cria produto existente
			const existingProduct = createProduct(asin, {
				price: 100,
				old_price: 100
			});
			await productRepository.create(existingProduct);

			// Garante que o produto existe no MockAmazonPAAPIClient primeiro
			const amazonProduct = createAmazonProduct(asin, {
				currentPrice: 100 // Preço inicial igual ao produto existente
			});
			// Adiciona o produto diretamente ao mock para garantir controle do preço
			amazonApi['products'].set(asin, amazonProduct);

			// Primeira redução de preço (10%)
			amazonApi.simulatePriceChange(asin, 90);

			const checkAction1: CheckProductAction = {
				id: 'check-1',
				user_id: 'user-1',
				type: ActionType.CHECK_PRODUCT,
				value: asin,
				created_at: new Date().toISOString(),
				is_processed: 0
			};

			await checkProductProcessor.process(checkAction1);

			// Segunda redução de preço (mais 6% sobre o valor anterior)
			amazonApi.simulatePriceChange(asin, 85); // 90 -> 85 = 5.56% de redução

			const checkAction2: CheckProductAction = {
				id: 'check-2',
				user_id: 'user-1',
				type: ActionType.CHECK_PRODUCT,
				value: asin,
				created_at: new Date().toISOString(),
				is_processed: 0
			};

			await checkProductProcessor.process(checkAction2);

			// Verifica se ambas as estatísticas foram criadas
			const stats = productStatsRepository.getAllStats();
			expect(stats).toHaveLength(2);

			// Primeira estatística: 100 -> 90 (10% de redução)
			expect(stats[0].old_price).toBe(100);
			expect(stats[0].price).toBe(90);
			expect(stats[0].percentage_change).toBe(10);

			// Segunda estatística: 90 -> 85 (5.56% de redução)
			expect(stats[1].old_price).toBe(90);
			expect(stats[1].price).toBe(85);
			expect(stats[1].percentage_change).toBeCloseTo(5.56, 2);
		});
	});
});
