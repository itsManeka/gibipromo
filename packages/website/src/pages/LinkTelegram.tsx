import React, { useState, useEffect } from 'react';
import { linkAccountsService } from '../api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function LinkTelegram() {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [status, setStatus] = useState<{ isLinked: boolean; isLinking: boolean; telegramUsername?: string } | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await linkAccountsService.linkTelegram(token.toUpperCase());
            setSuccess(true);
            setToken('');
            // Inicia polling para verificar conclusão
            startPolling();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    const startPolling = () => {
        const interval = setInterval(async () => {
            await loadStatus();
            const currentStatus = await linkAccountsService.getStatus();
            if (currentStatus.isLinked) {
                clearInterval(interval);
                window.location.reload();
            }
        }, 3000);
    };

    if (status?.isLinked) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                        Conta Vinculada!
                    </h2>
                    <p className="text-green-700 dark:text-green-300">
                        Sua conta do Telegram <strong>@{status.telegramUsername}</strong> está vinculada ao site.
                    </p>
                </div>
            </div>
        );
    }

    if (status?.isLinking) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                    <Clock className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                        Processando Vínculo...
                    </h2>
                    <p className="text-blue-700 dark:text-blue-300">
                        Aguarde enquanto vinculamos suas contas. Isso pode levar alguns instantes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Vincular Telegram
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Como vincular sua conta:
                </h2>

                <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                    <li>Abra o Telegram e converse com <a className="text-yellow-600 hover:text-yellow-700 dark:text-purple-400 dark:hover:text-purple-300" href="https://t.me/GibiPromo_bot" target="_blank" rel="noopener noreferrer"><strong>@GibiPromo_bot</strong></a></li>
                    <li>Envie o comando <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/link</code></li>
                    <li>Copie o código de 6 dígitos que o bot enviar</li>
                    <li>Cole o código no campo abaixo</li>
                </ol>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Código de Vínculo
                        </label>
                        <input
                            type="text"
                            id="token"
                            value={token}
                            onChange={(e) => setToken(e.target.value.toUpperCase())}
                            maxLength={6}
                            placeholder="ABC123"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white uppercase tracking-widest text-center text-2xl font-mono"
                            disabled={loading}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                            <p className="text-green-700 dark:text-green-300 text-sm">
                                Vínculo iniciado! Aguarde alguns instantes...
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || token.length !== 6}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processando...' : 'Vincular Conta'}
                    </button>
                </form>
            </div>
        </div>
    );
}

