import { ProductClassifier } from '../../application/ports/ProductClassifier';
import { GeminiProductClassifier, MockProductClassifier } from '../adapters/gemini';
import { createLogger } from '@gibipromo/shared';

const logger = createLogger('ProductClassifierFactory');

/**
 * Cria uma instância do ProductClassifier baseado nas variáveis de ambiente
 * @returns Instância do classificador (Gemini ou Mock) ou undefined se desabilitado
 */
export function createProductClassifier(): ProductClassifier | undefined {
	const useClassifier = process.env.USE_PRODUCT_CLASSIFIER === 'true';
	
	if (!useClassifier) {
		logger.info('Classificador de produtos desabilitado (USE_PRODUCT_CLASSIFIER != true)');
		return undefined;
	}

	const useMock = process.env.USE_MOCK_CLASSIFIER === 'true';

	if (useMock) {
		logger.info('Usando MockProductClassifier');
		return new MockProductClassifier();
	}

	const apiKey = process.env.GEMINI_API_KEY;
	const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';

	if (!apiKey) {
		logger.warn('GEMINI_API_KEY não configurada. Classificador desabilitado.');
		return undefined;
	}

	logger.info(`Usando GeminiProductClassifier com modelo ${modelName}`);
	return new GeminiProductClassifier(apiKey, modelName);
}

