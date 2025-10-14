/**
 * DynamoDB Client Configuration for Shared Package
 * 
 * This configuration is shared across all packages that need DynamoDB access.
 * It automatically configures for local development (DynamoDB Local) or production (AWS).
 * 
 * @module infrastructure/config/dynamodb
 */

import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do diretório raiz do workspace
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const isDevelopment = process.env.NODE_ENV === 'development';

const config: AWS.DynamoDB.ClientConfiguration = {
	region: process.env.AWS_REGION || 'us-east-1'
};

// Em desenvolvimento, usa DynamoDB Local (Docker)
if (isDevelopment) {
	config.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
	config.credentials = {
		accessKeyId: 'local',
		secretAccessKey: 'local'
	};
}

/**
 * Cliente DynamoDB (low-level API)
 */
export const dynamodb = new AWS.DynamoDB(config);

/**
 * Cliente DynamoDB DocumentClient (high-level API)
 * Preferir este para operações CRUD normais
 */
export const documentClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });
