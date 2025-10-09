/**
 * Logger estruturado para o projeto GibiPromo
 * Fornece logging consistente em toda a aplicação
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

export interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: string;
	data?: any;
	error?: Error;
}

export class Logger {
	private static instance: Logger;
	private level: LogLevel = LogLevel.INFO;
	private context?: string;

	private constructor(context?: string) {
		this.context = context;
		// Configura o nível baseado na variável de ambiente
		const envLevel = process.env.LOG_LEVEL?.toUpperCase();
		if (envLevel && envLevel in LogLevel) {
			this.level = LogLevel[envLevel as keyof typeof LogLevel];
		}
	}

	/**
	 * Cria ou retorna a instância global do logger
	 */
	static getInstance(context?: string): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return context ? new Logger(context) : Logger.instance;
	}

	/**
	 * Cria um logger com contexto específico
	 */
	static withContext(context: string): Logger {
		return new Logger(context);
	}

	/**
	 * Log de debug - informações detalhadas para desenvolvimento
	 */
	debug(message: string, data?: any): void {
		this.log(LogLevel.DEBUG, message, data);
	}

	/**
	 * Log de informação - eventos importantes da aplicação
	 */
	info(message: string, data?: any): void {
		this.log(LogLevel.INFO, message, data);
	}

	/**
	 * Log de aviso - situações que merecem atenção mas não param a aplicação
	 */
	warn(message: string, data?: any): void {
		this.log(LogLevel.WARN, message, data);
	}

	/**
	 * Log de erro - problemas que afetam o funcionamento
	 */
	error(message: string, error?: Error | any, data?: any): void {
		this.log(LogLevel.ERROR, message, data, error);
	}

	/**
	 * Método interno para realizar o log
	 */
	private log(level: LogLevel, message: string, data?: any, error?: Error | any): void {
		if (level < this.level) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level: LogLevel[level],
			message,
			context: this.context,
			data,
			error: error instanceof Error ? error : undefined
		};

		const formattedMessage = this.formatMessage(entry);

		// Em desenvolvimento, usa console para melhor legibilidade
		// Em produção, pode ser enviado para serviços de logging
		switch (level) {
		case LogLevel.DEBUG:
			console.debug(formattedMessage);
			break;
		case LogLevel.INFO:
			console.log(formattedMessage);
			break;
		case LogLevel.WARN:
			console.warn(formattedMessage);
			break;
		case LogLevel.ERROR:
			console.error(formattedMessage);
			if (error) {
				console.error(error);
			}
			break;
		}
	}

	/**
	 * Formata a mensagem de log
	 */
	private formatMessage(entry: LogEntry): string {
		let message = `[${entry.timestamp}] ${entry.level}`;
		
		if (entry.context) {
			message += ` [${entry.context}]`;
		}
		
		message += `: ${entry.message}`;
		
		if (entry.data) {
			message += ` | Data: ${JSON.stringify(entry.data)}`;
		}
		
		return message;
	}

	/**
	 * Define o nível mínimo de log
	 */
	setLevel(level: LogLevel): void {
		this.level = level;
	}

	/**
	 * Retorna o nível atual de log
	 */
	getLevel(): LogLevel {
		return this.level;
	}
}

// Exporta instância padrão para uso direto
export const logger = Logger.getInstance();

// Utilitários para criação de loggers com contexto
export const createLogger = (context: string): Logger => Logger.withContext(context);