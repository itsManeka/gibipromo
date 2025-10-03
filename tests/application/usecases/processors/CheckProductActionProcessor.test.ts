import { CheckProductActionProcessor } from '../../../../src/application/usecases/processors/CheckProductActionProcessor';
import { ActionRepository } from '../../../../src/application/ports/ActionRepository';
import { ProductRepository } from '../../../../src/application/ports/ProductRepository';
import { AmazonProductAPI } from '../../../../src/application/ports/AmazonProductAPI';
import { Product } from '../../../../src/domain/entities/Product';

// Helper function to create test products
const createTestProduct = (
  id: string, 
  title: string, 
  fullPrice: number, 
  currentPrice: number,
  users: string[] = []
): Product => ({
  id,
  offerid: `offer-${id}`,
  title,
  preco_cheio: fullPrice,
  preco: currentPrice,
  menor_preco: currentPrice,
  link: `https://amazon.com.br/dp/${id}`,
  imagem: `http://example.com/${id}.jpg`,
  estoque: true,
  pre_venda: false,
  usuarios: users
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
  findByUserId: jest.fn(),
  addUser: jest.fn(),
  removeUser: jest.fn(),
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
      mockAmazonApi
    );
  });

  describe('processNext', () => {
    it('deve processar lote de produtos e atualizar preços quando necessário', async () => {
      // Arrange
      const products: Product[] = [
        createTestProduct('B0001AAAA', 'Produto 1', 100, 95, ['user-1']),
        createTestProduct('B0002BBBB', 'Produto 2', 200, 190, ['user-1', 'user-2'])
      ];

      const amazonProducts = new Map();
      amazonProducts.set('B0001AAAA', {
        offerId: 'offer-1',
        title: 'Produto 1',
        fullPrice: 100,
        currentPrice: 80, // Preço menor - deve gerar notificação
        inStock: true,
        imageUrl: 'http://example.com/1.jpg',
        isPreOrder: false
      });
      amazonProducts.set('B0002BBBB', {
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
      expect(mockAmazonApi.getProducts).toHaveBeenCalledWith(['B0001AAAA', 'B0002BBBB']);
      expect(mockAmazonApi.getProducts).toHaveBeenCalledTimes(1);
      expect(mockProductRepo.update).toHaveBeenCalledTimes(2);
      expect(mockActionRepo.create).toHaveBeenCalledTimes(1); // Uma notificação de preço menor
    });

    it('deve ignorar produtos não encontrados na Amazon', async () => {
      // Arrange
      const products: Product[] = [
        createTestProduct('B0001AAAA', 'Produto 1', 100, 95, ['user-1']),
        createTestProduct('B0002BBBB', 'Produto 2', 200, 190, ['user-1', 'user-2'])
      ];

      const amazonProducts = new Map();
      amazonProducts.set('B0001AAAA', {
        offerId: 'offer-1',
        title: 'Produto 1',
        fullPrice: 100,
        currentPrice: 95,
        inStock: true,
        imageUrl: 'http://example.com/1.jpg',
        isPreOrder: false
      });
      // B0002BBBB não existe no Map (simula produto não encontrado)

      // Mock das chamadas
      mockProductRepo.getNextProductsToCheck.mockResolvedValue(products);
      mockAmazonApi.getProducts.mockResolvedValue(amazonProducts);

      // Act
      const result = await processor.processNext(10);

      // Assert
      expect(result).toBe(1);
      expect(mockAmazonApi.getProducts).toHaveBeenCalledWith(['B0001AAAA', 'B0002BBBB']);
      expect(mockAmazonApi.getProducts).toHaveBeenCalledTimes(1);
      expect(mockProductRepo.update).toHaveBeenCalledTimes(1);
      expect(mockActionRepo.create).not.toHaveBeenCalled();
    });

    it('deve continuar a partir do último produto verificado', async () => {
      // Arrange - Primeira chamada
      const firstBatch: Product[] = [
        createTestProduct('B0001AAAA', 'Produto 1', 100, 95, ['user-1'])
      ];

      const secondBatch: Product[] = [
        createTestProduct('B0002BBBB', 'Produto 2', 200, 190, ['user-1'])
      ];

      const amazonProducts1 = new Map();
      amazonProducts1.set('B0001AAAA', {
        offerId: 'offer-1',
        title: 'Produto 1',
        fullPrice: 100,
        currentPrice: 95,
        inStock: true,
        imageUrl: 'http://example.com/1.jpg',
        isPreOrder: false
      });

      const amazonProducts2 = new Map();
      amazonProducts2.set('B0002BBBB', {
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
      expect(mockAmazonApi.getProducts.mock.calls[0][0]).toEqual(['B0001AAAA']);
      expect(mockAmazonApi.getProducts.mock.calls[1][0]).toEqual(['B0002BBBB']);
    });
  });
});