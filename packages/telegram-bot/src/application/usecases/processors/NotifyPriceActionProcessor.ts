import { ActionProcessor } from '../../ports/ActionProcessor';
import { ActionType, NotifyPriceAction } from '@gibipromo/shared/dist/entities/Action';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { ProductUserRepository } from '../../ports/ProductUserRepository';
import { UserRepository } from '../../ports/UserRepository';
import { TelegramNotifier } from '../../../infrastructure/adapters/telegram';
import { shouldNotifyForPrice } from '@gibipromo/shared/dist/entities/ProductUser';
import { User } from '@gibipromo/shared';

/**
 * Processador de ações de notificação de preço
 */
export class NotifyPriceActionProcessor implements ActionProcessor<NotifyPriceAction> {
	public readonly actionType = ActionType.NOTIFY_PRICE;

	constructor(
		private readonly actionRepository: ActionRepository,
		private readonly productRepository: ProductRepository,
		private readonly productUserRepository: ProductUserRepository,
		private readonly userRepository: UserRepository,
		private readonly notifier: TelegramNotifier
	) { }

	async process(action: NotifyPriceAction): Promise<void> {
		try {
			// Busca o produto
			const product = await this.productRepository.findById(action.value);
			if (!product) {
				console.warn(`Produto não encontrado: ${action.value}`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Busca todos os usuários que monitoram este produto
			const productUsers = await this.productUserRepository.findByProductId(action.value);
			if (!productUsers || productUsers.length === 0) {
				console.log(`Nenhum usuário monitorando o produto ${product.id}`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Busca preços da tabela Products (current = price, old = old_price)
			const currentPrice = product.price;
			const oldPrice = product.old_price ?? product.price; // Fallback para o preço atual se old_price não existir

			// Filtra usuários que devem receber notificação baseado no desired_price
			const usersToNotify = productUsers.filter(productUser =>
				shouldNotifyForPrice(productUser, currentPrice)
			);

			if (usersToNotify.length === 0) {
				console.log(`Nenhum usuário deve ser notificado para o produto ${product.id} com preço ${currentPrice}`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Busca os dados completos dos usuários para obter telegram_id
			const userPromises = usersToNotify.map(productUser =>
				this.userRepository.findById(productUser.user_id)
			);
			const users = await Promise.all(userPromises);

			// Filtra apenas usuários que têm telegram_id (usuários do Telegram)
			const telegramUsers = users.filter((user: User | null, index: number) => {
				if (!user) {
					console.warn(`Usuário não encontrado: ${usersToNotify[index].user_id}`);
					return false;
				}
				if (!user.telegram_id) {
					console.log(`Usuário ${user.id} não tem telegram_id, pulando notificação`);
					return false;
				}
				return true;
			}) as User[]; // Safe cast porque já filtramos nulls e users sem telegram_id

			if (telegramUsers.length === 0) {
				console.log(`Nenhum usuário do Telegram deve ser notificado para o produto ${product.id}`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Notifica todos os usuários do Telegram
			await Promise.all(
				telegramUsers.map((user: User) =>
					this.notifier.notifyPriceChange(
						user.telegram_id!,
						product,
						oldPrice,
						currentPrice
					)
				)
			);
			await this.actionRepository.markProcessed(action.id);
		} catch (error) {
			console.error('Erro ao processar ação de notificação:', error);
			// Não marca como processado para tentar novamente depois
		}
	}

	async processNext(limit: number): Promise<number> {
		const actions = await this.actionRepository.findPendingByType(this.actionType, limit);
		await Promise.all(actions.map(action => this.process(action as NotifyPriceAction)));
		return actions.length;
	}
}