import dotenv from 'dotenv';
import { AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';
import { AmazonPAAPIClient } from './AmazonPAAPIClient';
import { MockAmazonPAAPIClient } from './MockAmazonPAAPIClient';

dotenv.config();

/**
 * Cria a instância apropriada do cliente da Amazon PA-API baseado na configuração
 * 
 * @returns {AmazonProductAPI} Cliente da PA-API (real ou mock)
 */
export function createAmazonClient(): AmazonProductAPI {
    const useMockPAAPI = process.env.USE_MOCK_PAAPI === 'true';
  
    if (useMockPAAPI) {
        console.log('🔧 Usando mock da PA-API');
        return new MockAmazonPAAPIClient();
    }

    console.log('🌐 Usando PA-API real');
    return new AmazonPAAPIClient();
}