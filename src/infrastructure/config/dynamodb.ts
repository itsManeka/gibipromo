// This file is used by all services that need DynamoDB access
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

const config: AWS.DynamoDB.ClientConfiguration = {
    region: process.env.AWS_REGION || 'us-east-1'
};

if (isDevelopment) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
    config.credentials = {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    };
}

export const dynamodb = new AWS.DynamoDB(config);
export const documentClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });