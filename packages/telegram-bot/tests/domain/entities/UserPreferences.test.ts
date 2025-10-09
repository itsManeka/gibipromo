import { createUserPreferences } from '@gibipromo/shared/dist/entities/UserPreferences';

describe('UserPreferences Entity', () => {
	it('should create user preferences with default values', () => {
		const preferencesData = {
			id: 'pref-123',
			user_id: 'user-456'
		};

		const preferences = createUserPreferences(preferencesData);

		expect(preferences).toEqual({
			id: 'pref-123',
			user_id: 'user-456',
			monitor_preorders: true,
			monitor_coupons: true,
			theme: 'light'
		});
	});

	it('should create user preferences with custom values', () => {
		const preferencesData = {
			id: 'pref-123',
			user_id: 'user-456',
			monitor_preorders: false,
			monitor_coupons: false,
			theme: 'dark' as const
		};

		const preferences = createUserPreferences(preferencesData);

		expect(preferences).toEqual({
			id: 'pref-123',
			user_id: 'user-456',
			monitor_preorders: false,
			monitor_coupons: false,
			theme: 'dark'
		});
	});

	it('should have all required properties', () => {
		const preferences = createUserPreferences({
			id: 'pref-123',
			user_id: 'user-456'
		});

		expect(preferences).toHaveProperty('id');
		expect(preferences).toHaveProperty('user_id');
		expect(preferences).toHaveProperty('monitor_preorders');
		expect(preferences).toHaveProperty('monitor_coupons');
		expect(preferences).toHaveProperty('theme');
	});
});