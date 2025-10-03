import { ActionProcessor } from '../../ports/ActionProcessor';
import { ActionType, NotifyPriceAction } from '../../../domain/entities/Action';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { TelegramNotifier } from '../../../infrastructure/adapters/telegram';

/**
 * Processador de ações de notificação de preço
 */
export class NotifyPriceActionProcessor implements ActionProcessor<NotifyPriceAction> {
  public readonly actionType = ActionType.NOTIFY_PRICE;

  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly productRepository: ProductRepository,
    private readonly notifier: TelegramNotifier
  ) {}

  async process(action: NotifyPriceAction): Promise<void> {
    try {
      // Busca o produto
      const product = await this.productRepository.findById(action.value);
      if (!product) {
        console.warn(`Produto não encontrado: ${action.value}`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      // Verifica se tem usuários monitorando
      if (!product.users || product.users.length === 0) {
        console.log(`Nenhum usuário monitorando o produto ${product.id}`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      // Busca preços da tabela Products (current = price, old = old_price)
      const currentPrice = product.price;
      const oldPrice = product.old_price ?? product.price; // Fallback para o preço atual se old_price não existir

      // Notifica todos os usuários que monitoram o produto
      await Promise.all(
        product.users.map((userId: string) =>
          this.notifier.notifyPriceChange(
            userId,
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