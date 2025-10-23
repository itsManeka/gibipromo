/**
 * Testes para ASIN Extractor
 */

import {
	extractASIN,
	extractASINFromURL,
	extractASINFromDOM,
	isValidASIN,
} from '../../src/content/asin-extractor';

describe('ASIN Extractor', () => {
	describe('isValidASIN', () => {
		it('deve validar ASIN correto', () => {
			expect(isValidASIN('B08N5WRWNW')).toBe(true);
			expect(isValidASIN('1234567890')).toBe(true);
		});

		it('deve rejeitar ASIN inválido', () => {
			expect(isValidASIN('ABC')).toBe(false);
			expect(isValidASIN('12345')).toBe(false);
			expect(isValidASIN('ABCDEFGHIJK')).toBe(false);
			expect(isValidASIN('')).toBe(false);
		});
	});

	describe('extractASINFromURL', () => {
		it('deve extrair ASIN de URL /dp/', () => {
			const url = 'https://www.amazon.com.br/dp/B08N5WRWNW';
			expect(extractASINFromURL(url)).toBe('B08N5WRWNW');
		});

		it('deve extrair ASIN de URL /dp/ com query params', () => {
			const url = 'https://www.amazon.com.br/dp/B08N5WRWNW?ref=test';
			expect(extractASINFromURL(url)).toBe('B08N5WRWNW');
		});

		it('deve extrair ASIN de URL /gp/product/', () => {
			const url = 'https://www.amazon.com.br/gp/product/B08N5WRWNW';
			expect(extractASINFromURL(url)).toBe('B08N5WRWNW');
		});

		it('deve extrair ASIN de URL longa com título', () => {
			const url =
				'https://www.amazon.com.br/Nome-Produto-Teste/dp/B08N5WRWNW/ref=sr_1_1';
			expect(extractASINFromURL(url)).toBe('B08N5WRWNW');
		});

		it('deve retornar null para URL sem ASIN', () => {
			const url = 'https://www.amazon.com.br/';
			expect(extractASINFromURL(url)).toBeNull();
		});

		it('deve retornar null para URL inválida', () => {
			expect(extractASINFromURL('invalid-url')).toBeNull();
		});
	});

	describe('extractASINFromDOM', () => {
		beforeEach(() => {
			document.body.innerHTML = '';
		});

		it('deve extrair ASIN de input#ASIN', () => {
			document.body.innerHTML = '<input type="hidden" id="ASIN" value="B08N5WRWNW" />';
			expect(extractASINFromDOM()).toBe('B08N5WRWNW');
		});

		it('deve extrair ASIN de elemento com data-asin', () => {
			document.body.innerHTML = '<div data-asin="B08N5WRWNW"></div>';
			expect(extractASINFromDOM()).toBe('B08N5WRWNW');
		});

		it('deve retornar null se não encontrar ASIN', () => {
			document.body.innerHTML = '<div>No ASIN here</div>';
			expect(extractASINFromDOM()).toBeNull();
		});

		it('deve validar ASIN antes de retornar', () => {
			document.body.innerHTML = '<input id="ASIN" value="INVALID" />';
			expect(extractASINFromDOM()).toBeNull();
		});
	});

	describe('extractASIN', () => {
		it('deve priorizar URL sobre DOM', () => {
			document.body.innerHTML = '<input id="ASIN" value="B11111111A" />';
			const url = 'https://www.amazon.com.br/dp/B22222222B';

			expect(extractASIN(url)).toBe('B22222222B');
		});

		it('deve usar DOM como fallback', () => {
			document.body.innerHTML = '<input id="ASIN" value="B08N5WRWNW" />';

			// Mock window.location.href
			Object.defineProperty(window, 'location', {
				value: { href: 'https://www.amazon.com.br/' },
				writable: true,
			});

			expect(extractASIN()).toBe('B08N5WRWNW');
		});
	});
});

