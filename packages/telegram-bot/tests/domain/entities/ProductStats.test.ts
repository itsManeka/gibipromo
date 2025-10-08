import {
	createProductStats,
	calculatePercentageChange,
	shouldCreateStats
} from '@gibipromo/shared/dist/entities/ProductStats';

describe('ProductStats', () => {
	describe('createProductStats', () => {
		it('should create a ProductStats with generated id and created_at', () => {
			const params = {
				product_id: 'product123',
				price: 100,
				old_price: 120,
				percentage_change: 16.67
			};

			const productStats = createProductStats(params);

			expect(productStats.id).toBeDefined();
			expect(productStats.id).toMatch(/^stats_\d+_[a-z0-9]+$/);
			expect(productStats.product_id).toBe(params.product_id);
			expect(productStats.price).toBe(params.price);
			expect(productStats.old_price).toBe(params.old_price);
			expect(productStats.percentage_change).toBe(params.percentage_change);
			expect(productStats.created_at).toBeDefined();
			expect(new Date(productStats.created_at)).toBeInstanceOf(Date);
		});

		it('should generate unique ids for different calls', () => {
			const params = {
				product_id: 'product123',
				price: 100,
				old_price: 120,
				percentage_change: 16.67
			};

			const stats1 = createProductStats(params);
			const stats2 = createProductStats(params);

			expect(stats1.id).not.toBe(stats2.id);
		});
	});

	describe('calculatePercentageChange', () => {
		it('should calculate positive percentage for price reduction', () => {
			const result = calculatePercentageChange(100, 80);
			expect(result).toBe(20);
		});

		it('should calculate negative percentage for price increase', () => {
			const result = calculatePercentageChange(100, 120);
			expect(result).toBe(-20);
		});

		it('should return 0 for same prices', () => {
			const result = calculatePercentageChange(100, 100);
			expect(result).toBe(0);
		});

		it('should return 0 for invalid old price (zero)', () => {
			const result = calculatePercentageChange(0, 50);
			expect(result).toBe(0);
		});

		it('should return 0 for invalid old price (negative)', () => {
			const result = calculatePercentageChange(-10, 50);
			expect(result).toBe(0);
		});

		it('should handle decimal calculations correctly', () => {
			const result = calculatePercentageChange(150, 130);
			expect(result).toBeCloseTo(13.33, 2);
		});
	});

	describe('shouldCreateStats', () => {
		it('should return true for 5% reduction', () => {
			const result = shouldCreateStats(100, 95);
			expect(result).toBe(true);
		});

		it('should return true for more than 5% reduction', () => {
			const result = shouldCreateStats(100, 80);
			expect(result).toBe(true);
		});

		it('should return false for less than 5% reduction', () => {
			const result = shouldCreateStats(100, 96);
			expect(result).toBe(false);
		});

		it('should return false for no price change', () => {
			const result = shouldCreateStats(100, 100);
			expect(result).toBe(false);
		});

		it('should return false for price increase', () => {
			const result = shouldCreateStats(100, 120);
			expect(result).toBe(false);
		});

		it('should return false for invalid old price', () => {
			const result = shouldCreateStats(0, 50);
			expect(result).toBe(false);
		});

		it('should handle edge case of exactly 5% reduction', () => {
			const result = shouldCreateStats(100, 95);
			expect(result).toBe(true);
		});

		it('should handle decimal prices correctly', () => {
			const result = shouldCreateStats(19.99, 18.99);
			const percentage = calculatePercentageChange(19.99, 18.99);
			expect(percentage).toBeGreaterThan(5);
			expect(result).toBe(true);
		});
	});
});