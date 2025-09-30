import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { UserRepository } from '../../../application/ports/UserRepository';
import { ActionRepository } from '../../../application/ports/ActionRepository';
import { createUser } from '../../../domain/entities/User';
import { createAddProductAction } from '../../../domain/entities/Action';

dotenv.config();

export class TelegramBot {
  private bot: Telegraf;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly actionRepository: ActionRepository
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
    this.bot.command('start', this.handleStart.bind(this));
    this.bot.command('stop', this.handleStop.bind(this));
    this.bot.command('help', this.handleHelp.bind(this));
    this.bot.command('addlink', this.handleAddLink.bind(this));

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
   * Manipula o comando /start
   */
  private async handleStart(ctx: Context): Promise<void> {
    try {
      const { id, first_name, last_name, username, language_code } = ctx.from!;

      // Verifica se o usuário já existe
      const existingUser = await this.userRepository.findById(id.toString());
      if (existingUser) {
        await this.userRepository.setActive(id.toString(), true);
        await ctx.reply('Monitoramento reativado com sucesso! 🎉');
        return;
      }

      // Cria novo usuário
      const user = createUser({
        id: id.toString(),
        nome: first_name || '',
        sobrenome: last_name || '',
        username: username || '',
        idioma: language_code || 'pt'
      });

      await this.userRepository.create(user);
      await ctx.reply('Bem-vindo ao GibiPromo! 🎉\nUse /help para ver os comandos disponíveis.');
    } catch (error) {
      console.error('Erro ao processar comando /start:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
    }
  }

  /**
   * Manipula o comando /stop
   */
  private async handleStop(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id.toString();
      await this.userRepository.setActive(userId, false);
      await ctx.reply('Monitoramento desativado com sucesso! 👋\nUse /start para reativar.');
    } catch (error) {
      console.error('Erro ao processar comando /stop:', error);
      await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
    }
  }

  /**
   * Manipula o comando /help
   */
  private async handleHelp(ctx: Context): Promise<void> {
    const helpMessage = `
🤖 *Comandos disponíveis:*

/start - Ativa o monitoramento
/stop - Desativa o monitoramento
/addlink - Adiciona um produto para monitorar
/help - Mostra esta mensagem

*Como usar:*
1. Use /start para começar
2. Envie links da Amazon com /addlink
3. Aguarde notificações de preços! 📉
`;
    await ctx.replyWithMarkdownV2(helpMessage);
  }

  /**
   * Estado do bot por usuário
   */
  private userStates: Map<string, { awaitingLinks: boolean }> = new Map();

  /**
   * Manipula o comando /addlink
   */
  private async handleAddLink(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id.toString();
      const user = await this.userRepository.findById(userId);

      if (!user) {
        await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
        return;
      }

      if (!user.ativo) {
        await ctx.reply('Seu monitoramento está desativado. Use /start para reativar.');
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
      if (!user || !user.ativo) {
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