import { Logger, createLogger } from '@gibipromo/shared';

/**
 * Base service class with common functionality
 * Following Clean Architecture principles
 */
export abstract class BaseService {
	protected logger: Logger;

	constructor(serviceName: string) {
		this.logger = createLogger(`WebAPI:${serviceName}`);
	}

	/**
	 * Log service action
	 */
	protected logAction(action: string, data?: any): void {
		this.logger.info(`${action}`, data);
	}

	/**
	 * Log service error
	 */
	protected logError(error: Error, context?: string): void {
		this.logger.error(`Error in ${context || 'service'}:`, error);
	}
}