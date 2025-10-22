import { UserFactory } from '@gibipromo/shared/dist/entities/User';

describe('User Entity', () => {
	it('should create a telegram user with monitoring disabled by default', () => {
		const telegramId = '123456789';
		const username = 'johndoe';
		const name = 'John';
		const language = 'pt';

		const user = UserFactory.createTelegramUser(telegramId, username, name, language);

		expect(user).toMatchObject({
			telegram_id: telegramId,
			name,
			username,
			language,
			enabled: false
		});
		expect(user.id).toBeDefined();
	});

	it('should create a website user with monitoring enabled by default', () => {
		const email = 'john@example.com';
		const passwordHash = 'hashed_password';
		const username = 'johndoe';

		const user = UserFactory.createWebsiteUser(email, passwordHash, username);

		expect(user).toMatchObject({
			email,
			password_hash: passwordHash,
			username,
			enabled: true
		});
		expect(user.id).toBeDefined();
	});

	it('should have all required properties for telegram user', () => {
		const user = UserFactory.createTelegramUser('123456789', 'johndoe', 'John', 'pt');

		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('telegram_id');
		expect(user).toHaveProperty('name');
		expect(user).toHaveProperty('username');
		expect(user).toHaveProperty('language');
		expect(user).toHaveProperty('enabled');
	});
});