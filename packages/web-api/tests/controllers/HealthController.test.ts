import { Request, Response } from 'express';
import { HealthController } from '../../src/controllers/HealthController';

describe('HealthController', () => {
	let healthController: HealthController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		healthController = new HealthController();
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
	});

	describe('getHealth', () => {
		it('should return health status successfully', async () => {
			await healthController.getHealth(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				data: expect.objectContaining({
					status: 'ok',
					timestamp: expect.any(Number),
					uptime: expect.any(Number),
					environment: expect.any(String),
					version: '1.0.0'
				}),
				message: 'API is healthy'
			});
		});

		it('should include uptime in response', async () => {
			const startTime = process.uptime();
			
			await healthController.getHealth(mockRequest as Request, mockResponse as Response);

			const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
			expect(callArgs.data.uptime).toBeGreaterThanOrEqual(startTime);
		});
	});

	describe('getDetailedHealth', () => {
		it('should return detailed health status', async () => {
			await healthController.getDetailedHealth(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				data: expect.objectContaining({
					status: 'ok',
					timestamp: expect.any(Number),
					uptime: expect.any(Number),
					environment: expect.any(String),
					version: '1.0.0',
					system: expect.objectContaining({
						platform: expect.any(String),
						nodeVersion: expect.any(String),
						memory: expect.any(Object)
					}),
					services: expect.any(Object)
				}),
				message: 'Detailed API health information'
			});
		});

		it('should include memory information', async () => {
			await healthController.getDetailedHealth(mockRequest as Request, mockResponse as Response);

			const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
			expect(callArgs.data.system.memory).toHaveProperty('rss');
			expect(callArgs.data.system.memory).toHaveProperty('heapTotal');
			expect(callArgs.data.system.memory).toHaveProperty('heapUsed');
			expect(callArgs.data.system.memory).toHaveProperty('external');
		});
	});
});