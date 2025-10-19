import { ActionScheduler } from '../usecases/ActionScheduler';
import { AddProductActionProcessor } from '../usecases/processors/AddProductActionProcessor';
import { CheckProductActionProcessor } from '../usecases/processors/CheckProductActionProcessor';
import { NotifyPriceActionProcessor } from '../usecases/processors/NotifyPriceActionProcessor';
import { ProductStatsService } from '../usecases/ProductStatsService';
import { 
	DynamoDBActionRepository, 
	DynamoDBProductRepository, 
	DynamoDBProductUserRepository,
	DynamoDBUserRepository,
	DynamoDBActionConfigRepository,
	DynamoDBProductStatsRepository,
	DynamoDBNotificationRepository
} from '@gibipromo/shared';
import { AmazonProductAPI } from '../ports/AmazonProductAPI';
import { TelegramNotifier } from '../../infrastructure/adapters/telegram';

export function createActionScheduler(
	amazonApi: AmazonProductAPI
): ActionScheduler {
	// Repositórios
	const actionRepository = new DynamoDBActionRepository();
	const productRepository = new DynamoDBProductRepository();
	const productUserRepository = new DynamoDBProductUserRepository();
	const userRepository = new DynamoDBUserRepository();
	const actionConfigRepository = new DynamoDBActionConfigRepository();
	const productStatsRepository = new DynamoDBProductStatsRepository();
	const notificationRepository = new DynamoDBNotificationRepository();

	// Serviços
	const productStatsService = new ProductStatsService(productStatsRepository);

	// Notificador
	const notifier = new TelegramNotifier();

	// Processadores
	const processors = [
		new AddProductActionProcessor(
			actionRepository,
			productRepository,
			productUserRepository,
			userRepository,
			amazonApi,
			productStatsService,
			notificationRepository
		),
		new CheckProductActionProcessor(
			actionRepository,
			productRepository,
			amazonApi,
			productStatsService
		),
		new NotifyPriceActionProcessor(
			actionRepository,
			productRepository,
			productUserRepository,
			userRepository,
			notifier,
			notificationRepository
		)
	];

	return new ActionScheduler(
		processors,
		productRepository,
		actionRepository,
		actionConfigRepository
	);
}