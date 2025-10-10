import request from 'supertest';
import { Server } from '../../src/server';

describe('Server Error Handling', () => {
	let server: Server;
	let app: any;

	beforeAll(async () => {
		server = new Server();
		app = server.getApp();
	});

	describe('404 handling', () => {
		it('should handle 404 for nested paths', async () => {
			const response = await request(app)
				.get('/api/v1/deeply/nested/non-existent/path')
				.expect(404);

			expect(response.body.path).toBe('/api/v1/deeply/nested/non-existent/path');
		});

		it('should handle different HTTP methods for 404', async () => {
			const response = await request(app)
				.post('/non-existent')
				.expect(404);

			expect(response.body.error).toBe('Endpoint not found');
		});
	});

	describe('Server configuration', () => {
		it('should handle different content types', async () => {
			// Test that the server accepts JSON
			const response = await request(app)
				.post('/api/v1/health')
				.send({ test: 'data' })
				.set('Content-Type', 'application/json')
				.expect(404); // Health is GET only, so should return 404

			expect(response.body.error).toBe('Endpoint not found');
		});
	});
});