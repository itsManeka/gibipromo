import { UserFactory, User } from '../../src/entities/User';

describe('UserFactory', () => {
	describe('generateId', () => {
		it('should generate a valid UUID v4', () => {
			const id = UserFactory.generateId();

			// UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
			const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(id).toMatch(uuidV4Regex);
		});

		it('should generate unique IDs', () => {
			const id1 = UserFactory.generateId();
			const id2 = UserFactory.generateId();
			const id3 = UserFactory.generateId();

			expect(id1).not.toBe(id2);
			expect(id1).not.toBe(id3);
			expect(id2).not.toBe(id3);
		});

		it('should generate IDs with correct format', () => {
			const id = UserFactory.generateId();
			const parts = id.split('-');

			expect(parts).toHaveLength(5);
			expect(parts[0]).toHaveLength(8);
			expect(parts[1]).toHaveLength(4);
			expect(parts[2]).toHaveLength(4);
			expect(parts[2][0]).toBe('4'); // Version 4
			expect(parts[3]).toHaveLength(4);
			expect(['8', '9', 'a', 'b']).toContain(parts[3][0].toLowerCase()); // Variant
			expect(parts[4]).toHaveLength(12);
		});
	});

	describe('createTelegramUser', () => {
		it('should create a telegram user with required fields', () => {
			const telegramId = '123456789';
			const user = UserFactory.createTelegramUser(telegramId);

			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.telegram_id).toBe(telegramId);
			expect(user.username).toBe('');
			expect(user.name).toBe('');
			expect(user.language).toBe('en');
			expect(user.enabled).toBe(false);
			expect(user.email).toBeUndefined();
		});
		
		it('should create a telegram user with optional username and name', () => {
			const telegramId = '123456789';
			const username = 'john_doe';
			const name = 'John Doe';

			const user = UserFactory.createTelegramUser(telegramId, username, name);

			expect(user.telegram_id).toBe(telegramId);
			expect(user.username).toBe(username);
			expect(user.name).toBe(name);
		});

		it('should create a telegram user with custom language', () => {
			const telegramId = '123456789';
			const language = 'pt-BR';

			const user = UserFactory.createTelegramUser(telegramId, undefined, undefined, language);

			expect(user.telegram_id).toBe(telegramId);
			expect(user.language).toBe(language);
		});

		it('should generate unique UUID v4 for each user', () => {
			const user1 = UserFactory.createTelegramUser('123');
			const user2 = UserFactory.createTelegramUser('456');

			expect(user1.id).not.toBe(user2.id);

			const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(user1.id).toMatch(uuidV4Regex);
			expect(user2.id).toMatch(uuidV4Regex);
		});

		it('should default enabled to false', () => {
			const user = UserFactory.createTelegramUser('123');
			expect(user.enabled).toBe(false);
		});
	});

	describe('createWebsiteUser', () => {
		it('should create a website user with required fields', () => {
			const email = 'test@example.com';
			const passwordHash = 'hashed_password';

			const user = UserFactory.createWebsiteUser(email, passwordHash);

			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.email).toBe(email);
			expect(user.password_hash).toBe(passwordHash);
			expect(user.username).toBe('');
			expect(user.name).toBe('');
			expect(user.language).toBe('en');
			expect(user.enabled).toBe(true);
		});

		it('should create a website user with optional username', () => {
			const email = 'test@example.com';
			const passwordHash = 'hashed_password';
			const username = 'web_test_123';

			const user = UserFactory.createWebsiteUser(email, passwordHash, username);

			expect(user.email).toBe(email);
			expect(user.password_hash).toBe(passwordHash);
			expect(user.username).toBe(username);
		});

		it('should generate unique UUID v4 for each user', () => {
			const user1 = UserFactory.createWebsiteUser('user1@example.com', 'hash1');
			const user2 = UserFactory.createWebsiteUser('user2@example.com', 'hash2');

			expect(user1.id).not.toBe(user2.id);

			const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(user1.id).toMatch(uuidV4Regex);
			expect(user2.id).toMatch(uuidV4Regex);
		});

		it('should default enabled to true', () => {
			const user = UserFactory.createWebsiteUser('test@example.com', 'hash');
			expect(user.enabled).toBe(true);
		});

		it('should not have telegram_id', () => {
			const user = UserFactory.createWebsiteUser('test@example.com', 'hash');
			expect(user.telegram_id).toBeUndefined();
		});
	});

	describe('createDefaultPreferences', () => {
		it('should create default preferences with all fields', () => {
			const userId = UserFactory.generateId();
			const preferences = UserFactory.createDefaultPreferences(userId);

			expect(preferences).toBeDefined();
			expect(preferences.id).toBeDefined();
			expect(preferences.user_id).toBe(userId);
			expect(preferences.monitor_preorders).toBe(false);
			expect(preferences.monitor_coupons).toBe(false);
		});

		it('should generate unique IDs for preferences', () => {
			const userId = UserFactory.generateId();
			const prefs1 = UserFactory.createDefaultPreferences(userId);
			const prefs2 = UserFactory.createDefaultPreferences(userId);

			expect(prefs1.id).not.toBe(prefs2.id);
		});

		it('should have default values as false', () => {
			const userId = UserFactory.generateId();
			const preferences = UserFactory.createDefaultPreferences(userId);

			expect(preferences.monitor_preorders).toBe(false);
			expect(preferences.monitor_coupons).toBe(false);
		});
	});

	describe('createDefaultProfile', () => {
		it('should create default profile with provided nick', () => {
			const userId = UserFactory.generateId();
			const nick = 'TestUser';
			const profile = UserFactory.createDefaultProfile(userId, nick);

			expect(profile).toBeDefined();
			expect(profile.id).toBeDefined();
			expect(profile.user_id).toBe(userId);
			expect(profile.nick).toBe(nick);
		});

		it('should use fallback nick when empty string provided', () => {
			const userId = UserFactory.generateId();
			const profile = UserFactory.createDefaultProfile(userId, '');

			expect(profile.nick).toBe('Usuario');
		});

		it('should generate unique IDs for profiles', () => {
			const userId = UserFactory.generateId();
			const profile1 = UserFactory.createDefaultProfile(userId, 'User1');
			const profile2 = UserFactory.createDefaultProfile(userId, 'User2');

			expect(profile1.id).not.toBe(profile2.id);
		});

		it('should handle different nick types', () => {
			const userId = UserFactory.generateId();

			const profile1 = UserFactory.createDefaultProfile(userId, 'username123');
			const profile2 = UserFactory.createDefaultProfile(userId, 'João Silva');
			const profile3 = UserFactory.createDefaultProfile(userId, 'web_user_xyz');

			expect(profile1.nick).toBe('username123');
			expect(profile2.nick).toBe('João Silva');
			expect(profile3.nick).toBe('web_user_xyz');
		});
	});
});
