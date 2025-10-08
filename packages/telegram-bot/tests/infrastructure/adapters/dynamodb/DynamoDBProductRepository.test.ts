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
