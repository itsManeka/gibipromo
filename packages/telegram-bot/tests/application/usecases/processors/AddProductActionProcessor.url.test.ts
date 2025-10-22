import { AddProductActionProcessor } from '../../../../src/application/usecases/processors/AddProductActionProcessor';
import { createMockNotificationRepository } from '../../../test-helpers/factories';

describe('AddProductActionProcessor URL Validation', () => {
	const mockDeps = {
		actionRepository: {} as any,
		productRepository: {} as any,
		userRepository: {} as any,
		amazonApi: {} as any,
		productUserRepository: {} as any,
		productStatsService: {} as any,
	};

	const mockNotificationRepository = createMockNotificationRepository();

	const processor = new AddProductActionProcessor(
		mockDeps.actionRepository,
		mockDeps.productRepository,
		mockDeps.userRepository,
		mockDeps.amazonApi,
		mockDeps.productUserRepository,
		mockDeps.productStatsService,
		mockNotificationRepository
	);

	const testCases = [
		{
			description: 'handles standard URL format',
			url: 'https://amazon.com.br/dp/B012345678/',
			expectedASIN: 'B012345678'
		},
		{
			description: 'handles URL with www prefix',
			url: 'https://www.amazon.com.br/dp/B012345678/',
			expectedASIN: 'B012345678'
		},
		{
			description: 'handles product URL format',
			url: 'https://amazon.com.br/gp/product/B012345678/',
			expectedASIN: 'B012345678'
		},
		{
			description: 'handles product URL with www prefix',
			url: 'https://www.amazon.com.br/gp/product/B012345678/',
			expectedASIN: 'B012345678'
		},
		{
			description: 'handles lowercase ASIN',
			url: 'https://amazon.com.br/dp/b012345678/',
			expectedASIN: 'B012345678'
		},
		{
			description: 'handles URL with query parameters',
			url: 'https://amazon.com.br/dp/B012345678?ref=something',
			expectedASIN: 'B012345678'
		}
	];

	const invalidUrls = [
		{
			description: 'rejects empty URL',
			url: ''
		},
		{
			description: 'rejects null URL',
			url: null
		},
		{
			description: 'rejects undefined URL',
			url: undefined
		},
		{
			description: 'rejects invalid URL format',
			url: 'https://amazon.com.br/invalid/B012345678'
		},
		{
			description: 'rejects URL with invalid ASIN length',
			url: 'https://amazon.com.br/dp/B0001A'
		},
		{
			description: 'rejects URL with invalid ASIN characters',
			url: 'https://amazon.com.br/dp/B00!123456'
		}
	];

	describe('extractASIN', () => {
		testCases.forEach(({ description, url, expectedASIN }) => {
			it(description, () => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const asin = (processor as any)['extractASIN'](url);
				expect(asin).toBe(expectedASIN);
			});
		});

		invalidUrls.forEach(({ description, url }) => {
			it(description, () => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const asin = (processor as any)['extractASIN'](url as string);
				expect(asin).toBeNull();
			});
		});
	});
});