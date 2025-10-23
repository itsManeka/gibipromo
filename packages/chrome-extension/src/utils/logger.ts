/**
 * Logger wrapper para extensão Chrome
 * Adiciona prefixo para facilitar debug
 */

const PREFIX = '[GibiPromo Extension]';

export const logger = {
	info: (message: string, ...args: unknown[]): void => {
		console.log(`${PREFIX} ${message}`, ...args);
	},

	warn: (message: string, ...args: unknown[]): void => {
		console.warn(`${PREFIX} ${message}`, ...args);
	},

	error: (message: string, ...args: unknown[]): void => {
		console.error(`${PREFIX} ${message}`, ...args);
	},

	debug: (message: string, ...args: unknown[]): void => {
		if (process.env.NODE_ENV === 'development') {
			console.debug(`${PREFIX} ${message}`, ...args);
		}
	},

	group: (label: string): void => {
		console.group(`${PREFIX} ${label}`);
	},

	groupEnd: (): void => {
		console.groupEnd();
	},
};

