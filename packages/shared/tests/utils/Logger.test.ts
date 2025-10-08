import { Logger, LogLevel, createLogger } from '../../src/utils/Logger';

describe('Logger', () => {
	let consoleSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleSpy = jest.spyOn(console, 'log').mockImplementation();
		jest.spyOn(console, 'debug').mockImplementation();
		jest.spyOn(console, 'warn').mockImplementation();
		jest.spyOn(console, 'error').mockImplementation();
	});

	afterEach(() => {
		consoleSpy.mockRestore();
		jest.restoreAllMocks();
	});

	describe('getInstance', () => {
		it('should return the same instance when called multiple times', () => {
			const logger1 = Logger.getInstance();
			const logger2 = Logger.getInstance();
			expect(logger1).toBe(logger2);
		});

		it('should create new instance with context', () => {
			const logger1 = Logger.getInstance();
			const logger2 = Logger.getInstance('test-context');
			expect(logger1).not.toBe(logger2);
		});
	});

	describe('withContext', () => {
		it('should create logger with specific context', () => {
			const logger = Logger.withContext('TestContext');
			logger.info('test message');
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('[TestContext]: test message')
			);
		});
	});

	describe('createLogger', () => {
		it('should create logger with context using utility function', () => {
			const logger = createLogger('UtilContext');
			logger.info('util test');
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('[UtilContext]: util test')
			);
		});
	});

	describe('log levels', () => {
		let logger: Logger;

		beforeEach(() => {
			logger = Logger.withContext('TestLogger');
		});

		it('should log info messages', () => {
			logger.info('info message');
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('INFO [TestLogger]: info message')
			);
		});

		it('should log warn messages', () => {
			const warnSpy = jest.spyOn(console, 'warn');
			logger.warn('warn message');
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('WARN [TestLogger]: warn message')
			);
		});

		it('should log error messages', () => {
			const errorSpy = jest.spyOn(console, 'error');
			logger.error('error message');
			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('ERROR [TestLogger]: error message')
			);
		});

		it('should log debug messages', () => {
			const debugSpy = jest.spyOn(console, 'debug');
			logger.setLevel(LogLevel.DEBUG);
			logger.debug('debug message');
			expect(debugSpy).toHaveBeenCalledWith(
				expect.stringContaining('DEBUG [TestLogger]: debug message')
			);
		});

		it('should include data in log messages', () => {
			const data = { key: 'value', number: 123 };
			logger.info('message with data', data);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Data: {"key":"value","number":123}')
			);
		});

		it('should handle errors in error logs', () => {
			const errorSpy = jest.spyOn(console, 'error');
			const testError = new Error('Test error');
			logger.error('error with exception', testError);
			
			expect(errorSpy).toHaveBeenCalledTimes(2);
			expect(errorSpy).toHaveBeenNthCalledWith(1, 
				expect.stringContaining('ERROR [TestLogger]: error with exception')
			);
			expect(errorSpy).toHaveBeenNthCalledWith(2, testError);
		});
	});

	describe('level filtering', () => {
		let logger: Logger;

		beforeEach(() => {
			logger = Logger.withContext('FilterTest');
		});

		it('should not log debug when level is INFO', () => {
			const debugSpy = jest.spyOn(console, 'debug');
			logger.setLevel(LogLevel.INFO);
			logger.debug('should not appear');
			expect(debugSpy).not.toHaveBeenCalled();
		});

		it('should not log info when level is WARN', () => {
			logger.setLevel(LogLevel.WARN);
			logger.info('should not appear');
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it('should log warn when level is INFO', () => {
			const warnSpy = jest.spyOn(console, 'warn');
			logger.setLevel(LogLevel.INFO);
			logger.warn('should appear');
			expect(warnSpy).toHaveBeenCalled();
		});

		it('should get current log level', () => {
			logger.setLevel(LogLevel.ERROR);
			expect(logger.getLevel()).toBe(LogLevel.ERROR);
		});
	});

	describe('message formatting', () => {
		let logger: Logger;

		beforeEach(() => {
			logger = Logger.withContext('FormatTest');
		});

		it('should include timestamp in ISO format', () => {
			logger.info('test');
			const logCall = consoleSpy.mock.calls[0][0];
			expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
		});

		it('should include context in brackets', () => {
			logger.info('test');
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('[FormatTest]')
			);
		});

		it('should work without context', () => {
			const loggerNoContext = Logger.getInstance();
			loggerNoContext.info('no context test');
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/INFO: no context test/)
			);
		});
	});
});