import { DynamoDBActionRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBActionRepository';
import { DynamoDBUserRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBUserRepository';
import { DynamoDBProductRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBProductRepository';
import { MockAmazonPAAPIClient } from '../../../../src/infrastructure/adapters/amazon/MockAmazonPAAPIClient';
import { User } from '../../../../src/domain/entities/User';
import { Product } from '../../../../src/domain/entities/Product';
import { Action } from '../../../../src/domain/entities/Action';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { UserRepository } from '../../../../src/application/ports/UserRepository';
import { 
  AddProductActionProcessor 
} from '../../../../src/application/usecases/processors/AddProductActionProcessor';
import { 
  ActionType, 
  NotifyPriceAction,
  AddProductAction
} from '../../../../src/domain/entities/Action';
import { 
  createAmazonProduct, 
  createProduct, 
  createTestAction, 
  createTestUser 
} from '../../../test-helpers/factories';
import { AmazonProduct } from '../../../../src/application/ports/AmazonProductAPI';

/**
 * Mock completo do repositório de ações usando implementação em memória
 */
class MockActionRepository implements ActionRepository {
  private actions: Action[] = [];
  private idCounter = 1;

  async create(action: Omit<Action, 'id'> | Action): Promise<Action> {
    const newAction: Action = {
      ...action,
      id: 'id' in action && action.id ? action.id : `action-${this.idCounter++}` // Usa o ID existente se fornecido
    };
    this.actions.push(newAction);
    return newAction;
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

  async findByType(type: ActionType, limit?: number): Promise<Action[]> {
    const filtered = this.actions.filter(action => action.type === type);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async markProcessed(id: string): Promise<void> {
    const action = this.actions.find(a => a.id === id);
    if (action) {
      console.log(`[MockActionRepository] Marcando ação ${id} como processada. Antes: is_processed=${action.is_processed}`);
      action.is_processed = 1; // DynamoDB usa 1 para true
      console.log(`[MockActionRepository] Depois: is_processed=${action.is_processed}`);
    } else {
      console.log(`[MockActionRepository] Ação ${id} não encontrada para marcar como processada`);
    }
  }

  async findById(id: string): Promise<Action | null> {
    const action = this.actions.find(a => a.id === id) || null;
    if (action) {
      console.log(`[MockActionRepository] Encontrou ação ${id}: is_processed=${action.is_processed}`);
    } else {
      console.log(`[MockActionRepository] Ação ${id} não encontrada`);
    }
    return action;
  }

  async update(action: Action): Promise<Action> {
    const index = this.actions.findIndex(a => a.id === action.id);
    if (index !== -1) {
      this.actions[index] = action;
    }
    return action;
  }

  async delete(id: string): Promise<void> {
    const index = this.actions.findIndex(a => a.id === id);
    if (index !== -1) {
      this.actions.splice(index, 1);
    }
  }

  // Método auxiliar para testes
  clear(): void {
    this.actions = [];
    this.idCounter = 1;
  }
}

/**
 * Mock completo do repositório de usuários usando implementação em memória
 */
class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.username === username) || null;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async setEnabled(id: string, enabled: boolean): Promise<User> {
    const user = this.users.get(id);
    if (user) {
      user.enabled = enabled;
      return user;
    }
    throw new Error(`User ${id} not found`);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  // Método auxiliar para testes
  clear(): void {
    this.users.clear();
  }
}

/**
 * Extensão para mock do cliente Amazon
 */
class ExtendedMockAmazonPAAPIClient extends MockAmazonPAAPIClient {
  private mockProducts: Map<string, AmazonProduct> = new Map();

  setProducts(products: AmazonProduct[]): void {
    this.mockProducts.clear();
    for (const product of products) {
      // Use offerId since AmazonProduct doesn't have asin property
      const asin = product.offerId.replace('offer-', '');
      this.mockProducts.set(asin, product);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProducts(_asins: string[]): Promise<Map<string, AmazonProduct>> {
    return this.mockProducts;
  }
}

/**
 * Extensão para mock do repositório de produtos
 */
class ExtendedDynamoDBProductRepository extends DynamoDBProductRepository {
  private products: Map<string, Product> = new Map();

  async findAll(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async create(product: Product): Promise<Product> {
    this.products.set(product.id, product);
    return product;
  }

  async update(product: Product): Promise<Product> {
    this.products.set(product.id, product);
    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async addUser(productId: string, userId: string): Promise<void> {
    const product = this.products.get(productId);
    if (product) {
      if (!product.usuarios.includes(userId)) {
        product.usuarios.push(userId);
      }
    }
  }

  // Método auxiliar para testes
  clear(): void {
    this.products.clear();
  }
}

describe('AddProductActionProcessor Integration Tests', () => {
  let actionProcessor: AddProductActionProcessor;
  let actionRepository: MockActionRepository;
  let userRepository: MockUserRepository;
  let productRepository: ExtendedDynamoDBProductRepository;
  let amazonApi: ExtendedMockAmazonPAAPIClient;
  let defaultUser: User;

  beforeEach(async () => {
    // Setup repositories com mocks completos
    actionRepository = new MockActionRepository();
    userRepository = new MockUserRepository();
    productRepository = new ExtendedDynamoDBProductRepository();
    amazonApi = new ExtendedMockAmazonPAAPIClient();

    // Create processor
    actionProcessor = new AddProductActionProcessor(
      actionRepository,
      productRepository,
      userRepository,
      amazonApi
    );

    // Clear all repositories
    actionRepository.clear();
    userRepository.clear();
    productRepository.clear();

    // Create default test user
    defaultUser = createTestUser();
    await userRepository.create(defaultUser);
  });

  describe('Validações básicas', () => {
    it('deve ter o tipo ADD_PRODUCT', () => {
      expect(actionProcessor.actionType).toBe(ActionType.ADD_PRODUCT);
    });

    it('deve ignorar ação se o usuário não existe', async () => {
      // Arrange
      const nonExistentUserId = 'user123';
      const action = createTestAction('B0123456789', {
        user_id: nonExistentUserId
      });
      
      // Adiciona a ação no repositório primeiro
      const createdAction = await actionRepository.create(action);

      // Act
      await actionProcessor.process(createdAction as AddProductAction);

      // Assert
      const updatedAction = await actionRepository.findById(createdAction.id);
      expect(updatedAction?.is_processed).toBe(1);
    });

    it('deve ignorar ação se o usuário está desativado', async () => {
      // Arrange
      const disabledUser = createTestUser({ enabled: false });
      await userRepository.create(disabledUser);

      const action = createTestAction('B0123456789', {
        user_id: disabledUser.id
      });
      
      // Adiciona a ação no repositório primeiro
      const createdAction = await actionRepository.create(action);

      // Act
      await actionProcessor.process(createdAction as AddProductAction);

      // Assert
      const updatedAction = await actionRepository.findById(createdAction.id);
      expect(updatedAction?.is_processed).toBe(1);
    });
  });

  describe('Validação de URLs', () => {
    it.each([
      'https://www.amazon.com.br/dp/B012345678',
      'https://amazon.com.br/dp/B012345678/',
      'https://www.amazon.com.br/dp/b012345678',
      'https://amazon.com.br/product/B012345678',
      'https://www.amazon.com.br/product/B012345678/',
      'https://amazon.com.br/dp/B012345678?ref=123',
      'https://amazon.com.br/product/B012345678?psc=1'
    ])('deve extrair ASIN corretamente de %s', async (url) => {
      // Arrange
      const action = createTestAction('B012345678', {
        product_link: url
      });

      const amazonProduct = createAmazonProduct('B012345678');
      amazonApi.setProducts([amazonProduct]);
      
      // Adiciona a ação no repositório primeiro
      const createdAction = await actionRepository.create(action);

      // Act
      await actionProcessor.process(createdAction as AddProductAction);

      // Assert
      const updatedAction = await actionRepository.findById(createdAction.id);
      expect(updatedAction?.is_processed).toBe(1);

      const product = await productRepository.findById('B012345678');
      expect(product).toBeDefined();
      expect(product?.id).toBe('B012345678');
    });

    it.each([
      'https://amazon.com.br',
      'https://amazon.com.br/123',
      'https://amazon.com.br/dp/',
      'https://amazon.com.br/dp/123',
      'https://amazon.com.br/dp/B01234',
      'https://amazon.com.br/product/',
      'https://amazon.com.br/product/123',
      'https://amazon.com.br/product/B01234'
    ])('deve rejeitar URL inválida %s', async (url) => {
      // Arrange
      const action = createTestAction('B0123456789', {
        product_link: url
      });
      
      // Adiciona a ação no repositório primeiro
      const createdAction = await actionRepository.create(action);

      // Act
      await actionProcessor.process(createdAction as AddProductAction);

      // Assert
      const updatedAction = await actionRepository.findById(createdAction.id);
      expect(updatedAction?.is_processed).toBe(1);

      const products = await productRepository.findAll();
      expect(products).toHaveLength(0);
    });
  });

  describe('Processamento em lote', () => {
    it('deve processar múltiplos produtos em lote', async () => {
      // Arrange
      const products = [
        createAmazonProduct('B01234567'),
        createAmazonProduct('B98765432')
      ];

      const actions = [
        createTestAction('B01234567'),
        createTestAction('B98765432')
      ];

      // Registra ações
      await Promise.all(actions.map(action => actionRepository.create(action)));

      // Configura produtos mock
      amazonApi.setProducts(products);

      // Act
      const processedCount = await actionProcessor.processNext(10);

      // Assert
      expect(processedCount).toBe(2);

      const savedProducts = await productRepository.findAll();
      expect(savedProducts).toHaveLength(2);

      const updatedActions = await Promise.all(
        actions.map(action => actionRepository.findById(action.id))
      );
      expect(updatedActions.every(action => action?.is_processed === 1)).toBe(true);
    });

    it('deve criar notificação quando preço diminui', async () => {
      // Arrange
      const originalProduct = createProduct('B012345678', {
        preco: 100
      });
      await productRepository.create(originalProduct);

      const action = createTestAction('B012345678');
      await actionRepository.create(action); // Criar ação no repositório antes de processar

      const amazonProduct = createAmazonProduct('B012345678', {
        currentPrice: 80,
        fullPrice: 100
      });

      amazonApi.setProducts([amazonProduct]);

      // Act
      await actionProcessor.process(action);

      // Assert
      // Confirma que a ação original foi processada  
      const updatedAction = await actionRepository.findById(action.id);
      expect(updatedAction?.is_processed).toBe(1);

      // Busca ações de notificação criadas
      const notifyActions = await actionRepository.findPendingByType(ActionType.NOTIFY_PRICE, 10);
      expect(notifyActions).toHaveLength(1);

      const notifyAction = notifyActions[0] as NotifyPriceAction;
      expect(notifyAction.product_id).toBe('B012345678');
      expect(notifyAction.old_price).toBe(100);
      expect(notifyAction.new_price).toBe(80);
    });
  });
});