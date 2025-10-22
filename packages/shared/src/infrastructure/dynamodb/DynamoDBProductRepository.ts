import { Product } from '../../entities';
import { ProductRepository } from '../../repositories/ProductRepository';
import { DynamoDBRepository } from './DynamoDBRepository';
import { documentClient } from '../config/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PromotionFilters, FilterOptions } from '../../types/PromotionFilters';

/**
 * DynamoDB implementation of ProductRepository
 */
export class DynamoDBProductRepository extends DynamoDBRepository<Product> implements ProductRepository {
	constructor() {
		super('Products');
	}

	async create(entity: Product): Promise<Product> {
		const now = new Date().toISOString();
		const productWithTimestamps = {
			...entity,
			created_at: now,
			updated_at: now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productWithTimestamps
		};

		await documentClient.put(params).promise();
		return productWithTimestamps;
	}

	async update(entity: Product): Promise<Product> {
		const now = new Date().toISOString();
		const productWithUpdatedTimestamp = {
			...entity,
			updated_at: now
		};

		const params: DocumentClient.PutItemInput = {
			TableName: this.tableName,
			Item: productWithUpdatedTimestamp
		};

		await documentClient.put(params).promise();
		return productWithUpdatedTimestamp;
	}

	async findByLink(link: string): Promise<Product | null> {
		const params: DocumentClient.QueryInput = {
			TableName: this.tableName,
			IndexName: 'UrlIndex',
			KeyConditionExpression: 'url = :url',
			ExpressionAttributeValues: {
				':url': link
			}
		};

		const result = await documentClient.query(params).promise();
		return result.Items && result.Items.length > 0 ? (result.Items[0] as Product) : null;
	}

	private lastEvaluatedKey: DocumentClient.Key | undefined;

	async getNextProductsToCheck(limit: number): Promise<Product[]> {
		try {
			console.log(`[DynamoDB] Buscando próximos ${limit} produtos para verificar`);

			const params: DocumentClient.ScanInput = {
				TableName: this.tableName,
				Limit: limit
			};

			// Se tiver uma chave salva, usa para continuar de onde parou
			if (this.lastEvaluatedKey) {
				params.ExclusiveStartKey = this.lastEvaluatedKey;
			}

			const result = await documentClient.scan(params).promise();

			// Guarda a última chave avaliada para a próxima consulta
			this.lastEvaluatedKey = result.LastEvaluatedKey;

			// Se não tem mais itens, reinicia a paginação
			if (!this.lastEvaluatedKey) {
				console.log('[DynamoDB] Fim da lista de produtos, reiniciando paginação');
			}

			const products = (result.Items || []) as Product[];
			console.log(`[DynamoDB] Encontrados ${products.length} produtos para verificar`);

			return products;
		} catch (error) {
			console.error('[DynamoDB] Erro ao buscar produtos para verificar:', error);
			this.lastEvaluatedKey = undefined; // Reseta em caso de erro
			throw error;
		}
	}

	/**
	 * Find products on promotion with filters
	 * Aplica filtros simples no DynamoDB e filtros complexos em memória
	 */
	async findPromotions(filters: PromotionFilters, limit: number): Promise<Product[]> {
		try {
			console.log('[DynamoDB] Buscando promoções com filtros:', filters);

			// Limitar a 1000 para otimizar custos (AWS Free Tier)
			const effectiveLimit = Math.min(limit, 1000);

			// Construir FilterExpression para DynamoDB
			const filterConditions: string[] = ['price < full_price', 'product_group = :productGroup']; // Condição de promoção, só livros
			const expressionValues: any = {
				':productGroup': 'Book' // Apenas livros
			};
			const expressionNames: any = {};			// Filtros simples aplicados no DynamoDB
			if (filters.category) {
				filterConditions.push('category = :category');
				expressionValues[':category'] = filters.category;
			}

			if (filters.publisher) {
				filterConditions.push('publisher = :publisher');
				expressionValues[':publisher'] = filters.publisher;
			}

			if (filters.genre) {
				filterConditions.push('genre = :genre');
				expressionValues[':genre'] = filters.genre;
			}

			if (filters.format) {
				filterConditions.push('#format = :format');
				expressionValues[':format'] = filters.format;
				expressionNames['#format'] = 'format'; // 'format' é palavra reservada
			}

			// inStock: true = apenas em estoque, false = todos (em estoque + sem estoque)
			if (filters.inStock === true) {
				filterConditions.push('in_stock = :inStock');
				expressionValues[':inStock'] = true;
			}
			// Se inStock === false, não adiciona filtro (mostra todos)

			if (filters.preorder !== undefined) {
				filterConditions.push('preorder = :preorder');
				expressionValues[':preorder'] = filters.preorder;
			}

			// Executar Scan com FilterExpression
			const params: DocumentClient.ScanInput = {
				TableName: this.tableName,
				Limit: effectiveLimit,
				FilterExpression: filterConditions.join(' AND '),
				ExpressionAttributeValues: expressionValues
			};

			if (Object.keys(expressionNames).length > 0) {
				params.ExpressionAttributeNames = expressionNames;
			}

			const result = await documentClient.scan(params).promise();
			let products = (result.Items || []) as Product[];

			console.log(`[DynamoDB] Encontrados ${products.length} produtos em promoção antes dos filtros complexos`);

			// Aplicar filtros complexos em memória
			products = this.applyComplexFilters(products, filters);

			console.log(`[DynamoDB] Retornando ${products.length} produtos após filtros complexos`);

			return products;
		} catch (error) {
			console.error('[DynamoDB] Erro ao buscar promoções:', error);
			throw error;
		}
	}

