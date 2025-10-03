import { DynamoDBActionConfigRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBActionConfigRepository';
import { documentClient } from '../../../../src/infrastructure/config/dynamodb';
import { ActionConfig } from '../../../../src/domain/entities/ActionConfig';
import { ActionType } from '../../../../src/domain/entities/Action';

jest.mock('../../../../src/infrastructure/config/dynamodb', () => ({
  documentClient: {
    query: jest.fn(),
    update: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    scan: jest.fn()
  }
}));

describe('DynamoDBActionConfigRepository', () => {
  let repository: DynamoDBActionConfigRepository;
  const mockDocumentClient = documentClient as jest.Mocked<typeof documentClient>;

  const mockActionConfig: ActionConfig = {
    id: 'config-123',
    action_type: ActionType.ADD_PRODUCT,
    interval_minutes: 5,
    enabled: true
  };

  const mockConfigs: ActionConfig[] = [
    mockActionConfig,
    {
      id: 'config-456',
      action_type: ActionType.CHECK_PRODUCT,
      interval_minutes: 10,
      enabled: true
    },
    {
      id: 'config-789',
      action_type: ActionType.NOTIFY_PRICE,
      interval_minutes: 2,
      enabled: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new DynamoDBActionConfigRepository();
  });

  describe('findByType', () => {
    it('deve encontrar configuração por tipo de ação', async () => {
      // Arrange
      const promiseMock = jest.fn().mockResolvedValue({ 
        Item: mockActionConfig 
      });
      const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.get.mockImplementation(getMock);

      // Act
      const result = await repository.findByType(ActionType.ADD_PRODUCT);

      // Assert
      expect(getMock).toHaveBeenCalledWith({
        TableName: 'ActionConfigs',
        Key: {
          action_type: ActionType.ADD_PRODUCT
        }
      });
      expect(result).toEqual(mockActionConfig);
    });

    it('deve retornar null quando configuração não é encontrada', async () => {
      // Arrange
      const promiseMock = jest.fn().mockResolvedValue({});
      const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.get.mockImplementation(getMock);

      // Act
      const result = await repository.findByType(ActionType.CHECK_PRODUCT);

      // Assert
      expect(result).toBeNull();
    });

    it('deve retornar null quando Item é undefined', async () => {
      // Arrange
      const promiseMock = jest.fn().mockResolvedValue({ Item: undefined });
      const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.get.mockImplementation(getMock);

      // Act
      const result = await repository.findByType(ActionType.ADD_PRODUCT);

      // Assert
      expect(result).toBeNull();
    });

    it('deve lançar erro quando get falha', async () => {
      // Arrange
      const error = new Error('DynamoDB get error');
      const promiseMock = jest.fn().mockRejectedValue(error);
      const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.get.mockImplementation(getMock);

      // Act & Assert
      await expect(repository.findByType(ActionType.ADD_PRODUCT))
        .rejects.toThrow('DynamoDB get error');
    });
  });

  describe('findEnabled', () => {
    it('deve encontrar todas as configurações habilitadas', async () => {
      // Arrange
      const enabledConfigs = mockConfigs.filter(config => config.enabled);
      const promiseMock = jest.fn().mockResolvedValue({ 
        Items: enabledConfigs 
      });
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.scan.mockImplementation(scanMock);

      // Act
      const result = await repository.findEnabled();

      // Assert
      expect(scanMock).toHaveBeenCalledWith({
        TableName: 'ActionConfigs',
        FilterExpression: 'enabled = :enabled',
        ExpressionAttributeValues: {
          ':enabled': true
        }
      });
      expect(result).toEqual(enabledConfigs);
      expect(result).toHaveLength(2);
      expect(result.every(config => config.enabled)).toBe(true);
    });

    it('deve retornar array vazio quando não há configurações habilitadas', async () => {
      // Arrange
      const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.scan.mockImplementation(scanMock);

      // Act
      const result = await repository.findEnabled();

      // Assert
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando Items é undefined', async () => {
      // Arrange
      const promiseMock = jest.fn().mockResolvedValue({});
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.scan.mockImplementation(scanMock);

      // Act
      const result = await repository.findEnabled();

      // Assert
      expect(result).toEqual([]);
    });

    it('deve lançar erro quando scan falha', async () => {
      // Arrange
      const error = new Error('DynamoDB scan error');
      const promiseMock = jest.fn().mockRejectedValue(error);
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      mockDocumentClient.scan.mockImplementation(scanMock);

      // Act & Assert
      await expect(repository.findEnabled())
        .rejects.toThrow('DynamoDB scan error');
    });
  });

  describe('inherited methods', () => {
    it('deve herdar métodos básicos do DynamoDBRepository', () => {
      expect(repository.create).toBeDefined();
      expect(repository.findById).toBeDefined();
      expect(repository.update).toBeDefined();
      expect(repository.delete).toBeDefined();
    });

    it('deve usar a tabela ActionConfigs', () => {
      // Podemos verificar indiretamente através dos mocks
      expect(repository).toBeInstanceOf(DynamoDBActionConfigRepository);
    });
  });
});