import { TelegramBot } from '../adapters/telegram';
import { 
	DynamoDBUserRepository, 
	DynamoDBActionRepository,
	DynamoDBProductRepository,
	DynamoDBProductUserRepository
} from '@gibipromo/shared';

export function createTelegramBot(): TelegramBot {
	const userRepository = new DynamoDBUserRepository();
	const actionRepository = new DynamoDBActionRepository();
	const productRepository = new DynamoDBProductRepository();
	const productUserRepository = new DynamoDBProductUserRepository();

	return new TelegramBot(userRepository, actionRepository, productRepository, productUserRepository);
}