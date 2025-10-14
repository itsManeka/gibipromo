import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { UserRepository } from '../../../application/ports/UserRepository';
import { ActionRepository } from '../../../application/ports/ActionRepository';
import { ProductRepository } from '../../../application/ports/ProductRepository';
import { ProductUserRepository } from '../../../application/ports/ProductUserRepository';
import { UserFactory } from '@gibipromo/shared';
import { createAddProductAction } from '@gibipromo/shared';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

export class TelegramBot {
	private bot: Telegraf;

	constructor(
		private readonly userRepository: UserRepository,
		private readonly actionRepository: ActionRepository,
		private readonly productRepository: ProductRepository,
		private readonly productUserRepository: ProductUserRepository
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
		this.bot.command('enable', this.handleEnable.bind(this));
		this.bot.command('disable', this.handleDisable.bind(this));
		this.bot.command('help', this.handleHelp.bind(this));
		this.bot.command('addlink', this.handleAddLink.bind(this));
		this.bot.command('list', this.handleList.bind(this));
		this.bot.command('delete', this.handleDelete.bind(this));

		// Handler para ações nos botões inline
		this.bot.action(/^product:(.+)$/, this.handleProductDetails.bind(this));
		this.bot.action(/^page:(\d+)$/, this.handlePageChange.bind(this));
		this.bot.action(/^delete:(yes|no)$/, this.handleDeleteConfirmation.bind(this));
		this.bot.action(/^stop_monitor:(.+):(.+)$/, this.handleStopMonitoring.bind(this));
		this.bot.action(/^update_price:(.+):(.+):(.+)$/, this.handleUpdateDesiredPrice.bind(this));

		// Handler para mensagens normais (links)
		this.bot.on('text', this.handleText.bind(this));
	}

	/**
	* Inicia o bot
	*/
	public start(): void {
		this.bot.launch();
	}

	/**
	* Para o bot
	*/
	public async stop(): Promise<void> {
		await this.bot.stop();
	}

	/**
	* Manipula o comando /start
	*/
	private async handleStart(ctx: Context): Promise<void> {
		try {
			const { id, first_name, username, language_code } = ctx.from!;
			const telegramId = id.toString();

			// Verifica se o usuário já existe pelo telegram_id
			const existingUser = await this.userRepository.findByTelegramId(telegramId);
			if (existingUser) {
				await ctx.reply('Bem-vindo de volta ao GibiPromo! 🎉\nUse /help para ver os comandos disponíveis.');
				return;
			}

			// Cria novo usuário usando UserFactory (UUID v4)
			const user = UserFactory.createTelegramUser(
				telegramId,
				username || '',
				first_name || '',
				language_code || 'pt'
			);

			await this.userRepository.create(user);
			await ctx.reply('Bem-vindo ao GibiPromo! 🎉\nAgora use /enable para ativar o monitoramento de preços e depois /help para ver os comandos disponíveis.');
		} catch (error) {
			console.error('Erro ao processar comando /start:', error);
			await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
		}
	}

