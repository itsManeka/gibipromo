import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { router } from './routes/index';

// Load environment variables
dotenv.config();

/**
 * Express application setup with middleware configuration
 * Following Clean Architecture principles for web API
 */
class Server {
	private app: express.Application;
	private port: number;

	constructor() {
		this.app = express();
		this.port = parseInt(process.env.PORT || '3000', 10);
		this.setupMiddleware();
		this.setupRoutes();
		this.setupErrorHandling();
	}

	/**
	 * Configure middleware stack
	 */
	private setupMiddleware(): void {
		// Security middleware
		this.app.use(helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					styleSrc: ["'self'", "'unsafe-inline'"],
					scriptSrc: ["'self'"],
					imgSrc: ["'self'", "data:", "https:"],
				},
			},
		}));

		// CORS configuration
		this.app.use(cors({
			origin: process.env.NODE_ENV === 'development' 
				? true 
				: ['http://localhost:3001', 'https://gibipromo.com'],
			credentials: true,
		}));

		// Logging
		this.app.use(morgan('combined'));

		// Body parsing
		this.app.use(express.json({ limit: '10mb' }));
		this.app.use(express.urlencoded({ extended: true }));
	}

	/**
	 * Setup API routes
	 */
	private setupRoutes(): void {
		const apiPrefix = process.env.API_PREFIX || '/api/v1';
		this.app.use(apiPrefix, router);

		// Root endpoint
		this.app.get('/', (req, res) => {
			res.json({
				message: 'GibiPromo Web API',
				version: '1.0.0',
				status: 'running',
				timestamp: new Date().toISOString()
			});
		});
	}

	/**
	 * Setup error handling middleware
	 */
	private setupErrorHandling(): void {
		// 404 handler
		this.app.use('*', (req, res) => {
			res.status(404).json({
				error: 'Endpoint not found',
				path: req.originalUrl,
				timestamp: new Date().toISOString()
			});
		});

		// Global error handler
		this.app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
			console.error('Unhandled error:', error);
			
			res.status(500).json({
				error: 'Internal server error',
				message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
				timestamp: new Date().toISOString()
			});
		});
	}

	/**
	 * Start the server
	 */
	public async start(): Promise<void> {
		return new Promise((resolve) => {
			this.app.listen(this.port, () => {
				console.log(`🚀 GibiPromo Web API running on port ${this.port}`);
				console.log(`📖 API documentation: http://localhost:${this.port}${process.env.API_PREFIX || '/api/v1'}`);
				console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
				resolve();
			});
		});
	}

	/**
	 * Get the Express application instance
	 */
	public getApp(): express.Application {
		return this.app;
	}
}

export { Server };