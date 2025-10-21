/**
 * Preferences API Service
 * 
 * Cliente para endpoints de preferências do usuário.
 * Gerencia busca e atualização de preferências do usuário.
 * 
 * @module api/preferences.service
 */

import { apiClient } from './client';

/**
 * Interface das preferências do usuário
 */
export interface UserPreferences {
    id: string;
    user_id: string;
    monitor_preorders: boolean;
    monitor_coupons: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Request para atualizar preferências
 */
export interface UpdatePreferencesRequest {
    monitor_preorders?: boolean;
    monitor_coupons?: boolean;
}

/**
 * Resposta padrão da API
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Serviço de preferências do usuário
 * Responsável por buscar e atualizar preferências de monitoria
 */
export const preferencesService = {
    /**
     * Busca as preferências do usuário autenticado
     * @returns Preferências do usuário
     * @throws Error se usuário não autenticado ou preferências não encontradas
     */
    async getPreferences(): Promise<UserPreferences> {
        const response = await apiClient.get<ApiResponse<UserPreferences>>(
            '/users/preferences'
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Falha ao buscar preferências');
        }

        return response.data.data;
    },

    /**
     * Atualiza as preferências do usuário
     * @param data - Preferências a serem atualizadas
     * @returns Preferências atualizadas
     * @throws Error se dados inválidos ou falha na atualização
     */
    async updatePreferences(data: UpdatePreferencesRequest): Promise<UserPreferences> {
        const response = await apiClient.put<ApiResponse<UserPreferences>>(
            '/users/preferences',
            data
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Falha ao atualizar preferências');
        }

        return response.data.data;
    },
};


