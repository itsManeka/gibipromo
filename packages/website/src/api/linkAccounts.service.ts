import { apiClient } from './client';
import { ApiResponse } from '@gibipromo/shared';

export interface LinkTelegramRequest {
	token: string;
}

export interface LinkTelegramResponse {
	message: string;
}

export interface LinkStatusResponse {
	isLinked: boolean;
	isLinking: boolean;
	telegramUsername?: string;
}

/**
 * Service for account linking operations
 */
export const linkAccountsService = {
	/**
	 * Links account with Telegram using a token
	 * @param token 6-digit token from Telegram bot
	 */
	async linkTelegram(token: string): Promise<LinkTelegramResponse> {
		const response = await apiClient.post<ApiResponse<LinkTelegramResponse>>('/link-telegram', { token });
		return response.data.data!;
	},

	/**
	 * Gets the current link status for the authenticated user
	 */
	async getStatus(): Promise<LinkStatusResponse> {
		const response = await apiClient.get<ApiResponse<LinkStatusResponse>>('/link-telegram/status');
		return response.data.data!;
	}
};

