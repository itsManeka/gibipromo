import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { Product } from '../../../domain/entities/Product';

dotenv.config();

export class TelegramNotifier {
    private bot: Telegraf;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error('TELEGRAM_BOT_TOKEN não configurado');
        }

        this.bot = new Telegraf(token);
    }

    /**
   * Envia notificação de alteração de preço para um usuário
   */
    async notifyPriceChange(
        userId: string,
        product: Product,
        oldPrice: number,
        newPrice: number
    ): Promise<void> {
        const difference = ((oldPrice - newPrice) / oldPrice * 100).toFixed(2);
        const formattedOldPrice = this.escapeMarkdown(oldPrice.toFixed(2));
        const formattedNewPrice = this.escapeMarkdown(newPrice.toFixed(2));
        const formattedDifference = this.escapeMarkdown(difference);
        const message = `
*Boa notícia\\! O preço baixou\\!*

📚 *${this.escapeMarkdown(product.title)}*

💰 Preço anterior: R$ ${formattedOldPrice}
✨ *Novo preço: R$ ${formattedNewPrice}*
📉 Redução: ${formattedDifference}%

${product.in_stock ? '✅ Produto em estoque' : '❌ Produto fora de estoque'}
${product.preorder ? '\n⏳ *Produto em pré\\-venda*' : ''}

_Clique nos botões abaixo para ver o produto ou parar de monitorar_
`;

        try {
            await this.bot.telegram.sendMessage(userId, message, {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🛒 Ver produto',
                                url: product.url
                            }
                        ],
                        [
                            {
                                text: '🛑 Parar monitoria',
                                callback_data: `stop_monitor:${product.id}:${userId}`
                            }
                        ]
                    ]
                }
            });
        } catch (error) {
            console.error(`Erro ao enviar notificação para usuário ${userId}:`, error);
        }
    }

    /**
   * Escapa caracteres especiais do Markdown V2
   */
    private escapeMarkdown(text: string): string {
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    }
}