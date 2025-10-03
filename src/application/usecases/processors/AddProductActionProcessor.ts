import {
	ActionType,
	AddProductAction,
	createNotifyPriceAction
} from '../../../domain/entities/Action';
import { ActionRepository } from '../../ports/ActionRepository';
import { ProductRepository } from '../../ports/ProductRepository';
import { UserRepository } from '../../ports/UserRepository';
import { AmazonProduct, AmazonProductAPI } from '../../ports/AmazonProductAPI';
import { createProduct } from '../../../domain/entities/Product';
import { ActionProcessor } from '../../ports/ActionProcessor';

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
	) { }

	async process(action: AddProductAction): Promise<void> {
		try {
			console.log(`Processando ação individual: ${action.id}`);

			// Verifica se o usuário existe e a monitoria está habilitada primeiro
			const user = await this.userRepository.findById(action.user_id);
			if (!user || !user.enabled) {
				console.log(`Usuário ${action.user_id} não encontrado ou monitoria desabilitada`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			const asin = this.extractASIN(action.value);
			if (!asin) {
				console.warn(`Link inválido: ${action.value}`);
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			const amazonProducts = await this.amazonApi.getProducts([asin]);
			await this.processAction(action, amazonProducts);
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
				preorder: amazonProduct.isPreOrder
			});

			await this.productRepository.create(product);
			console.log(`Produto criado com sucesso: ${product.title} (R$ ${product.price})`);
		} else {
			// Produto existe, verifica se o preço mudou
			const oldPrice = product.price;
			const newPrice = amazonProduct.currentPrice;

			//-- Atualiza apenas se houver mudança em algum campo relevante
			if (oldPrice === newPrice &&
				product.in_stock === amazonProduct.inStock &&
				product.preorder === amazonProduct.isPreOrder &&
				product.users.includes(action.user_id)) {
				console.log(`Nenhuma mudança para o produto ${product.title}, pulando atualização.`);
				await this.actionRepository.markProcessed(action.id);
				return true;
			}

			// Atualiza dados do produto
			product.offer_id = amazonProduct.offerId;
			product.title = amazonProduct.title;
			product.full_price = amazonProduct.fullPrice;
			product.price = amazonProduct.currentPrice;
			product.in_stock = amazonProduct.inStock;
			product.image = amazonProduct.imageUrl;
			product.preorder = amazonProduct.isPreOrder;

			await this.productRepository.update(product);

			// Se o preço diminuiu, cria ação de notificação
			if (newPrice < oldPrice) {
				console.log(`Preço diminuiu para ${product.title}: R$ ${oldPrice} -> R$ ${newPrice}`);
				const notifyAction = createNotifyPriceAction(product.id);
				await this.actionRepository.create(notifyAction);
				console.log(`Ação de notificação criada: ${notifyAction.id}`);
			} else if (newPrice !== oldPrice) {
				console.log(`Preço aumentou para ${product.title}: R$ ${oldPrice} -> R$ ${newPrice}`);
			}
		}

		// Adiciona o usuário à lista de monitoramento do produto
		const user = await this.userRepository.findById(action.user_id);
		if (user) {
			await this.productRepository.addUser(product.id, user.id);
		}
		await this.actionRepository.markProcessed(action.id);
		return true;
	}

	async processNext(limit: number): Promise<number> {
		// Busca até 10 ações pendentes
		const actions = await this.actionRepository.findPendingByType(this.actionType, limit);
		if (actions.length === 0) return 0;

		console.log(`Processando ${actions.length} ações de adicionar produtos em lote`);

		// Obtém a lista de ASINs únicos das ações
		const asins: string[] = [];
		for (const action of actions) {
			const asin = this.extractASIN((action as AddProductAction).value);
			if (asin) asins.push(asin);
		}

		// Se não houver ASINs válidos, marca todas como processadas
		if (asins.length === 0) {
			console.warn('Nenhum ASIN válido encontrado nas ações');
			await Promise.all(
				actions.map(action => this.actionRepository.markProcessed(action.id))
			);
			return actions.length;
		}

		// Busca todos os produtos na Amazon de uma vez
		console.log(`Buscando ${asins.length} produtos na Amazon`);
		let amazonProducts: Map<string, any>;

		try {
			amazonProducts = await this.amazonApi.getProducts(asins);
		} catch (error) {
			console.error('Erro ao buscar produtos na Amazon:', error);
			// Em caso de erro da API, marca todas as ações como processadas
			await Promise.all(
				actions.map(action => this.actionRepository.markProcessed(action.id))
			);
			return actions.length;
		}

		// Processa cada ação usando os produtos já buscados
		let processedCount = 0;
		for (const action of actions) {
			try {
				const asin = this.extractASIN((action as AddProductAction).value);
				if (!asin) {
					console.warn(`Link inválido: ${(action as AddProductAction).value}`);
					await this.actionRepository.markProcessed(action.id);
					processedCount++;
					continue;
				}

				const amazonProduct = amazonProducts.get(asin);
				console.log(`Processando ação ${action.id} para produto ${asin} (${amazonProduct?.title})`);

				await this.processAction(action as AddProductAction, amazonProducts);
				processedCount++;

				console.log(`Ação ${action.id} processada com sucesso - Produto: ${amazonProduct?.title} (R$ ${amazonProduct?.currentPrice})`);
			} catch (error) {
				console.error(`Erro ao processar ação ${action.id}:`, error);
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

		// ASINs are typically 9 or 10 characters
		if (asin.length >= 9 && asin.length <= 10) {
			return asin;
		}

		return null;
	}
}