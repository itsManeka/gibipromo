import { TelegramNotifier } from 'infrastructure/adapters/telegram/TelegramNotifier';
import { Product } from '@gibipromo/shared/dist/entities/Product';

// Mock do bot do Telegram
const mockSendMessage = jest.fn().mockResolvedValue(true);
const mockSendPhoto = jest.fn().mockResolvedValue(true);
jest.mock('telegraf', () => ({
	Telegraf: jest.fn().mockImplementation(() => ({
		telegram: {
			sendMessage: mockSendMessage,
			sendPhoto: mockSendPhoto
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

	it('should send photo with caption when product has image', async () => {
		const userId = '123456789';
		const oldPrice = 99.99;
		const newPrice = 89.99;

		await notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice);

		expect(mockSendPhoto).toHaveBeenCalledWith(
			userId,
			mockProduct.image,
			expect.objectContaining({
				caption: expect.stringContaining('Boa notícia\\! O preço baixou\\!'),
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
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it('should send message when product has no image', async () => {
		const userId = '123456789';
		const oldPrice = 99.99;
		const newPrice = 89.99;
		const productWithoutImage = { ...mockProduct, image: '' };

		await notifier.notifyPriceChange(userId, productWithoutImage, oldPrice, newPrice);

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
								url: productWithoutImage.url
							}
						],
						[
							{
								text: '🛑 Parar monitoria',
								callback_data: `stop_monitor:${productWithoutImage.id}:${userId}`
							}
						],
						[
							{
								text: expect.stringContaining('💰 Atualizar preço desejado'),
								callback_data: expect.stringContaining(`update_price:${productWithoutImage.id}:${userId}:`)
							}
						]
					]
				}
			})
		);
		expect(mockSendPhoto).not.toHaveBeenCalled();
	});

	it('should send message when product image is only whitespace', async () => {
		const userId = '123456789';
		const oldPrice = 99.99;
		const newPrice = 89.99;
		const productWithWhitespaceImage = { ...mockProduct, image: '   ' };

		await notifier.notifyPriceChange(userId, productWithWhitespaceImage, oldPrice, newPrice);

		expect(mockSendMessage).toHaveBeenCalledWith(
			userId,
			expect.stringContaining('Boa notícia\\! O preço baixou\\!'),
			expect.any(Object)
		);
		expect(mockSendPhoto).not.toHaveBeenCalled();
	});

	it('should format and send price change notification with stop monitoring button', async () => {
		const userId = '123456789';
		const oldPrice = 99.99;
		const newPrice = 89.99;

		await notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice);

		// Verifica que foi chamado sendPhoto (já que o produto tem imagem)
		expect(mockSendPhoto).toHaveBeenCalledWith(
			userId,
			mockProduct.image,
			expect.objectContaining({
				caption: expect.stringContaining('Boa notícia\\! O preço baixou\\!'),
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

		// Verifica que foi chamado sendPhoto (já que o produto tem imagem)
		expect(mockSendPhoto).toHaveBeenCalledWith(
			userId,
			mockProduct.image,
			expect.objectContaining({
				caption: expect.stringContaining('20\\.00%')
			})
		);
	});

	it('should handle sendPhoto errors gracefully', async () => {
		const userId = '123456789';
		const oldPrice = 99.99;
		const newPrice = 89.99;

		mockSendPhoto.mockRejectedValueOnce(new Error('Network error'));

		// Não deve lançar erro
		await expect(
			notifier.notifyPriceChange(userId, mockProduct, oldPrice, newPrice)
		).resolves.not.toThrow();
	});

	it('should handle sendMessage errors gracefully', async () => {
		const userId = '123456789';
		const oldPrice = 99.99;
		const newPrice = 89.99;
		const productWithoutImage = { ...mockProduct, image: '' };

		mockSendMessage.mockRejectedValueOnce(new Error('Network error'));

		// Não deve lançar erro
		await expect(
			notifier.notifyPriceChange(userId, productWithoutImage, oldPrice, newPrice)
		).resolves.not.toThrow();
	});
});