	/**
	* Manipula o comando /enable
	*/
	private async handleEnable(ctx: Context): Promise<void> {
		try {
			const telegramId = ctx.from!.id.toString();

			// Verifica se o usuário existe pelo telegram_id
			const existingUser = await this.userRepository.findByTelegramId(telegramId);
			if (!existingUser) {
				await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
				return;
			}

			// Ativa a monitoria para o usuário existente
			await this.userRepository.setEnabled(existingUser.id, true);
			await ctx.reply('Monitoria ativada com sucesso! ✅\nAgora você pode usar /addlink para adicionar produtos.');
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
			const telegramId = ctx.from!.id.toString();

			// Verifica se o usuário existe pelo telegram_id
			const existingUser = await this.userRepository.findByTelegramId(telegramId);
			if (!existingUser) {
				await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
				return;
			}

			await this.userRepository.setEnabled(existingUser.id, false);
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

/start - Inicia o bot e cria sua conta
/enable - Ativa a monitoria de preços
/disable - Desativa a monitoria
/addlink - Adiciona um produto para monitorar
/list - Lista seus produtos monitorados
/delete - Exclui sua conta permanentemente
/help - Mostra esta mensagem

*Como usar:*
1. Use /start para criar sua conta
2. Use /enable para ativar a monitoria
3. Envie links da Amazon com /addlink
4. Use /list para ver seus produtos
5. Aguarde notificações de preços! 📉
`;
		await ctx.replyWithMarkdownV2(this.escapeMarkdown(helpMessage));
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
			const telegramId = ctx.from!.id.toString();
			const user = await this.userRepository.findByTelegramId(telegramId);

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
	private async showProductList(ctx: Context, page: number, editMessage: boolean = false): Promise<void> {
		const telegramId = ctx.from!.id.toString();
		const user = await this.userRepository.findByTelegramId(telegramId);
		
		if (!user) {
			await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
			return;
		}

		const pageSize = 5;

		// Busca os relacionamentos ProductUser para este usuário
		const { productUsers, total } = await this.productUserRepository.findByUserId(user.id, page, pageSize);

		if (productUsers.length === 0) {
			if (editMessage && 'editMessageText' in ctx) {
				await ctx.editMessageText('Você ainda não está monitorando nenhum produto. Use /addlink para começar 📦');
			} else {
				await ctx.reply('Você ainda não está monitorando nenhum produto. Use /addlink para começar 📦');
			}
			return;
		}

		// Busca os detalhes dos produtos
		const products = await Promise.all(
			productUsers.map(async (productUser) => {
				const product = await this.productRepository.findById(productUser.product_id);
				return product;
			})
		);

		const validProducts = products.filter(product => product !== null);

		if (validProducts.length === 0) {
			if (editMessage && 'editMessageText' in ctx) {
				await ctx.editMessageText('Erro ao carregar os produtos. Tente novamente.');
			} else {
				await ctx.reply('Erro ao carregar os produtos. Tente novamente.');
			}
			return;
		}

		const totalPages = Math.ceil(total / pageSize);
		const message = `📋 Seus produtos monitorados (Página ${page}/${totalPages}):`;

		const keyboard: any[] = validProducts.map(product => [{
			text: `${product!.title} (R$ ${product!.price.toFixed(2)})`, // Formato compacto: Nome (Preço atual)
			callback_data: `product:${product!.id}`
		}]);

		// Adiciona botões de navegação
		const navigationButtons = [];
		if (page > 1) {
			navigationButtons.push({
				text: '⬅️ Ant',
				callback_data: `page:${page - 1}`
			});
		}
		if (page < totalPages) {
			navigationButtons.push({
				text: 'Prox ➡️',
				callback_data: `page:${page + 1}`
			});
		}

		if (navigationButtons.length > 0) {
			keyboard.push(navigationButtons);
		}

		const options = {
			reply_markup: {
				inline_keyboard: keyboard
			}
		};

		if (editMessage && 'editMessageText' in ctx) {
			await ctx.editMessageText(message, options);
		} else {
			await ctx.reply(message, options);
		}
	}

	/**
	* Manipula o callback quando um produto é selecionado
	*/
	private async handleProductDetails(ctx: Context): Promise<void> {
		try {
			if (!('match' in ctx) || !ctx.match || !Array.isArray(ctx.match)) return;

			const productId = ctx.match[1] as string;
			const telegramId = ctx.from!.id.toString();

			// Busca o usuário pelo telegram_id para obter o user_id (UUID)
			const user = await this.userRepository.findByTelegramId(telegramId);
			if (!user) {
				await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
				return;
			}

			const product = await this.productRepository.findById(productId);

			if (!product) {
				await ctx.reply('Produto não encontrado.');
				return;
			}

			// Busca informações do relacionamento ProductUser para preço desejado (usando user_id UUID)
			const productUser = await this.productUserRepository.findByProductAndUser(productId, user.id);

			const formattedPrice = this.formatPrice(product.price);
			const formattedOldPrice = product.old_price ? this.formatPrice(product.old_price) : null;

			// Calcula redução se há preço anterior
			let reductionText = '';
			if (product.old_price && product.old_price > product.price) {
				const reduction = ((product.old_price - product.price) / product.old_price) * 100;
				reductionText = ` (${reduction.toFixed(1)}% de desconto!)`;
			}

			// Informações sobre preço desejado
			let desiredPriceText = '';
			if (productUser?.desired_price) {
				const desiredPrice = this.formatPrice(productUser.desired_price);
				if (product.price <= productUser.desired_price) {
					desiredPriceText = `\n💰 *Preço desejado atingido!* Seu alvo era ${desiredPrice}`;
				} else {
					desiredPriceText = `\n🎯 *Preço desejado:* ${desiredPrice}`;
				}
			}

			// Verifica se houve redução para exibir o percentual
			if (product.old_price && product.old_price > product.price) {
				const reduction = ((product.old_price - product.price) / product.old_price * 100).toFixed(2);
				reductionText = `\n📉 Redução: ${this.escapeMarkdown(reduction)}%`;
			}

			// Calcula o preço sugerido (preço atual -5%)
			const suggestedPrice = product.price * 0.95;
			const unescapedSuggestedPrice = suggestedPrice.toFixed(2);

			const message = `
*${this.escapeMarkdown(product.title)}*

${formattedOldPrice ? `💰 Preço anterior: R$ ${formattedOldPrice}\n✨ *Preço atual: R$ ${formattedPrice}*${reductionText}` : `💰 Preço atual: R$ ${formattedPrice}`}${desiredPriceText}

${product.in_stock ? '✅ Em estoque' : '❌ Fora de estoque'}
${product.preorder ? '\n⏳ Em pré\\-venda' : ''}

_Clique nos botões abaixo para ver o produto ou gerenciar sua monitoria_
`;

			const inlineKeyboard = [
				[
					{
						text: '🛒 Ver Produto',
						url: product.url
					}
				],
				[
					{
						text: '🛑 Parar monitoria',
						callback_data: `stop_monitor:${product.id}:${telegramId}`
					}
				],
				[
					{
						text: `💰 Atualizar preço desejado para R$ ${unescapedSuggestedPrice} (-5%)`,
						callback_data: `update_price:${product.id}:${telegramId}:${suggestedPrice}`
					}
				]
			];

			// Se o produto tem imagem, envia como foto com legenda
			if (product.image && product.image.trim() !== '') {
				await ctx.telegram.sendPhoto(ctx.chat!.id, product.image, {
					caption: message,
					parse_mode: 'MarkdownV2',
					reply_markup: {
						inline_keyboard: inlineKeyboard
					}
				});
			} else {
				// Fallback: envia como mensagem de texto se não há imagem
				await ctx.reply(message, {
					parse_mode: 'MarkdownV2',
					reply_markup: {
						inline_keyboard: inlineKeyboard
					}
				});
			}
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
			await this.showProductList(ctx, page, true); // true = editar mensagem atual
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
			const telegramId = ctx.from!.id.toString();
			const user = await this.userRepository.findByTelegramId(telegramId);

			if (!user) {
				await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
				return;
			}

			if (!user.enabled) {
				await ctx.reply('Sua monitoria está desativada. Use /enable para reativar.');
				return;
			}

			// Marca o usuário como esperando links (usando telegram_id para estado temporário)
			this.userStates.set(telegramId, { awaitingLinks: true });

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
			const telegramId = ctx.from!.id.toString();
			const userState = this.userStates.get(telegramId);

			// Se não está esperando links, ignora a mensagem
			if (!userState?.awaitingLinks) {
				return;
			}

			const user = await this.userRepository.findByTelegramId(telegramId);
			if (!user || !user.enabled) {
				this.userStates.delete(telegramId);
				return;
			}

			// Extrai todos os links da mensagem
			const messageText = (ctx.message as { text: string }).text;
			const links = messageText
				.split(/[\n\s]+/) // Divide por espaços ou novas linhas
				.filter(text => {
					// Aceita links da Amazon e links encurtados conhecidos
					return text.includes('amazon.com') ||
						text.includes('amzn.to') ||
						text.includes('amzlink.to') ||
						text.includes('a.co');
				});

			if (links.length === 0) {
				await ctx.reply('🤔 Não encontrei nenhum link da Amazon na sua mensagem.\nPor favor, envie links da Amazon (incluindo links encurtados como amzn.to).');
				return;
			}

			// Cria ações para cada link
			for (const link of links) {
				const action = createAddProductAction(user.id, link);
				await this.actionRepository.create(action);
			}

			// Remove o estado de espera
			this.userStates.delete(telegramId);

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

	/**
	* Manipula o comando /delete
	*/
	private async handleDelete(ctx: Context): Promise<void> {
		try {
			const userId = ctx.from!.id.toString();
			const user = await this.userRepository.findByTelegramId(userId);

			if (!user) {
				await ctx.reply('Por favor, use /start primeiro para começar a usar o bot.');
				return;
			}

			await ctx.reply(
				'⚠️ Tem certeza que deseja excluir sua conta e parar o monitoramento?\n\n' +
				'Esta ação não pode ser desfeita e você perderá todos os seus produtos monitorados.',
				{
					reply_markup: {
						inline_keyboard: [[
							{ text: '✅ Sim', callback_data: 'delete:yes' },
							{ text: '❌ Não', callback_data: 'delete:no' }
						]]
					}
				}
			);
		} catch (error) {
			console.error('Erro ao processar comando /delete:', error);
			await ctx.reply('Desculpe, ocorreu um erro ao processar seu comando. 😕');
		}
	}

	/**
	* Manipula a confirmação do comando delete
	*/
	private async handleDeleteConfirmation(ctx: Context): Promise<void> {
		try {
			if (!('match' in ctx) || !ctx.match || !Array.isArray(ctx.match)) return;

			const action = ctx.match[1] as string;
			const userId = ctx.from!.id.toString();

			if (action === 'yes') {
				// Remove o usuário da base de dados
				await this.userRepository.delete(userId);

				// Remove do estado local se existir
				this.userStates.delete(userId);

				await ctx.reply('✅ Sua conta foi excluída com sucesso.\nObrigado por usar o GibiPromo!');
			} else {
				await ctx.reply('❌ Operação cancelada.\nSua conta permanece ativa.');
			}
		} catch (error) {
			console.error('Erro ao processar confirmação de exclusão:', error);
			await ctx.reply('Desculpe, ocorreu um erro ao processar a exclusão. 😕');
		}
	}

	/**
	* Manipula o callback de atualizar preço desejado
	*/
	private async handleUpdateDesiredPrice(ctx: Context): Promise<void> {
		try {
			if (!('match' in ctx) || !ctx.match || !Array.isArray(ctx.match)) return;

			const productId = ctx.match[1] as string;
			const telegramId = ctx.match[2] as string;
			const desiredPrice = parseFloat(ctx.match[3] as string);
			const currentUserId = ctx.from!.id.toString();

			// Verifica se o usuário do callback é o mesmo que clicou o botão
			if (telegramId !== currentUserId) {
				await ctx.reply('⚠️ Este botão não é para você.');
				return;
			}

			// Busca o usuário pelo telegram_id para obter o user_id (UUID)
			const user = await this.userRepository.findByTelegramId(telegramId);
			if (!user) {
				await ctx.reply('❌ Usuário não encontrado.');
				return;
			}

			// Verifica se o produto existe
			const product = await this.productRepository.findById(productId);
			if (!product) {
				await ctx.reply('❌ Produto não encontrado.');
				return;
			}

			// Verifica se o usuário está monitorando este produto (usando user_id UUID)
			const productUser = await this.productUserRepository.findByProductAndUser(productId, user.id);
			if (!productUser) {
				await ctx.reply('ℹ️ Você não está monitorando este produto.');
				return;
			}

			// Atualiza o preço desejado diretamente
			const updatedProductUser = {
				...productUser,
				desired_price: desiredPrice,
				updated_at: new Date().toISOString()
			};
			await this.productUserRepository.update(updatedProductUser);

			const formattedPrice = this.escapeMarkdown(desiredPrice.toFixed(2));
			const message = `${this.escapeMarkdown('✅ Preço desejado atualizado para R$ ')}${formattedPrice}\n*${this.escapeMarkdown(product.title)}*\n\n${this.escapeMarkdown('Você será notificado apenas quando o preço for igual ou menor que este valor.')}`;
			await ctx.reply(message, {
				parse_mode: 'MarkdownV2'
			});
		} catch (error) {
			console.error('Erro ao atualizar preço desejado:', error);
			await ctx.reply('Desculpe, ocorreu um erro ao atualizar o preço desejado. 😕');
		}
	}

	/**
	* Manipula o callback de parar monitoria de um produto específico
	*/
	private async handleStopMonitoring(ctx: Context): Promise<void> {
		try {
			if (!('match' in ctx) || !ctx.match || !Array.isArray(ctx.match)) return;

			const productId = ctx.match[1] as string;
			const telegramId = ctx.match[2] as string;
			const currentUserId = ctx.from!.id.toString();

			// Verifica se o usuário do callback é o mesmo que clicou o botão
			if (telegramId !== currentUserId) {
				await ctx.reply('⚠️ Este botão não é para você.');
				return;
			}

			// Busca o usuário pelo telegram_id para obter o user_id (UUID)
			const user = await this.userRepository.findByTelegramId(telegramId);
			if (!user) {
				await ctx.reply('❌ Usuário não encontrado.');
				return;
			}

			// Verifica se o produto existe
			const product = await this.productRepository.findById(productId);
			if (!product) {
				await ctx.reply('❌ Produto não encontrado.');
				return;
			}

			// Verifica se o usuário está monitorando este produto (usando user_id UUID)
			const productUser = await this.productUserRepository.findByProductAndUser(productId, user.id);
			if (!productUser) {
				await ctx.reply('ℹ️ Você não está monitorando este produto.');
				return;
			}

			// Remove o relacionamento ProductUser (usando user_id UUID)
			await this.productUserRepository.removeByProductAndUser(productId, user.id);

			await ctx.reply(`✅ Você não está mais monitorando este produto:\n*${this.escapeMarkdown(product.title)}*`, {
				parse_mode: 'MarkdownV2'
			});
		} catch (error) {
			console.error('Erro ao parar monitoria:', error);
			await ctx.reply('Desculpe, ocorreu um erro ao parar a monitoria. 😕');
		}
	}
}