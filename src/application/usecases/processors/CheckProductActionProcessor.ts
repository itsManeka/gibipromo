import { ActionProcessor } from '../../ports/ActionProcessor';
import { ActionType, CheckProductAction, createNotifyPriceAction } from '../../../domain/entities/Action';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { AmazonProductAPI } from '../../ports/AmazonProductAPI';
import { updateProductPrice } from '../../../domain/entities/Product';

/**
 * Processador de ações de verificação de produtos
 */
export class CheckProductActionProcessor implements ActionProcessor<CheckProductAction> {
  public readonly actionType = ActionType.CHECK_PRODUCT;

  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly productRepository: ProductRepository,
    private readonly amazonApi: AmazonProductAPI
  ) {}

  async process(action: CheckProductAction): Promise<void> {
    try {
      // Busca o produto no banco
      const product = await this.productRepository.findById(action.product_id);
      if (!product) {
        console.warn(`Produto não encontrado: ${action.product_id}`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      // Busca informações atualizadas na Amazon
      const amazonProduct = await this.amazonApi.getProduct(product.id);
      if (!amazonProduct) {
        console.warn(`Produto não encontrado na Amazon: ${product.id}`);
        await this.actionRepository.markProcessed(action.id);
        return;
      }

      const oldPrice = product.preco;
      const shouldNotify = updateProductPrice(product, amazonProduct.currentPrice);

      // Atualiza outras informações do produto
      product.offerid = amazonProduct.offerId;
      product.preco_cheio = amazonProduct.fullPrice;
      product.estoque = amazonProduct.inStock;
      product.imagem = amazonProduct.imageUrl;
      product.pre_venda = amazonProduct.isPreOrder;

      await this.productRepository.update(product);
      await this.actionRepository.markProcessed(action.id);

      // Se o preço baixou, cria ação de notificação
      if (shouldNotify) {
        const notifyAction = createNotifyPriceAction(
          product.id,
          oldPrice,
          amazonProduct.currentPrice
        );
        await this.actionRepository.create(notifyAction);
      }

    } catch (error) {
      console.error('Erro ao processar ação de verificação de produto:', error);
      // Não marca como processado para tentar novamente depois
    }
  }

  private lastCheckedProductId: string | null = null;

  async processNext(limit: number): Promise<number> {
    // Busca o próximo lote de produtos para verificar
    const products = await this.productRepository.getNextProductsToCheck(limit);
    if (products.length === 0) {
      console.log('Nenhum produto para verificar');
      return 0;
    }

    console.log(`Verificando lote de ${products.length} produtos`);
    
    // Busca todos os produtos na Amazon de uma vez
    const asins = products.map(p => p.id);
    const amazonProducts = await this.amazonApi.getProducts(asins);

    let processedCount = 0;
    let updatedCount = 0;

    // Processa cada produto
    for (const product of products) {
      try {
        const amazonProduct = amazonProducts.get(product.id);
        if (!amazonProduct) {
          console.warn(`Produto não encontrado na Amazon: ${product.id}`);
          continue;
        }

        const oldPrice = product.preco;
        const shouldNotify = updateProductPrice(product, amazonProduct.currentPrice);

        // Atualiza outras informações do produto
        product.offerid = amazonProduct.offerId;
        product.preco_cheio = amazonProduct.fullPrice;
        product.estoque = amazonProduct.inStock;
        product.imagem = amazonProduct.imageUrl;
        product.pre_venda = amazonProduct.isPreOrder;

        await this.productRepository.update(product);
        processedCount++;

        // Se o preço baixou, cria ação de notificação
        if (shouldNotify) {
          const notifyAction = createNotifyPriceAction(
            product.id,
            oldPrice,
            amazonProduct.currentPrice
          );
          await this.actionRepository.create(notifyAction);
          updatedCount++;
        }
      } catch (error) {
        console.error(`Erro ao atualizar produto ${product.id}:`, error);
      }
    }

    console.log(`${processedCount} produtos verificados, ${updatedCount} atualizações de preço`);
    return processedCount;
  }
}