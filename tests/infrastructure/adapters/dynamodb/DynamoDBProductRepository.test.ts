import { DynamoDBProductRepository } from 'infrastructure/adapters/dynamodb/DynamoDBProductRepository';
import { createProduct } from 'domain/entities/Product';
import { documentClient } from 'infrastructure/config/dynamodb';

jest.mock('infrastructure/config/dynamodb', () => ({
  documentClient: {
    scan: jest.fn(),
    put: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({})
  }
}));

describe('DynamoDBProductRepository', () => {
  let repository: DynamoDBProductRepository;
  const mockProducts = [
    createProduct({
      id: 'B08PP8QHFQ',
      title: 'Kindle 11ª Geração',
      offerid: 'offer-1',
      preco_cheio: 149.99,
      preco: 129.99,
      estoque: true,
      link: 'https://amazon.com.br/dp/B08PP8QHFQ',
      imagem: 'image1.jpg',
      pre_venda: false
    }),
    createProduct({
      id: 'B07JQKWWXT',
      title: 'Fire TV Stick Lite',
      offerid: 'offer-2',
      preco_cheio: 89.99,
      preco: 79.99,
      estoque: true,
      link: 'https://amazon.com.br/dp/B07JQKWWXT',
      imagem: 'image2.jpg',
      pre_venda: false
    })
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new DynamoDBProductRepository();
    mockProducts[0].usuarios = ['user1'];
    mockProducts[1].usuarios = ['user1', 'user2'];
  });

  describe('findByUserId', () => {
    it('should return paginated products for a user', async () => {
      const promiseMock = jest.fn().mockResolvedValue({ Items: mockProducts });
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      (documentClient.scan as jest.Mock).mockImplementation(scanMock);

      const result = await repository.findByUserId('user1', 1, 2);

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(scanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: 'contains(usuarios, :userId)',
          ExpressionAttributeValues: { ':userId': 'user1' }
        })
      );
    });

    it('should return empty array when no products found', async () => {
      const promiseMock = jest.fn().mockResolvedValue({ Items: [] });
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      (documentClient.scan as jest.Mock).mockImplementation(scanMock);

      const result = await repository.findByUserId('user3', 1, 5);

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const promiseMock = jest.fn().mockResolvedValue({ Items: mockProducts });
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      (documentClient.scan as jest.Mock).mockImplementation(scanMock);

      const result = await repository.findByUserId('user1', 2, 1);

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should sort products by id in descending order', async () => {
      const products = [...mockProducts];
      const promiseMock = jest.fn().mockResolvedValue({ Items: products });
      const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
      (documentClient.scan as jest.Mock).mockImplementation(scanMock);

      const result = await repository.findByUserId('user1', 1, 5);

      expect(result.products[0].id).toBe('B08PP8QHFQ');
      expect(result.products[1].id).toBe('B07JQKWWXT');
    });
  });
});