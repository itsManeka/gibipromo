/**
 * ProductActionsService Tests
 *
 * Tests for product actions service business logic
 */

import { ProductActionsService } from '../../src/services/ProductActionsService';
import { ActionRepository, UserRepository } from '@gibipromo/shared';
import { Action, ActionType } from '@gibipromo/shared/dist/entities/Action';
import { User } from '@gibipromo/shared/dist/entities/User';

// Mock do ActionRepository
class MockActionRepository implements ActionRepository {
	private actions: Action[] = [];

	async create(entity: Action): Promise<Action> {
		this.actions.push(entity);
		return entity;
	}

	async findById(id: string): Promise<Action | null> {
		return this.actions.find(a => a.id === id) || null;
	}

	async update(entity: Action): Promise<Action> {
		const index = this.actions.findIndex(a => a.id === entity.id);
		if (index !== -1) {
			this.actions[index] = entity;
		}
		return entity;
	}

	async delete(id: string): Promise<void> {
		this.actions = this.actions.filter(a => a.id !== id);
	}

	async findByType(type: ActionType): Promise<Action[]> {
		return this.actions.filter(a => a.type === type);
	}

	async findPendingByType(type: ActionType, limit: number): Promise<Action[]> {
		return this.actions
			.filter(a => a.type === type && a.is_processed === 0)
			.slice(0, limit);
	}

	async findPendingByTypeAndDate(): Promise<Action[]> {
		return this.actions.filter(a => a.is_processed === 0);
	}

	async findByUserId(userId: string): Promise<Action[]> {
		return this.actions.filter(a => a.user_id === userId);
	}

	async markProcessed(id: string): Promise<void> {
		const action = await this.findById(id);
		if (action) {
			action.is_processed = 1;
			await this.update(action);
		}
	}

	async markAsProcessed(id: string): Promise<void> {
		await this.markProcessed(id);
	}

	// Método auxiliar para testes
	getActions(): Action[] {
		return this.actions;
	}

	clearActions(): void {
		this.actions = [];
	}
}

// Mock do UserRepository
class MockUserRepository implements UserRepository {
	private users: User[] = [];

	constructor(initialUsers: User[] = []) {
		this.users = initialUsers;
	}

	async create(entity: User): Promise<User> {
		this.users.push(entity);
		return entity;
	}

	async findById(id: string): Promise<User | null> {
		return this.users.find(u => u.id === id) || null;
	}

	async update(entity: User): Promise<User> {
		const index = this.users.findIndex(u => u.id === entity.id);
		if (index !== -1) {
			this.users[index] = entity;
		}
		return entity;
	}

	async delete(id: string): Promise<void> {
		this.users = this.users.filter(u => u.id !== id);
	}

	async findByTelegramId(telegramId: string): Promise<User | null> {
		return this.users.find(u => u.telegram_id === telegramId) || null;
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.users.find(u => u.email === email) || null;
	}

	async findByUsername(username: string): Promise<User | null> {
		return this.users.find(u => u.username === username) || null;
	}

	async setEnabled(userId: string, enabled: boolean): Promise<User> {
		const user = await this.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}
		user.enabled = enabled;
		return this.update(user);
	}

	async updateSessionId(userId: string, sessionId: string | null): Promise<User> {
		const user = await this.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}
		user.session_id = sessionId || undefined;
		return this.update(user);
	}
}

// Helper para criar usuário de teste
function createTestUser(overrides: Partial<User> = {}): User {
	const now = new Date().toISOString();
	return {
		id: `user-${Date.now()}-${Math.random()}`,
		telegram_id: '123456789',
		username: 'testuser',
		name: 'Test User',
		language: 'pt-BR',
		enabled: true,
		created_at: now,
		updated_at: now,
		...overrides
	};
}

