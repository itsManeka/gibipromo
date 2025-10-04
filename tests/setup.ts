import { config } from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente de teste
config({
    path: path.resolve(__dirname, '.env.test')
});