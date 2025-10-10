import request from 'supertest';
import { Server } from '../../src/server';

describe('Health Routes', () => {
	let server: Server;
	let app: any;

	beforeAll(async () => {
		server = new Server();
		app = server.getApp();
	});

	describe('GET /health', () => {
		it('should return health status', async () => {
			const response = await request(app)
				.get('/api/v1/health')
				.expect(200);

			expect(response.body).toEqual({
				success: true,
				data: expect.objectContaining({
					status: 'ok',
					timestamp: expect.any(Number),
					uptime: expect.any(Number),
					environment: 'test',
					version: '1.0.0'
				}),
				message: 'API is healthy'
			});
		});

		it('should have required health properties', async () => {
			const response = await request(app)
				.get('/api/v1/health')
				.expect(200);

			expect(response.body.data).toHaveProperty('status');
			expect(response.body.data).toHaveProperty('timestamp');
			expect(response.body.data).toHaveProperty('uptime');
			expect(response.body.data).toHaveProperty('environment');
			expect(response.body.data).toHaveProperty('version');
		});
	});

	describe('GET /health/detailed', () => {
		it('should return detailed health status', async () => {
			const response = await request(app)
				.get('/api/v1/health/detailed')
				.expect(200);

			expect(response.body).toEqual({
				success: true,
				data: expect.objectContaining({
					status: 'ok',
					timestamp: expect.any(Number),
					uptime: expect.any(Number),
					environment: 'test',
					version: '1.0.0',
					system: expect.objectContaining({
						platform: expect.any(String),
						nodeVersion: expect.any(String),
						memory: expect.objectContaining({
							rss: expect.any(Number),
							heapTotal: expect.any(Number),
							heapUsed: expect.any(Number),
							external: expect.any(Number)
						})
					}),
					services: expect.objectContaining({
						dynamodb: 'connected',
						amazon_api: 'available'
					})
				}),
				message: 'Detailed API health information'
			});
		});

		it('should have system information', async () => {
			const response = await request(app)
				.get('/api/v1/health/detailed')
				.expect(200);

			expect(response.body.data.system).toBeDefined();
			expect(response.body.data.system.memory).toBeDefined();
			expect(response.body.data.services).toBeDefined();
		});
	});
});