import dotenv from 'dotenv';
import { createTelegramBot } from './infrastructure/config/telegram';
import { createActionScheduler } from './application/factories/createActionScheduler';
import { createAmazonClient } from './infrastructure/adapters/amazon';

dotenv.config();

async function main(): Promise<void> {
  try {

    // Inicializa o cliente da Amazon
    const amazonClient = createAmazonClient();

    // Configura e inicia o scheduler
    const scheduler = createActionScheduler(
      amazonClient,
      {
        productCheckInterval: Number(process.env.PRODUCT_CHECK_INTERVAL) || 300,
        actionCheckInterval: Number(process.env.ACTION_CHECK_INTERVAL) || 60
      }
    );

    // Inicializa o bot
    const bot = createTelegramBot();
    bot.start();
    console.log('Bot iniciado com sucesso! 🤖');

    // Configuração de desligamento gracioso
    process.on('SIGINT', () => {
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      scheduler.stop();
      process.exit(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      scheduler.stop();
      process.exit(1);
    });

  } catch (error) {
    console.error('Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

main();