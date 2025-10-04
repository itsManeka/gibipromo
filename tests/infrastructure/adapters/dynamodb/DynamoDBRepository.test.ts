import { DynamoDBRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBRepository';
import { documentClient } from '../../../../src/infrastructure/config/dynamodb';
import { Entity } from '../../../../src/domain/entities/Entity';

jest.mock('../../../../src/infrastructure/config/dynamodb', () => ({
    documentClient: {
        put: jest.fn(),
        get: jest.fn(),
        delete: jest.fn()
    }
}));

// Classe concreta para testar a classe abstrata
class TestEntity implements Entity {
    constructor(public id: string, public name: string) {}
}

class TestRepository extends DynamoDBRepository<TestEntity> {
    constructor() {
        super('TestTable');
    }
}

describe('DynamoDBRepository', () => {
    let repository: TestRepository;
    const mockDocumentClient = documentClient as jest.Mocked<typeof documentClient>;

    const mockEntity: TestEntity = {
        id: 'test-123',
        name: 'Test Entity'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new TestRepository();
    });

    describe('create', () => {
        it('deve criar uma entidade', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({});
            const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.put.mockImplementation(putMock);

            // Act
            const result = await repository.create(mockEntity);

            // Assert
            expect(putMock).toHaveBeenCalledWith({
                TableName: 'TestTable',
                Item: mockEntity
            });
            expect(result).toEqual(mockEntity);
        });

        it('deve lançar erro quando put falha', async () => {
            // Arrange
            const error = new Error('DynamoDB put error');
            const promiseMock = jest.fn().mockRejectedValue(error);
            const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.put.mockImplementation(putMock);

            // Act & Assert
            await expect(repository.create(mockEntity))
                .rejects.toThrow('DynamoDB put error');
        });
    });

    describe('findById', () => {
        it('deve encontrar entidade por ID', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({ 
                Item: mockEntity 
            });
            const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.get.mockImplementation(getMock);

            // Act
            const result = await repository.findById('test-123');

            // Assert
            expect(getMock).toHaveBeenCalledWith({
                TableName: 'TestTable',
                Key: { id: 'test-123' }
            });
            expect(result).toEqual(mockEntity);
        });

        it('deve retornar null quando entidade não é encontrada', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({});
            const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.get.mockImplementation(getMock);

            // Act
            const result = await repository.findById('nonexistent');

            // Assert
            expect(result).toBeNull();
        });

        it('deve retornar null quando Item é undefined', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({ Item: undefined });
            const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.get.mockImplementation(getMock);

            // Act
            const result = await repository.findById('test-123');

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
            await expect(repository.findById('test-123'))
                .rejects.toThrow('DynamoDB get error');
        });
    });

    describe('update', () => {
        it('deve atualizar uma entidade', async () => {
            // Arrange
            const updatedEntity = { ...mockEntity, name: 'Updated Name' };
            const promiseMock = jest.fn().mockResolvedValue({});
            const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.put.mockImplementation(putMock);

            // Act
            const result = await repository.update(updatedEntity);

            // Assert
            expect(putMock).toHaveBeenCalledWith({
                TableName: 'TestTable',
                Item: updatedEntity
            });
            expect(result).toEqual(updatedEntity);
        });

        it('deve lançar erro quando put falha na atualização', async () => {
            // Arrange
            const error = new Error('DynamoDB update error');
            const promiseMock = jest.fn().mockRejectedValue(error);
            const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.put.mockImplementation(putMock);

            // Act & Assert
            await expect(repository.update(mockEntity))
                .rejects.toThrow('DynamoDB update error');
        });
    });

    describe('delete', () => {
        it('deve deletar uma entidade', async () => {
            // Arrange
            const promiseMock = jest.fn().mockResolvedValue({});
            const deleteMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.delete.mockImplementation(deleteMock);

            // Act
            await repository.delete('test-123');

            // Assert
            expect(deleteMock).toHaveBeenCalledWith({
                TableName: 'TestTable',
                Key: { id: 'test-123' }
            });
        });

        it('deve lançar erro quando delete falha', async () => {
            // Arrange
            const error = new Error('DynamoDB delete error');
            const promiseMock = jest.fn().mockRejectedValue(error);
            const deleteMock = jest.fn().mockReturnValue({ promise: promiseMock });
            mockDocumentClient.delete.mockImplementation(deleteMock);

            // Act & Assert
            await expect(repository.delete('test-123'))
                .rejects.toThrow('DynamoDB delete error');
        });
    });

    describe('tableName protection', () => {
        it('deve usar o nome da tabela correto', () => {
            // Podemos verificar indiretamente através dos mocks que a tabela é usada corretamente
            expect(repository).toBeInstanceOf(TestRepository);
        });
    });
});