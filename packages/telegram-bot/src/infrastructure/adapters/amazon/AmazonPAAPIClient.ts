import { ApiClient, DefaultApi, GetItemsRequest, GetItemsResponse } from 'paapi5-nodejs-sdk';
import dotenv from 'dotenv';
import { AmazonProduct, AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

/**
 * Cliente real da API de produtos da Amazon
 */
export class AmazonPAAPIClient implements AmazonProductAPI {
	private client: DefaultApi;
	private readonly partnerTag: string;

	constructor() {
		const accessKey = process.env.AMAZON_ACCESS_KEY;
		const secretKey = process.env.AMAZON_SECRET_KEY;
		const partnerTag = process.env.AMAZON_PARTNER_TAG;
		const partnerType = process.env.AMAZON_PARTNER_TYPE;

		if (!accessKey || !secretKey || !partnerTag || !partnerType) {
			throw new Error('Credenciais da Amazon PA-API não configuradas');
		}

		// Configura o cliente global
		const defaultClient = ApiClient.instance;
		defaultClient.accessKey = accessKey;
		defaultClient.secretKey = secretKey;
		defaultClient.host = 'webservices.amazon.com.br';
		defaultClient.region = 'us-east-1';

		this.partnerTag = partnerTag;
		this.client = new DefaultApi();
	}

	async getProduct(asin: string): Promise<AmazonProduct | null> {
		try {
			const response = await this.getProducts([asin]);
			return response.get(asin) || null;
		} catch (error) {
			console.error('Erro ao buscar produto na Amazon:', error);
			return null;
		}
	}

	async getProducts(asins: string[]): Promise<Map<string, AmazonProduct>> {
		console.log(`Buscando ${asins.length} produtos na Amazon PA-API...`);
		try {
			const request = new GetItemsRequest();
			request.ItemIds = asins;
			request.Resources = [
				'Images.Primary.Large',
				'Images.Variants.Large',
				'ItemInfo.Title',
				'ItemInfo.Classifications',
				'ItemInfo.ByLineInfo',
				'Offers.Listings.MerchantInfo',
				'Offers.Listings.Availability.Type',
				'Offers.Listings.Price',
				'Offers.Listings.SavingBasis'
			];
			request.PartnerTag = this.partnerTag;
			request.PartnerType = 'Associates';
			request.Marketplace = 'www.amazon.com.br';
			request.Merchant = 'Amazon';

			// Forçar uso de callback puro sem promises para evitar chamada dupla
			const response: GetItemsResponse = await new Promise((resolve, reject) => {
				// @ts-expect-error - O SDK declara incorretamente o tipo do callback - https://github.com/amzn/paapi5-nodejs-sdk/issues/24
				this.client.getItems(request, function callback(error, data) {
					if (error) {
						console.error('Erro na chamada da Amazon PA-API:', error);
						reject(error);
						return;
					}

					if (!data) {
						console.error('Resposta vazia da Amazon PA-API');
						resolve(new GetItemsResponse());
						return;
					}

					try {
						const response = GetItemsResponse.constructFromObject(data);
						resolve(response);
					} catch (error) {
						console.error('Erro ao construir resposta da Amazon PA-API:', error);
						console.error('Dados recebidos:', data);
						reject(error);
					}
				});
			});

			if (response.Errors?.length) {
				console.error('Erros retornados pela Amazon PA-API:', response.Errors);
				return new Map();
			}

			const result = new Map<string, AmazonProduct>();

			if (!response.ItemsResult?.Items) {
				console.log('Nenhum item encontrado na resposta da Amazon PA-API');
				return result;
			}

			for (const item of response.ItemsResult.Items) {
				const listing = item.Offers?.Listings?.[0];
				if (!listing) continue;

				const title = item.ItemInfo?.Title?.DisplayValue || '';
				const price = listing.Price;
				const savingBasis = listing.SavingBasis;

				const currentPrice = Number(price?.Amount) || 0;
				const fullPrice = Number(savingBasis?.Amount) || currentPrice;

				const offerId = listing.MerchantInfo?.Id || '';
				const inStock = offerId !== '';
				const isPreOrder = listing.Availability?.Type === 'Preorderable';

				const product: AmazonProduct = {
					offerId,
					title,
					fullPrice,
					currentPrice,
					inStock,
					imageUrl: item.Images?.Primary?.Large?.URL || '',
					isPreOrder,
					url: item.DetailPageURL || '',
				};

				result.set(item.ASIN!, product);
			}

			return result;
		} catch (error) {
			console.error('Erro ao buscar produtos na Amazon:', error);
			return new Map();
		}
	}
}