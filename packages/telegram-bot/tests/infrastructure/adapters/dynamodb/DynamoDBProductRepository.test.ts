jest.mock('../../../../src/infrastructure/config/dynamodb', () => ({
	documentClient: {
		put: jest.fn(),
		update: jest.fn(),
		scan: jest.fn(),
		query: jest.fn(),
		get: jest.fn(),
		delete: jest.fn()
	}
}));

import { DynamoDBProductRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBProductRepository';
import { createProduct } from '../../../test-helpers/factories';
import { documentClient } from '../../../../src/infrastructure/config/dynamodb';

describe('DynamoDBProductRepository', () => {
	let repository: DynamoDBProductRepository;
	const mockDocumentClient = documentClient as jest.Mocked<typeof documentClient>;

	beforeEach(() => {
		jest.clearAllMocks();
		repository = new DynamoDBProductRepository();
	});

	describe('create', () => {
		it('deve criar produto com timestamps', async () => {
			const product = createProduct('B08PP8QHFQ', {
				title: 'Test Product',
				offer_id: 'offer-123',
				full_price: 100,
				price: 90,
				in_stock: true,
				url: 'https://amazon.com/product',
				image: 'image.jpg',
				preorder: false
			});

			const promiseMock = jest.fn().mockResolvedValue({});
			const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
			(documentClient.put as jest.Mock).mockImplementation(putMock);

			await repository.create(product);

			expect(putMock).toHaveBeenCalledWith(
				expect.objectContaining({
					TableName: 'Products',
					Item: expect.objectContaining({
						id: 'B08PP8QHFQ',
						title: 'Test Product',
						created_at: expect.any(String),
						updated_at: expect.any(String)
					})
				})
			);
		});
	});

	describe('update', () => {
		it('deve atualizar produto com novo timestamp', async () => {
			const product = createProduct('B08PP8QHFQ', {
				title: 'Updated Product',
				offer_id: 'offer-456',
				full_price: 120,
				price: 100,
				in_stock: true,
				url: 'https://amazon.com/updated-product',
				image: 'updated-image.jpg',
				preorder: false
			});

			const promiseMock = jest.fn().mockResolvedValue({});
			const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
			(documentClient.put as jest.Mock).mockImplementation(putMock);

			const result = await repository.update(product);

			expect(putMock).toHaveBeenCalledWith(
				expect.objectContaining({
					TableName: 'Products',
					Item: expect.objectContaining({
						id: 'B08PP8QHFQ',
						title: 'Updated Product',
						updated_at: expect.any(String)
					})
				})
			);
			expect(result.updated_at).toBeDefined();
			expect(result.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
			// O timestamp sempre é atualizado com o momento atual
			expect(result.id).toBe(product.id);
			expect(result.title).toBe(product.title);
		});

		it('deve manter dados originais e adicionar timestamp', async () => {
			const originalProduct = createProduct('B08PP8QHFQ', {
				title: 'Original Product',
				offer_id: 'offer-789',
				full_price: 150,
				price: 130,
				in_stock: false,
				url: 'https://amazon.com/original-product',
				image: 'original-image.jpg',
				preorder: true
			});

			const promiseMock = jest.fn().mockResolvedValue({});
			const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
			(documentClient.put as jest.Mock).mockImplementation(putMock);

			const result = await repository.update(originalProduct);

			expect(result).toEqual(expect.objectContaining({
				...originalProduct,
				updated_at: expect.any(String)
			}));
		});
	});

	describe('findByLink', () => {
		it('deve retornar produto quando encontrado', async () => {
			const mockProduct = createProduct('B08PP8QHFQ', {
				title: 'Kindle 11ª Geração',
				offer_id: 'offer-1',
				full_price: 149.99,
				price: 129.99,
				in_stock: true,
				url: 'https://amazon.com.br/dp/B08PP8QHFQ',
				image: 'https://images-amazon.com/image.jpg',
				preorder: false
			});

			const promiseMock = jest.fn().mockResolvedValue({ Items: [mockProduct] });
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			(documentClient.query as jest.Mock).mockImplementation(queryMock);

			const result = await repository.findByLink('https://amazon.com.br/dp/B08PP8QHFQ');

			expect(result).toEqual(mockProduct);
			expect(queryMock).toHaveBeenCalledWith(
				expect.objectContaining({
					TableName: 'Products',
					IndexName: 'UrlIndex',
					KeyConditionExpression: 'url = :url',
					ExpressionAttributeValues: { ':url': 'https://amazon.com.br/dp/B08PP8QHFQ' }
				})
			);
		});

		it('deve retornar null quando produto não encontrado', async () => {
			const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			(documentClient.query as jest.Mock).mockImplementation(queryMock);

			const result = await repository.findByLink('https://amazon.com.br/dp/NOT_FOUND');

			expect(result).toBeNull();
		});

		it('deve retornar null quando Items é undefined', async () => {
			const promiseMock = jest.fn().mockResolvedValue({});
			const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
			(documentClient.query as jest.Mock).mockImplementation(queryMock);

			const result = await repository.findByLink('https://amazon.com.br/dp/UNDEFINED_ITEMS');

			expect(result).toBeNull();
		});
	});

	describe('findById', () => {
		it('deve retornar produto quando encontrado', async () => {
			const mockProduct = createProduct('B08PP8QHFQ', {
				title: 'Test Product',
				offer_id: 'offer-123',
				full_price: 100,
				price: 90,
				in_stock: true,
				url: 'https://amazon.com/product',
				image: 'image.jpg',
				preorder: false
			});

			const promiseMock = jest.fn().mockResolvedValue({ Item: mockProduct });
			const getMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.get.mockImplementation(getMock);

			const result = await repository.findById('B08PP8QHFQ');

			expect(result).toEqual(mockProduct);
		});
	});

	describe('getNextProductsToCheck', () => {
		beforeEach(() => {
			// Reset console mocks
			console.log = jest.fn();
			console.error = jest.fn();
		});

		it('deve retornar produtos para verificar', async () => {
			const mockProducts = [
				createProduct('B08PP8QHFQ', {
					title: 'Kindle 11ª Geração',
					offer_id: 'offer-1',
					full_price: 149.99,
					price: 129.99,
					in_stock: true,
					url: 'https://amazon.com.br/dp/B08PP8QHFQ',
					image: 'https://images-amazon.com/image1.jpg',
					preorder: false
				})
			];

			const promiseMock = jest.fn().mockResolvedValue({ Items: mockProducts });
			const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.scan.mockImplementation(scanMock);

			const result = await repository.getNextProductsToCheck(1);

			expect(result).toEqual(mockProducts);
			expect(result).toHaveLength(1);
			expect(console.log).toHaveBeenCalledWith('[DynamoDB] Buscando próximos 1 produtos para verificar');
			expect(console.log).toHaveBeenCalledWith('[DynamoDB] Encontrados 1 produtos para verificar');
		});

		it('deve usar ExclusiveStartKey quando há lastEvaluatedKey', async () => {
			const mockProducts = [
				createProduct('B08PP8QHFQ', {
					title: 'Product 1',
					offer_id: 'offer-1',
					full_price: 100,
					price: 90,
					in_stock: true,
					url: 'https://amazon.com.br/dp/B08PP8QHFQ',
					image: 'image1.jpg',
					preorder: false
				})
			];

			// Primeira chamada - simula ter LastEvaluatedKey
			const promiseMock1 = jest.fn().mockResolvedValue({ 
				Items: mockProducts, 
				LastEvaluatedKey: { id: 'B08PP8QHFQ' } 
			});
			const scanMock1 = jest.fn().mockReturnValue({ promise: promiseMock1 });
			mockDocumentClient.scan.mockImplementation(scanMock1);

			await repository.getNextProductsToCheck(1);

			// Segunda chamada - deve usar a chave anterior
			const promiseMock2 = jest.fn().mockResolvedValue({ Items: [] });
			const scanMock2 = jest.fn().mockReturnValue({ promise: promiseMock2 });
			mockDocumentClient.scan.mockImplementation(scanMock2);

			await repository.getNextProductsToCheck(1);

			expect(scanMock2).toHaveBeenCalledWith(
				expect.objectContaining({
					ExclusiveStartKey: { id: 'B08PP8QHFQ' }
				})
			);
		});

		it('deve reiniciar paginação quando não há LastEvaluatedKey', async () => {
			const promiseMock = jest.fn().mockResolvedValue({ 
				Items: [],
				LastEvaluatedKey: undefined 
			});
			const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.scan.mockImplementation(scanMock);

			await repository.getNextProductsToCheck(1);

			expect(console.log).toHaveBeenCalledWith('[DynamoDB] Fim da lista de produtos, reiniciando paginação');
		});

		it('deve tratar Items undefined corretamente', async () => {
			const promiseMock = jest.fn().mockResolvedValue({ 
				LastEvaluatedKey: undefined 
			});
			const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.scan.mockImplementation(scanMock);

			const result = await repository.getNextProductsToCheck(1);

			expect(result).toEqual([]);
			expect(console.log).toHaveBeenCalledWith('[DynamoDB] Encontrados 0 produtos para verificar');
		});

		it('deve tratar erros e resetar lastEvaluatedKey', async () => {
			const error = new Error('DynamoDB connection failed');
			const promiseMock = jest.fn().mockRejectedValue(error);
			const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.scan.mockImplementation(scanMock);

			// Primeiro define uma chave
			(repository as any).lastEvaluatedKey = { id: 'some-key' };

			await expect(repository.getNextProductsToCheck(1)).rejects.toThrow('DynamoDB connection failed');

			expect(console.error).toHaveBeenCalledWith('[DynamoDB] Erro ao buscar produtos para verificar:', error);
			expect((repository as any).lastEvaluatedKey).toBeUndefined();
		});

		it('deve configurar parâmetros de scan corretamente', async () => {
			const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
			const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.scan.mockImplementation(scanMock);

			await repository.getNextProductsToCheck(5);

			expect(scanMock).toHaveBeenCalledWith(
				expect.objectContaining({
					TableName: 'Products',
					Limit: 5
				})
			);
		});

		it('deve manter estado entre chamadas para paginação', async () => {
			// Primeira chamada com LastEvaluatedKey
			const mockProducts1 = [createProduct('B001')];
			const promiseMock1 = jest.fn().mockResolvedValue({ 
				Items: mockProducts1,
				LastEvaluatedKey: { id: 'B001' }
			});
			const scanMock1 = jest.fn().mockReturnValue({ promise: promiseMock1 });
			mockDocumentClient.scan.mockImplementation(scanMock1);

			const result1 = await repository.getNextProductsToCheck(1);
			expect(result1).toHaveLength(1);

			// Segunda chamada usando a chave salva
			const mockProducts2 = [createProduct('B002')];
			const promiseMock2 = jest.fn().mockResolvedValue({ 
				Items: mockProducts2,
				LastEvaluatedKey: undefined // Final da lista
			});
			const scanMock2 = jest.fn().mockReturnValue({ promise: promiseMock2 });
			mockDocumentClient.scan.mockImplementation(scanMock2);

			const result2 = await repository.getNextProductsToCheck(1);
			expect(result2).toHaveLength(1);
			expect(console.log).toHaveBeenCalledWith('[DynamoDB] Fim da lista de produtos, reiniciando paginação');

			// Terceira chamada deve reiniciar (sem ExclusiveStartKey)
			const promiseMock3 = jest.fn().mockResolvedValue({ Items: [] });
			const scanMock3 = jest.fn().mockReturnValue({ promise: promiseMock3 });
			mockDocumentClient.scan.mockImplementation(scanMock3);

			await repository.getNextProductsToCheck(1);

			expect(scanMock3).toHaveBeenCalledWith(
				expect.objectContaining({
					TableName: 'Products',
					Limit: 1
				})
			);
			expect(scanMock3).toHaveBeenCalledWith(
				expect.not.objectContaining({
					ExclusiveStartKey: expect.anything()
				})
			);
		});
	});

	describe('delete', () => {
		it('deve deletar produto com sucesso', async () => {
			const promiseMock = jest.fn().mockResolvedValue({});
			const deleteMock = jest.fn().mockReturnValue({ promise: promiseMock });
			mockDocumentClient.delete.mockImplementation(deleteMock);

			await repository.delete('B08PP8QHFQ');

			expect(deleteMock).toHaveBeenCalledWith(
				expect.objectContaining({
					TableName: 'Products',
					Key: { id: 'B08PP8QHFQ' }
				})
			);
		});
	});
});
