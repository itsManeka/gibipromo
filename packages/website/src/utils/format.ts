/**
 * Normaliza lista de colaboradores (autores, ilustradores)
 * Remove duplicatas e limpa o formato
 * 
 * @param contributors - Array de nomes de colaboradores
 * @returns Array normalizado sem duplicatas
 * 
 * @example
 * normalizeContributors(['Eastman, Kevin', 'Bisley, Simon', 'Eastman, Kevin'])
 * // ['Eastman, Kevin', 'Bisley, Simon']
 * 
 * normalizeContributors(['Alan Moore', 'Dave Gibbons', 'Alan Moore'])
 * // ['Alan Moore', 'Dave Gibbons']
 */
export function normalizeContributors(contributors: string[] | undefined): string[] {
	if (!contributors || contributors.length === 0) {
		return [];
	}

	// Remove duplicatas mantendo a ordem original
	const uniqueContributors = Array.from(new Set(contributors.map(c => c.trim())));

	return uniqueContributors.filter(c => c.length > 0);
}

/**
 * Formata lista de colaboradores para exibição
 * Remove duplicatas e junta com separador visual (•)
 * 
 * @param contributors - Array de nomes de colaboradores
 * @returns String formatada para exibição
 * 
 * @example
 * formatContributors(['Eastman, Kevin', 'Bisley, Simon', 'Eastman, Kevin'])
 * // 'Eastman, Kevin • Bisley, Simon'
 */
export function formatContributors(contributors: string[] | undefined): string {
	const normalized = normalizeContributors(contributors);
	return normalized.join(' • ');
}

/**
 * Formata preço para exibição
 * @param price - Preço em número
 * @returns String formatada no padrão brasileiro (R$ 99,90)
 * 
 * @example
 * formatPrice(99.9) // 'R$ 99,90'
 * formatPrice(1234.56) // 'R$ 1.234,56'
 */
export function formatPrice(price: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL'
	}).format(price);
}

/**
 * Calcula e formata o desconto percentual
 * @param fullPrice - Preço cheio
 * @param currentPrice - Preço atual
 * @returns Desconto percentual arredondado
 * 
 * @example
 * calculateDiscount(100, 70) // 30
 * calculateDiscount(89.90, 59.90) // 33
 */
export function calculateDiscount(fullPrice: number, currentPrice: number): number {
	if (fullPrice <= 0 || currentPrice >= fullPrice) {
		return 0;
	}
	return Math.round(((fullPrice - currentPrice) / fullPrice) * 100);
}

/**
 * Trunca texto com ellipsis
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado
 * 
 * @example
 * truncateText('Batman: Ano Um - Edição Definitiva', 20)
 * // 'Batman: Ano Um - ...'
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return text.substring(0, maxLength - 3) + '...';
}

