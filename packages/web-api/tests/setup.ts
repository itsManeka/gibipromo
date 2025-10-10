/**
 * Jest setup configuration for Web API tests
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for tests
process.env.LOG_LEVEL = 'ERROR'; // Minimize logs during tests

// Global test timeout
jest.setTimeout(30000);