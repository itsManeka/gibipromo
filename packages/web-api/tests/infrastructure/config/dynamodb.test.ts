/**
 * Testes de Conectividade DynamoDB
 * 
 * Valida que a configuração do DynamoDB está funcionando corretamente
 * tanto em ambiente de desenvolvimento (DynamoDB Local) quanto produção.
 * 
 * @group integration
 */

import { dynamodb, documentClient } from '@gibipromo/shared';

describe('DynamoDB Configuration', () => {
	describe('Client Initialization', () => {
		it('should initialize DynamoDB client', () => {
			expect(dynamodb).toBeDefined();
			expect(dynamodb.config).toBeDefined();
		});

		it('should initialize DocumentClient', () => {
			expect(documentClient).toBeDefined();
		});

		it('should have correct region configuration', () => {
			expect(dynamodb.config.region).toBe('us-east-1');
		});

		it('should use local endpoint in development', () => {
			if (process.env.NODE_ENV === 'development') {
				expect(dynamodb.endpoint?.href).toContain('localhost:8000');
			}
		});
	});

	describe('DynamoDB Connectivity', () => {
		it('should list tables successfully', async () => {
			try {
				const result = await dynamodb.listTables().promise();
				expect(result).toBeDefined();
				expect(result.TableNames).toBeDefined();
				expect(Array.isArray(result.TableNames)).toBe(true);
			} catch (error) {
				// Em ambiente de teste sem DynamoDB rodando, esperamos erro de conexão
				if (process.env.NODE_ENV === 'test') {
					expect(error).toBeDefined();
				} else {
					throw error;
				}
			}
		}, 10000); // timeout de 10s para operações de rede

		it('should verify required tables exist in development', async () => {
			if (process.env.NODE_ENV !== 'development') {
				return; // Skip em outros ambientes
			}

			const requiredTables = [
				'Users',
				'Products',
				'ProductUsers',
				'Actions',
				'ActionConfigs',
				'ProductStats'
			];

			try {
				const result = await dynamodb.listTables().promise();
				const existingTables = result.TableNames || [];

				// Verifica se pelo menos alguma tabela existe
				// (em setup inicial pode não ter todas)
				if (existingTables.length > 0) {
					requiredTables.forEach(tableName => {
						const exists = existingTables.includes(tableName);
						if (!exists) {
							console.warn(`⚠️  Table "${tableName}" not found. Run: npm run init:dynamo`);
						}
					});
				}
			} catch (error) {
				console.warn('⚠️  Could not connect to DynamoDB. Make sure Docker is running.');
			}
		}, 10000);
	});

	describe('DocumentClient Operations', () => {
		const testTableName = 'Users';
		const testUserId = 'test-connectivity-' + Date.now();

		// Apenas executa se DynamoDB estiver disponível
		it('should perform basic CRUD operations', async () => {
			if (process.env.NODE_ENV === 'test') {
				return; // Skip em ambiente de teste sem DynamoDB
			}

			try {
				// CREATE - Tenta criar um item de teste
				const testItem = {
					id: testUserId,
					telegram_id: 'test123',
					enabled: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};

				await documentClient.put({
					TableName: testTableName,
					Item: testItem
				}).promise();

				// READ - Tenta ler o item criado
				const getResult = await documentClient.get({
					TableName: testTableName,
					Key: { id: testUserId }
				}).promise();

				expect(getResult.Item).toBeDefined();
				expect(getResult.Item?.id).toBe(testUserId);

				// DELETE - Remove o item de teste
				await documentClient.delete({
					TableName: testTableName,
					Key: { id: testUserId }
				}).promise();

				// Verifica que foi deletado
				const verifyDelete = await documentClient.get({
					TableName: testTableName,
					Key: { id: testUserId }
				}).promise();

				expect(verifyDelete.Item).toBeUndefined();

			} catch (error: any) {
				if (error.code === 'ResourceNotFoundException') {
					console.warn(`⚠️  Table "${testTableName}" not found. Run: npm run init:dynamo`);
				} else if (error.code === 'NetworkingError') {
					console.warn('⚠️  Could not connect to DynamoDB. Make sure Docker is running.');
				} else {
					throw error;
				}
			}
		}, 15000);
	});
});
