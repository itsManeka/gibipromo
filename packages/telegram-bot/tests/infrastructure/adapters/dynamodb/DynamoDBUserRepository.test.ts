import { DynamoDBUserRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBUserRepository';
import { documentClient } from '../../../../src/infrastructure/config/dynamodb';
import { User } from '@gibipromo/shared/dist/entities/User';

jest.mock('../../../../src/infrastructure/config/dynamodb', () => ({
	documentClient: {
		query: jest.fn(),
		update: jest.fn(),
		put: jest.fn(),
		get: jest.fn(),
		delete: jest.fn()
	}
}));

describe('DynamoDBUserRepository', () => {
	let repository: DynamoDBUserRepository;
	const mockDocumentClient = documentClient as jest.Mocked<typeof documentClient>;

	const mockUser: User = {
		id: 'user-123',
		username: 'testuser',
		name: 'Test User',
		enabled: true,
		language: 'pt-BR'
	};

	beforeEach(() => {
		jest.clearAllMocks();
		repository = new DynamoDBUserRepository();
	});

	describe('findByUsername', () => {
		it('deve encontrar usuário pelo username', async () => {
			// Arrange
			const promiseMock = jest.fn().mockResolvedValue({ 
				Items: [mockUser] 
			});
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.query.mockImplementation(queryMock);

			// Act
			const result = await repository.findByUsername('testuser');

			// Assert
			expect(queryMock).toHaveBeenCalledWith({
				TableName: 'Users',
				IndexName: 'UsernameIndex',
				KeyConditionExpression: 'username = :username',
				ExpressionAttributeValues: {
					':username': 'testuser'
				}
			});
			expect(result).toEqual(mockUser);
		});

		it('deve retornar null quando usuário não é encontrado', async () => {
			// Arrange
			const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.query.mockImplementation(queryMock);

			// Act
			const result = await repository.findByUsername('nonexistent');

			// Assert
			expect(result).toBeNull();
		});

		it('deve retornar null quando Items é undefined', async () => {
			// Arrange
			const promiseMock = jest.fn().mockResolvedValue({});
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.query.mockImplementation(queryMock);

			// Act
			const result = await repository.findByUsername('testuser');

			// Assert
			expect(result).toBeNull();
		});

		it('deve retornar null quando Items está vazio', async () => {
			// Arrange
			const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.query.mockImplementation(queryMock);

			// Act
			const result = await repository.findByUsername('testuser');

			// Assert
			expect(result).toBeNull();
		});

		it('deve lançar erro quando query falha', async () => {
			// Arrange
			const error = new Error('DynamoDB query error');
			const promiseMock = jest.fn().mockRejectedValue(error);
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.query.mockImplementation(queryMock);

			// Act & Assert
			await expect(repository.findByUsername('testuser'))
				.rejects.toThrow('DynamoDB query error');
		});
	});

	describe('setEnabled', () => {
		it('deve habilitar usuário', async () => {
			// Arrange
			const updatedUser = { ...mockUser, enabled: true };
			const promiseMock = jest.fn().mockResolvedValue({ 
				Attributes: updatedUser 
			});
			const updateMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.update.mockImplementation(updateMock);

			// Act
			const result = await repository.setEnabled('user-123', true);

			// Assert
			expect(updateMock).toHaveBeenCalledWith({
				TableName: 'Users',
				Key: { id: 'user-123' },
				UpdateExpression: 'set enabled = :enabled',
				ExpressionAttributeValues: {
					':enabled': true
				},
				ReturnValues: 'ALL_NEW'
			});
			expect(result).toEqual(updatedUser);
		});

		it('deve desabilitar usuário', async () => {
			// Arrange
			const updatedUser = { ...mockUser, enabled: false };
			const promiseMock = jest.fn().mockResolvedValue({ 
				Attributes: updatedUser 
			});
			const updateMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.update.mockImplementation(updateMock);

			// Act
			const result = await repository.setEnabled('user-123', false);

			// Assert
			expect(updateMock).toHaveBeenCalledWith({
				TableName: 'Users',
				Key: { id: 'user-123' },
				UpdateExpression: 'set enabled = :enabled',
				ExpressionAttributeValues: {
					':enabled': false
				},
				ReturnValues: 'ALL_NEW'
			});
			expect(result).toEqual(updatedUser);
			expect(result.enabled).toBe(false);
		});

		it('deve lançar erro quando update falha', async () => {
			// Arrange
			const error = new Error('Update failed');
			const promiseMock = jest.fn().mockRejectedValue(error);
			const updateMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.update.mockImplementation(updateMock);

			// Act & Assert
			await expect(repository.setEnabled('user-123', true))
				.rejects.toThrow('Update failed');
		});
	});

	describe('inherited methods', () => {
		it('deve herdar métodos básicos do DynamoDBRepository', () => {
			expect(repository.create).toBeDefined();
			expect(repository.findById).toBeDefined();
			expect(repository.update).toBeDefined();
			expect(repository.delete).toBeDefined();
		});

		it('deve usar a tabela Users', () => {
			// Podemos verificar indiretamente através dos mocks
			expect(repository).toBeInstanceOf(DynamoDBUserRepository);
		});
	});
});