	/**
	 * Find multiple products by IDs using batch get
	 * Divide em chunks de 100 (limite do DynamoDB batchGet)
	 */
	async findByIds(ids: string[]): Promise<Product[]> {
		try {
			if (ids.length === 0) {
				return [];
			}

			console.log(`[DynamoDB] Buscando ${ids.length} produtos por ID`);

			const products: Product[] = [];
			const chunkSize = 100; // Limite do DynamoDB batchGet

			// Dividir em chunks de 100
			for (let i = 0; i < ids.length; i += chunkSize) {
				const chunk = ids.slice(i, i + chunkSize);

				const keys = chunk.map(id => ({ id }));

				const params: DocumentClient.BatchGetItemInput = {
					RequestItems: {
						[this.tableName]: {
							Keys: keys
						}
					}
				};

				const result = await documentClient.batchGet(params).promise();
				const items = result.Responses?.[this.tableName] || [];

				products.push(...(items as Product[]));
			}

			console.log(`[DynamoDB] Encontrados ${products.length} produtos de ${ids.length} IDs solicitados`);

			return products;
		} catch (error) {
			console.error('[DynamoDB] Erro ao buscar produtos por IDs:', error);
			throw error;
		}
	}

	/**
	 * Get unique values for filterable fields
	 * Usado para popular dropdowns de filtros
	 */
	async getUniqueFilterValues(): Promise<FilterOptions> {
		try {
			console.log('[DynamoDB] Extraindo valores únicos para filtros');

			// Buscar até 1000 produtos para análise (otimizado para Free Tier)
			const products = await this.getNextProductsToCheck(1000);

			// Extrair valores únicos usando Set
			const categoriesSet = new Set<string>();
			const publishersSet = new Set<string>();
			const genresSet = new Set<string>();
			const formatsSet = new Set<string>();
			const contributorsSet = new Set<string>();

			products.forEach(product => {
				if (product.category) categoriesSet.add(product.category);
				if (product.publisher) publishersSet.add(product.publisher);
				if (product.genre) genresSet.add(product.genre);
				if (product.format) formatsSet.add(product.format);

				// Extrair contributors (array)
				if (product.contributors && Array.isArray(product.contributors)) {
					product.contributors.forEach(contributor => {
						if (contributor) contributorsSet.add(contributor);
					});
				}
			});

			const filterOptions: FilterOptions = {
				categories: Array.from(categoriesSet).sort(),
				publishers: Array.from(publishersSet).sort(),
				genres: Array.from(genresSet).sort(),
				formats: Array.from(formatsSet).sort(),
				contributors: Array.from(contributorsSet).sort()
			};

			console.log('[DynamoDB] Valores únicos extraídos:', {
				categories: filterOptions.categories.length,
				publishers: filterOptions.publishers.length,
				genres: filterOptions.genres.length,
				formats: filterOptions.formats.length,
				contributors: filterOptions.contributors.length
			});

			return filterOptions;
		} catch (error) {
			console.error('[DynamoDB] Erro ao extrair valores únicos:', error);
			throw error;
		}
	}

	/**
	 * Aplica filtros complexos em memória
	 * Usado para query textual e contributors
	 */
	private applyComplexFilters(products: Product[], filters: PromotionFilters): Product[] {
		let filtered = products;

		// Filtro de busca textual (title + contributors)
		if (filters.query) {
			const query = filters.query.toLowerCase();
			filtered = filtered.filter(product => {
				const titleMatch = product.title.toLowerCase().includes(query);
				const contributorsMatch = product.contributors?.some(contributor =>
					contributor.toLowerCase().includes(query)
				);
				return titleMatch || contributorsMatch;
			});
		}

		// Filtro por contributors específicos
		if (filters.contributors && filters.contributors.length > 0) {
			filtered = filtered.filter(product => {
				if (!product.contributors || product.contributors.length === 0) return false;

				// Verifica se ALGUM contributor do filtro está presente no produto (match exato)
				return filters.contributors!.some(filterContributor => {
					const normalizedFilter = filterContributor.trim().toLowerCase();
					return product.contributors!.some(productContributor => {
						const normalizedProduct = productContributor.trim().toLowerCase();
						return normalizedProduct === normalizedFilter;
					});
				});
			});
		}

		return filtered;
	}
}