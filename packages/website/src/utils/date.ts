/**
 * Formata uma data ISO 8601 para o formato brasileiro (dd/mm/yyyy)
 * @param dateStr - String de data em formato ISO 8601
 * @returns Data formatada no padrão brasileiro
 * @example
 * formatDate('2024-01-15T10:30:00.000Z') // '15/01/2024'
 */
export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	
	// Verifica se a data é válida
	if (isNaN(date.getTime())) {
		return 'Data inválida';
	}

	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

/**
 * Formata uma data ISO 8601 para formato completo (dd/mm/yyyy às HH:mm)
 * @param dateStr - String de data em formato ISO 8601
 * @returns Data e hora formatadas
 * @example
 * formatDateTime('2024-01-15T10:30:00.000Z') // '15/01/2024 às 10:30'
 */
export function formatDateTime(dateStr: string): string {
	const date = new Date(dateStr);
	
	// Verifica se a data é válida
	if (isNaN(date.getTime())) {
		return 'Data inválida';
	}

	const dateFormatted = date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

	const timeFormatted = date.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	});

	return `${dateFormatted} às ${timeFormatted}`;
}
