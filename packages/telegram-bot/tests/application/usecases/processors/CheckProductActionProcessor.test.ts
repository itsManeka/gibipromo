import { CheckProductActionProcessor } from '../../../../src/application/usecases/processors/CheckProductActionProcessor';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { AmazonProductAPI } from '../../../../src/application/ports/AmazonProductAPI';
import { Product } from '@gibipromo/shared/dist/entities/Product';
import { createCheckProductAction } from '@gibipromo/shared/dist/entities/Action';

// Helper function to create test products
const createTestProduct = (
	id: string,
	title: string,
	fullPrice: number,
	currentPrice: number
): Product => ({
	id,
	offer_id: `offer-${id}`,
	title,
	full_price: fullPrice,
	price: currentPrice,
	lowest_price: currentPrice,
	url: `https://amazon.com.br/dp/${id}`,
	image: `http://example.com/${id}.jpg`,
	in_stock: true,
	preorder: false,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
});

// Mocks
const mockActionRepo: jest.Mocked<ActionRepository> = {
	create: jest.fn(),
	update: jest.fn(),
	findById: jest.fn(),
	findPendingByType: jest.fn(),
	findByType: jest.fn(),
	markProcessed: jest.fn(),
	delete: jest.fn()
};

const mockProductRepo: jest.Mocked<ProductRepository> = {
	create: jest.fn(),
	update: jest.fn(),
	findById: jest.fn(),
	findByLink: jest.fn(),
	getNextProductsToCheck: jest.fn(),
	delete: jest.fn()
};

const mockAmazonApi: jest.Mocked<AmazonProductAPI> = {
	getProduct: jest.fn(),
	getProducts: jest.fn()
};

