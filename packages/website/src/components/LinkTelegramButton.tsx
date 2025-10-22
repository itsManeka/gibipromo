import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { linkAccountsService } from '../api';

/**
 * Componente de botão de linkagem com Telegram
 * 
 * Features:
 * - Exibe botão de linkagem com Telegram
 * 
 * @example
 * ```tsx
 * <LinkTelegramButton />
 * ```
 */
export default function LinkTelegramButton() {
    const [status, setStatus] = useState<{ isLinked: boolean} | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const response = await linkAccountsService.getStatus();
            setStatus(response);
        } catch (err) {
            console.error('Erro ao carregar status:', err);
        }
    };

    return (
		<Link
			to="/vincular-telegram"
			className="w-full btn-secondary text-sm py-2 block text-center"
		>
			{status?.isLinked ? 'Telegram vinculado' : 'Vincular Telegram'}
		</Link>
    );
}