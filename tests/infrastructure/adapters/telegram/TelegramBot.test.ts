import { TelegramBot } from '../../../../src/infrastructure/adapters/telegram/TelegramBot';
import { UserRepository } from '../../../../src/application/ports/UserRepository';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { User } from '../../../../src/domain/entities/User';
import { Product } from '../../../../src/domain/entities/Product';
import { Action, ActionType } from '../../../../src/domain/entities/Action';
import { Context } from 'telegraf';

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
      findByUserId: jest.fn(),
      findByLink: jest.fn(),
      addUser: jest.fn(),
      removeUser: jest.fn(),
      getNextProductsToCheck: jest.fn()
    };

    // Get the mocked bot instance
    const { Telegraf } = require('telegraf');
    mockBot = {
      command: jest.fn(),
      action: jest.fn(),
      on: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn()
    };
    Telegraf.mockImplementation(() => mockBot);

    telegramBot = new TelegramBot(mockUserRepo, mockActionRepo, mockProductRepo);
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
        new TelegramBot(mockUserRepo, mockActionRepo, mockProductRepo);
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
      expect(mockCtx.reply).toHaveBeenCalledWith('Monitoria ativada com sucesso! ✅');
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
      mockUserRepo.create.mockResolvedValue({
        id: '123456789',
        name: 'Test',
        username: 'testuser',
        language: 'pt',
        enabled: true
      });

      // Get the handler function
      const enableHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'enable')[1];

      // Act
      await enableHandler(mockCtx);

      // Assert
      expect(mockUserRepo.findById).toHaveBeenCalledWith('123456789');
      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        id: '123456789',
        name: 'Test',
        username: 'testuser',
        language: 'pt',
        enabled: false
      }));
      expect(mockCtx.reply).toHaveBeenCalledWith('Bem-vindo ao GibiPromo! 🎉\nUse /help para ver os comandos disponíveis.');
    });

    it('deve testar comando /disable', async () => {
      // Arrange
      const mockCtx = {
        from: {
          id: 123456789
        },
        reply: jest.fn()
      } as unknown as Context;

      // Get the handler function
      const disableHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'disable')[1];

      // Act
      await disableHandler(mockCtx);

      // Assert
      expect(mockUserRepo.setEnabled).toHaveBeenCalledWith('123456789', false);
      expect(mockCtx.reply).toHaveBeenCalledWith('Monitoria desativada. ❌\nUse /enable para reativar.');
    });

    it('deve testar comando /start', async () => {
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

      // Get the handler function
      const startHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'start')[1];

      // Act
      await startHandler(mockCtx);

      // Assert
      expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Bem-vindo ao GibiPromo'));
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
      expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Por favor, use /enable primeiro'));
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
          users: ['123456789'],
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
          users: ['123456789'],
          offer_id: 'A1ZZFT5FULY4LN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockProductRepo.findByUserId.mockResolvedValue({ products: mockProducts, total: 2 });

      // Get the handler function
      const listHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'list')[1];

      // Act
      await listHandler(mockCtx);

      // Assert
      expect(mockProductRepo.findByUserId).toHaveBeenCalledWith('123456789', 1, 5);
      // A mensagem agora inclui um keyboard, então vamos verificar apenas o primeiro argumento
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📋 Seus produtos monitorados'),
        expect.any(Object)
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

      mockProductRepo.findByUserId.mockResolvedValue({ products: [], total: 0 });

      // Get the handler function
      const listHandler = mockBot.command.mock.calls.find((call: any) => call[0] === 'list')[1];

      // Act
      await listHandler(mockCtx);

      // Assert
      expect(mockProductRepo.findByUserId).toHaveBeenCalledWith('123456789', 1, 5);
      expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Você não está monitorando nenhum produto ainda'));
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
});