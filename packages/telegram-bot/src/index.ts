import dotenv from 'dotenv';
import { createTelegramBot } from './infrastructure/config/telegram';
import { createActionScheduler } from './application/factories/createActionScheduler';
import { createAmazonClient } from './infrastructure/adapters/amazon';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main(): Promise<void> {
	let bot: any = null;
	let scheduler: any = null;

	try {

		// Inicializa o cliente da Amazon
		const amazonClient = createAmazonClient();

		// Configura e inicia o scheduler
		scheduler = createActionScheduler(
			amazonClient
		);

		// Inicializa o bot
		bot = createTelegramBot();
		bot.start();
		console.log('Bot iniciado com sucesso! 🤖');

		// Configuração de desligamento gracioso
		const gracefulShutdown = async (signal: string) => {
			console.log(`\nRecebido sinal ${signal}. Encerrando aplicação...`);
			
			try {
				// Define um timeout para evitar travamento
				const shutdownTimeout = setTimeout(() => {
					console.log('Timeout no encerramento. Forçando saída...');
					process.exit(1);
				}, 5000); // 5 segundos

				if (scheduler) {
					console.log('Parando scheduler...');
					await scheduler.stop();
				}
				
				if (bot) {
					console.log('Parando bot do Telegram...');
					await bot.stop();
				}
				
				clearTimeout(shutdownTimeout);
				console.log('Aplicação encerrada com sucesso!');
				process.exit(0);
			} catch (error) {
				console.error('Erro durante o encerramento:', error);
				process.exit(1);
			}
		};

		process.once('SIGINT', () => gracefulShutdown('SIGINT'));
		process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

		process.on('unhandledRejection', async (reason, promise) => {
			console.error('Unhandled Rejection at:', promise, 'reason:', reason);
			await gracefulShutdown('unhandledRejection');
		});

	} catch (error) {
		console.error('Erro ao iniciar a aplicação:', error);
		
		if (scheduler) {
			await scheduler.stop();
		}
		
		if (bot) {
			await bot.stop();
		}
		
		process.exit(1);
	}
}

main();