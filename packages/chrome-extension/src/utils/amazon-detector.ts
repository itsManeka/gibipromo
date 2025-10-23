/**
 * Amazon detector - detecta páginas de produtos Amazon
 */

export const AMAZON_DOMAINS: Record<string, string> = {
	BR: 'amazon.com.br',
	// Preparado para expansão futura:
	// US: 'amazon.com',
	// UK: 'amazon.co.uk',
	// DE: 'amazon.de',
	// ES: 'amazon.es',
	// FR: 'amazon.fr',
	// IT: 'amazon.it',
	// JP: 'amazon.co.jp',
};

/**
 * Verifica se a URL é de uma página de produto da Amazon
 */
export function isAmazonProductPage(url: string): boolean {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();

		// Verificar se é domínio Amazon
		const isAmazonDomain = Object.values(AMAZON_DOMAINS).some((domain) =>
			hostname.includes(domain)
		);

		if (!isAmazonDomain) {
			return false;
		}

		// Verificar se é página de produto
		const path = urlObj.pathname.toLowerCase();
		return path.includes('/dp/') || path.includes('/gp/product/');
	} catch {
		return false;
	}
}

/**
 * Retorna a região da Amazon baseado no hostname
 */
export function getAmazonRegion(hostname: string): keyof typeof AMAZON_DOMAINS | null {
	const lowerHostname = hostname.toLowerCase();

	for (const [region, domain] of Object.entries(AMAZON_DOMAINS)) {
		if (lowerHostname.includes(domain)) {
			return region as keyof typeof AMAZON_DOMAINS;
		}
	}

	return null;
}

/**
 * Verifica se o hostname é um domínio Amazon válido
 */
export function isAmazonDomain(hostname: string): boolean {
	return getAmazonRegion(hostname) !== null;
}

