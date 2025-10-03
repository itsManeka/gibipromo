declare module 'paapi5-nodejs-sdk' {
    export class ApiClient {
        static instance: ApiClient;
        accessKey: string;
        secretKey: string;
        host: string;
        region: string;
    }

    export class DefaultApi {
        constructor();
        getItems(request: GetItemsRequest): Promise<GetItemsResponse>;
    }

    export class GetItemsRequest {
        constructor();
        PartnerTag: string;
        PartnerType: string;
        ItemIds: string[];
        Resources: string[];
        Marketplace?: string;
        Merchant?: string;
        Condition?: string;
    }

    export class GetItemsResponse {
        static constructFromObject(data: any): GetItemsResponse;
        ItemsResult?: {
            Items?: Array<{
                ASIN?: string;
                DetailPageURL?: string;
                Images?: {
                    Primary?: {
                        Large?: {
                            URL?: string;
                        };
                    };
                    Variants?: {
                        Large?: {
                            URL?: string;
                        };
                    };
                };
                ItemInfo?: {
                    ByLineInfo?: {
                        Brand?: {
                            DisplayValue?: string;
                        };
                        Manufacturer?: {
                            DisplayValue?: string;
                        };
                        Contributors?: Array<{
                            Locale?: string;
                            Name?: string;
                            Role?: string;
                            RoleType?: string;
                        }>;
                    };
                    Title?: {
                        DisplayValue?: string;
                    };
                    Classifications?: {
                        Bindings?: {
                            DisplayValue?: string;
                        };
                        ProductGroup?: {
                            DisplayValue?: string;
                        };
                    };
                };
                Offers?: {
                    Listings?: Array<{
                        MerchantInfo?: {
                            Id?: string;
                        };
                        SavingBasis?: {
                            Amount?: string;
                        };
                        Price?: {
                            Amount?: string;
                        };
                        Availability?: {
                            Type?: string;
                        };
                    }>;
                };
            }>;
        };
        Errors?: Array<{
            Code: string;
            Message: string;
        }>;
    }
}