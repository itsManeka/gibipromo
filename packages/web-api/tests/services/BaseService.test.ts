import { BaseService } from '../../src/services/BaseService';
import { Logger } from '@gibipromo/shared';

// Concrete implementation for testing
class TestService extends BaseService {
	constructor() {
		super('TestService');
	}

	public getLogger(): Logger {
		return this.logger;
	}

	public testLogAction(action: string, data?: any): void {
		this.logAction(action, data);
	}

	public testLogError(error: Error, context?: string): void {
		this.logError(error, context);
	}
}

describe('BaseService', () => {
	let testService: TestService;
	let loggerInfoSpy: jest.SpyInstance;
	let loggerErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		testService = new TestService();
		loggerInfoSpy = jest.spyOn(testService.getLogger(), 'info').mockImplementation(() => {});
		loggerErrorSpy = jest.spyOn(testService.getLogger(), 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		loggerInfoSpy.mockRestore();
		loggerErrorSpy.mockRestore();
	});

	describe('constructor', () => {
		it('should create logger with correct service name', () => {
			const logger = testService.getLogger();
			expect(logger).toBeDefined();
		});
	});

	describe('logAction', () => {
		it('should log action without data', () => {
			const action = 'test action';

			testService.testLogAction(action);

			expect(loggerInfoSpy).toHaveBeenCalledWith(action, undefined);
		});

		it('should log action with data', () => {
			const action = 'test action';
			const data = { test: 'data' };

			testService.testLogAction(action, data);

			expect(loggerInfoSpy).toHaveBeenCalledWith(action, data);
		});
	});

	describe('logError', () => {
		it('should log error without context', () => {
			const error = new Error('Test error');

			testService.testLogError(error);

			expect(loggerErrorSpy).toHaveBeenCalledWith('Error in service:', error);
		});

		it('should log error with context', () => {
			const error = new Error('Test error');
			const context = 'test context';

			testService.testLogError(error, context);

			expect(loggerErrorSpy).toHaveBeenCalledWith('Error in test context:', error);
		});
	});
});