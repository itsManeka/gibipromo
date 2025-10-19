/**
 * Notification Context
 * 
 * Gerencia estado global de notificações do usuário.
 * Features:
 * - Polling automático a cada 30 segundos
 * - Cache local de notificações
 * - Contador de não lidas em tempo real
 * - Métodos para marcar como lida/deletar
 * 
 * @module contexts/NotificationContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification, NotificationStatus } from '@gibipromo/shared';
import { notificationsService } from '../api';
import { useAuth } from './AuthContext';

/**
 * Intervalo de polling em milissegundos (30 segundos)
 */
const POLLING_INTERVAL = 30000;

/**
 * Interface do contexto de notificações
 */
interface NotificationContextType {
	/** Lista de notificações (últimas 10) */
	notifications: Notification[];
	
	/** Contador de notificações não lidas */
	unreadCount: number;
	
	/** Indica se está carregando */
	loading: boolean;
	
	/** Indica se ocorreu erro */
	error: string | null;
	
	/** Busca notificações da API */
	fetchNotifications: () => Promise<void>;
	
	/** Busca contador de não lidas */
	fetchUnreadCount: () => Promise<void>;
	
	/** Marca notificação como lida */
	markAsRead: (notificationId: string) => Promise<void>;
	
	/** Marca todas as notificações como lidas */
	markAllAsRead: () => Promise<void>;
	
	/** Deleta uma notificação */
	deleteNotification: (notificationId: string) => Promise<void>;
	
	/** Recarrega notificações e contador */
	refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provider de notificações
 * 
 * Gerencia estado global das notificações com polling automático.
 * Depende do AuthContext para saber se usuário está autenticado.
 * 
 * @example
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Busca notificações da API (últimas 10)
	 */
	const fetchNotifications = useCallback(async () => {
		if (!isAuthenticated) {
			setNotifications([]);
			return;
		}

		try {
			const response = await notificationsService.getAll({ limit: 10 });
			
			if (response.data.success && response.data.data) {
				setNotifications(response.data.data.items);
				setError(null);
			}
		} catch (err) {
			console.error('Erro ao buscar notificações:', err);
			setError('Erro ao carregar notificações');
		}
	}, [isAuthenticated]);

	/**
	 * Busca contador de não lidas
	 */
	const fetchUnreadCount = useCallback(async () => {
		if (!isAuthenticated) {
			setUnreadCount(0);
			return;
		}

		try {
			const response = await notificationsService.getUnreadCount();
			
			if (response.data.success && response.data.data) {
				setUnreadCount(response.data.data.count);
				setError(null);
			}
		} catch (err) {
			console.error('Erro ao buscar contador:', err);
			// Não exibe erro para o contador, apenas loga
		}
	}, [isAuthenticated]);

	/**
	 * Marca notificação como lida
	 */
	const markAsRead = useCallback(async (notificationId: string) => {
		try {
			await notificationsService.markAsRead(notificationId);

			// Atualiza estado local imediatamente para melhor UX
			setNotifications(prev =>
				prev.map(n =>
					n.id === notificationId
						? { ...n, status: NotificationStatus.READ, read_at: new Date().toISOString() }
						: n
				)
			);

			// Decrementa contador
			setUnreadCount(prev => Math.max(0, prev - 1));

			setError(null);
		} catch (err) {
			console.error('Erro ao marcar como lida:', err);
			setError('Erro ao marcar notificação como lida');
			throw err;
		}
	}, []);

	/**
	 * Marca todas as notificações como lidas
	 */
	const markAllAsRead = useCallback(async () => {
		try {
			await notificationsService.markAllAsRead();

			// Atualiza estado local
			setNotifications(prev =>
				prev.map(n => ({
					...n,
					status: NotificationStatus.READ,
					read_at: n.read_at || new Date().toISOString()
				}))
			);

			// Zera contador
			setUnreadCount(0);

			setError(null);
		} catch (err) {
			console.error('Erro ao marcar todas como lidas:', err);
			setError('Erro ao marcar todas como lidas');
			throw err;
		}
	}, []);

	/**
	 * Deleta uma notificação
	 */
	const deleteNotification = useCallback(async (notificationId: string) => {
		try {
			await notificationsService.deleteNotification(notificationId);

			// Remove do estado local
			setNotifications(prev => {
				const notification = prev.find(n => n.id === notificationId);
				
				// Se era não lida, decrementa contador
				if (notification?.status === NotificationStatus.UNREAD) {
					setUnreadCount(count => Math.max(0, count - 1));
				}

				return prev.filter(n => n.id !== notificationId);
			});

			setError(null);
		} catch (err) {
			console.error('Erro ao deletar notificação:', err);
			setError('Erro ao deletar notificação');
			throw err;
		}
	}, []);

	/**
	 * Recarrega notificações e contador
	 */
	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			await Promise.all([
				fetchNotifications(),
				fetchUnreadCount()
			]);
		} finally {
			setLoading(false);
		}
	}, [fetchNotifications, fetchUnreadCount]);

	/**
	 * Carrega notificações ao montar e quando autenticação mudar
	 */
	useEffect(() => {
		if (!isAuthenticated) {
			setNotifications([]);
			setUnreadCount(0);
			setLoading(false);
			setError(null);
			return;
		}

		// Carrega imediatamente
		refresh();
	}, [isAuthenticated, refresh]);

	/**
	 * Polling: busca notificações a cada 30 segundos
	 */
	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		const interval = setInterval(() => {
			fetchNotifications();
			fetchUnreadCount();
		}, POLLING_INTERVAL);

		return () => clearInterval(interval);
	}, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

	const value: NotificationContextType = {
		notifications,
		unreadCount,
		loading,
		error,
		fetchNotifications,
		fetchUnreadCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		refresh
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}
		</NotificationContext.Provider>
	);
}

/**
 * Hook para usar NotificationContext
 * 
 * @throws Error se usado fora do NotificationProvider
 * 
 * @example
 * function MyComponent() {
 *   const { notifications, unreadCount, markAsRead } = useNotifications();
 *   
 *   return (
 *     <div>
 *       <p>Não lidas: {unreadCount}</p>
 *       {notifications.map(n => (
 *         <div key={n.id} onClick={() => markAsRead(n.id)}>
 *           {n.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useNotifications() {
	const context = useContext(NotificationContext);
	
	if (!context) {
		throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
	}
	
	return context;
}
