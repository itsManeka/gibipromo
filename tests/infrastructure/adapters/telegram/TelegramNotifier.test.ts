import { TelegramNotifier } from 'infrastructure/adapters/telegram/TelegramNotifier';
import { Product } from 'domain/entities/Product';

// Mock do bot do Telegram
const mockSendMessage = jest.fn().mockResolvedValue(true);
jest.mock('telegraf', () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    telegram: {
      sendMessage: mockSendMessage
    }
  }))
}));

describe('TelegramNotifier', () => {
  let notifier: TelegramNotifier;
  const mockProduct: Product = {
    id: 'B08PP8QHFQ',
    offerid: 'offer-123',
    preco_cheio: 99.99,
    preco: 89.99,
    menor_preco: 89.99,
    usuarios: ['123456789'],
    estoque: true,
    link: 'https://amazon.com.br/dp/B08PP8QHFQ',
    imagem: 'https://example.com/image.jpg',
    pre_venda: false
  };

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
    notifier = new TelegramNotifier();
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    jest.clearAllMocks();
  });

  it('should format and send price change notification', async () => {
    const userId = '123456789';
    const oldPrice = 99.99;
    const newPrice = 89.99;

    await notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice);

    expect(mockSendMessage).toHaveBeenCalledWith(
      userId,
      expect.stringContaining('Boa notícia\\! O preço baixou\\!'),
      expect.any(Object)
    );
  });

  it('should include percentage in notification', async () => {
    const userId = '123456789';
    const oldPrice = 100;
    const newPrice = 80;

    await notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice);

    expect(mockSendMessage).toHaveBeenCalledWith(
      userId,
      expect.stringContaining('20\\.00%'),
      expect.any(Object)
    );
  });

  it('should handle errors gracefully', async () => {
    const userId = '123456789';
    const oldPrice = 99.99;
    const newPrice = 89.99;

    mockSendMessage.mockRejectedValueOnce(new Error('Network error'));

    // Não deve lançar erro
    await expect(
      notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice)
    ).resolves.not.toThrow();
  });
});