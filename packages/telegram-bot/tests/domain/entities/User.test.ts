import { createUser } from '@gibipromo/shared/dist/entities/User';

describe('User Entity', () => {
	it('should create a user with monitoring disabled by default', () => {
		const userData = {
			id: '123456789',
			name: 'John',
			username: 'johndoe',
			language: 'pt'
		};

		const user = createUser(userData);

		expect(user).toEqual({
			...userData,
			enabled: false
		});
	});

	it('should have all required properties', () => {
		const user = createUser({
			id: '123456789',
			name: 'John',
			username: 'johndoe',
			language: 'pt'
		});

		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('name');
		expect(user).toHaveProperty('username');
		expect(user).toHaveProperty('language');
		expect(user).toHaveProperty('enabled');
	});
});