import { resolveShortUrl } from '../../../src/infrastructure/utils/urlResolver';

describe('urlResolver', () => {
	describe('resolveShortUrl', () => {
		it('deve retornar diretamente URLs Amazon completas sem redirecionamento', async () => {
			const url = 'https://www.amazon.com.br/dp/B08PP8QHFQ';

			const result = await resolveShortUrl(url);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(true);
			expect(result.finalUrl).toBe(url);
			expect(result.error).toBeUndefined();
		});

		it('deve identificar URLs Amazon.com como válidas', async () => {
			const url = 'https://www.amazon.com/dp/B08PP8QHFQ';

			const result = await resolveShortUrl(url);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(true);
			expect(result.finalUrl).toBe(url);
		});

		it('deve identificar diferentes domínios Amazon como válidos', async () => {
			const urls = [
				'https://amazon.com.br/dp/B08PP8QHFQ',
				'https://amazon.co.uk/dp/B08PP8QHFQ',
				'https://amazon.de/dp/B08PP8QHFQ',
				'https://amazon.fr/dp/B08PP8QHFQ',
				'https://amazon.ca/dp/B08PP8QHFQ'
			];

			for (const url of urls) {
				const result = await resolveShortUrl(url);
				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
				expect(result.finalUrl).toBe(url);
			}
		});

		it('deve rejeitar URLs não Amazon como inválidas', async () => {
			const nonAmazonUrl = 'https://www.google.com/search?q=test';

			const result = await resolveShortUrl(nonAmazonUrl);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(false);
			expect(result.finalUrl).toBe(nonAmazonUrl);
			expect(result.error).toBe('Não é um link encurtado da Amazon conhecido');
		});

		it('deve tratar URLs malformadas', async () => {
			const invalidUrl = 'not-a-url';

			const result = await resolveShortUrl(invalidUrl);

			expect(result.success).toBe(false);
			expect(result.isAmazonUrl).toBe(false);
			expect(result.error).toContain('URL inválida');
		});

		it('deve tratar URLs vazias', async () => {
			const emptyUrl = '';

			const result = await resolveShortUrl(emptyUrl);

			expect(result.success).toBe(false);
			expect(result.isAmazonUrl).toBe(false);
			expect(result.error).toContain('URL inválida');
		});

		it('deve identificar URLs Amazon com subdomínios', async () => {
			const url = 'https://smile.amazon.com/dp/B08PP8QHFQ';

			const result = await resolveShortUrl(url);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(true);
			expect(result.finalUrl).toBe(url);
		});

		it('deve rejeitar domínios que apenas contêm amazon no nome', async () => {
			const fakeUrl = 'https://not-amazon.com/fake';

			const result = await resolveShortUrl(fakeUrl);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(false);
			expect(result.error).toBe('Não é um link encurtado da Amazon conhecido');
		});

		it('deve aceitar URLs Amazon com protocolo HTTP', async () => {
			const url = 'http://amazon.com/dp/B08PP8QHFQ';

			const result = await resolveShortUrl(url);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(true);
			expect(result.finalUrl).toBe(url);
		});

		it('deve aceitar URLs Amazon com portas específicas', async () => {
			const url = 'https://amazon.com:443/dp/B08PP8QHFQ';

			const result = await resolveShortUrl(url);

			expect(result.success).toBe(true);
			expect(result.isAmazonUrl).toBe(true);
			expect(result.finalUrl).toBe('https://amazon.com/dp/B08PP8QHFQ');
		});
	});
});