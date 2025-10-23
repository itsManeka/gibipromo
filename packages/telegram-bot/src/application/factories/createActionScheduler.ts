import { ActionScheduler } from '../usecases/ActionScheduler';
import { AddProductActionProcessor } from '../usecases/processors/AddProductActionProcessor';
import { CheckProductActionProcessor } from '../usecases/processors/CheckProductActionProcessor';
import { NotifyPriceActionProcessor } from '../usecases/processors/NotifyPriceActionProcessor';
import { LinkAccountsActionProcessor } from '../usecases/processors/LinkAccountsActionProcessor';
import { ProductStatsService } from '../usecases/ProductStatsService';
import { 
	DynamoDBActionRepository, 
	DynamoDBProductRepository, 
	DynamoDBProductUserRepository,
	DynamoDBUserRepository,
	DynamoDBUserProfileRepository,
	DynamoDBUserPreferencesRepository,
	DynamoDBActionConfigRepository,
	DynamoDBProductStatsRepository,
	DynamoDBNotificationRepository
} from '@gibipromo/shared';
import { AmazonProductAPI } from '../ports/AmazonProductAPI';
import { TelegramNotifier } from '../../infrastructure/adapters/telegram';
import { Telegraf } from 'telegraf';
import { createProductClassifier } from '../../infrastructure/config/productClassifier';

export function createActionScheduler(
	amazonApi: AmazonProductAPI
): ActionScheduler {
	// Repositórios
	const actionRepository = new DynamoDBActionRepository();
	const productRepository = new DynamoDBProductRepository();
	const productUserRepository = new DynamoDBProductUserRepository();
	const userRepository = new DynamoDBUserRepository();
	const userProfileRepository = new DynamoDBUserProfileRepository();
	const userPreferencesRepository = new DynamoDBUserPreferencesRepository();
	const actionConfigRepository = new DynamoDBActionConfigRepository();
	const productStatsRepository = new DynamoDBProductStatsRepository();
	const notificationRepository = new DynamoDBNotificationRepository();

	// Serviços
	const productStatsService = new ProductStatsService(productStatsRepository);
	
	// Classificador de produtos (opcional)
	const productClassifier = createProductClassifier();

	// Notificador
	const notifier = new TelegramNotifier();

	// Bot instance para enviar mensagens (LinkAccountsActionProcessor)
	const botToken = process.env.TELEGRAM_BOT_TOKEN!;
	const botInstance = new Telegraf(botToken);

	// Processadores
	const processors = [
		new AddProductActionProcessor(
			actionRepository,
			productRepository,
			productUserRepository,
			userRepository,
			amazonApi,
			productStatsService,
			notificationRepository,
			productClassifier
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
		),
		new LinkAccountsActionProcessor(
			actionRepository,
			userRepository,
			productUserRepository,
			userProfileRepository,
			userPreferencesRepository,
			notificationRepository,
			botInstance
		)
	];

	return new ActionScheduler(
		processors,
		productRepository,
		actionRepository,
		actionConfigRepository
	);
}