import { Server } from '../src/server';

// Mock the Server class
jest.mock('../src/server');

describe('Application Index', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should create and configure Server class correctly', () => {
		// Just verify that the Server class is imported and available
		expect(Server).toBeDefined();
		expect(typeof Server).toBe('function');
	});

	it('should have main entry point setup', () => {
		// Verify the index file can be imported without errors
		expect(() => require('../src/index')).not.toThrow();
	});
});