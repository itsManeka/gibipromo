import {
	ActionType,
	AddProductAction,
	createNotifyPriceAction
} from '@gibipromo/shared/dist/entities/Action';
import {
	createLogger,
	resolveShortUrl,
	ActionOrigin,
	UserOrigin,
	createProductAddedNotification
} from '@gibipromo/shared';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { ProductUserRepository } from '../../ports/ProductUserRepository';
import { UserRepository } from '../../ports/UserRepository';
import { NotificationRepository } from '@gibipromo/shared/dist/repositories/NotificationRepository';
import { AmazonProduct, AmazonProductAPI } from '../../ports/AmazonProductAPI';
import { createProduct, updateProductPrice } from '@gibipromo/shared/dist/entities/Product';
import { createProductUser } from '@gibipromo/shared/dist/entities/ProductUser';
import { ActionProcessor } from '../../ports/ActionProcessor';
import { ProductStatsService } from '../ProductStatsService';
import { ProductClassifier } from '../../ports/ProductClassifier';

const logger = createLogger('AddProductActionProcessor');

/**
 * Processador de ações de adição de produtos
 */
export class AddProductActionProcessor implements ActionProcessor<AddProductAction> {
	public readonly actionType = ActionType.ADD_PRODUCT;

	constructor(
		private readonly actionRepository: ActionRepository,
		private readonly productRepository: ProductRepository,
		private readonly productUserRepository: ProductUserRepository,
		private readonly userRepository: UserRepository,
		private readonly amazonApi: AmazonProductAPI,
		private readonly productStatsService: ProductStatsService,
		private readonly notificationRepository: NotificationRepository,
		private readonly productClassifier?: ProductClassifier
	) { }

	/**
	 * Valida se um ID é um ASIN válido da Amazon
	 */
	private isValidASIN(asin: string): boolean {
		// ASIN deve ter 10 caracteres alfanuméricos (pode começar com letra ou número)
		return /^[A-Z0-9]{10}$/.test(asin);
	}

	/**
	 * Resolve uma URL (pode ser encurtada) para a URL final da Amazon
	 * @param url URL original (pode ser encurtada)
	 * @returns URL final resolvida ou null se inválida
	 */
	private async resolveUrl(url: string): Promise<string | null> {
		try {
			const result = await resolveShortUrl(url);

			if (!result.success) {
				console.warn(`Erro ao resolver URL ${url}: ${result.error}`);
				return null;
			}

			if (!result.isAmazonUrl) {
				console.warn(`URL ${url} não é da Amazon: ${result.error}`);
				return null;
			}

			return result.finalUrl;
		} catch (error) {
			console.error(`Erro inesperado ao resolver URL ${url}:`, error);
			return null;
		}
	}

