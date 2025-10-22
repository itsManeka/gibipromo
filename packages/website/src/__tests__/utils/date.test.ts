import { formatDate, formatDateTime } from '../../utils/date';

describe('date utils', () => {
	describe('formatDate', () => {
		it('deve formatar data ISO 8601 para formato brasileiro', () => {
			const result = formatDate('2024-01-15T10:30:00.000Z');
			expect(result).toBe('15/01/2024');
		});

	it('deve formatar corretamente datas em diferentes meses', () => {
		expect(formatDate('2024-03-05T12:00:00.000Z')).toBe('05/03/2024');
		expect(formatDate('2024-12-25T12:00:00.000Z')).toBe('25/12/2024');
	});		it('deve retornar "Data inválida" para string inválida', () => {
			const result = formatDate('invalid-date');
			expect(result).toBe('Data inválida');
		});

		it('deve retornar "Data inválida" para string vazia', () => {
			const result = formatDate('');
			expect(result).toBe('Data inválida');
		});

		it('deve lidar com diferentes formatos ISO', () => {
			expect(formatDate('2024-01-15T12:00:00Z')).toBe('15/01/2024');
			expect(formatDate('2024-01-15T12:00:00.000Z')).toBe('15/01/2024');
		});
	});

	describe('formatDateTime', () => {
		it('deve formatar data e hora completas', () => {
			const result = formatDateTime('2024-01-15T10:30:00.000Z');
			
			// O formato pode variar dependendo do timezone, então verificamos a estrutura
			expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/);
		});

		it('deve retornar "Data inválida" para string inválida', () => {
			const result = formatDateTime('invalid-date');
			expect(result).toBe('Data inválida');
		});

		it('deve retornar "Data inválida" para string vazia', () => {
			const result = formatDateTime('');
			expect(result).toBe('Data inválida');
		});

		it('deve formatar corretamente diferentes horários', () => {
			const morning = formatDateTime('2024-01-15T08:00:00.000Z');
			const evening = formatDateTime('2024-01-15T20:45:00.000Z');
			
			expect(morning).toMatch(/\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/);
			expect(evening).toMatch(/\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/);
		});
	});
});
