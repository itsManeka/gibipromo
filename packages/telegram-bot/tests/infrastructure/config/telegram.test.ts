import { createTelegramBot } from '../../../src/infrastructure/config/telegram';
import { TelegramBot } from '../../../src/infrastructure/adapters/telegram';

// Mock dos repositórios DynamoDB
jest.mock('@gibipromo/shared', () => ({
	...jest.requireActual('@gibipromo/shared'),
	DynamoDBUserRepository: jest.fn().mockImplementation(() => ({})),
	DynamoDBActionRepository: jest.fn().mockImplementation(() => ({})),
	DynamoDBProductRepository: jest.fn().mockImplementation(() => ({})),
	DynamoDBProductUserRepository: jest.fn().mockImplementation(() => ({}))
}));

// Mock do TelegramBot
jest.mock('../../../src/infrastructure/adapters/telegram', () => ({
	TelegramBot: jest.fn().mockImplementation(() => ({
		start: jest.fn(),
		stop: jest.fn()
	}))
}));

describe('Telegram Config', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createTelegramBot', () => {
		it('deve criar instância do TelegramBot com repositórios', () => {
			const bot = createTelegramBot();

			expect(TelegramBot).toHaveBeenCalledWith(
				expect.any(Object), // userRepository
				expect.any(Object), // actionRepository
				expect.any(Object), // productRepository
				expect.any(Object)  // productUserRepository
			);
			expect(bot).toBeDefined();
		});

		it('deve retornar nova instância a cada chamada', () => {
			const bot1 = createTelegramBot();
			const bot2 = createTelegramBot();

			expect(TelegramBot).toHaveBeenCalledTimes(2);
			expect(bot1).toBeDefined();
			expect(bot2).toBeDefined();
		});
	});
});