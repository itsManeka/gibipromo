import { createTelegramUser, createWebsiteUser } from '@gibipromo/shared/dist/entities/User';

describe('User Entity', () => {
	it('should create a telegram user with monitoring disabled by default', () => {
		const userData = {
			id: 'uuid-123',
			telegram_id: '123456789',
			name: 'John',
			username: 'johndoe',
			language: 'pt'
		};

		const user = createTelegramUser(userData);

		expect(user).toEqual({
			...userData,
			enabled: false
		});
	});

	it('should create a website user with monitoring disabled by default', () => {
		const userData = {
			id: 'uuid-123',
			name: 'John',
			username: 'johndoe',
			language: 'pt',
			email: 'john@example.com',
			password_hash: 'hashed_password'
		};

		const user = createWebsiteUser(userData);

		expect(user).toEqual({
			...userData,
			enabled: false
		});
	});

	it('should have all required properties for telegram user', () => {
		const user = createTelegramUser({
			id: 'uuid-123',
			telegram_id: '123456789',
			name: 'John',
			username: 'johndoe',
			language: 'pt'
		});

		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('telegram_id');
		expect(user).toHaveProperty('name');
		expect(user).toHaveProperty('username');
		expect(user).toHaveProperty('language');
		expect(user).toHaveProperty('enabled');
	});
});