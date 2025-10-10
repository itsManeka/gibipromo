import request from 'supertest';
import { Server } from '../src/server';

describe('Server', () => {
	let server: Server;
	let app: any;

	beforeAll(async () => {
		server = new Server();
		app = server.getApp();
	});

	describe('Root endpoint', () => {
		it('should return API information', async () => {
			const response = await request(app)
				.get('/')
				.expect(200);

			expect(response.body).toEqual({
				message: 'GibiPromo Web API',
				version: '1.0.0',
				status: 'running',
				timestamp: expect.any(String)
			});
		});
	});

	describe('404 handler', () => {
		it('should return 404 for non-existent endpoints', async () => {
			const response = await request(app)
				.get('/non-existent-endpoint')
				.expect(404);

			expect(response.body).toEqual({
				error: 'Endpoint not found',
				path: '/non-existent-endpoint',
				timestamp: expect.any(String)
			});
		});

		it('should return 404 for non-existent API endpoints', async () => {
			const response = await request(app)
				.get('/api/v1/non-existent')
				.expect(404);

			expect(response.body).toEqual({
				error: 'Endpoint not found',
				path: '/api/v1/non-existent',
				timestamp: expect.any(String)
			});
		});
	});

	describe('Middleware configuration', () => {
		it('should have basic middleware working', async () => {
			const response = await request(app)
				.get('/')
				.expect(200);

			// Check that response is JSON
			expect(response.body).toBeDefined();
			expect(response.body.message).toBe('GibiPromo Web API');
		});
	});

	describe('Security headers', () => {
		it('should include security headers from helmet', async () => {
			const response = await request(app)
				.get('/')
				.expect(200);

			// Helmet adds various security headers
			expect(response.headers).toHaveProperty('x-content-type-options');
			expect(response.headers).toHaveProperty('x-frame-options');
		});
	});
});