import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, InboxIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
	/** Callback chamado quando o dropdown deve ser fechado */
	onClose: () => void;
}

/**
 * Componente de dropdown com preview das notificações
 * 
 * Features:
 * - Mostra últimas 5 notificações
 * - Botão para marcar todas como lidas
 * - Link para página completa de notificações
 * - Estado vazio (sem notificações)
 * - Loading state
 * 
 * @example
 * ```tsx
 * <NotificationDropdown onClose={() => setIsOpen(false)} />
 * ```
 */
export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
	const { notifications, loading, unreadCount, markAllAsRead } = useNotifications();

	// Pega apenas as últimas 5 notificações
	const recentNotifications = notifications.slice(0, 5);

	const handleMarkAllAsRead = async () => {
		await markAllAsRead();
	};

	return (
		<div
			className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-purple-700 rounded-lg shadow-xl border border-gray-200 dark:border-purple-600 overflow-hidden z-50"
			role="menu"
			aria-orientation="vertical"
			aria-labelledby="notifications-menu"
		>
			{/* Header */}
			<div className="px-4 py-3 border-b border-gray-200 dark:border-purple-600 bg-gray-50 dark:bg-purple-800/50">
				<div className="flex items-center justify-between gap-2">
					<h3 className="text-sm font-semibold text-gray-900 dark:text-white">
						Notificações
						{unreadCount > 0 && (
							<span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
								{unreadCount}
							</span>
						)}
					</h3>
					{unreadCount > 0 && (
						<button
							onClick={handleMarkAllAsRead}
							className="flex items-center gap-1 text-xs font-medium text-white hover:text-primary-yellow transition-colors whitespace-nowrap"
							aria-label="Marcar todas como lidas"
						>
							<CheckIcon className="h-4 w-4" />
							<span className="hidden sm:inline">Marcar todas</span>
						</button>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-h-96 overflow-y-auto">
				{loading && recentNotifications.length === 0 ? (
					// Loading state
					<div className="p-8 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
						<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
					</div>
				) : recentNotifications.length === 0 ? (
					// Empty state
					<div className="p-8 text-center">
						<InboxIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
						<p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
							Nenhuma notificação
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Você não tem notificações no momento
						</p>
					</div>
				) : (
					// Lista de notificações
					<div>
						{recentNotifications.map((notification) => (
							<div key={notification.id} className="border-b border-gray-100 dark:border-purple-600/50 last:border-b-0">
								<NotificationItem
									notification={notification}
									compact
									variant="dropdown"
									onClick={onClose}
								/>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Footer */}
			{recentNotifications.length > 0 && (
				<div className="px-4 py-3 border-t border-gray-200 dark:border-purple-600 bg-gray-50 dark:bg-purple-800/50">
					<Link
						to="/notificacoes"
						onClick={onClose}
						className="block text-center text-sm font-medium text-white hover:text-primary-yellow transition-colors"
					>
						Ver todas as notificações
					</Link>
				</div>
			)}
		</div>
	);
}
