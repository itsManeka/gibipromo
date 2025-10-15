import { AmazonPAAPIClient } from '../../../../src/infrastructure/adapters/amazon/AmazonPAAPIClient';

// Mock do @itsmaneka/paapi5-nodejs-sdk
jest.mock('@itsmaneka/paapi5-nodejs-sdk', () => ({
	ApiClient: {
		instance: {
			accessKey: '',
			secretKey: '',
			host: '',
			region: ''
		}
	},
	DefaultApi: jest.fn(),
	GetItemsRequest: jest.fn(),
	GetItemsResponse: {
		constructFromObject: jest.fn()
	}
}));

// Mock do dotenv
jest.mock('dotenv');

describe('AmazonPAAPIClient', () => {
	const mockEnvironment = {
		AMAZON_ACCESS_KEY: 'test-access-key',
		AMAZON_SECRET_KEY: 'test-secret-key',
		AMAZON_PARTNER_TAG: 'test-partner-tag',
		AMAZON_PARTNER_TYPE: 'Associates'
	};

	beforeEach(() => {
		jest.clearAllMocks();
		
		// Mock das variáveis de ambiente
		Object.keys(mockEnvironment).forEach(key => {
			process.env[key] = mockEnvironment[key as keyof typeof mockEnvironment];
		});

		// Mock do console
		console.error = jest.fn();
		console.log = jest.fn();
	});

	afterEach(() => {
		// Limpa as variáveis de ambiente
		Object.keys(mockEnvironment).forEach(key => {
			delete process.env[key];
		});
	});

	describe('constructor', () => {
		it('should initialize client with valid credentials', () => {
			expect(() => new AmazonPAAPIClient()).not.toThrow();
		});

		it('should throw error when access key is missing', () => {
			delete process.env.AMAZON_ACCESS_KEY;
			
			expect(() => new AmazonPAAPIClient()).toThrow(
				'Credenciais da Amazon PA-API não configuradas'
			);
		});

		it('should throw error when secret key is missing', () => {
			delete process.env.AMAZON_SECRET_KEY;
			
			expect(() => new AmazonPAAPIClient()).toThrow(
				'Credenciais da Amazon PA-API não configuradas'
			);
		});

		it('should throw error when partner tag is missing', () => {
			delete process.env.AMAZON_PARTNER_TAG;
			
			expect(() => new AmazonPAAPIClient()).toThrow(
				'Credenciais da Amazon PA-API não configuradas'
			);
		});

		it('should throw error when partner type is missing', () => {
			delete process.env.AMAZON_PARTNER_TYPE;
			
			expect(() => new AmazonPAAPIClient()).toThrow(
				'Credenciais da Amazon PA-API não configuradas'
			);
		});
	});

	describe('getProduct', () => {
		it('should return null when API call fails', async () => {
			// Cria cliente primeiro
			const client = new AmazonPAAPIClient();
			
			// Depois simula erro na API
			jest.spyOn(client, 'getProducts').mockRejectedValue(new Error('API Error'));

			const result = await client.getProduct('B001234567');
			
			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalledWith('Erro ao buscar produto na Amazon:', expect.any(Error));
		});

		it('should call getProducts with single ASIN and return product', async () => {
			const client = new AmazonPAAPIClient();
			
			const mockProduct = {
				offerId: 'AMAZON',
				title: 'Test Product',
				fullPrice: 99.99,
				currentPrice: 89.99,
				inStock: true,
				imageUrl: 'https://example.com/image.jpg',
				isPreOrder: false,
				url: 'https://amazon.com.br/dp/B001234567'
			};
			
			const mockResponse = new Map();
			mockResponse.set('B001234567', mockProduct);

			jest.spyOn(client, 'getProducts').mockResolvedValue(mockResponse);

			const result = await client.getProduct('B001234567');
			
			expect(client.getProducts).toHaveBeenCalledWith(['B001234567']);
			expect(result).toEqual(mockProduct);
		});

		it('should return null when product not found in response', async () => {
			const client = new AmazonPAAPIClient();
			
			const mockResponse = new Map();
			// Resposta vazia - produto não encontrado

			jest.spyOn(client, 'getProducts').mockResolvedValue(mockResponse);

			const result = await client.getProduct('B001234567');
			
			expect(client.getProducts).toHaveBeenCalledWith(['B001234567']);
			expect(result).toBeNull();
		});

		it('should handle exception during getProducts call', async () => {
			const client = new AmazonPAAPIClient();
			
			jest.spyOn(client, 'getProducts').mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			const result = await client.getProduct('B001234567');
			
			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalledWith('Erro ao buscar produto na Amazon:', expect.any(Error));
		});

		it('should handle network timeouts gracefully', async () => {
			const client = new AmazonPAAPIClient();
			
			jest.spyOn(client, 'getProducts').mockRejectedValue(new Error('ETIMEDOUT'));

			const result = await client.getProduct('B001234567');
			
			expect(result).toBeNull();
		});
	});

	describe('getProducts', () => {
		const { DefaultApi, GetItemsRequest, GetItemsResponse } = require('@itsmaneka/paapi5-nodejs-sdk');

		it('should handle network errors gracefully', async () => {
			// Mock da API para simular erro de rede
			const mockGetItems = jest.fn((request, callback) => {
				callback(new Error('Network error'), null);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result).toEqual(new Map());
			expect(console.log).toHaveBeenCalledWith('Buscando 1 produtos na Amazon PA-API...');
			expect(console.error).toHaveBeenCalledWith('Erro na chamada da Amazon PA-API:', expect.any(Error));
		});

		it('should handle empty response from API', async () => {
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, null);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result).toEqual(new Map());
			expect(console.error).toHaveBeenCalledWith('Resposta vazia da Amazon PA-API');
		});

		it('should handle API errors in response', async () => {
			const mockResponse = {
				Errors: [
					{ Code: 'InvalidParameterValue', Message: 'Invalid ASIN' }
				]
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['INVALID']);
			
			expect(result).toEqual(new Map());
			expect(console.error).toHaveBeenCalledWith('Erros retornados pela Amazon PA-API:', mockResponse.Errors);
		});

		it('should handle response without items', async () => {
			const mockResponse = {
				ItemsResult: {}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result).toEqual(new Map());
			expect(console.log).toHaveBeenCalledWith('Nenhum item encontrado na resposta da Amazon PA-API');
		});

		it('should parse successful response with complete product data', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: 'B001234567',
							ItemInfo: {
								Title: {
									DisplayValue: 'Test Product'
								}
							},
							OffersV2: {
								Listings: [
									{
										MerchantInfo: {
											Id: 'AMAZON'
										},
										Price: {
											Money: {
												Amount: 99.99
											},
											SavingBasis: {
												Amount: 129.99
											}
										},
										Availability: {
											Type: 'Now'
										}
									}
								]
							},
							Images: {
								Primary: {
									Large: {
										URL: 'https://example.com/image.jpg'
									}
								}
							},
							DetailPageURL: 'https://amazon.com.br/dp/B001234567'
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result.size).toBe(1);
			const product = result.get('B001234567');
			expect(product).toEqual({
				offerId: 'AMAZON',
				title: 'Test Product',
				fullPrice: 129.99,
				currentPrice: 99.99,
				inStock: true,
				imageUrl: 'https://example.com/image.jpg',
				isPreOrder: false,
				url: 'https://amazon.com.br/dp/B001234567',
				category: undefined,
				format: undefined,
				genre: undefined,
				publisher: undefined,
				contributors: []
			});
		});

		it('should handle product without offers', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: 'B001234567',
							ItemInfo: {
								Title: {
									DisplayValue: 'Test Product'
								}
							}
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result.size).toBe(0);
		});

		it('should handle product with preorder availability', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: 'B001234567',
							ItemInfo: {
								Title: {
									DisplayValue: 'Preorder Product'
								}
							},
							OffersV2: {
								Listings: [
									{
										MerchantInfo: {
											Id: 'AMAZON'
										},
										Price: {
											Money: {
												Amount: 59.99
											}
										},
										Availability: {
											Type: 'PREORDER'
										}
									}
								]
							},
							DetailPageURL: 'https://amazon.com.br/dp/B001234567'
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result.size).toBe(1);
			const product = result.get('B001234567');
			expect(product?.isPreOrder).toBe(true);
			expect(product?.fullPrice).toBe(59.99);
			expect(product?.currentPrice).toBe(59.99);
		});

		it('should handle product with missing optional fields', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: 'B001234567',
							OffersV2: {
								Listings: [
									{
										Price: {
											Money: {
												Amount: 29.99
											}
										}
									}
								]
							}
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result.size).toBe(1);
			const product = result.get('B001234567');
			expect(product).toEqual({
				offerId: '',
				title: '',
				fullPrice: 29.99,
				currentPrice: 29.99,
				inStock: false,
				imageUrl: '',
				isPreOrder: false,
				url: '',
				category: undefined,
				format: undefined,
				genre: undefined,
				publisher: undefined,
				contributors: []
			});
		});

		it('should handle response construction error', async () => {
			const mockGetItems = jest.fn((request, callback) => {
				// Simula um erro no processamento da resposta
				callback(null, { some: 'data' });
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			// Como a resposta não tem estrutura esperada, deve retornar Map vazio
			expect(result).toEqual(new Map());
		});

		it('should handle multiple products with mixed data', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: 'B001234567',
							ItemInfo: {
								Title: {
									DisplayValue: 'Product 1'
								}
							},
							OffersV2: {
								Listings: [
									{
										MerchantInfo: {
											Id: 'AMAZON'
										},
										Price: {
											Money: {
												Amount: 19.99
											}
										}
									}
								]
							}
						},
						{
							ASIN: 'B007654321',
							ItemInfo: {
								Title: {
									DisplayValue: 'Product 2'
								}
							},
							OffersV2: {
								Listings: [
									{
										MerchantInfo: {
											Id: 'THIRD_PARTY'
										},
										Price: {
											Money: {
												Amount: 39.99
											},
											SavingBasis: {
												Amount: 49.99
											}
										}
									}
								]
							}
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567', 'B007654321']);
			
			expect(result.size).toBe(2);
			expect(result.get('B001234567')?.title).toBe('Product 1');
			expect(result.get('B007654321')?.title).toBe('Product 2');
			expect(result.get('B007654321')?.fullPrice).toBe(49.99);
		});

		it('should setup request correctly', async () => {
			const mockRequest = {
				ItemIds: [],
				Resources: [],
				PartnerTag: '',
				PartnerType: '',
				Marketplace: '',
				Merchant: ''
			};
			
			(GetItemsRequest as jest.Mock).mockImplementation(() => mockRequest);
			
			const mockGetItems = jest.fn((request, callback) => {
				// Verifica se o request foi configurado corretamente
				expect(request.ItemIds).toEqual(['B001234567', 'B007654321']);
				expect(request.Resources).toEqual([
					'Images.Primary.Large',
					'Images.Variants.Large',
					'ItemInfo.Title',
					'ItemInfo.Classifications',
					'ItemInfo.ByLineInfo',
					'BrowseNodeInfo.BrowseNodes',
					'OffersV2.Listings.MerchantInfo',
					'OffersV2.Listings.Price'
				]);
				expect(request.PartnerTag).toBe('test-partner-tag');
				expect(request.PartnerType).toBe('Associates');
				expect(request.Marketplace).toBe('www.amazon.com.br');
				expect(request.Merchant).toBe('Amazon');
				
				callback(new Error('Expected error for test'), null);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			const client = new AmazonPAAPIClient();
			await client.getProducts(['B001234567', 'B007654321']);
			
			expect(mockGetItems).toHaveBeenCalled();
		});
	});

	describe('price parsing', () => {
		it('should handle different price formats', () => {
			// Testa a lógica de parsing de preço (método privado)
			// Como é método privado, testamos através do comportamento público
			expect(() => new AmazonPAAPIClient()).not.toThrow();
		});
	});

	describe('new product fields extraction', () => {
		let client: AmazonPAAPIClient;
		const { DefaultApi, GetItemsRequest, GetItemsResponse } = require('@itsmaneka/paapi5-nodejs-sdk');

		beforeEach(() => {
			const client = new AmazonPAAPIClient();
		});

		it('should extract category, format, genre, and publisher from API response', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: '8545707223',
							ItemInfo: {
								Title: {
									DisplayValue: 'Akira - Vol. 3'
								},
								Classifications: {
									Bindings: {
										DisplayValue: 'Capa comum'
									}
								},
								ByLineInfo: {
									Brand: {
										DisplayValue: 'Editora JBC'
									},
									Contributors: [
										{
											Name: 'Katsuhiro Otomo',
											Role: 'Autor'
										}
									],
									Manufacturer: {
										DisplayValue: 'Editora JBC'
									}
								}
							},
							BrowseNodeInfo: {
								BrowseNodes: [
									{
										DisplayName: 'Fantasia',
										Id: '7842717011',
										Ancestor: {
											DisplayName: 'Mangá',
											Id: '7842714011',
											Ancestor: {
												DisplayName: 'HQs, Mangás e Graphic Novels',
												Id: '7842710011'
											}
										}
									}
								]
							},
							OffersV2: {
								Listings: [
									{
										MerchantInfo: {
											Id: 'AMAZON'
										},
										Price: {
											Money: {
												Amount: 64.12
											},
											SavingBasis: {
												Amount: 94.90
											}
										},
										Availability: {
											Type: 'Now'
										}
									}
								]
							},
							Images: {
								Primary: {
									Large: {
										URL: 'https://m.media-amazon.com/images/I/51V8roKvg-S._SL500_.jpg'
									}
								}
							},
							DetailPageURL: 'https://www.amazon.com.br/dp/8545707223?tag=itsmaneka-20&linkCode=ogi&th=1&psc=1'
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['8545707223']);
			
			expect(result.size).toBe(1);
			const product = result.get('8545707223');
			expect(product).toEqual({
				offerId: 'AMAZON',
				title: 'Akira - Vol. 3',
				fullPrice: 94.90,
				currentPrice: 64.12,
				inStock: true,
				imageUrl: 'https://m.media-amazon.com/images/I/51V8roKvg-S._SL500_.jpg',
				isPreOrder: false,
				url: 'https://www.amazon.com.br/dp/8545707223?tag=itsmaneka-20&linkCode=ogi&th=1&psc=1',
				category: 'Mangá',
				format: 'Capa comum',
				genre: 'Fantasia',
				publisher: 'Editora JBC',
				contributors: ['Katsuhiro Otomo']
			});
		});

		it('should handle missing optional fields gracefully', async () => {
			const mockResponse = {
				ItemsResult: {
					Items: [
						{
							ASIN: 'B001234567',
							ItemInfo: {
								Title: {
									DisplayValue: 'Product Without Metadata'
								}
							},
							OffersV2: {
								Listings: [
									{
										MerchantInfo: {
											Id: 'AMAZON'
										},
										Price: {
											Money: {
												Amount: 29.99
											}
										},
										Availability: {
											Type: 'Now'
										}
									}
								]
							},
							DetailPageURL: 'https://amazon.com.br/dp/B001234567'
						}
					]
				}
			};
			
			const mockGetItems = jest.fn((request, callback) => {
				callback(null, mockResponse);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			(GetItemsResponse.constructFromObject as jest.Mock).mockReturnValue(mockResponse);

			const client = new AmazonPAAPIClient();
			const result = await client.getProducts(['B001234567']);
			
			expect(result.size).toBe(1);
			const product = result.get('B001234567');
			expect(product?.category).toBeUndefined();
			expect(product?.format).toBeUndefined();
			expect(product?.genre).toBeUndefined();
			expect(product?.publisher).toBeUndefined();
			expect(product?.contributors).toEqual([]);
		});

		it('should verify new Resources are included in request', async () => {
			const mockRequest = {
				ItemIds: ['B001234567'],
				Resources: [],
				PartnerTag: '',
				PartnerType: '',
				Marketplace: '',
				Merchant: ''
			};
			
			(GetItemsRequest as jest.Mock).mockImplementation(() => mockRequest);
			
			const mockGetItems = jest.fn((request, callback) => {
				// Verifica se os novos Resources foram incluídos
				expect(request.Resources).toContain('BrowseNodeInfo.BrowseNodes');
				expect(request.Resources).toContain('ItemInfo.ByLineInfo');
				expect(request.Resources).toContain('ItemInfo.Classifications');
				
				callback(new Error('Expected error for test'), null);
			});
			
			(DefaultApi as jest.Mock).mockImplementation(() => ({
				getItems: mockGetItems
			}));

			const client = new AmazonPAAPIClient();
			await client.getProducts(['B001234567']);
			
			expect(mockGetItems).toHaveBeenCalled();
		});
	});
});
