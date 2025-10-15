/**
 * Repository Factory
 * 
 * Factory functions para criar instâncias dos repositórios DynamoDB.
 * Centraliza a criação de repositórios para facilitar testes e manutenção.
 * 
 * @module infrastructure/factories/repositories
 */

import { 
	DynamoDBActionRepository,
	DynamoDBActionConfigRepository,
	DynamoDBProductRepository,
	DynamoDBProductStatsRepository,
	DynamoDBProductUserRepository,
	DynamoDBUserRepository,
	DynamoDBSessionRepository,
	DynamoDBUserPreferencesRepository,
	DynamoDBUserProfileRepository
} from '@gibipromo/shared';

/**
 * Interface com todos os repositórios disponíveis
 */
export interface Repositories {
	actions: DynamoDBActionRepository;
	actionConfigs: DynamoDBActionConfigRepository;
	products: DynamoDBProductRepository;
	productStats: DynamoDBProductStatsRepository;
	productUsers: DynamoDBProductUserRepository;
	users: DynamoDBUserRepository;
	sessions: DynamoDBSessionRepository;
	userPreferences: DynamoDBUserPreferencesRepository;
	userProfile: DynamoDBUserProfileRepository;
}

/**
 * Cria e retorna instâncias de todos os repositórios DynamoDB
 * 
 * @returns Objeto contendo todos os repositórios
 * 
 * @example
 * ```typescript
 * const repositories = createRepositories();
 * const user = await repositories.users.findById('user123');
 * const products = await repositories.products.findAll();
 * ```
 */
export function createRepositories(): Repositories {
	return {
		actions: new DynamoDBActionRepository(),
		actionConfigs: new DynamoDBActionConfigRepository(),
		products: new DynamoDBProductRepository(),
		productStats: new DynamoDBProductStatsRepository(),
		productUsers: new DynamoDBProductUserRepository(),
		users: new DynamoDBUserRepository(),
		sessions: new DynamoDBSessionRepository(),
		userPreferences: new DynamoDBUserPreferencesRepository(),
		userProfile: new DynamoDBUserProfileRepository()
	};
}

/**
 * Cria uma instância específica de repositório
 * 
 * @param repositoryType Tipo do repositório a ser criado
 * @returns Instância do repositório solicitado
 * 
 * @example
 * ```typescript
 * const userRepo = createRepository('users');
 * const productRepo = createRepository('products');
 * ```
 */
export function createRepository<K extends keyof Repositories>(
	repositoryType: K
): Repositories[K] {
	const repositories = createRepositories();
	return repositories[repositoryType];
}

/**
 * Nomes das tabelas DynamoDB
 */
export const TableNames = {
	USERS: 'Users',
	PRODUCTS: 'Products',
	PRODUCT_USERS: 'ProductUsers',
	ACTIONS: 'Actions',
	ACTION_CONFIGS: 'ActionConfigs',
	PRODUCT_STATS: 'ProductStats',
	SESSIONS: 'Sessions',
	USER_PREFERENCES: 'UserPreferences',
	USER_PROFILES: 'UserProfiles'
} as const;
