import { GeminiProductClassifier } from '../../../src/infrastructure/adapters/gemini/GeminiProductClassifier';
import { ProductClassification } from '../../../src/application/ports/ProductClassifier';

// Mock do Google Generative AI
jest.mock('@google/generative-ai', () => {
	return {
		GoogleGenerativeAI: jest.fn().mockImplementation(() => {
			return {
				getGenerativeModel: jest.fn().mockReturnValue({
					generateContent: jest.fn()
				})
			};
		})
	};
});

describe('GeminiProductClassifier', () => {
	let classifier: GeminiProductClassifier;
	let mockGenerateContent: jest.Mock;

	beforeEach(() => {
		// Configura o mock
		const { GoogleGenerativeAI } = require('@google/generative-ai');
		const mockGenAI = new GoogleGenerativeAI('test-api-key');
		const mockModel = mockGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
		mockGenerateContent = mockModel.generateContent as jest.Mock;

		classifier = new GeminiProductClassifier('test-api-key', 'gemini-1.5-flash');
		
		// Injeta o mock no classifier
		(classifier as any).model = mockModel;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('deve lançar erro se API key não for fornecida', () => {
			expect(() => new GeminiProductClassifier('')).toThrow('API Key do Gemini não configurada');
		});

		it('deve usar modelo padrão se não especificado', () => {
			const classifierDefault = new GeminiProductClassifier('test-key');
			expect(classifierDefault).toBeDefined();
		});
	});

	describe('classify', () => {
		it('deve classificar produto corretamente com resposta JSON válida', async () => {
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => '{"tipo": "Mangá", "genero": "Ação"}'
				}
			});

			const result = await classifier.classify('One Piece Vol. 1');
			
			expect(result).not.toBeNull();
			expect(result?.category).toBe('Mangá');
			expect(result?.genre).toBe('Ação');
		});

		it('deve parsear resposta com blocos de código markdown', async () => {
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => '```json\n{"tipo": "HQ", "genero": "Super-heróis"}\n```'
				}
			});

			const result = await classifier.classify('Batman');
			
			expect(result).not.toBeNull();
			expect(result?.category).toBe('HQ');
			expect(result?.genre).toBe('Super-heróis');
		});

		it('deve retornar null para título vazio', async () => {
			const result = await classifier.classify('');
			
			expect(result).toBeNull();
			expect(mockGenerateContent).not.toHaveBeenCalled();
		});

		it('deve retornar null para resposta JSON inválida', async () => {
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => 'resposta inválida'
				}
			});

			const result = await classifier.classify('Livro Teste');
			
			expect(result).toBeNull();
		});

		it('deve retornar null se resposta não tiver campos obrigatórios', async () => {
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => '{"tipo": "Livro"}'
				}
			});

			const result = await classifier.classify('Livro Teste');
			
			expect(result).toBeNull();
		});

		it('deve retornar null para tipo inválido', async () => {
			mockGenerateContent.mockResolvedValue({
				response: {
					text: () => '{"tipo": "InvalidType", "genero": "Ação"}'
				}
			});

			const result = await classifier.classify('Teste');
			
			expect(result).toBeNull();
		});

		it('deve tratar erro da API graciosamente', async () => {
			mockGenerateContent.mockRejectedValue(new Error('API Error'));

			const result = await classifier.classify('Livro Teste');
			
			expect(result).toBeNull();
		});

		it('deve aceitar todos os tipos válidos', async () => {
			const validCategories: Array<'HQ' | 'Mangá' | 'Livro'> = ['HQ', 'Mangá', 'Livro'];

			for (const category of validCategories) {
				mockGenerateContent.mockResolvedValue({
					response: {
						text: () => JSON.stringify({ category: category, genre: 'Teste' })
					}
				});

				const result = await classifier.classify('Teste');
				expect(result?.category).toBe(category);
			}
		});
	});
});

