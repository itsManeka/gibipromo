import { ActionType, LinkAccountsAction, UserOrigin, createAccountLinkedNotification } from '@gibipromo/shared';
import { createLogger } from '@gibipromo/shared';
import { ActionRepository } from '../../ports/ActionRepository';
import { UserRepository } from '../../ports/UserRepository';
import { ProductUserRepository } from '../../ports/ProductUserRepository';
import { UserProfileRepository } from '../../ports/UserProfileRepository';
import { UserPreferencesRepository } from '../../ports/UserPreferencesRepository';
import { NotificationRepository } from '@gibipromo/shared/dist/repositories/NotificationRepository';
import { ActionProcessor } from '../../ports/ActionProcessor';
import { Telegraf } from 'telegraf';

const logger = createLogger('LinkAccountsActionProcessor');

/**
* Processor for LINK_ACCOUNTS actions
* Handles the account linking process between Telegram and Website users
*/
export class LinkAccountsActionProcessor implements ActionProcessor<LinkAccountsAction> {
	public readonly actionType = 'LINK_ACCOUNTS' as ActionType;

	constructor(
		private readonly actionRepository: ActionRepository,
		private readonly userRepository: UserRepository,
		private readonly productUserRepository: ProductUserRepository,
		private readonly userProfileRepository: UserProfileRepository,
		private readonly userPreferencesRepository: UserPreferencesRepository,
		private readonly notificationRepository: NotificationRepository,
		private readonly bot: Telegraf
	) { }

	/**
	 * Processes a single LINK_ACCOUNTS action
	 * Merges Telegram and Site user accounts, products, and preferences
	 */
	async process(action: LinkAccountsAction): Promise<void> {
		try {
			const siteUserId = action.user_id;
			const telegramUserId = action.value;

			logger.info('Starting account link process', { siteUserId, telegramUserId });

			// Fetch both users
			const [siteUser, telegramUser] = await Promise.all([
				this.userRepository.findById(siteUserId),
				this.userRepository.findByTelegramId(telegramUserId)
			]);

			if (!siteUser || !telegramUser) {
				logger.error('User not found', { siteUser: !!siteUser, telegramUser: !!telegramUser });
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// Validate not the same user
			if (siteUser.id === telegramUser.id) {
				logger.error('Attempted to link same user');
				await this.actionRepository.markProcessed(action.id);
				return;
			}

			// 1. Fetch products from both users (returns paginated response)
			const [siteProductsResponse, telegramProductsResponse] = await Promise.all([
				this.productUserRepository.findByUserId(siteUserId, 1, 1000),
				this.productUserRepository.findByUserId(telegramUser.id, 1, 1000)
			]);

			const siteProducts = siteProductsResponse.productUsers;
			const telegramProducts = telegramProductsResponse.productUsers;

			// 2. Identify conflicts (same product_id)
			const siteProductIds = new Set(siteProducts.map(p => p.product_id));
			const conflictingTelegramProducts = telegramProducts.filter(p =>
				siteProductIds.has(p.product_id)
			);
			const nonConflictingTelegramProducts = telegramProducts.filter(p =>
				!siteProductIds.has(p.product_id)
			);

			logger.info('Product analysis', {
				site: siteProducts.length,
				telegram: telegramProducts.length,
				conflicts: conflictingTelegramProducts.length,
				toMerge: nonConflictingTelegramProducts.length
			});

			// 3. Delete conflicts (keep site products)
			await Promise.all(
				conflictingTelegramProducts.map(p =>
					this.productUserRepository.removeByProductAndUser(p.product_id, p.user_id)
				)
			);

			// 4. Update non-conflicting products to site user_id
			await Promise.all(
				nonConflictingTelegramProducts.map(async (p) => {
					await this.productUserRepository.removeByProductAndUser(p.product_id, p.user_id);
					await this.productUserRepository.create({
						...p,
						id: `${p.product_id}#${siteUserId}`, // New composite key
						user_id: siteUserId
					});
				})
			);

			// 5. Update site user with Telegram data
			await this.userRepository.update({
				...siteUser,
				telegram_id: telegramUser.telegram_id,
				username: telegramUser.username || siteUser.username,
				language: telegramUser.language || siteUser.language,
				origin: UserOrigin.BOTH,
				is_linking: false
			});

			// 6. Delete Telegram user's related records (UserProfile and UserPreferences)
			const [telegramProfile, telegramPreferences] = await Promise.all([
				this.userProfileRepository.findByUserId(telegramUser.id),
				this.userPreferencesRepository.findByUserId(telegramUser.id)
			]);

			const deletePromises = [];
			if (telegramProfile) {
				deletePromises.push(this.userProfileRepository.delete(telegramProfile.id));
				logger.info('Deleting Telegram user profile', { profileId: telegramProfile.id });
			}
			if (telegramPreferences) {
				deletePromises.push(this.userPreferencesRepository.delete(telegramPreferences.id));
				logger.info('Deleting Telegram user preferences', { preferencesId: telegramPreferences.id });
			}
			await Promise.all(deletePromises);

			// 7. Delete old Telegram user
			await this.userRepository.delete(telegramUser.id);
			logger.info('Deleted Telegram user', { userId: telegramUser.id });

			// 8. Create notification on site
			const notification = createAccountLinkedNotification(siteUserId);
			await this.notificationRepository.create(notification);

			// 9. Send message on Telegram
			const message = this.buildSuccessMessage(
				nonConflictingTelegramProducts.length,
				conflictingTelegramProducts.length
			);

			await this.bot.telegram.sendMessage(telegramUserId, message, {
				parse_mode: 'MarkdownV2'
			});

			logger.info('Account link completed successfully', { siteUserId, telegramUserId });

			// 10. Mark action as processed
			await this.actionRepository.markProcessed(action.id);

		} catch (error) {
			logger.error('Error processing account link', error);
			throw error;
		}
	}

	/**
	 * Processes next batch of LINK_ACCOUNTS actions
	 */
	async processNext(batchSize: number): Promise<number> {
		const actions = await this.actionRepository.findPendingByType(
			'LINK_ACCOUNTS' as ActionType,
			batchSize
		);

		for (const action of actions) {
			await this.process(action as LinkAccountsAction);
		}

		return actions.length;
	}

	/**
	 * Builds success message for Telegram notification
	 */
	private buildSuccessMessage(mergedCount: number, duplicateCount: number): string {
		let message = `✅ *Contas Vinculadas\\!*\n\nSua conta do Telegram foi vinculada com sucesso ao site GibiPromo\\!\n\n🎉 A partir de agora você receberá notificações de promoções tanto aqui quanto no site\\.`;

		if (mergedCount > 0) {
			message += `\n\n📦 ${mergedCount} produto\\(s\\) do Telegram foram mesclados\\.`;
		}

		if (duplicateCount > 0) {
			message += `\n\n⚠️ ${duplicateCount} produto\\(s\\) duplicado\\(s\\) foram mantidos da sua conta do site\\.`;
		}

		message += `\n\nContinue monitorando suas promoções\\! 🛒`;

		return message.trim();
	}
}

