import { ProductsAPI, GetItemsRequest, GetItemsResponse } from 'paapi5-nodejs-sdk';
import dotenv from 'dotenv';
import { AmazonProduct, AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';

dotenv.config();

/**
 * Cliente real da API de produtos da Amazon
 */
export class AmazonPAAPIClient implements AmazonProductAPI {
  private client: ProductsAPI;
  private readonly partnerTag: string;

  constructor() {
    const accessKey = process.env.AMAZON_ACCESS_KEY;
    const secretKey = process.env.AMAZON_SECRET_KEY;
    const partnerTag = process.env.AMAZON_PARTNER_TAG;
    const partnerType = process.env.AMAZON_PARTNER_TYPE;

    if (!accessKey || !secretKey || !partnerTag || !partnerType) {
      throw new Error('Credenciais da Amazon PA-API não configuradas');
    }

    this.partnerTag = partnerTag;
    this.client = new ProductsAPI({
      accessKey,
      secretKey,
      partnerTag,
      partnerType,
      host: 'webservices.amazon.com.br'
    });
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
    try {
      const request: GetItemsRequest = {
        ItemIds: asins,
        Resources: [
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'Offers.Listings.MerchantInfo',
          'Images.Primary.Large',
          'ItemInfo.ByLineInfo',
          'ItemInfo.ContentInfo',
          'Offers.Listings.Availability.Message',
          'Offers.Listings.Condition',
          'Offers.Listings.DeliveryInfo.IsAmazonFulfilled'
        ],
        PartnerTag: this.partnerTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com.br'
      };

      const response: GetItemsResponse = await this.client.getItems(request);
      const result = new Map<string, AmazonProduct>();

      if (!response.ItemsResult?.Items) {
        return result;
      }

      for (const item of response.ItemsResult.Items) {
        const listing = item.Offers?.Listings?.[0];
        if (!listing) continue;

        const product: AmazonProduct = {
          offerId: listing.Id || '',
          fullPrice: this.extractPrice(listing.Price?.Savings?.Amount, listing.Price?.Amount) || 0,
          currentPrice: this.extractPrice(listing.Price?.Amount) || 0,
          inStock: this.isInStock(listing.Availability?.Message),
          imageUrl: item.Images?.Primary?.Large?.URL || '',
          isPreOrder: this.isPreOrder(listing.Availability?.Message)
        };

        result.set(item.ASIN!, product);
      }

      return result;
    } catch (error) {
      console.error('Erro ao buscar produtos na Amazon:', error);
      return new Map();
    }
  }

  private extractPrice(amount?: number, fullPrice?: number): number | undefined {
    if (fullPrice) return fullPrice;
    return amount;
  }

  private isInStock(message?: string): boolean {
    if (!message) return false;
    return !message.toLowerCase().includes('indisponível') &&
           !message.toLowerCase().includes('unavailable');
  }

  private isPreOrder(message?: string): boolean {
    if (!message) return false;
    return message.toLowerCase().includes('pré-venda') ||
           message.toLowerCase().includes('pre-order');
  }
}