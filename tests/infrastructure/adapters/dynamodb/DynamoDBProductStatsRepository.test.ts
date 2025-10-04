import { DynamoDBProductStatsRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBProductStatsRepository';
import { ProductStats } from '../../../../src/domain/entities/ProductStats';
import { documentClient } from '../../../../src/infrastructure/config/dynamodb';

// Mock do DynamoDB
jest.mock('../../../../src/infrastructure/config/dynamodb');

describe('DynamoDBProductStatsRepository', () => {
    let repository: DynamoDBProductStatsRepository;
    let mockDocumentClient: jest.Mocked<typeof documentClient>;

    beforeEach(() => {
        mockDocumentClient = documentClient as jest.Mocked<typeof documentClient>;
        repository = new DynamoDBProductStatsRepository();
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a product stats record', async () => {
            const productStats: ProductStats = {
                id: 'stats123',
                product_id: 'prod123',
                price: 80,
                old_price: 100,
                percentage_change: 20,
                created_at: '2023-01-01T00:00:00.000Z'
            };

            mockDocumentClient.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            } as any);

            const result = await repository.create(productStats);

            expect(result).toEqual(productStats);
            expect(mockDocumentClient.put).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                Item: productStats
            });
        });
    });

    describe('findById', () => {
        it('should find a product stats record by id', async () => {
            const productStats: ProductStats = {
                id: 'stats123',
                product_id: 'prod123',
                price: 80,
                old_price: 100,
                percentage_change: 20,
                created_at: '2023-01-01T00:00:00.000Z'
            };

            mockDocumentClient.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: productStats })
            } as any);

            const result = await repository.findById('stats123');

            expect(result).toEqual(productStats);
            expect(mockDocumentClient.get).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                Key: { id: 'stats123' }
            });
        });

        it('should return null when record is not found', async () => {
            mockDocumentClient.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            } as any);

            const result = await repository.findById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('findByProductId', () => {
        it('should find all stats records for a product', async () => {
            const productStats: ProductStats[] = [
                {
                    id: 'stats1',
                    product_id: 'prod123',
                    price: 80,
                    old_price: 100,
                    percentage_change: 20,
                    created_at: '2023-01-01T00:00:00.000Z'
                },
                {
                    id: 'stats2',
                    product_id: 'prod123',
                    price: 75,
                    old_price: 80,
                    percentage_change: 6.25,
                    created_at: '2023-01-02T00:00:00.000Z'
                }
            ];

            mockDocumentClient.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: productStats })
            } as any);

            const result = await repository.findByProductId('prod123');

            expect(result).toEqual(productStats);
            expect(mockDocumentClient.scan).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                FilterExpression: 'product_id = :product_id',
                ExpressionAttributeValues: {
                    ':product_id': 'prod123'
                }
            });
        });

        it('should return empty array when no stats found', async () => {
            mockDocumentClient.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            } as any);

            const result = await repository.findByProductId('prod123');

            expect(result).toEqual([]);
        });
    });

    describe('findLatest', () => {
        it('should find latest stats records sorted by created_at descending', async () => {
            const productStats: ProductStats[] = [
                {
                    id: 'stats2',
                    product_id: 'prod123',
                    price: 75,
                    old_price: 80,
                    percentage_change: 6.25,
                    created_at: '2023-01-02T00:00:00.000Z'
                },
                {
                    id: 'stats1',
                    product_id: 'prod123',
                    price: 80,
                    old_price: 100,
                    percentage_change: 20,
                    created_at: '2023-01-01T00:00:00.000Z'
                }
            ];

            // DynamoDB retorna em ordem não ordenada
            const unorderedStats = [...productStats].reverse();

            mockDocumentClient.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: unorderedStats })
            } as any);

            const result = await repository.findLatest(5);

            expect(result).toEqual(productStats); // Deve estar ordenado por created_at desc
            expect(mockDocumentClient.scan).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                Limit: 5
            });
        });

        it('should return empty array when no stats found', async () => {
            mockDocumentClient.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            } as any);

            const result = await repository.findLatest(5);

            expect(result).toEqual([]);
        });
    });

    describe('findByProductIdAndDateRange', () => {
        it('should find stats records for product within date range', async () => {
            const productStats: ProductStats[] = [
                {
                    id: 'stats1',
                    product_id: 'prod123',
                    price: 80,
                    old_price: 100,
                    percentage_change: 20,
                    created_at: '2023-01-01T00:00:00.000Z'
                },
                {
                    id: 'stats2',
                    product_id: 'prod123',
                    price: 75,
                    old_price: 80,
                    percentage_change: 6.25,
                    created_at: '2023-01-02T00:00:00.000Z'
                }
            ];

            mockDocumentClient.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: productStats })
            } as any);

            const result = await repository.findByProductIdAndDateRange(
                'prod123',
                '2023-01-01T00:00:00.000Z',
                '2023-01-31T23:59:59.999Z'
            );

            expect(result).toEqual(productStats);
            expect(mockDocumentClient.scan).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                FilterExpression: 'product_id = :product_id AND created_at BETWEEN :start_date AND :end_date',
                ExpressionAttributeValues: {
                    ':product_id': 'prod123',
                    ':start_date': '2023-01-01T00:00:00.000Z',
                    ':end_date': '2023-01-31T23:59:59.999Z'
                }
            });
        });

        it('should return stats sorted by created_at ascending', async () => {
            const productStats: ProductStats[] = [
                {
                    id: 'stats2',
                    product_id: 'prod123',
                    price: 75,
                    old_price: 80,
                    percentage_change: 6.25,
                    created_at: '2023-01-02T00:00:00.000Z'
                },
                {
                    id: 'stats1',
                    product_id: 'prod123',
                    price: 80,
                    old_price: 100,
                    percentage_change: 20,
                    created_at: '2023-01-01T00:00:00.000Z'
                }
            ];

            // DynamoDB retorna em ordem não ordenada
            const unorderedStats = [...productStats];

            mockDocumentClient.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: unorderedStats })
            } as any);

            const result = await repository.findByProductIdAndDateRange(
                'prod123',
                '2023-01-01T00:00:00.000Z',
                '2023-01-31T23:59:59.999Z'
            );

            // Resultado deve estar ordenado por created_at ascending
            expect(result[0].created_at).toBe('2023-01-01T00:00:00.000Z');
            expect(result[1].created_at).toBe('2023-01-02T00:00:00.000Z');
        });
    });

    describe('update', () => {
        it('should update a product stats record', async () => {
            const productStats: ProductStats = {
                id: 'stats123',
                product_id: 'prod123',
                price: 80,
                old_price: 100,
                percentage_change: 20,
                created_at: '2023-01-01T00:00:00.000Z'
            };

            mockDocumentClient.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            } as any);

            const result = await repository.update(productStats);

            expect(result).toEqual(productStats);
            expect(mockDocumentClient.put).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                Item: productStats
            });
        });
    });

    describe('delete', () => {
        it('should delete a product stats record', async () => {
            mockDocumentClient.delete.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            } as any);

            await repository.delete('stats123');

            expect(mockDocumentClient.delete).toHaveBeenCalledWith({
                TableName: 'ProductStats',
                Key: { id: 'stats123' }
            });
        });
    });
});