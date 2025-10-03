import { createAmazonClient } from 'infrastructure/adapters/amazon';
import { MockAmazonPAAPIClient } from 'infrastructure/adapters/amazon/MockAmazonPAAPIClient';
import { AmazonPAAPIClient } from 'infrastructure/adapters/amazon/AmazonPAAPIClient';

describe('Amazon Client Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return MockAmazonPAAPIClient when USE_MOCK_PAAPI is true', () => {
    process.env.USE_MOCK_PAAPI = 'true';
    const client = createAmazonClient();
    expect(client).toBeInstanceOf(MockAmazonPAAPIClient);
  });

  it('should return AmazonPAAPIClient when USE_MOCK_PAAPI is false', () => {
    process.env.USE_MOCK_PAAPI = 'false';
    const client = createAmazonClient();
    expect(client).toBeInstanceOf(AmazonPAAPIClient);
  });

  it('should return AmazonPAAPIClient when USE_MOCK_PAAPI is not set', () => {
    delete process.env.USE_MOCK_PAAPI;
    const client = createAmazonClient();
    expect(client).toBeInstanceOf(AmazonPAAPIClient);
  });
});