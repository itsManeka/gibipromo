/**
 * Testes para Amazon Detector
 */

import {
	isAmazonProductPage,
	getAmazonRegion,
	isAmazonDomain,
} from '../../src/utils/amazon-detector';

describe('Amazon Detector', () => {
	describe('isAmazonDomain', () => {
		it('deve detectar domínio Amazon Brasil', () => {
			expect(isAmazonDomain('www.amazon.com.br')).toBe(true);
			expect(isAmazonDomain('amazon.com.br')).toBe(true);
		});

		it('deve rejeitar domínio não-Amazon', () => {
			expect(isAmazonDomain('www.google.com')).toBe(false);
			expect(isAmazonDomain('example.com')).toBe(false);
		});
	});

	describe('getAmazonRegion', () => {
		it('deve retornar BR para amazon.com.br', () => {
			expect(getAmazonRegion('www.amazon.com.br')).toBe('BR');
			expect(getAmazonRegion('amazon.com.br')).toBe('BR');
		});

		it('deve retornar null para domínio não-Amazon', () => {
			expect(getAmazonRegion('www.google.com')).toBeNull();
		});
	});

	describe('isAmazonProductPage', () => {
		it('deve detectar página de produto com /dp/', () => {
			const url = 'https://www.amazon.com.br/produto/dp/B08N5WRWNW';
			expect(isAmazonProductPage(url)).toBe(true);
		});

		it('deve detectar página de produto com /gp/product/', () => {
			const url = 'https://www.amazon.com.br/gp/product/B08N5WRWNW';
			expect(isAmazonProductPage(url)).toBe(true);
		});

		it('deve rejeitar página home da Amazon', () => {
			const url = 'https://www.amazon.com.br/';
			expect(isAmazonProductPage(url)).toBe(false);
		});

		it('deve rejeitar página de busca', () => {
			const url = 'https://www.amazon.com.br/s?k=livro';
			expect(isAmazonProductPage(url)).toBe(false);
		});

		it('deve rejeitar domínio não-Amazon', () => {
			const url = 'https://www.google.com/dp/B08N5WRWNW';
			expect(isAmazonProductPage(url)).toBe(false);
		});

		it('deve retornar false para URL inválida', () => {
			expect(isAmazonProductPage('invalid-url')).toBe(false);
		});
	});
});

