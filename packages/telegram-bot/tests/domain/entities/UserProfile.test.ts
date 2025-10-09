import { createUserProfile } from '@gibipromo/shared/dist/entities/UserProfile';

describe('UserProfile Entity', () => {
	it('should create a user profile with required fields', () => {
		const profileData = {
			id: 'profile-123',
			user_id: 'user-456',
			nick: 'JohnDoe'
		};

		const profile = createUserProfile(profileData);

		expect(profile).toEqual({
			id: 'profile-123',
			user_id: 'user-456',
			nick: 'JohnDoe'
		});
	});

	it('should have all required properties', () => {
		const profile = createUserProfile({
			id: 'profile-123',
			user_id: 'user-456',
			nick: 'TestUser'
		});

		expect(profile).toHaveProperty('id');
		expect(profile).toHaveProperty('user_id');
		expect(profile).toHaveProperty('nick');
	});
});