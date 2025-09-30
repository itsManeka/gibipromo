import dotenv from 'dotenv';
import { AmazonProductAPI } from '../../../application/ports/AmazonProductAPI';
import { AmazonPAAPIClient } from './AmazonPAAPIClient';
import { MockAmazonPAAPIClient } from './MockAmazonPAAPIClient';

dotenv.config();

/**
 * Cria a instância apropriada do cliente da Amazon PA-API baseado no ambiente
 */
export function createAmazonClient(): AmazonProductAPI {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('Usando mock da API da Amazon para ambiente de desenvolvimento');
    return new MockAmazonPAAPIClient();
  }

  return new AmazonPAAPIClient();
}