import { createSession, isSessionExpired } from '@gibipromo/shared/dist/entities/Session';

describe('Session Entity', () => {
	it('should create a session with default expiration of 24 hours', () => {
		const sessionData = {
			session_id: 'session-123',
			user_id: 'user-456'
		};

		const session = createSession(sessionData);

		expect(session).toHaveProperty('id', sessionData.session_id);
		expect(session).toHaveProperty('session_id', sessionData.session_id);
		expect(session).toHaveProperty('user_id', sessionData.user_id);
		expect(session).toHaveProperty('expires_at');

		// Verifica se a expiração está aproximadamente 24 horas no futuro
		const expiresAt = new Date(session.expires_at);
		const now = new Date();
		const diff = expiresAt.getTime() - now.getTime();
		const hoursInMs = 24 * 60 * 60 * 1000;
		
		expect(diff).toBeGreaterThan(hoursInMs - 1000); // Tolerância de 1 segundo
		expect(diff).toBeLessThan(hoursInMs + 1000);
	});

	it('should create a session with custom expiration', () => {
		const sessionData = {
			session_id: 'session-123',
			user_id: 'user-456',
			expiresInMinutes: 60 // 1 hora
		};

		const session = createSession(sessionData);

		const expiresAt = new Date(session.expires_at);
		const now = new Date();
		const diff = expiresAt.getTime() - now.getTime();
		const hoursInMs = 60 * 60 * 1000; // 1 hora em ms
		
		expect(diff).toBeGreaterThan(hoursInMs - 1000);
		expect(diff).toBeLessThan(hoursInMs + 1000);
	});

	it('should correctly identify expired sessions', () => {
		const expiredSession = createSession({
			session_id: 'expired-session',
			user_id: 'user-123',
			expiresInMinutes: -10 // Expirou há 10 minutos
		});

		expect(isSessionExpired(expiredSession)).toBe(true);
	});

	it('should correctly identify non-expired sessions', () => {
		const validSession = createSession({
			session_id: 'valid-session',
			user_id: 'user-123',
			expiresInMinutes: 10 // Expira em 10 minutos
		});

		expect(isSessionExpired(validSession)).toBe(false);
	});
});