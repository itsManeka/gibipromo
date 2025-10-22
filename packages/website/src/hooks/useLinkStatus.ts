import { useEffect, useState } from 'react';
import { linkAccountsService } from '../api';

export function useLinkStatus() {
    const [isLinking, setIsLinking] = useState(false);
    const [isLinked, setIsLinked] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        try {
            const response = await linkAccountsService.getStatus();
            setIsLinking(response.isLinking);
            setIsLinked(response.isLinked);
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();

        // Polling a cada 5 segundos se estiver vinculando
        if (isLinking) {
            const interval = setInterval(checkStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [isLinking]);

    return { isLinking, isLinked, loading };
}