describe('ProductActionsService', () => {
	let service: ProductActionsService;
	let mockActionRepo: MockActionRepository;
	let mockUserRepo: MockUserRepository;

	beforeEach(() => {
		mockActionRepo = new MockActionRepository();
		mockUserRepo = new MockUserRepository();
		service = new ProductActionsService(mockActionRepo, mockUserRepo);
	});

	afterEach(() => {
		mockActionRepo.clearActions();
	});

	describe('addProductForMonitoring', () => {
		it('should create ADD_PRODUCT action for valid Amazon URL', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://www.amazon.com.br/dp/B08N5WRWNW';
			const result = await service.addProductForMonitoring(user.id, url);

			expect(result.actionId).toBeDefined();

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(1);
			expect(actions[0].type).toBe(ActionType.ADD_PRODUCT);
			expect(actions[0].user_id).toBe(user.id);
			expect(actions[0].value).toBe(url);
			expect(actions[0].is_processed).toBe(0);
		});

		it('should create action for shortened Amazon URL', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://amzn.to/3abc123';
			const result = await service.addProductForMonitoring(user.id, url);

			expect(result.actionId).toBeDefined();

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(1);
			expect(actions[0].value).toBe(url);
		});

		it('should throw error if user not found', async () => {
			const url = 'https://www.amazon.com.br/dp/B08N5WRWNW';

			await expect(
				service.addProductForMonitoring('nonexistent-user', url)
			).rejects.toThrow('Usuário não encontrado');
		});

		it('should throw error if user is disabled', async () => {
			const user = createTestUser({ id: 'user-123', enabled: false });
			mockUserRepo.create(user);

			const url = 'https://www.amazon.com.br/dp/B08N5WRWNW';

			await expect(
				service.addProductForMonitoring(user.id, url)
			).rejects.toThrow('Sua monitoria está desabilitada');
		});

		it('should throw error for invalid Amazon URL', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://www.google.com';

			await expect(
				service.addProductForMonitoring(user.id, url)
			).rejects.toThrow('URL deve ser da Amazon');
		});

		it('should throw error for empty URL', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			await expect(
				service.addProductForMonitoring(user.id, '')
			).rejects.toThrow('URL inválida');
		});

		it('should throw error for malformed URL', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			await expect(
				service.addProductForMonitoring(user.id, 'not-a-url')
			).rejects.toThrow('URL inválida');
		});
	});

	describe('addMultipleProducts', () => {
		it('should create actions for multiple valid URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const urls = [
				'https://www.amazon.com.br/dp/B08N5WRWNW',
				'https://amzn.to/3abc123',
				'https://www.amazon.com.br/dp/B07XYZ9876'
			];

			const results = await service.addMultipleProducts(user.id, urls);

			expect(results.successCount).toBe(3);
			expect(results.failedUrls).toHaveLength(0);

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(3);
			expect(actions[0].type).toBe(ActionType.ADD_PRODUCT);
			expect(actions[1].type).toBe(ActionType.ADD_PRODUCT);
			expect(actions[2].type).toBe(ActionType.ADD_PRODUCT);
		});

		it('should handle mix of valid and invalid URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const urls = [
				'https://www.amazon.com.br/dp/B08N5WRWNW',
				'https://www.google.com',
				'https://amzn.to/3abc123',
				'not-a-url'
			];

			const results = await service.addMultipleProducts(user.id, urls);

			expect(results.successCount).toBe(2);
			expect(results.failedUrls).toHaveLength(2);

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(2);
		});

		it('should return all failed for user not found', async () => {
			const urls = [
				'https://www.amazon.com.br/dp/B08N5WRWNW',
				'https://amzn.to/3abc123'
			];

			const results = await service.addMultipleProducts('nonexistent-user', urls);

			expect(results.successCount).toBe(0);
			expect(results.failedUrls).toHaveLength(2);
			expect(results.failedUrls).toContain('https://www.amazon.com.br/dp/B08N5WRWNW');
		});

		it('should return all failed for disabled user', async () => {
			const user = createTestUser({ id: 'user-123', enabled: false });
			mockUserRepo.create(user);

			const urls = [
				'https://www.amazon.com.br/dp/B08N5WRWNW',
				'https://amzn.to/3abc123'
			];

			const results = await service.addMultipleProducts(user.id, urls);

			expect(results.successCount).toBe(0);
			expect(results.failedUrls).toHaveLength(2);
		});

		it('should handle empty URL array', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const results = await service.addMultipleProducts(user.id, []);

			expect(results.successCount).toBe(0);
			expect(results.failedUrls).toHaveLength(0);
		});

		it('should process each URL independently', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const urls = [
				'https://www.amazon.com.br/dp/B08N5WRWNW',
				'invalid-url',
				'https://amzn.to/3abc123'
			];

			const results = await service.addMultipleProducts(user.id, urls);

			expect(results.successCount).toBe(2);
			expect(results.failedUrls).toHaveLength(1);
			expect(results.failedUrls).toContain('invalid-url');
		});
	});

	describe('URL validation edge cases', () => {
		it('should accept amazon.com.br URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://www.amazon.com.br/dp/B08N5WRWNW';
			await service.addProductForMonitoring(user.id, url);

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(1);
		});

		it('should accept amazon.com URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://www.amazon.com/dp/B08N5WRWNW';
			await service.addProductForMonitoring(user.id, url);

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(1);
		});

		it('should accept amzn.to URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://amzn.to/3abc123';
			await service.addProductForMonitoring(user.id, url);

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(1);
		});

		it('should accept a.co URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const url = 'https://a.co/d/abc123';
			await service.addProductForMonitoring(user.id, url);

			const actions = mockActionRepo.getActions();
			expect(actions).toHaveLength(1);
		});

		it('should reject non-Amazon URLs', async () => {
			const user = createTestUser({ id: 'user-123', enabled: true });
			mockUserRepo.create(user);

			const invalidUrls = [
				'https://www.mercadolivre.com.br/p/123',
				'https://www.ebay.com/item/123',
				'https://www.submarino.com.br/produto/123'
			];

			for (const url of invalidUrls) {
				await expect(
					service.addProductForMonitoring(user.id, url)
				).rejects.toThrow('URL deve ser da Amazon');
			}
		});
	});
});
