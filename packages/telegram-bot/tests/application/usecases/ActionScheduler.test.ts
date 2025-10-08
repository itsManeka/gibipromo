import { ActionScheduler } from '../../../src/application/usecases/ActionScheduler';
import { ActionProcessor } from '../../../src/application/ports/ActionProcessor';
import { ProductRepository } from '../../../src/application/ports/ProductRepository';
import { ActionRepository } from '../../../src/application/ports/ActionRepository';
import { ActionConfigRepository } from '../../../src/application/ports/ActionConfigRepository';
import { ActionType } from '@gibipromo/shared/dist/entities/Action';
import { ActionConfig } from '@gibipromo/shared/dist/entities/ActionConfig';
import { ToadScheduler, AsyncTask, SimpleIntervalJob } from 'toad-scheduler';

// Mock do toad-scheduler
jest.mock('toad-scheduler', () => ({
	ToadScheduler: jest.fn().mockImplementation(() => ({
		addSimpleIntervalJob: jest.fn(),
		stop: jest.fn()
	})),
	SimpleIntervalJob: jest.fn(),
	AsyncTask: jest.fn()
}));

describe('ActionScheduler', () => {
	let scheduler: ActionScheduler;
	let mockProcessors: jest.Mocked<ActionProcessor<any>>[];
	let mockProductRepo: jest.Mocked<ProductRepository>;
	let mockActionRepo: jest.Mocked<ActionRepository>;
	let mockActionConfigRepo: jest.Mocked<ActionConfigRepository>;

	const mockConfigs: ActionConfig[] = [
		{
			id: 'config-1',
			action_type: ActionType.ADD_PRODUCT,
			interval_minutes: 5,
			enabled: true
		},
		{
			id: 'config-2',
			action_type: ActionType.CHECK_PRODUCT,
			interval_minutes: 10,
			enabled: true
		}
	];

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock dos processadores
		mockProcessors = [
			{
				actionType: ActionType.ADD_PRODUCT,
				process: jest.fn(),
				processNext: jest.fn().mockResolvedValue(5)
			} as any,
			{
				actionType: ActionType.CHECK_PRODUCT,
				process: jest.fn(),
				processNext: jest.fn().mockResolvedValue(3)
			} as any
		];

		// Mock dos repositórios
		mockProductRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByLink: jest.fn(),
			getNextProductsToCheck: jest.fn()
		};

		mockActionRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByType: jest.fn(),
			findPendingByType: jest.fn(),
			markProcessed: jest.fn()
		};

		mockActionConfigRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByType: jest.fn(),
			findEnabled: jest.fn().mockResolvedValue(mockConfigs)
		};
	});

	describe('constructor', () => {
		it('deve criar uma instância do ActionScheduler', () => {
			// Act
			scheduler = new ActionScheduler(
				mockProcessors,
				mockProductRepo,
				mockActionRepo,
				mockActionConfigRepo
			);

			// Assert
			expect(scheduler).toBeInstanceOf(ActionScheduler);
		});

		it('deve configurar jobs baseados nas configurações habilitadas', async () => {
			// Arrange
			const mockSchedulerInstance = {
				addSimpleIntervalJob: jest.fn(),
				stop: jest.fn()
			};
			(ToadScheduler as jest.Mock).mockImplementation(() => mockSchedulerInstance);

			// Act
			scheduler = new ActionScheduler(
				mockProcessors,
				mockProductRepo,
				mockActionRepo,
				mockActionConfigRepo
			);

			// Aguarda a configuração async
			await new Promise(resolve => setTimeout(resolve, 0));

			// Assert
			expect(mockActionConfigRepo.findEnabled).toHaveBeenCalled();
		});

		it('deve avisar quando processador não é encontrado para um tipo de ação', async () => {
			// Arrange
			const configsWithUnknownType = [
				...mockConfigs,
				{
					id: 'config-3',
					action_type: 'UNKNOWN_TYPE' as ActionType,
					interval_minutes: 15,
					enabled: true
				}
			];
			mockActionConfigRepo.findEnabled.mockResolvedValue(configsWithUnknownType);

			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			// Act
			scheduler = new ActionScheduler(
				mockProcessors,
				mockProductRepo,
				mockActionRepo,
				mockActionConfigRepo
			);

			// Aguarda a configuração async
			await new Promise(resolve => setTimeout(resolve, 0));

			// Assert
			expect(consoleSpy).toHaveBeenCalledWith(
				'Processador não encontrado para o tipo de ação UNKNOWN_TYPE'
			);

			consoleSpy.mockRestore();
		});
	});

	describe('stop', () => {
		it('deve parar o scheduler', () => {
			// Arrange
			const mockSchedulerInstance = {
				addSimpleIntervalJob: jest.fn(),
				stop: jest.fn()
			};
			(ToadScheduler as jest.Mock).mockImplementation(() => mockSchedulerInstance);

			scheduler = new ActionScheduler(
				mockProcessors,
				mockProductRepo,
				mockActionRepo,
				mockActionConfigRepo
			);

			// Act
			scheduler.stop();

			// Assert
			expect(mockSchedulerInstance.stop).toHaveBeenCalled();
		});
	});

	describe('task execution', () => {
		it('deve configurar tasks corretamente', async () => {
			// Arrange
			const mockSchedulerInstance = {
				addSimpleIntervalJob: jest.fn(),
				stop: jest.fn()
			};

			(ToadScheduler as jest.Mock).mockImplementation(() => mockSchedulerInstance);

			// Act
			scheduler = new ActionScheduler(
				mockProcessors,
				mockProductRepo,
				mockActionRepo,
				mockActionConfigRepo
			);

			// Aguarda a configuração async
			await new Promise(resolve => setTimeout(resolve, 100));

			// Assert
			expect(mockActionConfigRepo.findEnabled).toHaveBeenCalled();
			expect(AsyncTask).toHaveBeenCalledTimes(2); // Um para cada processador
			expect(SimpleIntervalJob).toHaveBeenCalledTimes(2);
			expect(mockSchedulerInstance.addSimpleIntervalJob).toHaveBeenCalledTimes(2);
		});

		it('deve parar o scheduler corretamente', () => {
			// Arrange
			const mockSchedulerInstance = {
				addSimpleIntervalJob: jest.fn(),
				stop: jest.fn()
			};

			(ToadScheduler as jest.Mock).mockImplementation(() => mockSchedulerInstance);

			scheduler = new ActionScheduler(
				mockProcessors,
				mockProductRepo,
				mockActionRepo,
				mockActionConfigRepo
			);

			// Act
			scheduler.stop();

			// Assert
			expect(mockSchedulerInstance.stop).toHaveBeenCalled();
		});
	});
});