declare module 'paapi5-nodejs-sdk' {
    export interface ProductsAPI {
        getItems(request: GetItemsRequest): Promise<GetItemsResponse>;
    }

    export interface GetItemsRequest {
        ItemIds: string[];
        Resources: string[];
        PartnerTag: string;
        PartnerType: string;
        Marketplace: string;
    }

    export interface GetItemsResponse {
        ItemsResult?: {
            Items?: Array<{
                ASIN?: string;
                Offers?: {
                    Listings?: Array<{
                        Id?: string;
                        Price?: {
                            Amount?: number;
                            Savings?: {
                                Amount?: number;
                            };
                        };
                        Availability?: {
                            Message?: string;
                        };
                    }>;
                };
                Images?: {
                    Primary?: {
                        Large?: {
                            URL?: string;
                        };
                    };
                };
            }>;
        };
    }

    export const ProductsAPI: {
        new(config: {
            accessKey: string;
            secretKey: string;
            partnerTag: string;
            partnerType: string;
            host: string;
        }): ProductsAPI;
    };
}