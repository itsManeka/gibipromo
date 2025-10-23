/**
 * ASIN Extractor - extrai ASIN de URLs e DOM da Amazon
 */

const ASIN_REGEX = /^[A-Z0-9]{10}$/;

/**
 * Extrai ASIN da URL
 */
export function extractASINFromURL(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const path = urlObj.pathname;

		// Pattern: /dp/{ASIN}
		const dpMatch = path.match(/\/dp\/([A-Z0-9]{10})/i);
		if (dpMatch) {
			return dpMatch[1].toUpperCase();
		}

		// Pattern: /gp/product/{ASIN}
		const gpMatch = path.match(/\/gp\/product\/([A-Z0-9]{10})/i);
		if (gpMatch) {
			return gpMatch[1].toUpperCase();
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Extrai ASIN do DOM da página
 */
export function extractASINFromDOM(): string | null {
	// Método 1: Input hidden com id "ASIN"
	const asinInput = document.querySelector<HTMLInputElement>('input#ASIN');
	if (asinInput && asinInput.value && ASIN_REGEX.test(asinInput.value)) {
		return asinInput.value.toUpperCase();
	}

	// Método 2: Atributos data-asin
	const dataAsinElement = document.querySelector('[data-asin]');
	if (dataAsinElement) {
		const asin = dataAsinElement.getAttribute('data-asin');
		if (asin && ASIN_REGEX.test(asin)) {
			return asin.toUpperCase();
		}
	}

	// Método 3: Procurar em elementos comuns
	const selectors = [
		'[data-asin]',
		'[data-parent-asin]',
		'input[name="ASIN"]',
		'input[name="asin"]',
	];

	for (const selector of selectors) {
		const element = document.querySelector(selector);
		if (element) {
			const asin =
				element.getAttribute('data-asin') ||
				element.getAttribute('data-parent-asin') ||
				(element as HTMLInputElement).value;

			if (asin && ASIN_REGEX.test(asin)) {
				return asin.toUpperCase();
			}
		}
	}

	return null;
}

/**
 * Extrai ASIN da página (URL first, depois DOM)
 */
export function extractASIN(url?: string): string | null {
	// Tentar URL primeiro
	const urlToUse = url || window.location.href;
	const asinFromURL = extractASINFromURL(urlToUse);
	if (asinFromURL) {
		return asinFromURL;
	}

	// Fallback para DOM
	return extractASINFromDOM();
}

/**
 * Valida se string é um ASIN válido
 */
export function isValidASIN(asin: string): boolean {
	return ASIN_REGEX.test(asin);
}

