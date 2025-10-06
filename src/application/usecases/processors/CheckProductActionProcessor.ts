import { ActionProcessor } from '../../ports/ActionProcessor';
import { ActionType, CheckProductAction, createNotifyPriceAction } from '../../../domain/entities/Action';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { AmazonProductAPI } from '../../ports/AmazonProductAPI';
import { updateProductPrice } from '../../../domain/entities/Product';
import { ProductStatsService } from '../ProductStatsService';

/**
 * Processador de ações de verificação de produtos
 */
export class CheckProductActionProcessor implements ActionProcessor<CheckProductAction> {
    public readonly actionType = ActionType.CHECK_PRODUCT;

    constructor(
    private readonly actionRepository: ActionRepository,
    private readonly productRepository: ProductRepository,
    private readonly amazonApi: AmazonProductAPI,
    private readonly productStatsService: ProductStatsService
    ) {}

    /**
     * Valida se um ID é um ASIN válido da Amazon
     */
    private isValidASIN(asin: string): boolean {
        // ASIN deve ter 10 caracteres alfanuméricos (pode começar com letra ou número)
        return /^[A-Z0-9]{10}$/.test(asin);
    }

    async process(action: CheckProductAction): Promise<void> {
        try {
            // Busca o produto no banco
            const product = await this.productRepository.findById(action.value);
            if (!product) {
                console.warn(`Produto não encontrado: ${action.value}`);
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

            const shouldNotify = updateProductPrice(product, amazonProduct.currentPrice);

            // Atualiza outras informações do produto
            product.offer_id = amazonProduct.offerId;
            product.full_price = amazonProduct.fullPrice;
            product.in_stock = amazonProduct.inStock;
            product.image = amazonProduct.imageUrl;
            product.preorder = amazonProduct.isPreOrder;

            await this.productRepository.update(product);
            await this.actionRepository.markProcessed(action.id);

            // Gera estatísticas se houve uma redução significativa de preço (>=5%)
            try {
                const stats = await this.productStatsService.handlePriceChange(product);
                if (stats) {
                    console.log(`Estatística criada para ${product.title}: redução de ${stats.percentage_change.toFixed(2)}%`);
                }
            } catch (error) {
                console.error('Erro ao gerar estatísticas do produto:', error);
                // Não falha o processamento se houver erro nas estatísticas
            }

            // Se o preço baixou, cria ação de notificação
            if (shouldNotify) {
                const notifyAction = createNotifyPriceAction(product.id);
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
    
        // Filtra apenas produtos com ASINs válidos
        const validProducts = products.filter(p => this.isValidASIN(p.id));
        const invalidProducts = products.filter(p => !this.isValidASIN(p.id));

        // Log produtos com ASINs inválidos
        if (invalidProducts.length > 0) {
            console.warn(`Ignorando ${invalidProducts.length} produtos com ASINs inválidos:`, 
                invalidProducts.map(p => p.id));
        }

        let amazonProducts = new Map();
        
        // Busca apenas produtos com ASINs válidos na Amazon
        if (validProducts.length > 0) {
            const validAsins = validProducts.map(p => p.id);
            amazonProducts = await this.amazonApi.getProducts(validAsins);
        }

        let processedCount = 0;
        let updatedCount = 0;

        // Processa todos os produtos (válidos e inválidos)
        for (const product of products) {
            try {
                // Para produtos com ASIN inválido, apenas pula o processamento
                if (!this.isValidASIN(product.id)) {
                    console.warn(`Produto com ASIN inválido ignorado: ${product.id}`);
                    processedCount++;
                    continue;
                }

                const amazonProduct = amazonProducts.get(product.id);
                if (!amazonProduct) {
                    console.warn(`Produto não encontrado na Amazon: ${product.id}`);
                    continue;
                }

                const shouldNotify = updateProductPrice(product, amazonProduct.currentPrice);

                // Atualiza outras informações do produto
                product.offer_id = amazonProduct.offerId;
                product.full_price = amazonProduct.fullPrice;
                product.in_stock = amazonProduct.inStock;
                product.image = amazonProduct.imageUrl;
                product.preorder = amazonProduct.isPreOrder;

                await this.productRepository.update(product);
                processedCount++;

                // Gera estatísticas se houve uma redução significativa de preço (>=5%)
                try {
                    const stats = await this.productStatsService.handlePriceChange(product);
                    if (stats) {
                        console.log(`Estatística criada para ${product.title}: redução de ${stats.percentage_change.toFixed(2)}%`);
                    }
                } catch (error) {
                    console.error('Erro ao gerar estatísticas do produto:', error);
                    // Não falha o processamento se houver erro nas estatísticas
                }

                // Se o preço baixou, cria ação de notificação
                if (shouldNotify) {
                    const notifyAction = createNotifyPriceAction(product.id);
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