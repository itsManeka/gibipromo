import AWS from 'aws-sdk';

// Mock do AWS SDK - versão simplificada focada em testar apenas a configuração
jest.mock('aws-sdk', () => {
	const mockDynamoDB = jest.fn();
	const mockDocumentClient = jest.fn();
	
	return {
		__esModule: true,
		default: {
			DynamoDB: Object.assign(mockDynamoDB, {
				DocumentClient: mockDocumentClient
			})
		}
	};
});

// Mock do dotenv
jest.mock('dotenv', () => ({
	config: jest.fn()
}));

describe('DynamoDB Config', () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = process.env;
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('carregamento do módulo', () => {
		it('deve carregar módulo com configurações padrão', () => {
			process.env = {
				...originalEnv,
				NODE_ENV: 'test'
			};

			// Re-importar módulo após configurar variáveis de ambiente
			delete require.cache[require.resolve('../../../src/infrastructure/config/dynamodb')];
			const { dynamodb, documentClient } = require('../../../src/infrastructure/config/dynamodb');

			expect(dynamodb).toBeDefined();
			expect(documentClient).toBeDefined();
		});

		it('deve carregar com variáveis de ambiente de desenvolvimento', () => {
			process.env = {
				...originalEnv,
				NODE_ENV: 'development',
				AWS_REGION: 'us-east-1',
				DYNAMODB_ENDPOINT: 'http://localhost:8000'
			};

			delete require.cache[require.resolve('../../../src/infrastructure/config/dynamodb')];
			const { dynamodb, documentClient } = require('../../../src/infrastructure/config/dynamodb');

			expect(dynamodb).toBeDefined();
			expect(documentClient).toBeDefined();
		});

		it('deve carregar com variáveis de ambiente de produção', () => {
			process.env = {
				...originalEnv,
				NODE_ENV: 'production',
				AWS_REGION: 'us-west-2'
			};

			delete require.cache[require.resolve('../../../src/infrastructure/config/dynamodb')];
			const { dynamodb, documentClient } = require('../../../src/infrastructure/config/dynamodb');

			expect(dynamodb).toBeDefined();
			expect(documentClient).toBeDefined();
		});
	});
});