	async process(action: AddProductAction): Promise<void> {
		try {
			logger.info(`Processando ação individual: ${action.id}`);

			// Verifica se o usuário existe e a monitoria está habilitada primeiro
			const user = await this.userRepository.findById(action.user_id);
			if (!user || !user.enabled) {
				logger.warn(`Usuário ${action.user_id} não encontrado ou monitoria desabilitada`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Resolve a URL (pode ser encurtada) para a URL final da Amazon
			const resolvedUrl = await this.resolveUrl(action.value);
			if (!resolvedUrl) {
				console.warn(`Não foi possível resolver a URL: ${action.value}`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			const asin = this.extractASIN(resolvedUrl);
			if (!asin) {
				console.warn(`Link inválido após resolução: ${resolvedUrl} (original: ${action.value})`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Verifica se o ASIN é válido antes de consultar a Amazon
			if (!this.isValidASIN(asin)) {
				console.warn(`ASIN inválido: ${asin} (extraído de ${resolvedUrl}, original: ${action.value})`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			const amazonProducts = await this.amazonApi.getProducts([asin]);
			// Usa a URL resolvida para processamento
			const modifiedAction = { ...action, value: resolvedUrl };
			await this.processAction(modifiedAction, amazonProducts);
		} catch (error) {
			console.error('Erro ao processar ação de adição de produto:', error);
			throw error; // Re-throw para tratamento adequado
		}
	}

	private async processAction(
		action: AddProductAction,
		amazonProducts: Map<string, AmazonProduct>
	): Promise<boolean> {
		// Extrai o ASIN do link
		const asin = this.extractASIN(action.value);
		if (!asin) {
			console.warn(`Link inválido: ${action.value}`);
			await this.actionRepository.markProcessed(action.id);
			return true;
		}

		const amazonProduct = amazonProducts.get(asin);
		if (!amazonProduct) {
			console.warn(`Produto não encontrado na Amazon: ${asin}`);
			await this.actionRepository.markProcessed(action.id);
			return true;
		}

		// Verifica se o produto já existe
		let product = await this.productRepository.findById(asin);

		if (!product) {
			console.log(`Criando novo produto: ${amazonProduct.title}`);

			// Classifica o produto usando IA (se disponível)
			// Apenas classifica com IA produtos do grupo de Livros (Book)
			let category = undefined;
			let genre = undefined;

			if (this.productClassifier && amazonProduct.productGroup === 'Book') {
				try {
					const classification = await this.productClassifier.classify(amazonProduct.title);
					if (classification) {
						category = classification.category;
						genre = classification.genre;
						logger.info('Produto classificado pela IA', {
							title: amazonProduct.title,
							category,
							genre
						});
					}
				} catch (error) {
					logger.warn('Erro ao classificar produto com IA', { error });
					// Os campos category e genre serão indefinidos
				}
			}

			// Cria novo produto
			product = createProduct({
				id: asin,
				offer_id: amazonProduct.offerId,
				title: amazonProduct.title,
				full_price: amazonProduct.fullPrice,
				price: amazonProduct.currentPrice,
				old_price: amazonProduct.currentPrice,
				in_stock: amazonProduct.inStock,
				url: amazonProduct.url,
				image: amazonProduct.imageUrl,
				preorder: amazonProduct.isPreOrder,
				category: category,
				format: amazonProduct.format,
				genre: genre,
				publisher: amazonProduct.publisher,
				contributors: amazonProduct.contributors,
				product_group: amazonProduct.productGroup,
				store: 'Amazon'
			});

			await this.productRepository.create(product);
			console.log(`Produto criado com sucesso: ${product.title} (R$ ${product.price})`);

			// Cria entrada inicial de estatísticas para o produto
			// Isso garante que sempre haverá pelo menos um ponto de dados no gráfico
			try {
				const initialStats = await this.productStatsService.createInitialStats(product);
				console.log(`Estatística inicial criada para ${product.title} (baseline: R$ ${initialStats.price})`);
			} catch (error) {
				console.error('Erro ao criar estatística inicial do produto:', error);
				// Não falha o processamento se houver erro nas estatísticas
			}
		} else {
			// Produto existe, verifica se o preço mudou
			const oldPrice = product.price;
			const newPrice = amazonProduct.currentPrice;

			// Verifica se o usuário já monitora este produto
			const existingProductUser = await this.productUserRepository.findByProductAndUser(product.id, action.user_id);

			//-- Atualiza apenas se houver mudança em algum campo relevante
			if (oldPrice === newPrice &&
				product.in_stock === amazonProduct.inStock &&
				product.preorder === amazonProduct.isPreOrder &&
				product.full_price === amazonProduct.fullPrice &&
				existingProductUser) {
				console.log(`Nenhuma mudança para o produto ${product.title}, pulando atualização.`);
				await this.actionRepository.markProcessed(action.id);
				return true;
			}

			// Atualiza dados do produto
			product.offer_id = amazonProduct.offerId;
			product.title = amazonProduct.title;
			product.full_price = amazonProduct.fullPrice;
			product.in_stock = amazonProduct.inStock;
			product.image = amazonProduct.imageUrl;
			product.preorder = amazonProduct.isPreOrder;

			// Atualiza o preço usando a função do domínio e verifica se deve notificar
			const shouldNotify = updateProductPrice(product, newPrice);

			await this.productRepository.update(product);

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

			// Se o preço diminuiu, cria ação de notificação
			if (shouldNotify) {
				console.log(`Preço diminuiu para ${product.title}: R$ ${product.old_price} -> R$ ${product.price}`);
				const notifyAction = createNotifyPriceAction(product.id);
				await this.actionRepository.create(notifyAction);
				console.log(`Ação de notificação criada: ${notifyAction.id}`);
			} else if (newPrice !== oldPrice) {
				console.log(`Preço aumentou para ${product.title}: R$ ${oldPrice} -> R$ ${newPrice}`);
			}
		}

		// Adiciona o usuário à lista de monitoramento do produto (tabela ProductUsers)
		const user = await this.userRepository.findById(action.user_id);
		if (user) {
			// Cria ou atualiza o relacionamento usando upsert
			const productUser = createProductUser({
				product_id: product.id,
				user_id: user.id
			});
			await this.productUserRepository.upsert(productUser);
			console.log(`Usuário ${user.id} adicionado ao monitoramento do produto ${product.id}`);

			// Notificar usuários do site sobre produto adicionado
			if (action.origin === ActionOrigin.SITE &&
				(user.origin === UserOrigin.SITE || user.origin === UserOrigin.BOTH)) {

				const notification = createProductAddedNotification(
					user.id,
					product.title,
					product.id,
					product.url
				);

				try {
					await this.notificationRepository.create(notification);
					logger.info('Notificação de produto adicionado criada', {
						userId: user.id,
						productId: product.id,
						notificationId: notification.id
					});
				} catch (error) {
					logger.error('Erro ao criar notificação de produto adicionado', error);
					// Não falha o processo por erro de notificação
				}
			}
		}
		await this.actionRepository.markProcessed(action.id);
		return true;
	}

	async processNext(limit: number): Promise<number> {
		// Busca até 10 ações pendentes
		const actions = await this.actionRepository.findPendingByType(this.actionType, limit);
		if (actions.length === 0) return 0;

		console.log(`Processando ${actions.length} ações de adicionar produtos em lote`);

		// Resolve todas as URLs primeiro e obtém a lista de ASINs únicos das ações válidas
		const asins: string[] = [];
		const invalidActions: any[] = [];
		const resolvedActions: { action: AddProductAction; resolvedUrl: string; asin: string }[] = [];

		for (const action of actions) {
			const addProductAction = action as AddProductAction;

			// Resolve a URL (pode ser encurtada) para a URL final da Amazon
			const resolvedUrl = await this.resolveUrl(addProductAction.value);
			if (!resolvedUrl) {
				console.warn(`Não foi possível resolver a URL da ação ${action.id}: ${addProductAction.value}`);
				invalidActions.push(action);
				continue;
			}

			const asin = this.extractASIN(resolvedUrl);
			if (asin && this.isValidASIN(asin)) {
				asins.push(asin);
				resolvedActions.push({ action: addProductAction, resolvedUrl, asin });
			} else {
				invalidActions.push(action);
				console.warn(`ASIN inválido ou não encontrado na ação ${action.id}: ${addProductAction.value} (resolvida: ${resolvedUrl})`);
			}
		}

		// Marca ações com URLs/ASINs inválidos como processadas
		if (invalidActions.length > 0) {
			await Promise.all(
				invalidActions.map(action => this.actionRepository.markProcessed(action.id))
			);
		}

		// Se não houver ASINs válidos, retorna
		if (asins.length === 0) {
			console.warn('Nenhum ASIN válido encontrado nas ações após resolução de URLs');
			return actions.length;
		}

		// Busca todos os produtos na Amazon de uma vez
		console.log(`Buscando ${asins.length} produtos na Amazon`);
		let amazonProducts: Map<string, any>;

		try {
			amazonProducts = await this.amazonApi.getProducts(asins);
		} catch (error) {
			console.error('Erro ao buscar produtos na Amazon:', error);
			// Em caso de erro da API, marca todas as ações válidas como processadas
			await Promise.all(
				resolvedActions.map(({ action }) => this.actionRepository.markProcessed(action.id))
			);
			return actions.length;
		}

		// Processa cada ação usando os produtos já buscados
		let processedCount = 0;
		for (const resolvedAction of resolvedActions) {
			try {
				const { action, resolvedUrl, asin } = resolvedAction;

				const amazonProduct = amazonProducts.get(asin);
				console.log(`Processando ação ${action.id} para produto ${asin} (${amazonProduct?.title})`);

				// Cria uma ação modificada com a URL resolvida
				const modifiedAction = { ...action, value: resolvedUrl };
				await this.processAction(modifiedAction, amazonProducts);
				processedCount++;

				console.log(`Ação ${action.id} processada com sucesso - Produto: ${amazonProduct?.title} (R$ ${amazonProduct?.currentPrice})`);
			} catch (error) {
				console.error(`Erro ao processar ação ${resolvedAction.action.id}:`, error);
				// Ainda conta como processada mesmo com erro
				processedCount++;
			}
		}

		console.log(`${processedCount} ações processadas com sucesso`);
		return processedCount;
	}

	/**
	 * Extrai o ASIN de um link da Amazon
	 * Suporta formatos:
	 * - amazon.com.br/dp/ASIN
	 * - amazon.com.br/gp/product/ASIN
	 * 
	 * @param url URL da Amazon
	 * @returns ASIN ou null se não encontrado
	 */
	private extractASIN(url: string): string | null {
		if (!url) return null;

		// Extract ASIN - capture all alphanumeric characters then filter by length
		const match = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]+)/i);
		if (!match) return null;

		const asin = match[1].toUpperCase();

		// ASINs devem ter exatamente 10 caracteres para Amazon PA-API
		if (asin.length === 10) {
			return asin;
		}

		return null;
	}
}