describe('CheckProductActionProcessor', () => {
	let processor: CheckProductActionProcessor;

	beforeEach(() => {
		// Limpa todos os mocks
		jest.clearAllMocks();

		// Cria nova instância do processador
		processor = new CheckProductActionProcessor(
			mockActionRepo,
			mockProductRepo,
			mockAmazonApi,
			{
				handlePriceChange: jest.fn()
			} as any
		);
	});

	describe('processNext', () => {
		it('deve processar lote de produtos e atualizar preços quando necessário', async () => {
			// Arrange
			const products: Product[] = [
				createTestProduct('B012345678', 'Produto 1', 100, 95),
				createTestProduct('B087654321', 'Produto 2', 200, 190)
			];

			const amazonProducts = new Map();
			amazonProducts.set('B012345678', {
				offerId: 'offer-1',
				title: 'Produto 1',
				fullPrice: 100,
				currentPrice: 80, // Preço menor - deve gerar notificação
				inStock: true,
				imageUrl: 'http://example.com/1.jpg',
				isPreOrder: false
			});
			amazonProducts.set('B087654321', {
				offerId: 'offer-2',
				title: 'Produto 2',
				fullPrice: 200,
				currentPrice: 190, // Mesmo preço - não deve gerar notificação
				inStock: true,
				imageUrl: 'http://example.com/2.jpg',
				isPreOrder: false
			});

			// Mock das chamadas
			mockProductRepo.getNextProductsToCheck.mockResolvedValue(products);
			mockAmazonApi.getProducts.mockResolvedValue(amazonProducts);

			// Act
			const result = await processor.processNext(10);

			// Assert
			expect(result).toBe(2);
			expect(mockAmazonApi.getProducts).toHaveBeenCalledWith(['B012345678', 'B087654321']);
			expect(mockAmazonApi.getProducts).toHaveBeenCalledTimes(1);
			expect(mockProductRepo.update).toHaveBeenCalledTimes(2);
			expect(mockActionRepo.create).toHaveBeenCalledTimes(1); // Uma notificação de preço menor
		});

		it('deve ignorar produtos não encontrados na Amazon', async () => {
			// Arrange
			const products: Product[] = [
				createTestProduct('B012345678', 'Produto 1', 100, 95),
				createTestProduct('B087654321', 'Produto 2', 200, 190)
			];

			const amazonProducts = new Map();
			amazonProducts.set('B012345678', {
				offerId: 'offer-1',
				title: 'Produto 1',
				fullPrice: 100,
				currentPrice: 95,
				inStock: true,
				imageUrl: 'http://example.com/1.jpg',
				isPreOrder: false
			});
			// B087654321 não existe no Map (simula produto não encontrado)

			// Mock das chamadas
			mockProductRepo.getNextProductsToCheck.mockResolvedValue(products);
			mockAmazonApi.getProducts.mockResolvedValue(amazonProducts);

			// Act
			const result = await processor.processNext(10);

			// Assert
			expect(result).toBe(1);
			expect(mockAmazonApi.getProducts).toHaveBeenCalledWith(['B012345678', 'B087654321']);
			expect(mockAmazonApi.getProducts).toHaveBeenCalledTimes(1);
			expect(mockProductRepo.update).toHaveBeenCalledTimes(1);
			expect(mockActionRepo.create).not.toHaveBeenCalled();
		});

		it('deve continuar a partir do último produto verificado', async () => {
			// Arrange - Primeira chamada
			const firstBatch: Product[] = [
				createTestProduct('B012345678', 'Produto 1', 100, 95)
			];

			const secondBatch: Product[] = [
				createTestProduct('B087654321', 'Produto 2', 200, 190)
			];

			const amazonProducts1 = new Map();
			amazonProducts1.set('B012345678', {
				offerId: 'offer-1',
				title: 'Produto 1',
				fullPrice: 100,
				currentPrice: 95,
				inStock: true,
				imageUrl: 'http://example.com/1.jpg',
				isPreOrder: false
			});

			const amazonProducts2 = new Map();
			amazonProducts2.set('B087654321', {
				offerId: 'offer-2',
				title: 'Produto 2',
				fullPrice: 200,
				currentPrice: 190,
				inStock: true,
				imageUrl: 'http://example.com/2.jpg',
				isPreOrder: false
			});

			// Mock das chamadas
			mockProductRepo.getNextProductsToCheck
				.mockResolvedValueOnce(firstBatch)  // Primeira chamada
				.mockResolvedValueOnce(secondBatch) // Segunda chamada
				.mockResolvedValueOnce([]); // Terceira chamada - fim da lista

			mockAmazonApi.getProducts
				.mockResolvedValueOnce(amazonProducts1)
				.mockResolvedValueOnce(amazonProducts2);

			// Act - Primeira chamada
			const result1 = await processor.processNext(1);
			const result2 = await processor.processNext(1);
			const result3 = await processor.processNext(1);

			// Assert
			expect(result1).toBe(1); // Primeiro lote
			expect(result2).toBe(1); // Segundo lote
			expect(result3).toBe(0); // Lista vazia - reinicia

			// Verifica a ordem das chamadas
			expect(mockProductRepo.getNextProductsToCheck).toHaveBeenCalledTimes(3);
			expect(mockAmazonApi.getProducts).toHaveBeenCalledTimes(2);

			// Verifica que os produtos foram processados na ordem correta
			expect(mockAmazonApi.getProducts.mock.calls[0][0]).toEqual(['B012345678']);
			expect(mockAmazonApi.getProducts.mock.calls[1][0]).toEqual(['B087654321']);
		});

		it('deve tratar erro durante atualização de produto específico', async () => {
			// Arrange
			const products = [
				createTestProduct('B012345678', 'Product A', 100, 90),
				createTestProduct('B087654321', 'Product B', 200, 180)
			];

			const amazonProducts = new Map([
				['B012345678', { title: 'Product A', currentPrice: 85, offerId: 'offer-1', fullPrice: 100, inStock: true, imageUrl: 'img1.jpg', isPreOrder: false, url: 'https://amazon.com.br/dp/B012345678' }],
				['B087654321', { title: 'Product B', currentPrice: 170, offerId: 'offer-2', fullPrice: 200, inStock: true, imageUrl: 'img2.jpg', isPreOrder: false, url: 'https://amazon.com.br/dp/B087654321' }]
			]);

			mockProductRepo.getNextProductsToCheck.mockResolvedValue(products);
			mockAmazonApi.getProducts.mockResolvedValue(amazonProducts);

			// Mock para simular erro apenas no segundo produto
			mockProductRepo.update
				.mockResolvedValueOnce(products[0]) // Primeiro produto ok
				.mockRejectedValueOnce(new Error('Database error')); // Segundo produto falha

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			// Act
			const result = await processor.processNext(2);

			// Assert
			expect(result).toBe(1); // Apenas 1 produto processado com sucesso
			expect(consoleSpy).toHaveBeenCalledWith('Erro ao atualizar produto B087654321:', expect.any(Error));

			consoleSpy.mockRestore();
		});

		it('deve tratar erro na API da Amazon durante processNext', async () => {
			// Arrange
			const products = [createTestProduct('B012345678', 'Product A', 100, 90)];

			mockProductRepo.getNextProductsToCheck.mockResolvedValue(products);
			mockAmazonApi.getProducts.mockRejectedValue(new Error('Amazon API error'));

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			// Act & Assert
			await expect(processor.processNext(1)).rejects.toThrow('Amazon API error');

			consoleSpy.mockRestore();
		});
	});

	describe('error handling', () => {
		it('deve tratar erro durante process de ação individual', async () => {
			// Arrange
			const action = createCheckProductAction('B012345678');

			mockProductRepo.findById.mockRejectedValue(new Error('Database connection failed'));
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			// Act
			await processor.process(action);

			// Assert
			expect(consoleSpy).toHaveBeenCalledWith('Erro ao processar ação de verificação de produto:', expect.any(Error));
			expect(mockActionRepo.markProcessed).not.toHaveBeenCalled(); // Não deve marcar como processado em caso de erro

			consoleSpy.mockRestore();
		});

		it('deve tratar produto não encontrado durante process', async () => {
			// Arrange
			const action = createCheckProductAction('B012345678');

			mockProductRepo.findById.mockResolvedValue(null);
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			// Act
			await processor.process(action);

			// Assert
			expect(consoleSpy).toHaveBeenCalledWith('Produto não encontrado: B012345678');
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(action.id);

			consoleSpy.mockRestore();
		});

		it('deve tratar produto não encontrado na Amazon durante process', async () => {
			// Arrange
			const action = createCheckProductAction('B012345678');

			const product = createTestProduct('B012345678', 'Product A', 100, 90);

			mockProductRepo.findById.mockResolvedValue(product);
			mockAmazonApi.getProduct.mockResolvedValue(null);
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			// Act
			await processor.process(action);

			// Assert
			expect(consoleSpy).toHaveBeenCalledWith('Produto não encontrado na Amazon: B012345678');
			expect(mockActionRepo.markProcessed).toHaveBeenCalledWith(action.id);

			consoleSpy.mockRestore();
		});
	});
});
