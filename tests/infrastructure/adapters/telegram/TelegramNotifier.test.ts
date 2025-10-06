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
        title: 'Produto de Teste',
        offer_id: 'offer-123',
        full_price: 99.99,
        price: 89.99,
        lowest_price: 89.99,
        in_stock: true,
        url: 'https://amazon.com.br/dp/B08PP8QHFQ',
        image: 'https://example.com/image.jpg',
        preorder: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    beforeEach(() => {
        process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
        notifier = new TelegramNotifier();
    });

    afterEach(() => {
        delete process.env.TELEGRAM_BOT_TOKEN;
        jest.clearAllMocks();
    });

    it('should format and send price change notification with stop monitoring button', async () => {
        const userId = '123456789';
        const oldPrice = 99.99;
        const newPrice = 89.99;

        await notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice);

        expect(mockSendMessage).toHaveBeenCalledWith(
            userId,
            expect.stringContaining('Boa notícia\\! O preço baixou\\!'),
            expect.objectContaining({
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🛒 Ver produto',
                                url: mockProduct.url
                            }
                        ],
                        [
                            {
                                text: '🛑 Parar monitoria',
                                callback_data: `stop_monitor:${mockProduct.id}:${userId}`
                            }
                        ],
                        [
                            {
                                text: expect.stringContaining('💰 Atualizar preço desejado'),
                                callback_data: expect.stringContaining(`update_price:${mockProduct.id}:${userId}:`)
                            }
                        ]
                    ]
                }
            })
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