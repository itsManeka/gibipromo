import { ActionScheduler } from '../usecases/ActionScheduler';
import { AddProductActionProcessor } from '../usecases/processors/AddProductActionProcessor';
import { CheckProductActionProcessor } from '../usecases/processors/CheckProductActionProcessor';
import { NotifyPriceActionProcessor } from '../usecases/processors/NotifyPriceActionProcessor';
import { 
  DynamoDBActionRepository, 
  DynamoDBProductRepository, 
  DynamoDBUserRepository,
  DynamoDBActionConfigRepository 
} from '../../infrastructure/adapters/dynamodb';
import { AmazonProductAPI } from '../ports/AmazonProductAPI';
import { TelegramNotifier } from '../../infrastructure/adapters/telegram';

export function createActionScheduler(
  amazonApi: AmazonProductAPI
): ActionScheduler {
  // Repositórios
  const actionRepository = new DynamoDBActionRepository();
  const productRepository = new DynamoDBProductRepository();
  const userRepository = new DynamoDBUserRepository();
  const actionConfigRepository = new DynamoDBActionConfigRepository();

  // Notificador
  const notifier = new TelegramNotifier();

  // Processadores
  const processors = [
    new AddProductActionProcessor(
      actionRepository,
      productRepository,
      userRepository,
      amazonApi
    ),
    new CheckProductActionProcessor(
      actionRepository,
      productRepository,
      amazonApi
    ),
    new NotifyPriceActionProcessor(
      actionRepository,
      productRepository,
      notifier
    )
  ];

  return new ActionScheduler(
    processors,
    productRepository,
    actionRepository,
    actionConfigRepository
  );
}