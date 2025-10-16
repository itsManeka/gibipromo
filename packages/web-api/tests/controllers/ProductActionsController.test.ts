/**
 * ProductActionsController Tests
 *
 * Tests for product actions controller endpoints
 */

import request from 'supertest';
import express, { Express } from 'express';
import { ProductActionsController } from '../../src/controllers/ProductActionsController';
import { ProductActionsService } from '../../src/services/ProductActionsService';

// Mock do ProductActionsService
jest.mock('../../src/services/ProductActionsService');
jest.mock('@gibipromo/shared', () => ({
	...jest.requireActual('@gibipromo/shared'),
	DynamoDBActionRepository: jest.fn().mockImplementation(() => ({})),
	DynamoDBUserRepository: jest.fn().mockImplementation(() => ({}))
}));

// Middleware mock para autenticação
const mockAuthMiddleware = (req: any, res: any, next: any) => {
	req.user = { id: 'user-123' };
	next();
};

describe('ProductActionsController', () => {
	let app: Express;
	let mockProductActionsService: jest.Mocked<ProductActionsService>;

	beforeEach(() => {
		// Criar app Express para testes
		app = express();
		app.use(express.json());

		// Criar mock do service
		mockProductActionsService = new ProductActionsService(null as any, null as any) as jest.Mocked<ProductActionsService>;

		// Criar controller com o service
		const controller = new ProductActionsController(mockProductActionsService);

		// Registrar rotas com autenticação
		app.post('/products/add', mockAuthMiddleware, controller.addProduct);
		app.post('/products/add-multiple', mockAuthMiddleware, controller.addMultipleProducts);
		app.post('/products/validate-url', controller.validateUrl);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /products/add', () => {
		it('should add product successfully', async () => {
			const mockResult = {
				actionId: 'action-123'
			};

			mockProductActionsService.addProductForMonitoring = jest.fn().mockResolvedValue(mockResult);

			const response = await request(app)
				.post('/products/add')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.action_id).toBe('action-123');
			expect(mockProductActionsService.addProductForMonitoring).toHaveBeenCalledWith(
				'user-123',
				'https://www.amazon.com.br/dp/B08N5WRWNW'
			);
		});

		it('should return 400 for missing URL', async () => {
			const response = await request(app)
				.post('/products/add')
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URL é obrigatória');
		});

		it('should return 400 for empty URL', async () => {
			const response = await request(app)
				.post('/products/add')
				.send({ url: '' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URL é obrigatória');
		});

		it('should return 400 for non-string URL', async () => {
			const response = await request(app)
				.post('/products/add')
				.send({ url: 123 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URL é obrigatória');
		});

		it('should return 400 for invalid Amazon URL', async () => {
			mockProductActionsService.addProductForMonitoring = jest.fn().mockRejectedValue(
				new Error('URL inválida: não é uma URL da Amazon')
			);

			const response = await request(app)
				.post('/products/add')
				.send({ url: 'https://www.google.com' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should return 400 for user not found', async () => {
			mockProductActionsService.addProductForMonitoring = jest.fn().mockRejectedValue(
				new Error('Usuário não encontrado')
			);

			const response = await request(app)
				.post('/products/add')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should return 400 for disabled user', async () => {
			mockProductActionsService.addProductForMonitoring = jest.fn().mockRejectedValue(
				new Error('Sua monitoria está desabilitada. Entre em contato com o suporte.')
			);

			const response = await request(app)
				.post('/products/add')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should handle service errors', async () => {
			mockProductActionsService.addProductForMonitoring = jest.fn().mockRejectedValue(
				new Error('Database error')
			);

			const response = await request(app)
				.post('/products/add')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /products/add-multiple', () => {
		it('should add multiple products successfully', async () => {
			const mockResult = {
				successCount: 2,
				failedUrls: []
			};

			mockProductActionsService.addMultipleProducts = jest.fn().mockResolvedValue(mockResult);

			const response = await request(app)
				.post('/products/add-multiple')
				.send({
					urls: [
						'https://www.amazon.com.br/dp/B08N5WRWNW',
						'https://amzn.to/3abc123'
					]
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.success_count).toBe(2);
			expect(response.body.data.failed_urls).toHaveLength(0);
		});

		it('should return 400 for missing URLs', async () => {
			const response = await request(app)
				.post('/products/add-multiple')
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URLs deve ser um array');
		});

		it('should return 400 for non-array URLs', async () => {
			const response = await request(app)
				.post('/products/add-multiple')
				.send({ urls: 'not-an-array' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URLs deve ser um array');
		});

		it('should return 400 for empty URLs array', async () => {
			const response = await request(app)
				.post('/products/add-multiple')
				.send({ urls: [] });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Lista de URLs não pode estar vazia');
		});

		it('should return 400 for too many URLs', async () => {
			const urls = Array(11).fill('https://www.amazon.com.br/dp/B08N5WRWNW');

			const response = await request(app)
				.post('/products/add-multiple')
				.send({ urls });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Máximo de 10 URLs por vez');
		});

		it('should handle partial success', async () => {
			const mockResult = {
				successCount: 1,
				failedUrls: ['https://www.google.com']
			};

			mockProductActionsService.addMultipleProducts = jest.fn().mockResolvedValue(mockResult);

			const response = await request(app)
				.post('/products/add-multiple')
				.send({
					urls: [
						'https://www.amazon.com.br/dp/B08N5WRWNW',
						'https://www.google.com'
					]
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.success_count).toBe(1);
			expect(response.body.data.failed_urls).toHaveLength(1);
		});

		it('should return 201 when all URLs fail', async () => {
			const mockResult = {
				successCount: 0,
				failedUrls: [
					'https://www.google.com',
					'invalid-url'
				]
			};

			mockProductActionsService.addMultipleProducts = jest.fn().mockResolvedValue(mockResult);

			const response = await request(app)
				.post('/products/add-multiple')
				.send({
					urls: [
						'https://www.google.com',
						'invalid-url'
					]
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.success_count).toBe(0);
			expect(response.body.data.failed_urls).toHaveLength(2);
		});
	});

	describe('POST /products/validate-url', () => {
		it('should validate valid Amazon URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.valid).toBe(true);
			expect(response.body.data.message).toContain('válida');
		});

		it('should validate shortened Amazon URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: 'https://amzn.to/3abc123' });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.valid).toBe(true);
		});

		it('should reject non-Amazon URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: 'https://www.google.com' });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.valid).toBe(false);
			expect(response.body.data.message).toContain('URL deve ser da Amazon');
		});

		it('should reject malformed URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: 'not-a-url' });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.valid).toBe(false);
		});

		it('should return 400 for missing URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URL é obrigatória');
		});

		it('should return 400 for empty URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: '' });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should return 400 for non-string URL', async () => {
			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: 123 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('URL é obrigatória');
		});

		it('should handle validation errors gracefully', async () => {
			// Testar com URL muito longa
			const longUrl = 'https://www.amazon.com.br/' + 'a'.repeat(2000);

			const response = await request(app)
				.post('/products/validate-url')
				.send({ url: longUrl });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.valid).toBeDefined();
		});
	});

	describe('Authentication', () => {
		it('should require authentication for /add endpoint', async () => {
			// Criar app sem middleware de autenticação
			const appNoAuth = express();
			appNoAuth.use(express.json());
			const mockService = new ProductActionsService(null as any, null as any);
			const controller = new ProductActionsController(mockService);
			appNoAuth.post('/products/add', controller.addProduct);

			const response = await request(appNoAuth)
				.post('/products/add')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			// Deve falhar sem req.user
			expect(response.status).toBe(401);
		});

		it('should require authentication for /add-multiple endpoint', async () => {
			const appNoAuth = express();
			appNoAuth.use(express.json());
			const mockService = new ProductActionsService(null as any, null as any);
			const controller = new ProductActionsController(mockService);
			appNoAuth.post('/products/add-multiple', controller.addMultipleProducts);

			const response = await request(appNoAuth)
				.post('/products/add-multiple')
				.send({ urls: ['https://www.amazon.com.br/dp/B08N5WRWNW'] });

			expect(response.status).toBe(401);
		});

		it('should NOT require authentication for /validate-url endpoint', async () => {
			const appNoAuth = express();
			appNoAuth.use(express.json());
			const mockService = new ProductActionsService(null as any, null as any);
			const controller = new ProductActionsController(mockService);
			appNoAuth.post('/products/validate-url', controller.validateUrl);

			const response = await request(appNoAuth)
				.post('/products/validate-url')
				.send({ url: 'https://www.amazon.com.br/dp/B08N5WRWNW' });

			expect(response.status).toBe(200);
			expect(response.body.data.valid).toBe(true);
		});
	});
});
