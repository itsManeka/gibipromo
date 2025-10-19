import { NotifyPriceActionProcessor } from '../../../../src/application/usecases/processors/NotifyPriceActionProcessor';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { ProductUserRepository } from '../../../../src/application/ports/ProductUserRepository';
import { UserRepository } from '../../../../src/application/ports/UserRepository';
import { TelegramNotifier } from '../../../../src/infrastructure/adapters/telegram';
import { ActionType, NotifyPriceAction } from '@gibipromo/shared/dist/entities/Action';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ProductUser } from '@gibipromo/shared/dist/entities/ProductUser';
import { createProduct, createMockNotificationRepository } from '../../../test-helpers/factories';

jest.mock('../../../../src/application/ports/ActionRepository');
jest.mock('../../../../src/application/ports/ProductRepository');
jest.mock('../../../../src/application/ports/ProductUserRepository');
jest.mock('../../../../src/application/ports/UserRepository');
jest.mock('../../../../src/infrastructure/adapters/telegram');

describe('NotifyPriceActionProcessor', () => {
	let processor: NotifyPriceActionProcessor;
	let mockActionRepo: jest.Mocked<ActionRepository>;
	let mockProductRepo: jest.Mocked<ProductRepository>;
	let mockProductUserRepo: jest.Mocked<ProductUserRepository>;
	let mockUserRepo: jest.Mocked<UserRepository>;
	let mockNotifier: jest.Mocked<TelegramNotifier>;

	const mockNotifyAction: NotifyPriceAction = {
		id: 'notify-123',
		type: ActionType.NOTIFY_PRICE,
		value: 'B01234567',
		created_at: '2024-01-01T00:00:00.000Z',
		is_processed: 0
	};

	const mockProduct: Product = createProduct('B01234567', {
		price: 80,
		old_price: 100
	});

	const mockProductUsers: ProductUser[] = [
		{
			id: 'pu1',
			product_id: 'B01234567',
			user_id: 'user1',
			desired_price: 90,
			created_at: '2024-01-01T00:00:00.000Z',
			updated_at: '2024-01-01T00:00:00.000Z'
		},
		{
			id: 'pu2',
			product_id: 'B01234567',
			user_id: 'user2',
			desired_price: 85,
			created_at: '2024-01-01T00:00:00.000Z',
			updated_at: '2024-01-01T00:00:00.000Z'
		}
	];

	beforeEach(() => {
		mockActionRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByType: jest.fn(),
			findPendingByType: jest.fn(),
			markProcessed: jest.fn()
		};

		mockProductRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByLink: jest.fn(),
			getNextProductsToCheck: jest.fn()
		};

		mockProductUserRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByProductAndUser: jest.fn(),
			findByProductId: jest.fn(),
			findByUserId: jest.fn(),
			upsert: jest.fn(),
			updateDesiredPrice: jest.fn(),
			removeByProductAndUser: jest.fn()
		};

		mockUserRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByUsername: jest.fn(),
			findByTelegramId: jest.fn(),
			findByEmail: jest.fn(),
			setEnabled: jest.fn(),
			updateSessionId: jest.fn()
		};

		mockNotifier = {
			notifyPriceChange: jest.fn()
		} as any;

		const mockNotificationRepository = createMockNotificationRepository();

		processor = new NotifyPriceActionProcessor(
			mockActionRepo,
			mockProductRepo,
			mockProductUserRepo,
			mockUserRepo,
			mockNotifier,
			mockNotificationRepository
		);

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('process', () => {
		it('deve notificar todos os usuários que monitoram o produto', async () => {
			// Arrange
			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductId.mockResolvedValue(mockProductUsers);
			
			// Mock users with telegram_id
			const mockUser1 = { 
				id: 'user1', 
				telegram_id: '123456789', 
				username: 'testuser1',
				name: 'Test User 1',
				language: 'pt-BR',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			const mockUser2 = { 
				id: 'user2', 
				telegram_id: '987654321', 
				username: 'testuser2',
				name: 'Test User 2',
				language: 'pt-BR',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			mockUserRepo.findById.mockImplementation((userId: string) => {
				if (userId === 'user1') return Promise.resolve(mockUser1);
				if (userId === 'user2') return Promise.resolve(mockUser2);
				return Promise.resolve(null);
			});
			
			mockNotifier.notifyPriceChange.mockResolvedValue();

			// Act
			await processor.process(mockNotifyAction);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
			expect(mockProductUserRepo.findByProductId).toHaveBeenCalledWith('B01234567');
			expect(mockUserRepo.findById).toHaveBeenCalledWith('user1');
			expect(mockUserRepo.findById).toHaveBeenCalledWith('user2');
			expect(mockNotifier.notifyPriceChange).toHaveBeenCalledTimes(2);
			expect(mockNotifier.notifyPriceChange).toHaveBeenCalledWith(
				'123456789',
				mockProduct,
				100,
				80
			);
			expect(mockNotifier.notifyPriceChange).toHaveBeenCalledWith(
				'987654321',
				mockProduct,
				100,
				80
			);
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith('notify-123');
		});

		it('deve marcar ação como processada quando produto não é encontrado', async () => {
			// Arrange
			mockProductRepo.findById.mockResolvedValue(null);

			// Act
			await processor.process(mockNotifyAction);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
			expect(mockNotifier.notifyPriceChange).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith('notify-123');
		});

		it('deve marcar ação como processada quando não há usuários monitorando', async () => {
			// Arrange
			const productWithoutUsers = createProduct('B01234567');
			mockProductRepo.findById.mockResolvedValue(productWithoutUsers);
			mockProductUserRepo.findByProductId.mockResolvedValue([]);

			// Act
			await processor.process(mockNotifyAction);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
			expect(mockProductUserRepo.findByProductId).toHaveBeenCalledWith('B01234567');
			expect(mockNotifier.notifyPriceChange).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith('notify-123');
		});

		it('deve marcar ação como processada quando users é undefined', async () => {
			// Arrange
			const productWithUndefinedUsers = createProduct('B01234567');
			mockProductRepo.findById.mockResolvedValue(productWithUndefinedUsers);
			mockProductUserRepo.findByProductId.mockResolvedValue([]);

			// Act
			await processor.process(mockNotifyAction);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
			expect(mockProductUserRepo.findByProductId).toHaveBeenCalledWith('B01234567');
			expect(mockNotifier.notifyPriceChange).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith('notify-123');
		});

		it('não deve marcar como processada quando há erro na notificação', async () => {
			// Arrange
			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductId.mockResolvedValue(mockProductUsers);
			
			// Mock users with telegram_id
			const mockUser1 = { 
				id: 'user1', 
				telegram_id: '123456789', 
				username: 'testuser1',
				name: 'Test User 1',
				language: 'pt-BR',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			const mockUser2 = { 
				id: 'user2', 
				telegram_id: '987654321', 
				username: 'testuser2',
				name: 'Test User 2',
				language: 'pt-BR',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			mockUserRepo.findById.mockImplementation((userId: string) => {
				if (userId === 'user1') return Promise.resolve(mockUser1);
				if (userId === 'user2') return Promise.resolve(mockUser2);
				return Promise.resolve(null);
			});
			
			mockNotifier.notifyPriceChange.mockRejectedValue(new Error('Network error'));

			// Act
			await processor.process(mockNotifyAction);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
			expect(mockProductUserRepo.findByProductId).toHaveBeenCalledWith('B01234567');
			expect(mockUserRepo.findById).toHaveBeenCalled();
			expect(mockNotifier.notifyPriceChange).toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).not.toHaveBeenCalled();
		});

		it('não deve marcar como processada quando há erro ao buscar produto', async () => {
			// Arrange
			mockProductRepo.findById.mockRejectedValue(new Error('Database error'));

			// Act
			await processor.process(mockNotifyAction);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
			expect(mockNotifier.notifyPriceChange).not.toHaveBeenCalled();
			expect(mockActionRepo.markProcessed).not.toHaveBeenCalled();
		});
	});

	describe('processNext', () => {
		it('deve processar múltiplas ações de notificação', async () => {
			// Arrange
			const actions = [
				{ ...mockNotifyAction, id: 'notify-1' },
				{ ...mockNotifyAction, id: 'notify-2' }
			];
			mockActionRepo.findPendingByType.mockResolvedValue(actions);
			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductId.mockResolvedValue(mockProductUsers);
			
			// Mock users with telegram_id
			const mockUser1 = { 
				id: 'user1', 
				telegram_id: '123456789', 
				username: 'testuser1',
				name: 'Test User 1',
				language: 'pt-BR',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			const mockUser2 = { 
				id: 'user2', 
				telegram_id: '987654321', 
				username: 'testuser2',
				name: 'Test User 2',
				language: 'pt-BR',
				enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			mockUserRepo.findById.mockImplementation((userId: string) => {
				if (userId === 'user1') return Promise.resolve(mockUser1);
				if (userId === 'user2') return Promise.resolve(mockUser2);
				return Promise.resolve(null);
			});
			
			mockNotifier.notifyPriceChange.mockResolvedValue();

			// Act
			const result = await processor.processNext(2);

			// Assert
			expect(mockActionRepo.findPendingByType).toHaveBeenCalledWith(ActionType.NOTIFY_PRICE, 2);
			expect(mockProductRepo.findById).toHaveBeenCalledTimes(2);
			expect(mockActionRepo.markProcessed).toHaveBeenCalledTimes(2);
			expect(result).toBe(2);
		});

		it('deve retornar 0 quando não há ações para processar', async () => {
			// Arrange
			mockActionRepo.findPendingByType.mockResolvedValue([]);

			// Act
			const result = await processor.processNext(5);

			// Assert
			expect(mockActionRepo.findPendingByType).toHaveBeenCalledWith(ActionType.NOTIFY_PRICE, 5);
			expect(mockProductRepo.findById).not.toHaveBeenCalled();
			expect(result).toBe(0);
		});
	});

	describe('actionType', () => {
		it('deve ter o tipo correto de ação', () => {
			expect(processor.actionType).toBe(ActionType.NOTIFY_PRICE);
		});
	});
});