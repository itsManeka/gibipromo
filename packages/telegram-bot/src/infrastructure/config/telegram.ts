import { TelegramBot } from '../adapters/telegram';
import { 
	DynamoDBUserRepository, 
	DynamoDBActionRepository,
	DynamoDBProductRepository,
	DynamoDBProductUserRepository,
	DynamoDBUserPreferencesRepository,
	DynamoDBUserProfileRepository,
	DynamoDBLinkTokenRepository
} from '@gibipromo/shared';

export function createTelegramBot(): TelegramBot {
	const userRepository = new DynamoDBUserRepository();
	const actionRepository = new DynamoDBActionRepository();
	const productRepository = new DynamoDBProductRepository();
	const productUserRepository = new DynamoDBProductUserRepository();
	const userPreferencesRepository = new DynamoDBUserPreferencesRepository();
	const userProfileRepository = new DynamoDBUserProfileRepository();
	const linkTokenRepository = new DynamoDBLinkTokenRepository();

	return new TelegramBot(
		userRepository, 
		actionRepository, 
		productRepository, 
		productUserRepository,
		userPreferencesRepository,
		userProfileRepository,
		linkTokenRepository
	);
}