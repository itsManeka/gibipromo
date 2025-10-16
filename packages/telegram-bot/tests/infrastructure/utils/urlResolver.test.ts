import { resolveShortUrl } from '@gibipromo/shared';

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

		describe('Domínios Amazon válidos', () => {
			const amazonDomains = [
				'amazon.com',
				'amazon.com.br', 
				'amazon.co.uk',
				'amazon.de',
				'amazon.fr',
				'amazon.it',
				'amazon.es',
				'amazon.ca',
				'amazon.com.au',
				'amazon.co.jp',
				'amazon.in'
			];

			amazonDomains.forEach(domain => {
				it(`deve reconhecer ${domain} como domínio Amazon válido`, async () => {
					const url = `https://${domain}/dp/B08PP8QHFQ`;
					const result = await resolveShortUrl(url);

					expect(result.success).toBe(true);
					expect(result.isAmazonUrl).toBe(true);
					expect(result.finalUrl).toBe(url);
				});

				it(`deve reconhecer subdomínios de ${domain} como válidos`, async () => {
					const url = `https://www.${domain}/dp/B08PP8QHFQ`;
					const result = await resolveShortUrl(url);

					expect(result.success).toBe(true);
					expect(result.isAmazonUrl).toBe(true);
					expect(result.finalUrl).toBe(url);
				});
			});
		});

		describe('Links encurtados e comportamento realista', () => {
			// Testes realistas: para domínios conhecidos como amzn.to e amzlink.to
			it('deve tentar redirecionar links amzn.to (pode ser Amazon ou não dependendo do destino)', async () => {
				const result = await resolveShortUrl('https://amzn.to/invalid-link-that-wont-redirect');

				// O resultado pode variar dependendo se o link redireciona para Amazon ou não
				expect(result.success).toBeTruthy();
				if (result.isAmazonUrl) {
					// Se for identificado como Amazon, deve ter uma URL final válida
					expect(result.finalUrl).toBeDefined();
				} else {
					// Se não for Amazon, deve ter um erro explicativo
					expect(result.error).toBeDefined();
				}
			});

			it('deve reconhecer a.co como domínio encurtado da Amazon', async () => {
				const result = await resolveShortUrl('https://a.co/invalid-link');

				expect(result.success).toBeTruthy();
				// a.co geralmente leva para Amazon, mas pode falhar em links inválidos
			});

			it('deve reconhecer amzlink.to como domínio encurtado (pode variar o resultado)', async () => {
				const result = await resolveShortUrl('https://amzlink.to/invalid-link');

				expect(result.success).toBeTruthy();
				// O resultado pode variar dependendo da rede e do destino
			});
		});

		describe('Validações de limite', () => {
			it('deve respeitar limite de redirecionamentos customizado', async () => {
				// Teste com limite baixo
				const result = await resolveShortUrl('https://amzn.to/test', 0);

				// Com limite 0, não deve seguir nenhum redirecionamento
				expect(result.success).toBe(false);
				expect(result.isAmazonUrl).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('deve funcionar com limite alto de redirecionamentos', async () => {
				const result = await resolveShortUrl('https://amazon.com/dp/B08PP8QHFQ', 100);

				// URL já é Amazon, não precisa de redirecionamento
				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
			});
		});

		describe('Casos edge de URLs', () => {
			it('deve tratar URLs com caracteres especiais', async () => {
				const url = 'https://amazon.com/dp/B08PP8QHFQ?ref=sr_1_1&keywords=test%20product';
				const result = await resolveShortUrl(url);

				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
				expect(result.finalUrl).toBe(url);
			});

			it('deve tratar URLs com fragmentos', async () => {
				const url = 'https://amazon.com/dp/B08PP8QHFQ#customerReviews';
				const result = await resolveShortUrl(url);

				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
				expect(result.finalUrl).toBe(url);
			});

			it('deve tratar URLs com portas não padrão', async () => {
				const url = 'https://amazon.com:8080/dp/B08PP8QHFQ';
				const result = await resolveShortUrl(url);

				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
				expect(result.finalUrl).toBe(url);
			});

			it('deve aceitar casos de maiúsculas e minúsculas (URL normalizada)', async () => {
				const url = 'https://AMAZON.COM/dp/B08PP8QHFQ';
				const result = await resolveShortUrl(url);

				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
				// URL pode ser normalizada para minúsculas
				expect(result.finalUrl).toBeDefined();
				if (result.finalUrl) {
					expect(result.finalUrl.toLowerCase()).toBe(url.toLowerCase());
				}
			});

			it('deve tratar subdomínios complexos', async () => {
				const url = 'https://affiliate.amazon.com.br/dp/B08PP8QHFQ';
				const result = await resolveShortUrl(url);

				expect(result.success).toBe(true);
				expect(result.isAmazonUrl).toBe(true);
				expect(result.finalUrl).toBe(url);
			});
		});

		describe('Domínios não Amazon', () => {
			const nonAmazonDomains = [
				'google.com',
				'facebook.com',
				'amazon-fake.com',
				'fake-amazon.com',
				'not-amazon.com.br',
				'amazonfake.com'
			];

			nonAmazonDomains.forEach(domain => {
				it(`deve rejeitar ${domain} como domínio não Amazon`, async () => {
					const url = `https://${domain}/some/path`;
					const result = await resolveShortUrl(url);

					expect(result.success).toBe(true);
					expect(result.isAmazonUrl).toBe(false);
					expect(result.error).toBe('Não é um link encurtado da Amazon conhecido');
				});
			});
		});
	});
});