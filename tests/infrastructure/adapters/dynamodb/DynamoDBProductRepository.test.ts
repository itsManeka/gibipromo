import { DynamoDBProductRepository } from 'infrastructure/adapters/dynamodb/DynamoDBProductRepository';
import { createProduct } from 'domain/entities/Product';
import { documentClient } from 'infrastructure/config/dynamodb';

jest.mock('infrastructure/config/dynamodb', () => ({
    documentClient: {
        scan: jest.fn(),
        put: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        query: jest.fn(),
        get: jest.fn()
    }
}));

describe('DynamoDBProductRepository', () => {
    let repository: DynamoDBProductRepository;
    const mockProducts = [
        createProduct({
            id: 'B08PP8QHFQ',
            title: 'Kindle 11ª Geração',
            offer_id: 'offer-1',
            full_price: 149.99,
            price: 129.99,
            in_stock: true,
            url: 'https://amazon.com.br/dp/B08PP8QHFQ',
            image: 'image1.jpg',
            preorder: false
        }),
        createProduct({
            id: 'B07JQKWWXT',
            title: 'Fire TV Stick Lite',
            offer_id: 'offer-2',
            full_price: 89.99,
            price: 79.99,
            in_stock: true,
            url: 'https://amazon.com.br/dp/B07JQKWWXT',
            image: 'image2.jpg',
            preorder: false
        })
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new DynamoDBProductRepository();
        mockProducts[0].users = ['user1'];
        mockProducts[1].users = ['user1', 'user2'];
    });

    describe('create', () => {
        it('deve criar produto com timestamps', async () => {
            const product = createProduct({
                id: 'B08PP8QHFQ',
                title: 'Test Product',
                offer_id: 'offer-123',
                full_price: 100,
                price: 90,
                in_stock: true,
                url: 'https://amazon.com.br/dp/B08PP8QHFQ',
                image: 'image.jpg',
                preorder: false
            });

            const promiseMock = jest.fn().mockResolvedValue({});
            const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
            (documentClient.put as jest.Mock).mockImplementation(putMock);

            const result = await repository.create(product);

            expect(result.created_at).toBeDefined();
            expect(result.updated_at).toBeDefined();
            expect(putMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: 'Products',
                    Item: expect.objectContaining({
                        ...product,
                        created_at: expect.any(String),
                        updated_at: expect.any(String)
                    })
                })
            );
        });
    });

    describe('update', () => {
        it('deve atualizar produto com timestamp', async () => {
            const product = mockProducts[0];

            const promiseMock = jest.fn().mockResolvedValue({});
            const putMock = jest.fn().mockReturnValue({ promise: promiseMock });
            (documentClient.put as jest.Mock).mockImplementation(putMock);

            const result = await repository.update(product);

            expect(result.updated_at).toBeDefined();
            expect(putMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: 'Products',
                    Item: expect.objectContaining({
                        ...product,
                        updated_at: expect.any(String)
                    })
                })
            );
        });
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
                    FilterExpression: 'contains(users, :userId)',
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

        it('deve tratar erro durante scan', async () => {
            const promiseMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
            const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
            (documentClient.scan as jest.Mock).mockImplementation(scanMock);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(repository.findByUserId('user1', 1, 5)).rejects.toThrow('DynamoDB error');
            expect(consoleSpy).toHaveBeenCalledWith('[DynamoDB] Erro ao buscar produtos do usuário:', expect.any(Error));
      
            consoleSpy.mockRestore();
        });
    });

    describe('findByLink', () => {
        it('deve encontrar produto pelo link', async () => {
            const promiseMock = jest.fn().mockResolvedValue({ Items: [mockProducts[0]] });
            const queryMock = jest.fn().mockReturnValue({ promise: promiseMock });
            (documentClient.query as jest.Mock).mockImplementation(queryMock);

            const result = await repository.findByLink('https://amazon.com.br/dp/B08PP8QHFQ');

            expect(result).toEqual(mockProducts[0]);
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

            const result = await repository.findByLink('https://amazon.com.br/dp/inexistente');

            expect(result).toBeNull();
        });
    });

    describe('addUser', () => {
        it('deve adicionar usuário ao produto', async () => {
            const product = { ...mockProducts[0] };
            product.users = ['user1'];

            // Mock findById
            const getMock = jest.fn().mockReturnValue({ 
                promise: jest.fn().mockResolvedValue({ Item: product })
            });
            (documentClient.get as jest.Mock).mockImplementation(getMock);

            // Mock update
            const updatePromiseMock = jest.fn().mockResolvedValue({});
            const updateMock = jest.fn().mockReturnValue({ promise: updatePromiseMock });
            (documentClient.update as jest.Mock).mockImplementation(updateMock);

            await repository.addUser('B08PP8QHFQ', 'user2');

            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: 'Products',
                    Key: { id: 'B08PP8QHFQ' },
                    UpdateExpression: 'SET #users = list_append(if_not_exists(#users, :empty), :userId), updated_at = :updated_at',
                    ExpressionAttributeNames: {
                        '#users': 'users'
                    },
                    ExpressionAttributeValues: {
                        ':userId': ['user2'],
                        ':empty': [],
                        ':updated_at': expect.any(String)
                    }
                })
            );
        });

        it('não deve adicionar usuário se já existir', async () => {
            const product = { ...mockProducts[0] };
            product.users = ['user1', 'user2'];

            // Mock findById
            const getMock = jest.fn().mockReturnValue({ 
                promise: jest.fn().mockResolvedValue({ Item: product })
            });
            (documentClient.get as jest.Mock).mockImplementation(getMock);

            await repository.addUser('B08PP8QHFQ', 'user1');

            expect(documentClient.update).not.toHaveBeenCalled();
        });

        it('não deve fazer nada se produto não existir', async () => {
            // Mock findById retornando null
            const getMock = jest.fn().mockReturnValue({ 
                promise: jest.fn().mockResolvedValue({})
            });
            (documentClient.get as jest.Mock).mockImplementation(getMock);

            await repository.addUser('inexistente', 'user1');

            expect(documentClient.update).not.toHaveBeenCalled();
        });
    });

    describe('removeUser', () => {
        it('deve remover usuário do produto', async () => {
            const product = { ...mockProducts[0] };
            product.users = ['user1', 'user2'];

            // Mock findById
            const getMock = jest.fn().mockReturnValue({ 
                promise: jest.fn().mockResolvedValue({ Item: product })
            });
            (documentClient.get as jest.Mock).mockImplementation(getMock);

            // Mock update
            const updatePromiseMock = jest.fn().mockResolvedValue({});
            const updateMock = jest.fn().mockReturnValue({ promise: updatePromiseMock });
            (documentClient.update as jest.Mock).mockImplementation(updateMock);

            await repository.removeUser('B08PP8QHFQ', 'user1');

            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: 'Products',
                    Key: { id: 'B08PP8QHFQ' },
                    UpdateExpression: 'SET #users = :users, updated_at = :updated_at',
                    ExpressionAttributeNames: {
                        '#users': 'users'
                    },
                    ExpressionAttributeValues: {
                        ':users': ['user2'],
                        ':updated_at': expect.any(String)
                    }
                })
            );
        });

        it('não deve fazer nada se produto não existir', async () => {
            // Mock findById retornando null
            const getMock = jest.fn().mockReturnValue({ 
                promise: jest.fn().mockResolvedValue({})
            });
            (documentClient.get as jest.Mock).mockImplementation(getMock);

            await repository.removeUser('inexistente', 'user1');

            expect(documentClient.update).not.toHaveBeenCalled();
        });
    });

    describe('getNextProductsToCheck', () => {
        it('deve retornar produtos para verificar', async () => {
            const promiseMock = jest.fn().mockResolvedValue({ 
                Items: mockProducts,
                LastEvaluatedKey: undefined 
            });
            const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
            (documentClient.scan as jest.Mock).mockImplementation(scanMock);

            const result = await repository.getNextProductsToCheck(2);

            expect(result).toHaveLength(2);
            expect(scanMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: 'Products',
                    Limit: 2,
                    FilterExpression: 'attribute_exists(#users) AND size(#users) > :zero',
                    ExpressionAttributeNames: {
                        '#users': 'users'
                    },
                    ExpressionAttributeValues: { ':zero': 0 }
                })
            );
        });

        it('deve continuar paginação com LastEvaluatedKey', async () => {
            const lastKey = { id: 'B08PP8QHFQ' };
      
            // Primeira chamada
            const promiseMock1 = jest.fn().mockResolvedValue({ 
                Items: [mockProducts[0]],
                LastEvaluatedKey: lastKey 
            });
            const scanMock1 = jest.fn().mockReturnValue({ promise: promiseMock1 });
            (documentClient.scan as jest.Mock).mockImplementation(scanMock1);

            await repository.getNextProductsToCheck(1);

            // Segunda chamada deve usar ExclusiveStartKey
            const promiseMock2 = jest.fn().mockResolvedValue({ 
                Items: [mockProducts[1]],
                LastEvaluatedKey: undefined 
            });
            const scanMock2 = jest.fn().mockReturnValue({ promise: promiseMock2 });
            (documentClient.scan as jest.Mock).mockImplementation(scanMock2);

            await repository.getNextProductsToCheck(1);

            expect(scanMock2).toHaveBeenCalledWith(
                expect.objectContaining({
                    ExclusiveStartKey: lastKey
                })
            );
        });

        it('deve tratar erro e resetar paginação', async () => {
            const promiseMock = jest.fn().mockRejectedValue(new Error('DynamoDB error'));
            const scanMock = jest.fn().mockReturnValue({ promise: promiseMock });
            (documentClient.scan as jest.Mock).mockImplementation(scanMock);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(repository.getNextProductsToCheck(1)).rejects.toThrow('DynamoDB error');
            expect(consoleSpy).toHaveBeenCalledWith('[DynamoDB] Erro ao buscar produtos para verificar:', expect.any(Error));
      
            consoleSpy.mockRestore();
        });
    });
});