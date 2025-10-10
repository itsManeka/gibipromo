import { Server } from './server';

/**
 * Application entry point
 * Starts the GibiPromo Web API server
 */
async function main(): Promise<void> {
	try {
		const server = new Server();
		await server.start();
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received. Shutting down gracefully...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('SIGINT received. Shutting down gracefully...');
	process.exit(0);
});

// Start the application
if (require.main === module) {
	main().catch((error) => {
		console.error('Application startup failed:', error);
		process.exit(1);
	});
}