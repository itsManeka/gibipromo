import dotenv from 'dotenv';
import { AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';
import { AmazonPAAPIClient } from './AmazonPAAPIClient';
import { MockAmazonPAAPIClient } from './MockAmazonPAAPIClient';
import { createLogger } from '@gibipromo/shared';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const logger = createLogger('AmazonClient');

/**
 * Cria a instância apropriada do cliente da Amazon PA-API baseado na configuração
 * 
 * @returns {AmazonProductAPI} Cliente da PA-API (real ou mock)
 */
export function createAmazonClient(): AmazonProductAPI {
	const useMockPAAPI = process.env.USE_MOCK_PAAPI === 'true';

	if (useMockPAAPI) {
		logger.info('🔧 Usando mock da PA-API');
		return new MockAmazonPAAPIClient();
	}

	logger.info('🌐 Usando PA-API real');
	return new AmazonPAAPIClient();
}