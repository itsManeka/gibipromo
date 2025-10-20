import React, { useState, useEffect } from 'react';
import { InboxIcon, CheckIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import { notificationsService } from '../api';
import { Notification, NotificationStatus } from '@gibipromo/shared';

type FilterType = 'all' | 'unread';

/**
 * Página completa de notificações
 * 
 * Features:
 * - Lista todas as notificações do usuário
 * - Filtros: Todas / Não lidas
 * - Paginação com cursor-based (carregar mais)
 * - Botão para marcar todas como lidas
 * - Estados: loading, empty, error
 * 
 * @example
 * ```tsx
 * <Route path="/notifications" element={<Notifications />} />
 * ```
 */
export default function Notifications() {
	const { unreadCount, markAllAsRead, refresh } = useNotifications();

	// Estado local (separado do context para não afetar o dropdown)
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [cursor, setCursor] = useState<string | undefined>();
	const [filter, setFilter] = useState<FilterType>('all');

	// Carrega notificações iniciais
	useEffect(() => {
		loadNotifications(true);
	}, [filter]);

	const loadNotifications = async (reset = false) => {
		try {
			if (reset) {
				setLoading(true);
				setNotifications([]);
				setCursor(undefined);
			} else {
				setLoadingMore(true);
			}

			setError(null);

			const response = await notificationsService.getAll({
				limit: 20,
				lastKey: reset ? undefined : cursor,
				status: filter === 'unread' ? NotificationStatus.UNREAD : undefined
			});

			const data = response.data.data!;

			if (reset) {
				setNotifications(data.items);
			} else {
				setNotifications(prev => [...prev, ...data.items]);
			}

			setHasMore(data.hasMore);
			setCursor(data.lastKey);
		} catch (err) {
			console.error('Erro ao carregar notificações:', err);
			setError('Erro ao carregar notificações. Tente novamente.');
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
		// Recarrega a lista
		await loadNotifications(true);
	};

	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			loadNotifications(false);
		}
	};

	// Handler para quando uma notificação é deletada
	const handleNotificationDelete = () => {
		refresh(); // Atualiza context (contador de não lidas)
		loadNotifications(true); // Recarrega lista local
	};

	// Handler para quando uma notificação é marcada como lida
	const handleNotificationMarkAsRead = () => {
		refresh(); // Atualiza context (contador de não lidas)
		// Não precisa recarregar a lista, pois o contexto já atualiza o estado
	};

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
						🔔 Notificações
					</h1>
					<p className="text-gray-600 dark:text-dark-300">
						Acompanhe atualizações sobre seus produtos monitorados
					</p>
				</div>

				{/* Actions Bar */}
				<div className="card p-4 mb-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						{/* Filtros */}
						<div className="flex items-center gap-3">
							<FunnelIcon className="h-5 w-5 text-purple-600 dark:text-primary-yellow" />
							<div className="flex gap-2">
								<button
									onClick={() => setFilter('all')}
									className={`
										px-4 py-2 rounded-lg text-sm font-medium transition-colors
										${filter === 'all'
											? 'bg-primary-yellow text-dark-950'
											: 'bg-purple-100 dark:bg-purple-700 text-purple-900 dark:text-white hover:bg-purple-200 dark:hover:bg-purple-600'
										}
									`}
								>
									Todas
								</button>
								<button
									onClick={() => setFilter('unread')}
									className={`
										px-4 py-2 rounded-lg text-sm font-medium transition-colors
										${filter === 'unread'
											? 'bg-primary-yellow text-dark-950'
											: 'bg-purple-100 dark:bg-purple-700 text-purple-900 dark:text-white hover:bg-purple-200 dark:hover:bg-purple-600'
										}
									`}
								>
									Não lidas {unreadCount > 0 && `(${unreadCount})`}
								</button>
							</div>
						</div>

						{/* Marcar todas como lidas */}
						{unreadCount > 0 && (
							<button
								onClick={handleMarkAllAsRead}
								className="btn-primary text-sm inline-flex items-center gap-2"
							>
								<CheckIcon className="h-4 w-4" />
								Marcar todas como lidas
							</button>
						)}
					</div>
				</div>

				{/* Content */}
				{loading ? (
					// Loading state
					<div className="text-center py-20">
						<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-primary-yellow mb-4"></div>
						<p className="text-gray-600 dark:text-dark-300">Carregando notificações...</p>
					</div>
				) : error ? (
					// Error state
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
						<p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
						<button
							onClick={() => loadNotifications(true)}
							className="btn-primary"
						>
							Tentar novamente
						</button>
					</div>
				) : notifications.length === 0 ? (
					// Empty state
					<div className="card p-12 text-center">
						<InboxIcon className="h-16 w-16 mx-auto text-dark-600 mb-4" />
						<h3 className="text-xl font-semibold text-white mb-2">
							{filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
						</h3>
						<p className="text-dark-300 mb-6">
							{filter === 'unread'
								? 'Você leu todas as suas notificações!'
								: 'Você ainda não tem notificações. Adicione produtos para começar a monitorar!'
							}
						</p>
						{filter === 'unread' && (
							<button
								onClick={() => setFilter('all')}
								className="btn-primary"
							>
								Ver todas as notificações
							</button>
						)}
					</div>
				) : (
					// Lista de notificações
					<>
						<div className="card divide-y divide-gray-700/50 p-0 overflow-hidden">
							{notifications.map((notification) => (
								<NotificationItem 
									key={notification.id}
									notification={notification}
									variant="page"
									onDelete={handleNotificationDelete}
									onMarkAsRead={handleNotificationMarkAsRead}
								/>
							))}
						</div>

						{/* Load More */}
						{hasMore && (
							<div className="text-center mt-6">
								<button
									onClick={handleLoadMore}
									disabled={loadingMore}
									className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loadingMore ? (
										<span className="flex items-center gap-2">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-yellow"></div>
											Carregando...
										</span>
									) : (
										'Carregar mais'
									)}
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
