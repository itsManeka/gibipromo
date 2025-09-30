import { ActionProcessor } from '../../ports/ActionProcessor';
import { 
  ActionType, 
  AddProductAction, 
  createNotifyPriceAction 
} from '../../../domain/entities/Action';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { UserRepository } from '../../ports/UserRepository';
import { AmazonProductAPI } from '../../ports/AmazonProductAPI';
import { createProduct } from '../../../domain/entities/Product';

/**
 * Processador de ações de adição de produtos
 */
export class AddProductActionProcessor implements ActionProcessor<AddProductAction> {
  public readonly actionType = ActionType.ADD_PRODUCT;

  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly productRepository: ProductRepository,
    private readonly userRepository: UserRepository,
    private readonly amazonApi: AmazonProductAPI
  ) {}

  async process(action: AddProductAction): Promise<void> {
    try {
      console.log(`Processando ação de adicionar produto: ${action.id}`);
      
      // Verifica se o usuário existe e está ativo
      const user = await this.userRepository.findById(action.user_id);
      if (!user || !user.ativo) {
        console.log(`Usuário ${action.user_id} não encontrado ou inativo`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      // Extrai o ASIN do link
      const asin = this.extractASIN(action.product_link);
      if (!asin) {
        console.warn(`Link inválido: ${action.product_link}`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      // Busca o produto na Amazon
      const amazonProduct = await this.amazonApi.getProduct(asin);
      if (!amazonProduct) {
        console.warn(`Produto não encontrado na Amazon: ${asin}`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      // Verifica se o produto já existe
      let product = await this.productRepository.findById(asin);
      
      if (!product) {
        // Cria novo produto
        product = createProduct({
          id: asin,
          offerid: amazonProduct.offerId,
          preco_cheio: amazonProduct.fullPrice,
          preco: amazonProduct.currentPrice,
          estoque: amazonProduct.inStock,
          link: action.product_link,
          imagem: amazonProduct.imageUrl,
          pre_venda: amazonProduct.isPreOrder
        });

        await this.productRepository.create(product);
      } else {
        // Produto existe, verifica se o preço mudou
        const oldPrice = product.preco;
        const newPrice = amazonProduct.currentPrice;

        // Atualiza dados do produto
        product.offerid = amazonProduct.offerId;
        product.preco_cheio = amazonProduct.fullPrice;
        product.preco = amazonProduct.currentPrice;
        product.estoque = amazonProduct.inStock;
        product.imagem = amazonProduct.imageUrl;
        product.pre_venda = amazonProduct.isPreOrder;

        await this.productRepository.update(product);

        // Se o preço diminuiu, cria ação de notificação
        if (newPrice < oldPrice) {
          const notifyAction = createNotifyPriceAction(
            product.id,
            oldPrice,
            newPrice
          );
          await this.actionRepository.create(notifyAction);
        }
      }

      // Adiciona o usuário à lista de monitoramento do produto
      await this.productRepository.addUser(product.id, user.id);
      await this.actionRepository.markProcessed(action.id);

    } catch (error) {
      console.error('Erro ao processar ação de adição de produto:', error);
      // Não marca como processado para tentar novamente depois
    }
  }

  async processNext(limit: number): Promise<number> {
    const actions = await this.actionRepository.findPendingByType(this.actionType, limit);
    let processedCount = 0;

    // Processa as ações sequencialmente para evitar perder erros
    for (const action of actions) {
      try {
        await this.process(action as AddProductAction);
        processedCount++;
      } catch (error) {
        console.error(`Erro ao processar ação ${action.id}:`, error);
        // Não incrementa o contador em caso de erro
      }
    }

    return processedCount;
  }

  private extractASIN(url: string): string | null {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/);
    return match ? match[1] : null;
  }
}