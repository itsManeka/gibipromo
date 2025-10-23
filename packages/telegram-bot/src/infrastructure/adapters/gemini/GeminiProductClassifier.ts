import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProductClassifier, ProductClassification } from '../../../application/ports/ProductClassifier';
import { createLogger } from '@gibipromo/shared';

const logger = createLogger('GeminiProductClassifier');

/**
 * Implementação do ProductClassifier usando a API do Google Gemini
 */
export class GeminiProductClassifier implements ProductClassifier {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private readonly modelName: string;

    constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
        if (!apiKey) {
            throw new Error('API Key do Gemini não configurada');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });

        logger.info(`GeminiProductClassifier inicializado com modelo ${this.modelName}`);
    }

    /**
     * Cria o prompt para classificação do produto
     */
    private createPrompt(title: string): string {
        return `Você é um assistente especializado em classificar livros, HQs e mangás.
Dado um título, responda **somente com um JSON válido** no seguinte formato:

{
  "category": "HQ|Mangá|Livro",
  "genre": "Gênero principal"
}

Não adicione texto extra, explicações ou comentários. Apenas o JSON.

Título: "${title}"`;
    }

    /**
     * Valida e parseia a resposta do Gemini
     */
    private parseResponse(text: string): ProductClassification | null {
        try {
            // Remove possíveis blocos de código markdown
            let cleanText = text.trim();

            // Remove ```json ou ``` se presente
            cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

            // Tenta parsear o JSON
            const parsed = JSON.parse(cleanText);

            // Valida os campos
            if (!parsed.category || !parsed.genre) {
                logger.warn('Resposta do Gemini sem campos obrigatórios', { parsed });
                return null;
            }

            // Valida o tipo
            const validCategories = ['HQ', 'Mangá', 'Livro'];
            if (!validCategories.includes(parsed.category)) {
                logger.warn('Tipo inválido na resposta do Gemini', { category: parsed.category });
                return null;
            }

            return {
                category: parsed.category as 'HQ' | 'Mangá' | 'Livro',
                genre: parsed.genre
            };
        } catch (error) {
            logger.error('Erro ao parsear resposta do Gemini', { error, text });
            return null;
        }
    }

    /**
     * Classifica um produto baseado no título
     */
    async classify(title: string): Promise<ProductClassification | null> {
        if (!title || title.trim().length === 0) {
            logger.warn('Título vazio fornecido para classificação');
            return null;
        }

        try {
            logger.info('Classificando produto', { title });

            const prompt = this.createPrompt(title);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            logger.debug('Resposta do Gemini recebida', { title, responseLength: text.length });

            const classification = this.parseResponse(text);

            if (classification) {
                logger.info('Produto classificado com sucesso', {
                    title,
                    category: classification.category,
                    genre: classification.genre
                });
            } else {
                logger.warn('Não foi possível classificar o produto', { title });
            }

            return classification;
        } catch (error) {
            logger.error('Erro ao classificar produto com Gemini', { title, error });
            return null;
        }
    }
}

