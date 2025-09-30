import { TelegramBot } from '../adapters/telegram';
import { DynamoDBUserRepository, DynamoDBActionRepository } from '../adapters/dynamodb';

export function createTelegramBot(): TelegramBot {
  const userRepository = new DynamoDBUserRepository();
  const actionRepository = new DynamoDBActionRepository();

  return new TelegramBot(userRepository, actionRepository);
}