import { Request, Response } from 'express';
import { BaseController } from '../../src/controllers/BaseController';
import { ApiResponse } from '@gibipromo/shared';

// Concrete implementation for testing
class TestController extends BaseController {
	public testSendSuccess<T>(res: Response, response: ApiResponse<T>): void {
		this.sendSuccess(res, response);
	}

	public testSendCreated<T>(res: Response, response: ApiResponse<T>): void {
		this.sendCreated(res, response);
	}

	public testSendBadRequest<T>(res: Response, response: ApiResponse<T>): void {
		this.sendBadRequest(res, response);
	}

	public testSendUnauthorized<T>(res: Response, response: ApiResponse<T>): void {
		this.sendUnauthorized(res, response);
	}

	public testSendNotFound<T>(res: Response, response: ApiResponse<T>): void {
		this.sendNotFound(res, response);
	}

	public testSendError(res: Response, error: string, statusCode?: number): void {
		this.sendError(res, error, statusCode);
	}

	public testSendServerError(res: Response, error: Error): void {
		this.sendServerError(res, error);
	}

	public getAsyncHandler() {
		return this.asyncHandler;
	}

	// Test method that throws an error
	public async throwingMethod(_req: Request, _res: Response): Promise<void> {
		throw new Error('Test error');
	}
}

describe('BaseController', () => {
	let testController: TestController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockStatus: jest.Mock;
	let mockJson: jest.Mock;

	beforeEach(() => {
		testController = new TestController();
		mockRequest = {};
		mockStatus = jest.fn().mockReturnThis();
		mockJson = jest.fn().mockReturnThis();
		mockResponse = {
			status: mockStatus,
			json: mockJson,
		};
	});

	describe('sendSuccess', () => {
		it('should send successful response with data and message', () => {
			const testData = { test: 'data' };
			const testMessage = 'Success message';

			const response: ApiResponse<typeof testData> = {
				success: true,
				data: testData,
				message: testMessage
			};

			testController.testSendSuccess(mockResponse as Response, response);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({
				success: true,
				data: testData,
				message: testMessage
			});
		});

		it('should send successful response without message', () => {
			const testData = { test: 'data' };

			const response: ApiResponse<typeof testData> = {
				success: true,
				data: testData
			};

			testController.testSendSuccess(mockResponse as Response, response);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith({
				success: true,
				data: testData
			});
		});
	});

	describe('sendError', () => {
		it('should send error response with default status code', () => {
			const errorMessage = 'Test error';

			testController.testSendError(mockResponse as Response, errorMessage);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith({
				success: false,
				error: errorMessage,
				data: null
			});
		});

		it('should send error response with custom status code', () => {
			const errorMessage = 'Test error';
			const statusCode = 422;

			testController.testSendError(mockResponse as Response, errorMessage, statusCode);

			expect(mockStatus).toHaveBeenCalledWith(statusCode);
			expect(mockJson).toHaveBeenCalledWith({
				success: false,
				error: errorMessage,
				data: null
			});
		});
	});

	describe('sendServerError', () => {
		const originalEnv = process.env.NODE_ENV;
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

		afterEach(() => {
			process.env.NODE_ENV = originalEnv;
			consoleErrorSpy.mockClear();
		});

		afterAll(() => {
			consoleErrorSpy.mockRestore();
		});

		it('should send server error with full message in development', () => {
			process.env.NODE_ENV = 'development';
			const error = new Error('Test server error');

			testController.testSendServerError(mockResponse as Response, error);

			expect(consoleErrorSpy).toHaveBeenCalledWith('Controller error:', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				success: false,
				error: 'Test server error',
				data: null
			});
		});

		it('should send server error with generic message in production', () => {
			process.env.NODE_ENV = 'production';
			const error = new Error('Test server error');

			testController.testSendServerError(mockResponse as Response, error);

			expect(consoleErrorSpy).toHaveBeenCalledWith('Controller error:', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				success: false,
				error: 'Internal server error',
				data: null
			});
		});
	});

	describe('asyncHandler', () => {
		it('should handle successful async operations', async () => {
			const asyncHandler = testController.getAsyncHandler();
			const successHandler = jest.fn().mockResolvedValue(undefined);
			const wrappedHandler = asyncHandler(successHandler);

			await wrappedHandler(mockRequest as Request, mockResponse as Response);

			expect(successHandler).toHaveBeenCalledWith(mockRequest, mockResponse);
		});

		it('should handle async errors', async () => {
			const asyncHandler = testController.getAsyncHandler();
			const wrappedHandler = asyncHandler(testController.throwingMethod.bind(testController));

			await wrappedHandler(mockRequest as Request, mockResponse as Response);

			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				success: false,
				error: expect.any(String),
				data: null
			});
		});
	});
});