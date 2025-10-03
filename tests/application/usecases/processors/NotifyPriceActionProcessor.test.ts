import { NotifyPriceActionProcessor } from '../../../../src/application/usecases/processors/NotifyPriceActionProcessor';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { TelegramNotifier } from '../../../../src/infrastructure/adapters/telegram';
import { ActionType, NotifyPriceAction } from '../../../../src/domain/entities/Action';
import { Product } from '../../../../src/domain/entities/Product';
import { createProduct } from '../../../test-helpers/factories';

jest.mock('../../../../src/application/ports/ActionRepository');
jest.mock('../../../../src/application/ports/ProductRepository');
jest.mock('../../../../src/infrastructure/adapters/telegram');

describe('NotifyPriceActionProcessor', () => {
  let processor: NotifyPriceActionProcessor;
  let mockActionRepo: jest.Mocked<ActionRepository>;
  let mockProductRepo: jest.Mocked<ProductRepository>;
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
    old_price: 100,
    users: ['user1', 'user2']
  });

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
      findByUserId: jest.fn(),
      findByLink: jest.fn(),
      addUser: jest.fn(),
      removeUser: jest.fn(),
      getNextProductsToCheck: jest.fn()
    };

    mockNotifier = {
      notifyPriceChange: jest.fn()
    } as any;

    processor = new NotifyPriceActionProcessor(
      mockActionRepo,
      mockProductRepo,
      mockNotifier
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('deve notificar todos os usuários que monitoram o produto', async () => {
      // Arrange
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockNotifier.notifyPriceChange.mockResolvedValue();

      // Act
      await processor.process(mockNotifyAction);

      // Assert
      expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
      expect(mockNotifier.notifyPriceChange).toHaveBeenCalledTimes(2);
      expect(mockNotifier.notifyPriceChange).toHaveBeenCalledWith(
        'user1',
        mockProduct,
        100,
        80
      );
      expect(mockNotifier.notifyPriceChange).toHaveBeenCalledWith(
        'user2',
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
      const productWithoutUsers = createProduct('B01234567', { users: [] });
      mockProductRepo.findById.mockResolvedValue(productWithoutUsers);

      // Act
      await processor.process(mockNotifyAction);

      // Assert
      expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
      expect(mockNotifier.notifyPriceChange).not.toHaveBeenCalled();
      expect(mockActionRepo.markProcessed).toHaveBeenCalledWith('notify-123');
    });

    it('deve marcar ação como processada quando users é undefined', async () => {
      // Arrange
      const productWithUndefinedUsers = createProduct('B01234567', { users: undefined as any });
      mockProductRepo.findById.mockResolvedValue(productWithUndefinedUsers);

      // Act
      await processor.process(mockNotifyAction);

      // Assert
      expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
      expect(mockNotifier.notifyPriceChange).not.toHaveBeenCalled();
      expect(mockActionRepo.markProcessed).toHaveBeenCalledWith('notify-123');
    });

    it('não deve marcar como processada quando há erro na notificação', async () => {
      // Arrange
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockNotifier.notifyPriceChange.mockRejectedValue(new Error('Network error'));

      // Act
      await processor.process(mockNotifyAction);

      // Assert
      expect(mockProductRepo.findById).toHaveBeenCalledWith('B01234567');
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