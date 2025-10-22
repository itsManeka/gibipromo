import {
	normalizeContributors,
	formatContributors,
	formatPrice,
	calculateDiscount,
	truncateText
} from '../../utils/format';

describe('format utils', () => {
	describe('normalizeContributors', () => {
		it('should remove duplicate contributors', () => {
			const contributors = ['Eastman, Kevin', 'Bisley, Simon', 'Eastman, Kevin'];
			const result = normalizeContributors(contributors);
			expect(result).toEqual(['Eastman, Kevin', 'Bisley, Simon']);
		});

		it('should handle contributors already separated by comma in name', () => {
			const contributors = [
				'Eastman, Kevin',
				'Bisley, Simon',
				'Santana, Bernardo',
				'Santana, Bernardo'
			];
			const result = normalizeContributors(contributors);
			expect(result).toEqual([
				'Eastman, Kevin',
				'Bisley, Simon',
				'Santana, Bernardo'
			]);
		});

		it('should trim whitespace from contributor names', () => {
			const contributors = ['  Alan Moore  ', ' Dave Gibbons ', 'Alan Moore'];
			const result = normalizeContributors(contributors);
			expect(result).toEqual(['Alan Moore', 'Dave Gibbons']);
		});

		it('should return empty array for undefined input', () => {
			const result = normalizeContributors(undefined);
			expect(result).toEqual([]);
		});

		it('should return empty array for empty array input', () => {
			const result = normalizeContributors([]);
			expect(result).toEqual([]);
		});

		it('should filter out empty strings', () => {
			const contributors = ['Alan Moore', '', '  ', 'Dave Gibbons'];
			const result = normalizeContributors(contributors);
			expect(result).toEqual(['Alan Moore', 'Dave Gibbons']);
		});

		it('should maintain original order', () => {
			const contributors = ['C', 'A', 'B', 'A', 'C'];
			const result = normalizeContributors(contributors);
			expect(result).toEqual(['C', 'A', 'B']);
		});
	});

	describe('formatContributors', () => {
		it('should format contributors with bullet separator', () => {
			const contributors = ['Eastman, Kevin', 'Bisley, Simon', 'Eastman, Kevin'];
			const result = formatContributors(contributors);
			expect(result).toBe('Eastman, Kevin • Bisley, Simon');
		});

		it('should return empty string for undefined input', () => {
			const result = formatContributors(undefined);
			expect(result).toBe('');
		});

		it('should return empty string for empty array', () => {
			const result = formatContributors([]);
			expect(result).toBe('');
		});

		it('should use bullet separator for better visual clarity', () => {
			const contributors = ['Author One', 'Author Two', 'Author Three'];
			const result = formatContributors(contributors);
			expect(result).toBe('Author One • Author Two • Author Three');
			expect(result).toContain('•');
		});
	});

	describe('formatPrice', () => {
		it('should format price in Brazilian currency', () => {
			const result = formatPrice(99.9);
			expect(result).toContain('99,90');
			expect(result).toContain('R$');
		});

		it('should handle large numbers with thousands separator', () => {
			const result = formatPrice(1234.56);
			expect(result).toContain('1.234,56');
			expect(result).toContain('R$');
		});

		it('should handle zero', () => {
			const result = formatPrice(0);
			expect(result).toContain('0,00');
			expect(result).toContain('R$');
		});

		it('should handle negative numbers', () => {
			const result = formatPrice(-50.5);
			expect(result).toContain('50,50');
			expect(result).toContain('R$');
		});
	});

	describe('calculateDiscount', () => {
		it('should calculate discount percentage correctly', () => {
			const result = calculateDiscount(100, 70);
			expect(result).toBe(30);
		});

		it('should round discount to nearest integer', () => {
			const result = calculateDiscount(89.9, 59.9);
			expect(result).toBe(33); // ((89.9 - 59.9) / 89.9) * 100 = 33.37
		});

		it('should return 0 when current price is higher', () => {
			const result = calculateDiscount(50, 70);
			expect(result).toBe(0);
		});

		it('should return 0 when prices are equal', () => {
			const result = calculateDiscount(100, 100);
			expect(result).toBe(0);
		});

		it('should return 0 when full price is zero', () => {
			const result = calculateDiscount(0, 50);
			expect(result).toBe(0);
		});

		it('should return 0 when full price is negative', () => {
			const result = calculateDiscount(-100, 50);
			expect(result).toBe(0);
		});

		it('should handle 100% discount', () => {
			const result = calculateDiscount(100, 0);
			expect(result).toBe(100);
		});
	});

	describe('truncateText', () => {
		it('should truncate text longer than maxLength', () => {
			const result = truncateText('Batman: Ano Um - Edição Definitiva', 20);
			expect(result).toBe('Batman: Ano Um - ...');
		});

		it('should not truncate text shorter than maxLength', () => {
			const result = truncateText('Batman', 20);
			expect(result).toBe('Batman');
		});

		it('should not truncate text equal to maxLength', () => {
			const result = truncateText('12345678901234567890', 20);
			expect(result).toBe('12345678901234567890');
		});

		it('should handle empty string', () => {
			const result = truncateText('', 10);
			expect(result).toBe('');
		});

		it('should add ellipsis when truncating', () => {
			const text = 'This is a very long text that needs truncation';
			const result = truncateText(text, 20);
			expect(result.endsWith('...')).toBe(true);
			expect(result.length).toBe(20);
		});
	});
});

