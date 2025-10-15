/**
 * Testes do Repository Factory
 * 
 * Valida que os helpers e factories de repositórios estão funcionando corretamente.
 * 
 * @group unit
 */

import { createRepositories, createRepository, TableNames } from '../../../src/infrastructure/factories/repositories';

describe('Repository Factory', () => {
	describe('TableNames', () => {
		it('should export all required table names', () => {
			expect(TableNames.USERS).toBe('Users');
			expect(TableNames.PRODUCTS).toBe('Products');
			expect(TableNames.PRODUCT_USERS).toBe('ProductUsers');
			expect(TableNames.ACTIONS).toBe('Actions');
			expect(TableNames.ACTION_CONFIGS).toBe('ActionConfigs');
			expect(TableNames.PRODUCT_STATS).toBe('ProductStats');
			expect(TableNames.SESSIONS).toBe('Sessions');
			expect(TableNames.USER_PREFERENCES).toBe('UserPreferences');
			expect(TableNames.USER_PROFILES).toBe('UserProfiles');
		});
	});

	describe('createRepositories', () => {
		it('should create all repository instances', () => {
			const repos = createRepositories();
			
			expect(repos.actions).toBeDefined();
			expect(repos.actionConfigs).toBeDefined();
			expect(repos.products).toBeDefined();
			expect(repos.productStats).toBeDefined();
			expect(repos.productUsers).toBeDefined();
			expect(repos.users).toBeDefined();
			expect(repos.sessions).toBeDefined();
			expect(repos.userPreferences).toBeDefined();
			expect(repos.userProfile).toBeDefined();
		});

		it('should create repositories with correct methods', () => {
			const repos = createRepositories();
			
			// Verifica métodos básicos do Repository
			expect(typeof repos.users.create).toBe('function');
			expect(typeof repos.users.findById).toBe('function');
			expect(typeof repos.users.update).toBe('function');
			expect(typeof repos.users.delete).toBe('function');
			
			// Verifica métodos específicos do UserRepository
			expect(typeof repos.users.findByTelegramId).toBe('function');
			expect(typeof repos.users.findByEmail).toBe('function');
		});
	});

	describe('createRepository', () => {
		it('should create specific repository instance', () => {
			const userRepo = createRepository('users');
			
			expect(userRepo).toBeDefined();
			expect(typeof userRepo.findById).toBe('function');
		});

		it('should create different repository types', () => {
			const productRepo = createRepository('products');
			const actionRepo = createRepository('actions');
			
			expect(productRepo).toBeDefined();
			expect(actionRepo).toBeDefined();
			expect(typeof productRepo.findByLink).toBe('function');
			expect(typeof actionRepo.findPendingByType).toBe('function');
		});
	});
});
