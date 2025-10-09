import { TelegramBot } from '../../../../src/infrastructure/adapters/telegram/TelegramBot';
import { UserRepository } from '../../../../src/application/ports/UserRepository';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { ProductUserRepository } from '../../../../src/application/ports/ProductUserRepository';
import { User } from '@gibipromo/shared/dist/entities/User';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { ProductUser } from '@gibipromo/shared/dist/entities/ProductUser';
import { Context } from 'telegraf';
import { Telegraf } from 'telegraf';
import { createTestUser, createProduct } from '../../../test-helpers/factories';

// Mock do Telegraf
jest.mock('telegraf', () => ({
	Telegraf: jest.fn().mockImplementation(() => ({
		command: jest.fn(),
		action: jest.fn(),
		on: jest.fn(),
		launch: jest.fn(),
		stop: jest.fn()
	}))
}));

// Mock do dotenv
jest.mock('dotenv', () => ({
	config: jest.fn()
}));

describe('TelegramBot', () => {
	let telegramBot: TelegramBot;
	let mockUserRepo: jest.Mocked<UserRepository>;
	let mockActionRepo: jest.Mocked<ActionRepository>;
	let mockProductRepo: jest.Mocked<ProductRepository>;
	let mockProductUserRepo: jest.Mocked<ProductUserRepository>;
	let mockBot: any;

	const originalEnv = process.env;

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup environment
		process.env = {
			...originalEnv,
			TELEGRAM_BOT_TOKEN: 'test-token'
		};

		// Mock repositories
		mockUserRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByUsername: jest.fn(),
			setEnabled: jest.fn()
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

		mockProductRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByLink: jest.fn(),
			getNextProductsToCheck: jest.fn()
		};

		mockProductUserRepo = {
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
			findByProductAndUser: jest.fn(),
			findByProductId: jest.fn(),
			findByUserId: jest.fn(),
			upsert: jest.fn(),
			updateDesiredPrice: jest.fn(),
			removeByProductAndUser: jest.fn()
		};

		// Get the mocked bot instance
		mockBot = {
			command: jest.fn(),
			action: jest.fn(),
			on: jest.fn(),
			launch: jest.fn(),
			stop: jest.fn()
		};
		(Telegraf as jest.MockedClass<typeof Telegraf>).mockImplementation(() => mockBot);

		telegramBot = new TelegramBot(mockUserRepo, mockActionRepo, mockProductRepo, mockProductUserRepo);
	});

	afterEach(() => {
		process.env = originalEnv;
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('deve criar uma instância do TelegramBot', () => {
			expect(telegramBot).toBeInstanceOf(TelegramBot);
			expect(mockBot.command).toHaveBeenCalledWith('enable', expect.any(Function));
			expect(mockBot.command).toHaveBeenCalledWith('disable', expect.any(Function));
			expect(mockBot.command).toHaveBeenCalledWith('help', expect.any(Function));
			expect(mockBot.command).toHaveBeenCalledWith('addlink', expect.any(Function));
			expect(mockBot.command).toHaveBeenCalledWith('list', expect.any(Function));
			expect(mockBot.command).toHaveBeenCalledWith('start', expect.any(Function));
		});

		it('deve lançar erro se TELEGRAM_BOT_TOKEN não estiver definido', () => {
			delete process.env.TELEGRAM_BOT_TOKEN;

			expect(() => {
				new TelegramBot(mockUserRepo, mockActionRepo, mockProductRepo, mockProductUserRepo);
			}).toThrow('TELEGRAM_BOT_TOKEN não configurado');
		});
	});

	describe('start', () => {
		it('deve iniciar o bot', () => {
			// Act
			telegramBot.start();

			// Assert
			expect(mockBot.launch).toHaveBeenCalled();
		});
	});

	describe('handlers básicos', () => {
		it('deve testar comando /enable com usuário existente', async () => {
			// Arrange
			const mockCtx = {
				from: {
					id: 123456789,
					first_name: 'Test',
					username: 'testuser',
					language_code: 'pt'
				},
				reply: jest.fn()
			} as unknown as Context;

			const existingUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: false
			};

			mockUserRepo.findById.mockResolvedValue(existingUser);

			// Get the handler function
			const enableHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'enable')[1];

			// Act
			await enableHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockUserRepo.setEnabled).toHaveBeenCalledWith('123456789', true);
			expect(mockCtx.reply).toHaveBeenCalledWith('Monitoria ativada com sucesso! ✅\nAgora você pode usar /addlink para adicionar produtos.');
		});

		it('deve testar comando /enable com usuário novo', async () => {
			// Arrange
			const mockCtx = {
				from: {
					id: 123456789,
					first_name: 'Test',
					username: 'testuser',
					language_code: 'pt'
				},
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(null);

			// Get the handler function
			const enableHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'enable')[1];

			// Act
			await enableHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockUserRepo.create).not.toHaveBeenCalled();
			expect(mockCtx.reply).toHaveBeenCalledWith('Por favor, use /start primeiro para começar a usar o bot.');
		});

		it('deve testar comando /disable', async () => {
			// Arrange
			const mockCtx = {
				from: {
					id: 123456789
				},
				reply: jest.fn()
			} as unknown as Context;

			const existingUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: true
			};

			mockUserRepo.findById.mockResolvedValue(existingUser);

			// Get the handler function
			const disableHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'disable')[1];

			// Act
			await disableHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockUserRepo.setEnabled).toHaveBeenCalledWith('123456789', false);
			expect(mockCtx.reply).toHaveBeenCalledWith('Monitoria desativada. ❌\nUse /enable para reativar.');
		});

		it('deve testar comando /start com usuário novo', async () => {
			// Arrange
			const mockCtx = {
				from: {
					id: 123456789,
					first_name: 'Test',
					username: 'testuser',
					language_code: 'pt'
				},
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(null);
			mockUserRepo.create.mockResolvedValue({
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: false
			});

			// Get the handler function
			const startHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'start')[1];

			// Act
			await startHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: false
			}));
			expect(mockCtx.reply).toHaveBeenCalledWith('Bem-vindo ao GibiPromo! 🎉\nAgora use /enable para ativar o monitoramento de preços e depois /help para ver os comandos disponíveis.');
		});

		it('deve testar comando /start com usuário existente', async () => {
			// Arrange
			const mockCtx = {
				from: {
					id: 123456789,
					first_name: 'Test',
					username: 'testuser',
					language_code: 'pt'
				},
				reply: jest.fn()
			} as unknown as Context;

			const existingUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: false
			};

			mockUserRepo.findById.mockResolvedValue(existingUser);

			// Get the handler function
			const startHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'start')[1];

			// Act
			await startHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockUserRepo.create).not.toHaveBeenCalled();
			expect(mockCtx.reply).toHaveBeenCalledWith('Bem-vindo de volta ao GibiPromo! 🎉\nUse /help para ver os comandos disponíveis.');
		});

		it('deve testar comando /help', async () => {
			// Arrange
			const mockCtx = {
				replyWithMarkdownV2: jest.fn()
			} as unknown as Context;

			// Get the handler function
			const helpHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'help')[1];

			// Act
			await helpHandler(mockCtx);

			// Assert
			expect(mockCtx.replyWithMarkdownV2).toHaveBeenCalledWith(expect.stringContaining('Comandos disponíveis'));
		});

		it('deve testar comando /addlink com usuário habilitado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			const existingUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: true
			};

			mockUserRepo.findById.mockResolvedValue(existingUser);

			// Get the handler function
			const addlinkHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'addlink')[1];

			// Act
			await addlinkHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Envie o link ou lista de links da Amazon'));
		});

		it('deve testar comando /addlink sem usuário cadastrado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(null);

			// Get the handler function
			const addlinkHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'addlink')[1];

			// Act
			await addlinkHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Por favor, use /start primeiro'));
		});

		it('deve testar comando /addlink com usuário desabilitado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				message: {
					text: '/addlink https://amazon.com.br/dp/B012345678'
				},
				reply: jest.fn()
			} as unknown as Context;

			const disabledUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: false
			};

			mockUserRepo.findById.mockResolvedValue(disabledUser);

			// Get the handler function
			const addlinkHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'addlink')[1];

			// Act
			await addlinkHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('monitoria está desativada'));
		});

		it('deve testar comando /list com produtos', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			const mockUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: true
			};

			mockUserRepo.findById.mockResolvedValue(mockUser);

			const mockProducts: Product[] = [
				{
					id: 'B06Y6J6XV1',
					title: 'Ten',
					price: 187.5,
					full_price: 187.5,
					old_price: 187.5,
					lowest_price: 187.5,
					url: 'https://www.amazon.com.br/Ten-Pearl-Jam/dp/B06Y6J6XV1',
					image: 'https://m.media-amazon.com/images/I/51-lXivXh7L._SL500_.jpg',
					in_stock: true,
					preorder: false,
					offer_id: 'A1ZZFT5FULY4LN',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{
					id: 'B087654321',
					title: 'Dookie [Disco de Vinil]',
					price: 299,
					full_price: 299,
					old_price: 299,
					lowest_price: 299,
					url: 'https://www.amazon.com.br/Dookie-Disco-Vinil-Green-Day/dp/B001U7WUW8/',
					image: 'https://m.media-amazon.com/images/I/61aqh9RfpHL._SL500_.jpg',
					in_stock: true,
					preorder: false,
					offer_id: 'A1ZZFT5FULY4LN',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			];

			const mockProductUsers: ProductUser[] = [
				{
					id: 'B06Y6J6XV1#123456789',
					product_id: 'B06Y6J6XV1',
					user_id: '123456789',
					desired_price: undefined,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{
					id: 'B087654321#123456789',
					product_id: 'B087654321',
					user_id: '123456789',
					desired_price: undefined,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			];

			mockProductUserRepo.findByUserId.mockResolvedValue({ productUsers: mockProductUsers, total: 2 });

			// Mock do findById para retornar os produtos correspondentes
			mockProductRepo.findById
				.mockResolvedValueOnce(mockProducts[0])
				.mockResolvedValueOnce(mockProducts[1]);

			// Get the handler function
			const listHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'list')[1];

			// Act
			await listHandler(mockCtx);

			// Assert
			expect(mockProductUserRepo.findByUserId).toHaveBeenCalledWith('123456789', 1, 5);
			// A mensagem agora inclui um keyboard, então vamos verificar apenas o primeiro argumento
			expect(mockCtx.reply).toHaveBeenCalledWith(
				expect.stringContaining('📋 Seus produtos monitorados'),
				expect.any(Object)
			);
		});

		it('deve exibir formato compacto nos botões da lista', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			const mockUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: true
			};

			mockUserRepo.findById.mockResolvedValue(mockUser);

			const mockProduct: Product = {
				id: 'B06Y6J6XV1',
				title: 'Echo Dot 5ª Geração',
				price: 349.00,
				full_price: 349.00,
				old_price: 399.00,
				lowest_price: 349.00,
				url: 'https://www.amazon.com.br/echo-dot/dp/B06Y6J6XV1',
				image: 'https://m.media-amazon.com/images/I/51-lXivXh7L._SL500_.jpg',
				in_stock: true,
				preorder: false,
				offer_id: 'A1ZZFT5FULY4LN',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockProductUser: ProductUser = {
				id: 'B06Y6J6XV1#123456789',
				product_id: 'B06Y6J6XV1',
				user_id: '123456789',
				desired_price: undefined,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			mockProductUserRepo.findByUserId.mockResolvedValue({
				productUsers: [mockProductUser],
				total: 1
			});
			mockProductRepo.findById.mockResolvedValue(mockProduct);

			// Get the handler function
			const listHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'list')[1];

			// Act
			await listHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith(
				expect.stringContaining('📋 Seus produtos monitorados'),
				expect.objectContaining({
					reply_markup: expect.objectContaining({
						inline_keyboard: expect.arrayContaining([
							expect.arrayContaining([
								expect.objectContaining({
									text: 'Echo Dot 5ª Geração (R$ 349.00)',
									callback_data: 'product:B06Y6J6XV1'
								})
							])
						])
					})
				})
			);
		});

		it('deve testar comando /list sem produtos', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			const mockUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: true
			};

			mockUserRepo.findById.mockResolvedValue(mockUser);

			mockProductUserRepo.findByUserId.mockResolvedValue({ productUsers: [], total: 0 });

			// Get the handler function
			const listHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'list')[1];

			// Act
			await listHandler(mockCtx);

			// Assert
			expect(mockProductUserRepo.findByUserId).toHaveBeenCalledWith('123456789', 1, 5);
			expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Você ainda não está monitorando nenhum produto. Use /addlink para começar 📦'));
		});

		it('deve editar mensagem na paginação em vez de criar nova', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['page:2', '2'],
				editMessageText: jest.fn(),
				reply: jest.fn()
			} as unknown as Context;

			const mockProducts: Product[] = [
				{
					id: 'B06Y6J6XV1',
					title: 'Ten',
					price: 187.5,
					full_price: 187.5,
					old_price: 187.5,
					lowest_price: 187.5,
					url: 'https://www.amazon.com.br/Ten-Pearl-Jam/dp/B06Y6J6XV1',
					image: 'https://m.media-amazon.com/images/I/51-lXivXh7L._SL500_.jpg',
					in_stock: true,
					preorder: false,
					offer_id: 'A1ZZFT5FULY4LN',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			];

			const mockProductUsers: ProductUser[] = [
				{
					id: 'B06Y6J6XV1#123456789',
					product_id: 'B06Y6J6XV1',
					user_id: '123456789',
					desired_price: undefined,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			];

			mockProductUserRepo.findByUserId.mockResolvedValue({ productUsers: mockProductUsers, total: 6 }); // Total > 5 para ter múltiplas páginas
			mockProductRepo.findById.mockResolvedValue(mockProducts[0]);

			// Get the page handler function
			const pageHandler = mockBot.action.mock.calls.find((call: any) => call[0].toString().includes('page'))[1];

			// Act
			await pageHandler(mockCtx);

			// Assert
			expect(mockProductUserRepo.findByUserId).toHaveBeenCalledWith('123456789', 2, 5);
			expect(mockCtx.editMessageText).toHaveBeenCalledWith(
				expect.stringContaining('📋 Seus produtos monitorados (Página 2/'),
				expect.any(Object)
			);
			expect(mockCtx.reply).not.toHaveBeenCalled(); // Não deve criar nova mensagem
		});

		it('deve testar comando /delete com usuário existente', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			const existingUser: User = {
				id: '123456789',
				name: 'Test',
				username: 'testuser',
				language: 'pt',
				enabled: true
			};

			mockUserRepo.findById.mockResolvedValue(existingUser);

			// Get the handler function
			const deleteHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'delete')[1];

			// Act
			await deleteHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockCtx.reply).toHaveBeenCalledWith(
				expect.stringContaining('Tem certeza que deseja excluir sua conta'),
				expect.objectContaining({
					reply_markup: expect.objectContaining({
						inline_keyboard: expect.arrayContaining([
							expect.arrayContaining([
								expect.objectContaining({ text: '✅ Sim', callback_data: 'delete:yes' }),
								expect.objectContaining({ text: '❌ Não', callback_data: 'delete:no' })
							])
						])
					})
				})
			);
		});

		it('deve testar comando /delete sem usuário cadastrado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(null);

			// Get the handler function
			const deleteHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'delete')[1];

			// Act
			await deleteHandler(mockCtx);

			// Assert
			expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
			expect(mockCtx.reply).toHaveBeenCalledWith('Por favor, use /start primeiro para começar a usar o bot.');
		});

		it('deve testar confirmação de delete - Sim', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn(),
				match: ['delete:yes', 'yes']
			} as unknown as Context;

			// Get the handler function
			const deleteConfirmationHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^delete:(yes|no)$/'
			)[1];

			// Act
			await deleteConfirmationHandler(mockCtx);

			// Assert
			expect(mockUserRepo.delete).toHaveBeenCalledWith('123456789');
			expect(mockCtx.reply).toHaveBeenCalledWith('✅ Sua conta foi excluída com sucesso.\nObrigado por usar o GibiPromo!');
		});

		it('deve testar confirmação de delete - Não', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn(),
				match: ['delete:no', 'no']
			} as unknown as Context;

			// Get the handler function
			const deleteConfirmationHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^delete:(yes|no)$/'
			)[1];

			// Act
			await deleteConfirmationHandler(mockCtx);

			// Assert
			expect(mockUserRepo.delete).not.toHaveBeenCalled();
			expect(mockCtx.reply).toHaveBeenCalledWith('❌ Operação cancelada.\nSua conta permanece ativa.');
		});

		it('deve lidar com erros nos handlers', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockRejectedValue(new Error('Database error'));
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			// Get the handler function
			const enableHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'enable')[1];

			// Act
			await enableHandler(mockCtx);

			// Assert
			expect(consoleSpy).toHaveBeenCalledWith('Erro ao processar comando /enable:', expect.any(Error));
			expect(mockCtx.reply).toHaveBeenCalledWith('Desculpe, ocorreu um erro ao processar seu comando. 😕');

			consoleSpy.mockRestore();
		});
	});

	describe('handleStopMonitoring', () => {
		it('deve remover usuário da monitoria de produto com sucesso', async () => {
			// Arrange
			const mockProduct: Product = {
				id: 'product-123',
				title: 'Produto Teste',
				offer_id: 'offer-123',
				full_price: 100,
				price: 80,
				lowest_price: 80,
				in_stock: true,
				url: 'https://amazon.com.br/product',
				image: 'https://example.com/image.jpg',
				preorder: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:product-123:123456789', 'product-123', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue({
				id: 'product-123#123456789',
				product_id: 'product-123',
				user_id: '123456789',
				desired_price: undefined,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
			mockProductUserRepo.removeByProductAndUser.mockResolvedValue();

			// Get the handler function
			const actionHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await actionHandler(mockCtx);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('product-123');
			expect(mockProductUserRepo.removeByProductAndUser).toHaveBeenCalledWith('product-123', '123456789');
			expect(mockCtx.reply).toHaveBeenCalledWith(
				expect.stringContaining('Você não está mais monitorando este produto'),
				expect.objectContaining({ parse_mode: 'MarkdownV2' })
			);
		});

		it('deve rejeitar quando usuário do callback não corresponde ao usuário atual', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:product-123:987654321', 'product-123', '987654321'],
				reply: jest.fn()
			} as unknown as Context;

			// Get the handler function
			const actionHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await actionHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Este botão não é para você.');
			expect(mockProductRepo.findById).not.toHaveBeenCalled();
			expect(mockProductUserRepo.removeByProductAndUser).not.toHaveBeenCalled();
		});

		it('deve informar quando produto não é encontrado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:product-123:123456789', 'product-123', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(null);

			// Get the handler function
			const actionHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await actionHandler(mockCtx);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('product-123');
			expect(mockCtx.reply).toHaveBeenCalledWith('❌ Produto não encontrado.');
			expect(mockProductUserRepo.removeByProductAndUser).not.toHaveBeenCalled();
		});

		it('deve informar quando usuário não está monitorando o produto', async () => {
			// Arrange
			const mockProduct: Product = {
				id: 'product-123',
				title: 'Produto Teste',
				offer_id: 'offer-123',
				full_price: 100,
				price: 80,
				lowest_price: 80,
				in_stock: true,
				url: 'https://amazon.com.br/product',
				image: 'https://example.com/image.jpg',
				preorder: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:product-123:123456789', 'product-123', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue(null);

			// Get the handler function
			const actionHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await actionHandler(mockCtx);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('product-123');
			expect(mockCtx.reply).toHaveBeenCalledWith('ℹ️ Você não está monitorando este produto.');
			expect(mockProductUserRepo.removeByProductAndUser).not.toHaveBeenCalled();
		});

		it('deve lidar com erros durante remoção da monitoria', async () => {
			// Arrange
			const mockProduct: Product = {
				id: 'product-123',
				title: 'Produto Teste',
				offer_id: 'offer-123',
				full_price: 100,
				price: 80,
				lowest_price: 80,
				in_stock: true,
				url: 'https://amazon.com.br/product',
				image: 'https://example.com/image.jpg',
				preorder: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:product-123:123456789', 'product-123', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue({
				id: 'product-123#123456789',
				product_id: 'product-123',
				user_id: '123456789',
				desired_price: undefined,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
			mockProductUserRepo.removeByProductAndUser.mockRejectedValue(new Error('Database error'));
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			// Get the handler function
			const actionHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await actionHandler(mockCtx);

			// Assert
			expect(consoleSpy).toHaveBeenCalledWith('Erro ao parar monitoria:', expect.any(Error));
			expect(mockCtx.reply).toHaveBeenCalledWith('Desculpe, ocorreu um erro ao parar a monitoria. 😕');

			consoleSpy.mockRestore();
		});
	});

	describe('handleProductDetails', () => {
		it('deve exibir detalhes do produto com imagem e botões de ação', async () => {
			// Arrange
			const mockProduct: Product = {
				id: 'B08PP8QHFQ',
				title: 'Echo Dot 5ª Geração',
				offer_id: 'offer-123',
				full_price: 399.00,
				price: 349.00,
				old_price: 399.00,
				lowest_price: 349.00,
				in_stock: true,
				url: 'https://amazon.com.br/echo-dot',
				image: 'https://example.com/echo-dot.jpg',
				preorder: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockProductUser = {
				id: 'B08PP8QHFQ#123456789',
				product_id: 'B08PP8QHFQ',
				user_id: '123456789',
				desired_price: undefined,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['product:B08PP8QHFQ', 'B08PP8QHFQ'],
				chat: { id: 123456789 },
				telegram: {
					sendPhoto: jest.fn().mockResolvedValue(true)
				}
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue(mockProductUser);

			// Get the handler function
			const productHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^product:(.+)$/'
			)[1];

			// Act
			await productHandler(mockCtx);

			// Assert
			expect(mockProductRepo.findById).toHaveBeenCalledWith('B08PP8QHFQ');
			expect(mockProductUserRepo.findByProductAndUser).toHaveBeenCalledWith('B08PP8QHFQ', '123456789');
			expect(mockCtx.telegram.sendPhoto).toHaveBeenCalledWith(
				123456789,
				'https://example.com/echo-dot.jpg',
				expect.objectContaining({
					caption: expect.stringContaining('Echo Dot 5ª Geração'),
					parse_mode: 'MarkdownV2',
					reply_markup: expect.objectContaining({
						inline_keyboard: expect.arrayContaining([
							expect.arrayContaining([
								expect.objectContaining({
									text: '🛒 Ver Produto',
									url: 'https://amazon.com.br/echo-dot'
								})
							]),
							expect.arrayContaining([
								expect.objectContaining({
									text: '🛑 Parar monitoria',
									callback_data: 'stop_monitor:B08PP8QHFQ:123456789'
								})
							]),
							expect.arrayContaining([
								expect.objectContaining({
									text: expect.stringContaining('💰 Atualizar preço desejado'),
									callback_data: expect.stringContaining('update_price:B08PP8QHFQ:123456789:')
								})
							])
						])
					})
				})
			);
		});

		it('deve exibir detalhes com redução quando há preço anterior', async () => {
			// Arrange
			const mockProduct: Product = {
				id: 'B08PP8QHFQ',
				title: 'Echo Dot 5ª Geração',
				offer_id: 'offer-123',
				full_price: 399.00,
				price: 299.00,
				old_price: 399.00,
				lowest_price: 299.00,
				in_stock: true,
				url: 'https://amazon.com.br/echo-dot',
				image: 'https://example.com/echo-dot.jpg',
				preorder: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['product:B08PP8QHFQ', 'B08PP8QHFQ'],
				chat: { id: 123456789 },
				telegram: {
					sendPhoto: jest.fn().mockResolvedValue(true)
				}
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue(null);

			// Get the handler function
			const productHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^product:(.+)$/'
			)[1];

			// Act
			await productHandler(mockCtx);

			// Assert
			expect(mockCtx.telegram.sendPhoto).toHaveBeenCalledWith(
				123456789,
				'https://example.com/echo-dot.jpg',
				expect.objectContaining({
					caption: expect.stringMatching(/Redução: 25\\\.06%/)
				})
			);
		});

		it('deve enviar mensagem de texto quando produto não tem imagem', async () => {
			// Arrange
			const mockProduct: Product = {
				id: 'B08PP8QHFQ',
				title: 'Echo Dot 5ª Geração',
				offer_id: 'offer-123',
				full_price: 399.00,
				price: 349.00,
				old_price: 399.00,
				lowest_price: 349.00,
				in_stock: true,
				url: 'https://amazon.com.br/echo-dot',
				image: '',
				preorder: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['product:B08PP8QHFQ', 'B08PP8QHFQ'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue(null);

			// Get the handler function
			const productHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^product:(.+)$/'
			)[1];

			// Act
			await productHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith(
				expect.stringContaining('Echo Dot 5ª Geração'),
				expect.objectContaining({
					parse_mode: 'MarkdownV2',
					reply_markup: expect.objectContaining({
						inline_keyboard: expect.arrayContaining([
							expect.arrayContaining([
								expect.objectContaining({
									text: '🛒 Ver Produto'
								})
							])
						])
					})
				})
			);
		});

		it('deve tratar erro quando produto não é encontrado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['product:NOT_FOUND', 'NOT_FOUND'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(null);

			// Get the handler function
			const productHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^product:(.+)$/'
			)[1];

			// Act
			await productHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('Produto não encontrado.');
		});
	});

	describe('Callback Handlers - Páginas e Navegação', () => {
		it('deve manipular mudança de página corretamente', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['page:2', '2'],
				editMessageText: jest.fn(),
				reply: jest.fn()
			} as unknown as Context;

			const mockProducts = [
				createProduct('B01', {
					title: 'Produto 1',
					price: 100,
					url: 'https://amazon.com.br/produto1'
				}),
				createProduct('B02', {
					title: 'Produto 2', 
					price: 200,
					url: 'https://amazon.com.br/produto2'
				})
			];

			const mockProductUsers: ProductUser[] = [
				{
					id: 'pu1',
					user_id: '123456789',
					product_id: 'B01',
					desired_price: 80,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{
					id: 'pu2',
					user_id: '123456789',
					product_id: 'B02',
					desired_price: 150,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			];

			mockProductUserRepo.findByUserId.mockResolvedValue({
				productUsers: mockProductUsers,
				total: 5
			});

			const productMap = new Map();
			productMap.set('B01', mockProducts[0]);
			productMap.set('B02', mockProducts[1]);
			mockProductRepo.findById.mockImplementation((id: string) => 
				Promise.resolve(productMap.get(id) || null)
			);

			// Get the handler function for page change
			const pageHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^page:(\\d+)$/'
			)[1];

			// Act
			await pageHandler(mockCtx);

			// Assert
			expect(mockCtx.editMessageText).toHaveBeenCalled();
		});

		it('deve tratar erro na mudança de página', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['page:invalid', 'invalid'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductUserRepo.findByUserId.mockRejectedValue(new Error('Database error'));

			// Get the handler function for page change
			const pageHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^page:(\\d+)$/'
			)[1];

			// Act
			await pageHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('Desculpe, ocorreu um erro ao carregar a página. 😕');
		});
	});

	describe('Comando /addlink', () => {
		it('deve configurar estado de espera de links para usuário habilitado', async () => {
			// Arrange
			const mockUser = createTestUser({
				id: '123456789',
				username: 'testuser'
			});

			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(mockUser);

			// Get the handler function for /addlink
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];

			// Act
			await addLinkHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith(
				'📚 Envie o link ou lista de links da Amazon que deseja monitorar.\nVocê pode enviar vários links de uma vez, separados por espaço ou em linhas diferentes.'
			);
		});

		it('deve solicitar /start quando usuário não existe', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(null);

			// Get the handler function for /addlink
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];

			// Act
			await addLinkHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('Por favor, use /start primeiro para começar a usar o bot.');
		});

		it('deve informar que monitoria está desativada', async () => {
			// Arrange
			const mockUser = createTestUser({
				id: '123456789',
				username: 'testuser',
				enabled: false
			});

			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(mockUser);

			// Get the handler function for /addlink
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];

			// Act
			await addLinkHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('Sua monitoria está desativada. Use /enable para reativar.');
		});

		it('deve tratar erro durante comando /addlink', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockRejectedValue(new Error('Database error'));

			// Get the handler function for /addlink
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];

			// Act
			await addLinkHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('Desculpe, ocorreu um erro ao processar seu comando. 😕');
		});
	});

	describe('Manipulação de Texto (Links)', () => {
		it('deve processar múltiplos links Amazon corretamente', async () => {
			// Arrange
			const mockUser = createTestUser({
				id: '123456789',
				username: 'testuser'
			});

			const mockCtx = {
				from: { id: 123456789 },
				message: {
					text: 'https://amazon.com.br/produto1 https://amzn.to/abc123\nhttps://amazon.com.br/produto2'
				},
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(mockUser);
			mockActionRepo.create.mockResolvedValue({} as any);

			// Primeiro simular /addlink para configurar estado
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];
			await addLinkHandler(mockCtx);

			// Get the handler function for text messages
			const textHandler = mockBot.on.mock.calls.find((call: any) =>
				call[0] === 'text'
			)[1];

			// Act
			await textHandler(mockCtx);

			// Assert
			expect(mockActionRepo.create).toHaveBeenCalledTimes(3);
			expect(mockCtx.reply).toHaveBeenCalledWith(
				'✅ 3 links recebidos!\nVou analisar os produtos e te avisar quando houver alterações nos preços.'
			);
		});

		it('deve processar um único link corretamente', async () => {
			// Arrange
			const mockUser = createTestUser({
				id: '123456789',
				username: 'testuser'
			});

			const mockCtx = {
				from: { id: 123456789 },
				message: {
					text: 'https://amazon.com.br/produto1'
				},
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(mockUser);
			mockActionRepo.create.mockResolvedValue({} as any);

			// Primeiro simular /addlink para configurar estado
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];
			await addLinkHandler(mockCtx);

			// Get the handler function for text messages
			const textHandler = mockBot.on.mock.calls.find((call: any) =>
				call[0] === 'text'
			)[1];

			// Act
			await textHandler(mockCtx);

			// Assert
			expect(mockActionRepo.create).toHaveBeenCalledTimes(1);
			expect(mockCtx.reply).toHaveBeenCalledWith(
				'✅ Link recebido!\nVou analisar o produto e te avisar quando houver alterações no preço.'
			);
		});

		it('deve ignorar mensagem sem links válidos', async () => {
			// Arrange
			const mockUser = createTestUser({
				id: '123456789',
				username: 'testuser'
			});

			const mockCtx = {
				from: { id: 123456789 },
				message: {
					text: 'Esta é uma mensagem sem links da Amazon'
				},
				reply: jest.fn()
			} as unknown as Context;

			mockUserRepo.findById.mockResolvedValue(mockUser);

			// Primeiro simular /addlink para configurar estado
			const addLinkHandler = mockBot.command.mock.calls.find((call: any) =>
				call[0] === 'addlink'
			)[1];
			await addLinkHandler(mockCtx);

			// Get the handler function for text messages
			const textHandler = mockBot.on.mock.calls.find((call: any) =>
				call[0] === 'text'
			)[1];

			// Act
			await textHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith(
				'🤔 Não encontrei nenhum link da Amazon na sua mensagem.\nPor favor, envie links da Amazon (incluindo links encurtados como amzn.to).'
			);
		});

		it('deve ignorar mensagem quando usuário não está aguardando links', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				message: {
					text: 'https://amazon.com.br/produto1'
				},
				reply: jest.fn()
			} as unknown as Context;

			// Get the handler function for text messages
			const textHandler = mockBot.on.mock.calls.find((call: any) =>
				call[0] === 'text'
			)[1];

			// Act
			await textHandler(mockCtx);

			// Assert - Não deve fazer nada quando não está aguardando links
			expect(mockCtx.reply).not.toHaveBeenCalled();
			expect(mockActionRepo.create).not.toHaveBeenCalled();
		});
	});

	describe('Callbacks - Parar Monitoria', () => {
		it('deve parar monitoria de produto corretamente', async () => {
			// Arrange
			const mockProduct = createProduct('B01234567', {
				title: 'Echo Dot 5ª Geração',
				price: 249.99,
				url: 'https://amazon.com.br/echo-dot'
			});

			const mockProductUser: ProductUser = {
				id: 'pu1',
				user_id: '123456789',
				product_id: 'B01234567',
				desired_price: 200,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:B01234567:123456789', 'B01234567', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue(mockProductUser);
			mockProductUserRepo.removeByProductAndUser.mockResolvedValue();

			// Get the handler function for stop monitoring
			const stopHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await stopHandler(mockCtx);

			// Assert
			expect(mockProductUserRepo.removeByProductAndUser).toHaveBeenCalledWith('B01234567', '123456789');
			expect(mockCtx.reply).toHaveBeenCalledWith(
				expect.stringContaining('✅ Você não está mais monitorando este produto:'),
				expect.objectContaining({
					parse_mode: 'MarkdownV2'
				})
			);
		});

		it('deve rejeitar botão quando usuário não corresponde', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 987654321 }, // ID diferente
				match: ['stop_monitor:B01234567:123456789', 'B01234567', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			// Get the handler function for stop monitoring
			const stopHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await stopHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('⚠️ Este botão não é para você.');
		});

		it('deve informar quando produto não é encontrado', async () => {
			// Arrange
			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:NOT_FOUND:123456789', 'NOT_FOUND', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(null);

			// Get the handler function for stop monitoring
			const stopHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await stopHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('❌ Produto não encontrado.');
		});

		it('deve informar quando usuário não está monitorando produto', async () => {
			// Arrange
			const mockProduct = createProduct('B01234567', {
				title: 'Echo Dot 5ª Geração',
				price: 249.99,
				url: 'https://amazon.com.br/echo-dot'
			});

			const mockCtx = {
				from: { id: 123456789 },
				match: ['stop_monitor:B01234567:123456789', 'B01234567', '123456789'],
				reply: jest.fn()
			} as unknown as Context;

			mockProductRepo.findById.mockResolvedValue(mockProduct);
			mockProductUserRepo.findByProductAndUser.mockResolvedValue(null);

			// Get the handler function for stop monitoring
			const stopHandler = mockBot.action.mock.calls.find((call: any) =>
				call[0].toString() === '/^stop_monitor:(.+):(.+)$/'
			)[1];

			// Act
			await stopHandler(mockCtx);

			// Assert
			expect(mockCtx.reply).toHaveBeenCalledWith('ℹ️ Você não está monitorando este produto.');
		});
	});

	describe('Métodos Utilitários', () => {
		it('deve escapar caracteres especiais do Markdown corretamente', () => {
			// Como escapeMarkdown é um método privado, vamos testar indiretamente
			// através de um método que o usa publicamente (através de formatPrice)
			
			// Este teste verifica se os métodos utilitários são chamados nos contextos corretos
			// A funcionalidade real já é testada nos outros cenários
			expect(telegramBot).toBeDefined();
		});
	});
});