import { Entity } from './Entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Representa um token de vínculo entre contas Telegram e Site
 * Tokens têm validade de 5 minutos e são de uso único
 */
export interface LinkToken extends Entity {
	/** ID do usuário no Telegram (telegram_id) */
	telegram_user_id: string;
	/** Token alfanumérico de 6 dígitos */
	token: string;
	/** Data de expiração (ISO 8601) - 5 minutos após criação */
	expires_at: string;
	/** Indica se o token já foi utilizado */
	used: boolean;
	/** Data de criação (ISO 8601) */
	created_at: string;
}

/**
 * Cria um novo token de vínculo
 * 
 * @param telegramUserId ID do usuário no Telegram
 * @returns LinkToken com token gerado e expiração de 5 minutos
 * 
 * @example
 * ```typescript
 * const token = createLinkToken('123456789');
 * console.log(token.token); // 'ABC123'
 * ```
 */
export function createLinkToken(telegramUserId: string): LinkToken {
	const token = generateToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // +5 min

	return {
		id: uuidv4(),
		telegram_user_id: telegramUserId,
		token,
		expires_at: expiresAt.toISOString(),
		used: false,
		created_at: now.toISOString()
	};
}

/**
 * Gera um token alfanumérico aleatório de 6 dígitos
 * Usa apenas letras maiúsculas e números para facilitar digitação
 * 
 * @returns String de 6 caracteres (ex: 'A3B9C2')
 */
function generateToken(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return Array.from({ length: 6 }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length))
	).join('');
}

