import { BaseService } from './BaseService';
import { LinkTokenRepository } from '@gibipromo/shared/dist/repositories/LinkTokenRepository';
import { UserRepository } from '@gibipromo/shared/dist/repositories/UserRepository';
import { ActionRepository } from '@gibipromo/shared/dist/repositories/ActionRepository';
import { createLinkAccountsAction, UserOrigin } from '@gibipromo/shared';

/**
 * Service for managing account linking between Telegram and Website
 */
export class LinkAccountsService extends BaseService {
	constructor(
		private linkTokenRepo: LinkTokenRepository,
		private userRepo: UserRepository,
		private actionRepo: ActionRepository
	) {
		super('LinkAccountsService');
	}

	/**
	 * Validates token and initiates account linking process
	 * 
	 * @param userId Site user ID
	 * @param token 6-digit link token from Telegram
	 * @returns Result with success status and message
	 */
	async linkAccount(userId: string, token: string): Promise<{ success: boolean; message: string }> {
		try {
			// Fetch site user
			const siteUser = await this.userRepo.findById(userId);
			if (!siteUser) {
				return { success: false, message: 'Usuário não encontrado' };
			}

			// Check if already linked
			if (siteUser.origin === UserOrigin.BOTH) {
				return { success: false, message: 'Sua conta já está vinculada ao Telegram' };
			}

			// Check if already linking
			if (siteUser.is_linking) {
				return { success: false, message: 'Processo de vínculo já em andamento' };
			}

			// Fetch and validate token
			const linkToken = await this.linkTokenRepo.findByToken(token);
			if (!linkToken) {
				return { success: false, message: 'Código inválido' };
			}

			if (linkToken.used) {
				return { success: false, message: 'Código já foi usado' };
			}

			const now = new Date();
			const expiresAt = new Date(linkToken.expires_at);
			if (now > expiresAt) {
				return { success: false, message: 'Código expirado. Solicite um novo no bot' };
			}

			// Fetch Telegram user
			const telegramUser = await this.userRepo.findByTelegramId(linkToken.telegram_user_id);
			if (!telegramUser) {
				return { success: false, message: 'Usuário do Telegram não encontrado' };
			}

			// Validate not the same user
			if (siteUser.id === telegramUser.id) {
				return { success: false, message: 'Não é possível vincular a mesma conta' };
			}

			// Mark token as used
			await this.linkTokenRepo.markAsUsed(linkToken.id);

			// Mark both users as "linking in progress"
			await Promise.all([
				this.userRepo.update({ ...siteUser, is_linking: true }),
				this.userRepo.update({ ...telegramUser, is_linking: true })
			]);

			// Create link action
			const action = createLinkAccountsAction(siteUser.id, linkToken.telegram_user_id);
			await this.actionRepo.create(action);

			this.logAction('Link initiated', { userId, telegramUserId: linkToken.telegram_user_id });

			return {
				success: true,
				message: 'Vínculo iniciado! Aguarde alguns instantes enquanto processamos.'
			};

		} catch (error) {
			const err = error as Error;
			this.logError(err, 'linkAccount');
			return { success: false, message: 'Erro ao processar vínculo' };
		}
	}

	/**
	 * Checks link status for a user
	 * 
	 * @param userId User ID to check
	 * @returns Link status information
	 */
	async checkLinkStatus(userId: string): Promise<{
		isLinked: boolean;
		isLinking: boolean;
		telegramUsername?: string;
	}> {
		const user = await this.userRepo.findById(userId);
		if (!user) {
			return { isLinked: false, isLinking: false };
		}

		return {
			isLinked: user.origin === UserOrigin.BOTH,
			isLinking: user.is_linking || false,
			telegramUsername: user.username
		};
	}
}

