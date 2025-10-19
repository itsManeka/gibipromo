import { BaseService } from './BaseService';
import { createAddProductAction, validateAmazonUrl, ActionOrigin } from '@gibipromo/shared';
import type { ActionRepository } from '@gibipromo/shared/dist/repositories/ActionRepository';
import type { UserRepository } from '@gibipromo/shared/dist/repositories/UserRepository';

/**
 * Service para gerenciar ações de produtos
 * Responsável por criar actions de ADD_PRODUCT para serem processadas pelo scheduler
 */
export class ProductActionsService extends BaseService {
	constructor(
		private readonly actionRepository: ActionRepository,
		private readonly userRepository: UserRepository
	) {
		super('ProductActionsService');
	}

	/**
	 * Adiciona produto para monitoramento
	 * Cria uma Action do tipo ADD_PRODUCT que será processada pelo scheduler
	 */
	async addProductForMonitoring(
		userId: string,
		url: string
	): Promise<{ actionId: string }> {
		this.logAction('Adicionando produto para monitoramento', { userId, url });

		// Valida usuário
		const user = await this.userRepository.findById(userId);
		if (!user) {
			this.logError(new Error('Usuário não encontrado'), 'addProductForMonitoring');
			throw new Error('Usuário não encontrado');
		}

		if (!user.enabled) {
			this.logError(new Error('Monitoria desabilitada'), 'addProductForMonitoring');
			throw new Error('Sua monitoria está desabilitada. Entre em contato com o suporte.');
		}

		// Valida URL usando utilitário compartilhado
		const validation = validateAmazonUrl(url);
		if (!validation.valid) {
			this.logError(new Error(validation.message), 'addProductForMonitoring');
			throw new Error(validation.message);
		}

		// Cria ação ADD_PRODUCT usando factory do shared com origin SITE
		const action = createAddProductAction(userId, url, ActionOrigin.SITE);
		await this.actionRepository.create(action);

		this.logAction('Ação criada com sucesso', { 
			actionId: action.id, 
			userId,
			actionType: action.type 
		});

		return { actionId: action.id };
	}

	/**
	 * Adiciona múltiplos produtos de uma vez
	 * Útil para importação em lote
	 */
	async addMultipleProducts(
		userId: string,
		urls: string[]
	): Promise<{ successCount: number; failedUrls: string[] }> {
		this.logAction('Adicionando múltiplos produtos', { userId, count: urls.length });

		const failedUrls: string[] = [];
		let successCount = 0;

		for (const url of urls) {
			try {
				await this.addProductForMonitoring(userId, url);
				successCount++;
			} catch (error) {
				this.logError(error as Error, 'addMultipleProducts');
				failedUrls.push(url);
			}
		}

		this.logAction('Múltiplos produtos processados', { 
			successCount, 
			failedCount: failedUrls.length 
		});

		return { successCount, failedUrls };
	}
}
