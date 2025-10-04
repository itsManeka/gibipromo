import { AddProductActionProcessor } from '../../../../src/application/usecases/processors/AddProductActionProcessor';

describe('AddProductActionProcessor URL Validation', () => {
    const mockDeps = {
        actionRepository: {} as any,
        productRepository: {} as any,
        userRepository: {} as any,
        amazonApi: {} as any,
    };

    const processor = new AddProductActionProcessor(
        mockDeps.actionRepository,
        mockDeps.productRepository,
        mockDeps.userRepository,
        mockDeps.amazonApi
    );

    const testCases = [
        {
            description: 'handles standard URL format',
            url: 'https://amazon.com.br/dp/B0001AAAA/',
            expectedASIN: 'B0001AAAA'
        },
        {
            description: 'handles URL with www prefix',
            url: 'https://www.amazon.com.br/dp/B0001AAAA/',
            expectedASIN: 'B0001AAAA'
        },
        {
            description: 'handles product URL format',
            url: 'https://amazon.com.br/gp/product/B0001AAAA/',
            expectedASIN: 'B0001AAAA'
        },
        {
            description: 'handles product URL with www prefix',
            url: 'https://www.amazon.com.br/gp/product/B0001AAAA/',
            expectedASIN: 'B0001AAAA'
        },
        {
            description: 'handles lowercase ASIN',
            url: 'https://amazon.com.br/dp/b0001aaaa/',
            expectedASIN: 'B0001AAAA'
        },
        {
            description: 'handles URL with query parameters',
            url: 'https://amazon.com.br/dp/B0001AAAA?ref=something',
            expectedASIN: 'B0001AAAA'
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
            url: 'https://amazon.com.br/invalid/B0001AAAA'
        },
        {
            description: 'rejects URL with invalid ASIN length',
            url: 'https://amazon.com.br/dp/B0001A'
        },
        {
            description: 'rejects URL with invalid ASIN characters',
            url: 'https://amazon.com.br/dp/B00!1AAAA'
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