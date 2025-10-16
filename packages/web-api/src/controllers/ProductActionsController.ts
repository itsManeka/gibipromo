/**
 * Product Actions Controller
 *
 * Handles HTTP requests for product action-related endpoints.
 * Manages the creation of actions for adding products to monitoring.
 *
 * @module controllers/ProductActionsController
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ProductActionsService } from '../services/ProductActionsService';
import { ApiResponse, validateAmazonUrl } from '@gibipromo/shared';

/**
 * Request body para adicionar produto
 */
interface AddProductRequest {
	url: string;
}

/**
 * Request body para adicionar múltiplos produtos
 */
interface AddMultipleProductsRequest {
	urls: string[];
}

/**
 * Request body para validar URL
 */
interface ValidateUrlRequest {
	url: string;
}

/**
 * Product Actions Controller
 * Provides REST endpoints for adding products to monitoring
 */
export class ProductActionsController extends BaseController {
	constructor(private readonly productActionsService: ProductActionsService) {
		super();
	}

	/**
	 * POST /api/v1/products/add
	 * Adiciona produto para monitoramento
	 */
	addProduct = this.asyncHandler(async (req: Request, res: Response) => {
		// O userId vem do middleware de autenticação (req.user.id)
		const userId = req.user?.id;

		if (!userId) {
			return this.sendError(res, 'Autenticação necessária', 401);
		}

		const { url } = req.body as AddProductRequest;

		// Validação
		if (!url || typeof url !== 'string' || url.trim() === '') {
			return this.sendError(res, 'URL é obrigatória', 400);
		}

		try {
			const { actionId } = await this.productActionsService.addProductForMonitoring(
				userId,
				url.trim()
			);

			const response: ApiResponse<{
				action_id: string;
				message: string;
				estimated_time: string;
			}> = {
				success: true,
				data: {
					action_id: actionId,
					message: 'Produto adicionado para análise! Você será notificado quando houver alterações no preço.',
					estimated_time: 'O produto será analisado em até 5 minutos'
				}
			};

			this.sendCreated(res, response);
		} catch (error) {
			// Erros de negócio (usuário não encontrado, monitoria desabilitada, URL inválida)
			const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar produto';
			return this.sendError(res, errorMessage, 400);
		}
	});

	/**
	 * POST /api/v1/products/add-multiple
	 * Adiciona múltiplos produtos de uma vez
	 */
	addMultipleProducts = this.asyncHandler(async (req: Request, res: Response) => {
		// O userId vem do middleware de autenticação (req.user.id)
		const userId = req.user?.id;

		if (!userId) {
			return this.sendError(res, 'Autenticação necessária', 401);
		}

		const { urls } = req.body as AddMultipleProductsRequest;

		// Validação
		if (!Array.isArray(urls)) {
			return this.sendError(res, 'URLs deve ser um array', 400);
		}

		if (urls.length === 0) {
			return this.sendError(res, 'Lista de URLs não pode estar vazia', 400);
		}

		if (urls.length > 10) {
			return this.sendError(res, 'Máximo de 10 URLs por vez', 400);
		}

		// Valida se todos os itens são strings
		if (!urls.every(url => typeof url === 'string' && url.trim() !== '')) {
			return this.sendError(res, 'Todas as URLs devem ser strings válidas', 400);
		}

		try {
			const result = await this.productActionsService.addMultipleProducts(
				userId,
				urls.map(url => url.trim())
			);

			const response: ApiResponse<{
				success_count: number;
				failed_count: number;
				failed_urls: string[];
				message: string;
			}> = {
				success: true,
				data: {
					success_count: result.successCount,
					failed_count: result.failedUrls.length,
					failed_urls: result.failedUrls,
					message: result.successCount > 0
						? `${result.successCount} produto(s) adicionado(s) com sucesso`
						: 'Nenhum produto foi adicionado'
				}
			};

			this.sendCreated(res, response);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar produtos';
			return this.sendError(res, errorMessage, 400);
		}
	});

	/**
	 * POST /api/v1/products/validate-url
	 * Valida URL sem criar ação (para feedback em tempo real no frontend)
	 */
	validateUrl = this.asyncHandler(async (req: Request, res: Response) => {
		const { url } = req.body as ValidateUrlRequest;

		// Validação
		if (!url || typeof url !== 'string' || url.trim() === '') {
			return this.sendError(res, 'URL é obrigatória', 400);
		}

		// Usa validação do shared (não faz requisição HTTP)
		const validation = validateAmazonUrl(url.trim());

		if (!validation.valid) {
			const response: ApiResponse<{
				valid: false;
				message: string;
			}> = {
				success: true,
				data: {
					valid: false,
					message: validation.message || 'URL inválida'
				}
			};
			return this.sendSuccess(res, response);
		}

		const response: ApiResponse<{
			valid: true;
			message: string;
		}> = {
			success: true,
			data: {
				valid: true,
				message: 'URL válida'
			}
		};

		this.sendSuccess(res, response);
	});
}
