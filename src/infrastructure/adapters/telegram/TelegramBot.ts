import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { UserRepository } from '../../../application/ports/UserRepository';
import { ActionRepository } from '../../../application/ports/ActionRepository';
import { ProductRepository } from '../../../application/ports/ProductRepository';
import { createUser } from '../../../domain/entities/User';
import { createAddProductAction } from '../../../domain/entities/Action';

dotenv.config();

export class TelegramBot {
  private bot: Telegraf;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly actionRepository: ActionRepository,
    private readonly productRepository: ProductRepository
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN não configurado');
    }

    this.bot = new Telegraf(token);
    this.setupCommands();
  }

  /**
   * Configura os comandos do bot
   */
  private setupCommands(): void {
    this.bot.command('enable', this.handleEnable.bind(this));
    this.bot.command('disable', this.handleDisable.bind(this));
    this.bot.command('help', this.handleHelp.bind(this));
    this.bot.command('addlink', this.handleAddLink.bind(this));
    this.bot.command('list', this.handleList.bind(this));
    this.bot.command('start', this.handleEnable.bind(this));

    // Handler para ações nos botões inline
    this.bot.action(/^product:(.+)$/, this.handleProductDetails.bind(this));
    this.bot.action(/^page:(\d+)$/, this.handlePageChange.bind(this));

    // Handler para mensagens normais (links)
    this.bot.on('text', this.handleText.bind(this));
  }

  /**
   * Inicia o bot
   */
  public start(): void {
    this.bot.launch();

    // Graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  /**
   * Manipula o comando /enable
   */
  private async handleEnable(ctx: Context): Promise<void> {
    try {
      const { id, first_name, username, language_code } = ctx.from!;

      // Verifica se o usuário já existe
      const existingUser = await this.userRepository.findById(id.toString());
      if (existingUser) {
        await this.userRepository.setEnabled(id.toString(), true);
        await ctx.reply('Monitoria ativada com sucesso! ✅');
        return;
      }

      // Cria novo usuário
      const user = createUser({
        id: id.toString(),
        name: first_name || '',
        username: username || '',
        language: language_code || 'pt'
      });

      await this.userRepository.create(user);
      await ctx.reply('Bem-vindo ao GibiPromo! 🎉\nUse /help para ver os comandos disponíveis.');
    } catch (error) {
      console.error('Erro ao processar comando /enable:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
    }
  }

  /**
   * Manipula o comando /disable
   */
  private async handleDisable(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id.toString();
      await this.userRepository.setEnabled(userId, false);
      await ctx.reply('Monitoria desativada. ❌\nUse /enable para reativar.');
    } catch (error) {
      console.error('Erro ao processar comando /disable:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
    }
  }

  /**
   * Manipula o comando /help
   */
  private async handleHelp(ctx: Context): Promise<void> {
    const helpMessage = `
🤖 *Comandos disponíveis:*

/enable - Ativa a monitoria de preços
/disable - Desativa a monitoria
/addlink - Adiciona um produto para monitorar
/list - Lista seus produtos monitorados
/help - Mostra esta mensagem

*Como usar:*
1. Use /enable para ativar a monitoria
2. Envie links da Amazon com /addlink
3. Use /list para ver seus produtos
4. Aguarde notificações de preços! 📉
`;
    await ctx.replyWithMarkdownV2(helpMessage);
  }

  /**
   * Estado do bot por usuário
   */
  private userStates: Map<string, { awaitingLinks: boolean }> = new Map();

  /**
   * Manipula o comando /list
   */
  private async handleList(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id.toString();
      const user = await this.userRepository.findById(userId);

      if (!user) {
        await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
        return;
      }

      await this.showProductList(ctx, 1);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao listar seus produtos. 😕');
    }
  }

  /**
   * Exibe a lista de produtos paginada
   */
  private async showProductList(ctx: Context, page: number): Promise<void> {
    const userId = ctx.from!.id.toString();
    const pageSize = 5;

    const { products, total } = await this.productRepository.findByUserId(userId, page, pageSize);

    if (products.length === 0) {
      await ctx.reply('Você não está monitorando nenhum produto ainda. Use /addlink para começar.');
      return;
    }

    const totalPages = Math.ceil(total / pageSize);
    const message = `📋 Seus produtos monitorados (Página ${page}/${totalPages}):`;

    const keyboard: any[] = products.map(product => [{
      text: `${this.escapeMarkdown(product.title)}`,
      callback_data: `product:${product.id}`
    }]);

    // Adiciona botões de navegação
    const navigationButtons = [];
    if (page > 1) {
      navigationButtons.push({
        text: '⬅ Prev',
        callback_data: `page:${page - 1}`
      });
    }
    if (page < totalPages) {
      navigationButtons.push({
        text: 'Next ➡',
        callback_data: `page:${page + 1}`
      });
    }

    if (navigationButtons.length > 0) {
      keyboard.push(navigationButtons);
    }

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }

  /**
   * Manipula o callback quando um produto é selecionado
   */
  private async handleProductDetails(ctx: Context): Promise<void> {
    try {
      if (!('match' in ctx) || !ctx.match || !Array.isArray(ctx.match)) return;

      const productId = ctx.match[1] as string;
      const product = await this.productRepository.findById(productId);

      if (!product) {
        await ctx.reply('Produto não encontrado.');
        return;
      }

      const formattedPrice = this.formatPrice(product.price);
      const formattedMinPrice = this.formatPrice(product.lowest_price);

      const message = `
*${this.escapeMarkdown(product.title)}*

💰 Preço atual: R$ ${formattedPrice}
📉 Menor preço: R$ ${formattedMinPrice}
${product.in_stock ? '✅ Em estoque' : '❌ Fora de estoque'}
${product.preorder ? '\n⏳ Em pré\\-venda' : ''}`;

      await ctx.reply(message, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🛒 Ver Produto',
              url: product.url
            }
          ]]
        }
      });
    } catch (error) {
      console.error('Erro ao mostrar detalhes do produto:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao carregar os detalhes do produto. 😕');
    }
  }

  /**
   * Manipula o callback de mudança de página
   */
  private async handlePageChange(ctx: Context): Promise<void> {
    try {
      if (!('match' in ctx) || !ctx.match || !Array.isArray(ctx.match)) return;

      const page = parseInt(ctx.match[1] as string);
      await this.showProductList(ctx, page);
    } catch (error) {
      console.error('Erro ao mudar de página:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao carregar a página. 😕');
    }
  }

  /**
   * Formata um preço para exibição
   */
  private formatPrice(price: number): string {
    return this.escapeMarkdown(price.toFixed(2));
  }

  /**
   * Escapa caracteres especiais do Markdown V2
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }

  /**
   * Manipula o comando /addlink
   */
  private async handleAddLink(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id.toString();
      const user = await this.userRepository.findById(userId);

      if (!user) {
        await ctx.reply('Por favor, use /enable primeiro para começar a usar o bot.');
        return;
      }

      if (!user.enabled) {
        await ctx.reply('Sua monitoria está desativada. Use /enable para reativar.');
        return;
      }

      // Marca o usuário como esperando links
      this.userStates.set(userId, { awaitingLinks: true });

      await ctx.reply('📚 Envie o link ou lista de links da Amazon que deseja monitorar.\nVocê pode enviar vários links de uma vez, separados por espaço ou em linhas diferentes.');
    } catch (error) {
      console.error('Erro ao processar comando /addlink:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
    }
  }

  /**
   * Manipula mensagens de texto (para receber links)
   */
  private async handleText(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id.toString();
      const userState = this.userStates.get(userId);

      // Se não está esperando links, ignora a mensagem
      if (!userState?.awaitingLinks) {
        return;
      }

      const user = await this.userRepository.findById(userId);
      if (!user || !user.enabled) {
        this.userStates.delete(userId);
        return;
      }

      // Extrai todos os links da mensagem
      const messageText = (ctx.message as { text: string }).text;
      const links = messageText
        .split(/[\n\s]+/) // Divide por espaços ou novas linhas
        .filter(text => text.includes('amazon.com.br')); // Filtra apenas links da Amazon

      if (links.length === 0) {
        await ctx.reply('🤔 Não encontrei nenhum link da Amazon Brasil na sua mensagem.\nPor favor, envie apenas links da Amazon Brasil.');
        return;
      }

      // Cria ações para cada link
      for (const link of links) {
        const action = createAddProductAction(userId, link);
        await this.actionRepository.create(action);
      }

      // Remove o estado de espera
      this.userStates.delete(userId);

      // Responde com confirmação
      const replyText = links.length === 1
        ? '✅ Link recebido!\nVou analisar o produto e te avisar quando houver alterações no preço.'
        : `✅ ${links.length} links recebidos!\nVou analisar os produtos e te avisar quando houver alterações nos preços.`;

      await ctx.reply(replyText);
    } catch (error) {
      console.error('Erro ao processar links:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao processar os links. 😕');
    }
  }
}