import { DynamoDBProductUserRepository } from '../../../../src/infrastructure/adapters/dynamodb/DynamoDBProductUserRepository';
import { ProductUser } from '@gibipromo/shared';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

// Mock do documentClient
jest.mock('../../../../src/infrastructure/config/dynamodb', () => ({
	documentClient: {
		put: jest.fn(),
		get: jest.fn(),
		query: jest.fn(),
		delete: jest.fn(),
		update: jest.fn()
	}
}));

import { documentClient } from '../../../../src/infrastructure/config/dynamodb';

describe('DynamoDBProductUserRepository', () => {
	let repository: DynamoDBProductUserRepository;
	let mockDocumentClient: jest.Mocked<DocumentClient>;

	beforeEach(() => {
		repository = new DynamoDBProductUserRepository();
		mockDocumentClient = documentClient as jest.Mocked<DocumentClient>;

		// Reset all mocks
		jest.clearAllMocks();

		// Setup default mock implementations
		mockDocumentClient.put.mockReturnValue({
			promise: jest.fn().mockResolvedValue({})
		} as any);

		mockDocumentClient.get.mockReturnValue({
			promise: jest.fn().mockResolvedValue({})
		} as any);

		mockDocumentClient.query.mockReturnValue({
			promise: jest.fn().mockResolvedValue({ Items: [] })
		} as any);

		mockDocumentClient.delete.mockReturnValue({
			promise: jest.fn().mockResolvedValue({})
		} as any);

		mockDocumentClient.update.mockReturnValue({
			promise: jest.fn().mockResolvedValue({})
		} as any);
	});

	describe('create', () => {
		it('should create a product user with timestamps', async () => {
			const productUser: ProductUser = {
				id: 'test-id',
				product_id: 'B012345678',
				user_id: 'user123',
				desired_price: 100,
				created_at: '',
				updated_at: ''
			};

			const result = await repository.create(productUser);

			expect(mockDocumentClient.put).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Item: expect.objectContaining({
					...productUser,
					created_at: expect.any(String),
					updated_at: expect.any(String)
				})
			});

			expect(result.created_at).toBeDefined();
			expect(result.updated_at).toBeDefined();
			expect(new Date(result.created_at).getTime()).toBeGreaterThan(0);
			expect(new Date(result.updated_at).getTime()).toBeGreaterThan(0);
		});

		it('should handle database errors', async () => {
			const productUser: ProductUser = {
				id: 'test-id',
				product_id: 'B012345678',
				user_id: 'user123',
				desired_price: 100,
				created_at: '',
				updated_at: ''
			};

			mockDocumentClient.put.mockReturnValue({
				promise: jest.fn().mockRejectedValue(new Error('Database error'))
			} as any);

			await expect(repository.create(productUser)).rejects.toThrow('Database error');
		});
	});

	describe('update', () => {
		it('should update a product user with new timestamp', async () => {
			const productUser: ProductUser = {
				id: 'test-id',
				product_id: 'B012345678',
				user_id: 'user123',
				desired_price: 150,
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			const result = await repository.update(productUser);

			expect(mockDocumentClient.put).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Item: expect.objectContaining({
					...productUser,
					updated_at: expect.any(String)
				})
			});

			expect(result.updated_at).toBeDefined();
			expect(result.updated_at).not.toBe(productUser.updated_at);
		});
	});

	describe('findByProductAndUser', () => {
		it('should find a product user by product and user id', async () => {
			const mockProductUser: ProductUser = {
				id: 'test-id',
				product_id: 'B012345678',
				user_id: 'user123',
				desired_price: 100,
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			mockDocumentClient.get.mockReturnValue({
				promise: jest.fn().mockResolvedValue({ Item: mockProductUser })
			} as any);

			const result = await repository.findByProductAndUser('B012345678', 'user123');

			expect(mockDocumentClient.get).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Key: {
					product_id: 'B012345678',
					user_id: 'user123'
				}
			});

			expect(result).toEqual(mockProductUser);
		});

		it('should return null when product user not found', async () => {
			mockDocumentClient.get.mockReturnValue({
				promise: jest.fn().mockResolvedValue({})
			} as any);

			const result = await repository.findByProductAndUser('B012345678', 'user123');

			expect(result).toBeNull();
		});
	});

	describe('findByProductId', () => {
		it('should find all product users by product id', async () => {
			const mockProductUsers: ProductUser[] = [
				{
					id: 'test-id-1',
					product_id: 'B012345678',
					user_id: 'user123',
					desired_price: 100,
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z'
				},
				{
					id: 'test-id-2',
					product_id: 'B012345678',
					user_id: 'user456',
					desired_price: 120,
					created_at: '2023-01-02T00:00:00.000Z',
					updated_at: '2023-01-02T00:00:00.000Z'
				}
			];

			mockDocumentClient.query.mockReturnValue({
				promise: jest.fn().mockResolvedValue({ Items: mockProductUsers })
			} as any);

			const result = await repository.findByProductId('B012345678');

			expect(mockDocumentClient.query).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				KeyConditionExpression: 'product_id = :productId',
				ExpressionAttributeValues: {
					':productId': 'B012345678'
				}
			});

			expect(result).toEqual(mockProductUsers);
		});

		it('should return empty array when no product users found', async () => {
			mockDocumentClient.query.mockReturnValue({
				promise: jest.fn().mockResolvedValue({})
			} as any);

			const result = await repository.findByProductId('B012345678');

			expect(result).toEqual([]);
		});
	});

	describe('findByUserId', () => {
		it('should find paginated product users by user id', async () => {
			const mockProductUsers: ProductUser[] = [
				{
					id: 'test-id-1',
					product_id: 'B012345678',
					user_id: 'user123',
					desired_price: 100,
					created_at: '2023-01-03T00:00:00.000Z',
					updated_at: '2023-01-03T00:00:00.000Z'
				},
				{
					id: 'test-id-2',
					product_id: 'B087654321',
					user_id: 'user123',
					desired_price: 120,
					created_at: '2023-01-02T00:00:00.000Z',
					updated_at: '2023-01-02T00:00:00.000Z'
				},
				{
					id: 'test-id-3',
					product_id: 'B111222333',
					user_id: 'user123',
					desired_price: 80,
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z'
				}
			];

			mockDocumentClient.query.mockReturnValue({
				promise: jest.fn().mockResolvedValue({ Items: mockProductUsers })
			} as any);

			const result = await repository.findByUserId('user123', 1, 2);

			expect(mockDocumentClient.query).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				IndexName: 'UserIdIndex',
				KeyConditionExpression: 'user_id = :userId',
				ExpressionAttributeValues: {
					':userId': 'user123'
				}
			});

			// Should return first 2 items sorted by created_at descending
			expect(result.productUsers).toHaveLength(2);
			expect(result.total).toBe(3);
			expect(result.productUsers[0].id).toBe('test-id-1'); // Most recent
			expect(result.productUsers[1].id).toBe('test-id-2'); // Second most recent
		});

		it('should handle second page correctly', async () => {
			const mockProductUsers: ProductUser[] = [
				{
					id: 'test-id-1',
					product_id: 'B012345678',
					user_id: 'user123',
					desired_price: 100,
					created_at: '2023-01-03T00:00:00.000Z',
					updated_at: '2023-01-03T00:00:00.000Z'
				},
				{
					id: 'test-id-2',
					product_id: 'B087654321',
					user_id: 'user123',
					desired_price: 120,
					created_at: '2023-01-02T00:00:00.000Z',
					updated_at: '2023-01-02T00:00:00.000Z'
				},
				{
					id: 'test-id-3',
					product_id: 'B111222333',
					user_id: 'user123',
					desired_price: 80,
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z'
				}
			];

			mockDocumentClient.query.mockReturnValue({
				promise: jest.fn().mockResolvedValue({ Items: mockProductUsers })
			} as any);

			const result = await repository.findByUserId('user123', 2, 2);

			// Second page should return the remaining item
			expect(result.productUsers).toHaveLength(1);
			expect(result.total).toBe(3);
			expect(result.productUsers[0].id).toBe('test-id-3'); // Oldest item
		});

		it('should handle database error', async () => {
			mockDocumentClient.query.mockReturnValue({
				promise: jest.fn().mockRejectedValue(new Error('Database error'))
			} as any);

			await expect(repository.findByUserId('user123', 1, 10)).rejects.toThrow('Database error');
		});
	});

	describe('upsert', () => {
		it('should upsert a product user with timestamps', async () => {
			const productUser: ProductUser = {
				id: 'test-id',
				product_id: 'B012345678',
				user_id: 'user123',
				desired_price: 100,
				created_at: '2023-01-01T00:00:00.000Z',
				updated_at: '2023-01-01T00:00:00.000Z'
			};

			await repository.upsert(productUser);

			expect(mockDocumentClient.put).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Item: expect.objectContaining({
					...productUser,
					updated_at: expect.any(String),
					created_at: productUser.created_at // Should keep existing created_at
				})
			});
		});

		it('should set created_at if not present', async () => {
			const productUser: ProductUser = {
				id: 'test-id',
				product_id: 'B012345678',
				user_id: 'user123',
				desired_price: 100,
				created_at: '',
				updated_at: ''
			};

			await repository.upsert(productUser);

			expect(mockDocumentClient.put).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Item: expect.objectContaining({
					...productUser,
					updated_at: expect.any(String),
					created_at: expect.any(String)
				})
			});
		});
	});

	describe('removeByProductAndUser', () => {
		it('should remove a product user by product and user id', async () => {
			await repository.removeByProductAndUser('B012345678', 'user123');

			expect(mockDocumentClient.delete).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Key: {
					product_id: 'B012345678',
					user_id: 'user123'
				}
			});
		});
	});

	describe('updateDesiredPrice', () => {
		it('should update desired price for a product user', async () => {
			await repository.updateDesiredPrice('B012345678', 'user123', 150);

			expect(mockDocumentClient.update).toHaveBeenCalledWith({
				TableName: 'ProductUsers',
				Key: {
					product_id: 'B012345678',
					user_id: 'user123'
				},
				UpdateExpression: 'SET desired_price = :desiredPrice, updated_at = :updatedAt',
				ExpressionAttributeValues: {
					':desiredPrice': 150,
					':updatedAt': expect.any(String)
				}
			});
		});
	});
});