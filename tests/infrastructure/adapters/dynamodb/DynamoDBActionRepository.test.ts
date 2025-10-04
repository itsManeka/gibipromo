import { DynamoDBActionRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBActionRepository';
import { documentClient } from '../../../../src/infrastructure/config/dynamodb';
import { ActionType, AddProductAction } from '../../../../src/domain/entities/Action';

jest.mock('../../../../src/infrastructure/config/dynamodb', () => ({
    documentClient: {
        query: jest.fn(),
        update: jest.fn(),
        put: jest.fn(),
        get: jest.fn(),
        delete: jest.fn()
    }
}));

describe('DynamoDBActionRepository', () => {
    let repository: DynamoDBActionRepository;
    const mockDocumentClient = documentClient as jest.Mocked<typeof documentClient>;

    const mockAddProductAction: AddProductAction = {
        id: 'action-123',
        user_id: 'user-1',
        type: ActionType.ADD_PRODUCT,
        created_at: '2024-01-01T00:00:00.000Z',
        value: 'https://amazon.com.br/dp/B01234567',
        is_processed: 0
    };

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new DynamoDBActionRepository();
    });

    describe('findByType', () => {
        it('deve buscar ações por tipo ordenadas por created_at', async () => {
            // Arrange
            const mockItems = [mockAddProductAction, { ...mockAddProductAction, id: 'action-124' }];
            const promiseMock = jest.fn().mockResolvedValue({ Items: mockItems });
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.query.mockImplementation(queryMock);

            // Act
            const result = await repository.findByType(ActionType.ADD_PRODUCT, 10);

            // Assert
            expect(queryMock).toHaveBeenCalledWith({
                TableName: 'Actions',
                IndexName: 'TypeCreatedIndex',
                KeyConditionExpression: '#type = :type',
                ExpressionAttributeNames: {
                    '#type': 'type'
                },
                ExpressionAttributeValues: {
                    ':type': ActionType.ADD_PRODUCT
                },
                Limit: 10,
                ScanIndexForward: true
            });
            expect(result).toEqual(mockItems);
        });

        it('deve retornar array vazio quando não há ações', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.query.mockImplementation(queryMock);

            // Act
            const result = await repository.findByType(ActionType.CHECK_PRODUCT, 5);

            // Assert
            expect(result).toEqual([]);
        });

        it('deve retornar array vazio quando Items é undefined', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({});
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.query.mockImplementation(queryMock);

            // Act
            const result = await repository.findByType(ActionType.ADD_PRODUCT, 5);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('findPendingByType', () => {
        it('deve buscar ações pendentes por tipo', async () => {
            // Arrange
            const mockItems = [mockAddProductAction];
            const promiseMock = jest.fn().mockResolvedValue({ Items: mockItems });
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.query.mockImplementation(queryMock);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Act
            const result = await repository.findPendingByType(ActionType.ADD_PRODUCT, 5);

            // Assert
            expect(queryMock).toHaveBeenCalledWith({
                TableName: 'Actions',
                IndexName: 'TypeProcessedIndex',
                KeyConditionExpression: '#type = :type AND #is_processed = :is_processed',
                ExpressionAttributeNames: {
                    '#type': 'type',
                    '#is_processed': 'is_processed'
                },
                ExpressionAttributeValues: {
                    ':type': ActionType.ADD_PRODUCT,
                    ':is_processed': 0
                },
                Limit: 5,
                ScanIndexForward: true
            });
            expect(result).toEqual(mockItems);
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Buscando 5 ações pendentes do tipo ADD_PRODUCT'
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Encontradas 1 ações pendentes do tipo ADD_PRODUCT'
            );

            consoleSpy.mockRestore();
        });

        it('deve retornar array vazio quando não há ações pendentes', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.query.mockImplementation(queryMock);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Act
            const result = await repository.findPendingByType(ActionType.CHECK_PRODUCT, 10);

            // Assert
            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Encontradas 0 ações pendentes do tipo CHECK_PRODUCT'
            );

            consoleSpy.mockRestore();
        });

        it('deve lançar erro quando query falha', async () => {
            // Arrange
            const error = new Error('DynamoDB error');
            const promiseMock = jest.fn().mockRejectedValue(error);
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.query.mockImplementation(queryMock);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act & Assert
            await expect(repository.findPendingByType(ActionType.ADD_PRODUCT, 5))
                .rejects.toThrow('DynamoDB error');

            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Erro ao buscar ações pendentes:',
                error
            );

            consoleSpy.mockRestore();
        });
    });

    describe('markProcessed', () => {
        it('deve marcar ação como processada', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({});
            const updateMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.update.mockImplementation(updateMock);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Act
            await repository.markProcessed('action-123');

            // Assert
            expect(updateMock).toHaveBeenCalledWith({
                TableName: 'Actions',
                Key: { id: 'action-123' },
                UpdateExpression: 'set is_processed = :is_processed',
                ExpressionAttributeValues: {
                    ':is_processed': 1
                }
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Marcando ação action-123 como processada'
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Ação action-123 marcada como processada com sucesso'
            );

            consoleSpy.mockRestore();
        });

        it('deve lançar erro quando update falha', async () => {
            // Arrange
            const error = new Error('Update failed');
            const promiseMock = jest.fn().mockRejectedValue(error);
            const updateMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.update.mockImplementation(updateMock);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Act & Assert
            await expect(repository.markProcessed('action-123'))
                .rejects.toThrow('Update failed');

            expect(consoleSpy).toHaveBeenCalledWith(
                '[DynamoDB] Erro ao marcar ação como processada:',
                error
            );

            consoleSpy.mockRestore();
        });
    });

    describe('inherited methods', () => {
        it('deve herdar métodos básicos do DynamoDBRepository', () => {
            expect(repository.create).toBeDefined();
            expect(repository.findById).toBeDefined();
            expect(repository.update).toBeDefined();
            expect(repository.delete).toBeDefined();
        });
    });
});