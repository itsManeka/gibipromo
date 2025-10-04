import { TelegramBot } from '../adapters/telegram';
import { 
    DynamoDBUserRepository, 
    DynamoDBActionRepository,
    DynamoDBProductRepository 
} from '../adapters/dynamodb';

export function createTelegramBot(): TelegramBot {
    const userRepository = new DynamoDBUserRepository();
    const actionRepository = new DynamoDBActionRepository();
    const productRepository = new DynamoDBProductRepository();

    return new TelegramBot(userRepository, actionRepository, productRepository);
}